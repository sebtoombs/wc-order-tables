//Object.assign polyfill

if (typeof Object.assign !== 'function') {
    // Must be writable: true, enumerable: false, configurable: true
    Object.defineProperty(Object, "assign", {
        value: function assign(target, varArgs) { // .length of function is 2
            'use strict';
            if (target === null || target === undefined) {
                throw new TypeError('Cannot convert undefined or null to object');
            }

            var to = Object(target);

            for (var index = 1; index < arguments.length; index++) {
                var nextSource = arguments[index];

                if (nextSource !== null && nextSource !== undefined) {
                    for (var nextKey in nextSource) {
                        // Avoid bugs when hasOwnProperty is shadowed
                        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
            return to;
        },
        writable: true,
        configurable: true
    });
}


(function($, dateFns) {
    //console.log(window.order_table_data);

    /**
     * ajaxPromise
     * Wrap the jQuery ajax function in a proper promise
     * Deps: jQuery, promise-polyfill
     */
    function ajaxPromise(args) {
        return new Promise(function(resolve, reject) {
            $.ajax(args).then(function(resp) {
                return resolve(resp);
            }, function(err) {
                return reject(err);
            });
        });
    }

    /**
     * Foreach/map polyfill for object
     * @param obj
     * @param cb
     */
    function forEach(obj, cb) {
        var newObj = {}
        Object.keys(obj).map(function(key) {
           newObj[key] = cb.apply(null, [key, obj[key]]);
        });
        return newObj;
    }

    var orders = typeof window.order_table_data.orders !== "undefined" ? window.order_table_data.orders : null;

    if(!orders) {
        alert('No orders data!');
        return;
    }

    var arrangement_options = [];

    orders = forEach(orders, function(order_id, order) {

        forEach(order.items, function(item_id,item) {
            //console.log(item._all_meta);
            var newArrangement = item.title.toLowerCase();
            if(arrangement_options.indexOf(newArrangement) == -1)
                arrangement_options.push(newArrangement)
        })

        return order;
    });
    if(arrangement_options.length) arrangement_options.splice(0, 0, "")



    var date_start = findGetParameter('date_start');
    var date_end = findGetParameter('date_end');
    date_start = date_start ? dateFns.startOfDay(new Date(date_start)) : null;
    date_end = date_end ? dateFns.endOfDay(new Date(date_end)) : null;

    var hide_filter = findGetParameter('date_start')
    hide_filter = hide_filter!==null;

    var sort_by = findGetParameter('sort_by');
    sort_by = sort_by ? sort_by : 'delivery_date'
    var sort_dir = findGetParameter('sort_dir');
    sort_dir = sort_dir ? sort_dir : 'desc'

    var apps = document.getElementsByClassName('vue-app')
    forEach(apps, function(app_index, app) {
        initApp(app)
    })


    //Prevent change of both filters firing two separate handlers
    var blockFireFilterChange = false;
    function handleFilterChange(cb) {
        if(blockFireFilterChange) return;
        blockFireFilterChange = true;
        setTimeout(function() {
            blockFireFilterChange = false;
        }, 10)
        cb()
    }


    function initApp(el) {
        var tableName = $(el).data('table-name') || 'detailed-orders';

        if(tableName !== 'detailed-orders' && !date_start && !date_end) {
            let today = dateFns.startOfDay(new Date());
            date_start = today;
            date_end = today;
        }


        var app = new Vue({
            el: el,
            data: {
                isLoading: false,
                orders: orders,
                driver_options: window.order_table_data.driver_options,
                custom_status_options: ['','urgent', 'ready for pickup', 'picked up by driver/customer'],
                arrangement_options: arrangement_options,
                filter: {
                    delivery: false,
                    pickup: false,
                    delivery_driver: null,
                    date_range: {
                        start: date_start,
                        end: date_end
                    },
                    custom_status: null,
                    title: null, //arrangement
                },
                sort: {
                    by: sort_by,//'id',
                    dir: sort_dir,//'desc'
                },
                showRow: [],
                columns: {
                    'delivery-date': true,
                    'custom-status': true
                },
                editingField: null,
                hideFilter:hide_filter
            },
            watch: {
                'filter.date_range.start': function() {tableName === 'detailed-orders' ? handleFilterChange(this.fetchOrders) : null},
                'filter.date_range.end': function() {tableName === 'detailed-orders' ? handleFilterChange(this.fetchOrders): null}
            },
            computed: {
                dateRangeFilterModel: function() {
                    var string = "";
                    if(this.filter.date_range.start) string += dateFns.format(this.filter.date_range.start, "DD MMM YYYY")
                    if(this.filter.date_range.end && !dateFns.isSameDay(this.filter.date_range.start, this.filter.date_range.end)) {
                        if(this.filter.date_range.start) string += " - ";
                        string += dateFns.format(this.filter.date_range.end, "DD MMM YYYY")
                    }
                    return string
                },
                orderTotalDateRange: function() {

                    var foundIDs = []
                    var countOrders = this.order_rows.filter(function(row, index, self) {
                        var found = foundIDs.indexOf(row.order_id)>-1
                        if(!found) {
                            foundIDs.push(row.order_id)
                        }
                        return !found;
                    })
                    return countOrders.length
                },
                orderTotal: function() {

                    var _this = this;
                    //var _order_rows = this.order_rows;
                    var _orders = this.orders

                    var totals = {
                        total: _orders.length,//_order_rows.length,
                        today: 0,
                        tomorrow: 0,
                        future: 0
                    }

                    //_order_rows.map(function(row) {
                    forEach(_orders, function(order_id, order) {

                        /*var today = new Date(2019, 8, 10)
                        var isToday = function(date) {
                            return dateFns.isSameDay(date, today)
                        }
                        var isTomorrow = function(date) {
                            return dateFns.isSameDay(date, dateFns.addDays(today,1))
                        }
                        var isFuture = function(date) {
                            return dateFns.isAfter(date, dateFns.endOfDay(today))
                        }*/


                        //var order = _this.orders[row.order_id];
                        var orderDate = order.delivery_date.timestamp*1000;
                        if(dateFns.isToday(order.delivery_date.timestamp*1000)) {
                        //if(isToday(orderDate)) {
                            totals.today++;
                        } else if(dateFns.isTomorrow(order.delivery_date.timestamp*1000)) {
                        //}else if(isTomorrow(orderDate)) {
                            totals.tomorrow++;
                        } else if(dateFns.isAfter(order.delivery_date.timestamp*1000, dateFns.endOfToday())) {
                        //}else if(isFuture(orderDate)){
                            totals.future ++;
                        }

                    })

                    return totals
                },
                order_rows: function() {
                    var rows = [];
                    var _orders = this.orders;

                    _orders = objectToArray(_orders);

                    //_orders = filterOrders(_orders, this.filter)

                    //_orders = sortOrders(_orders, this.sort)

                    var rowDefaults = {
                        id: null,
                        order_id: null,
                        title: null,
                        title_extra: null,
                        add_ons: null,
                        editingField: null,
                        qty: 1
                    }

                    _orders.map(function(order) {
                        var items = objectToArray(order.value.items)

                        for(var i =0; i< items.length; i++) {
                            var newRow = Object.assign({}, rowDefaults, {
                                id: order.key,
                                order_id: order.key,
                                title: items[i].value.title,
                                title_extra: items[i].value.title_extra,
                                add_ons: items[i].value.add_ons,
                                qty: items[i].value.qty
                            })
                            rows.push(newRow)
                            //rows.push(newRow)//TODO dev only
                        }

                    });

                    rows = sortOrders(rows, this.sort, this.orders);
                    rows = filterOrders(rows, this.filter, this.orders);

                    return rows;
                },
                //For arrangement summary table
                arrangements: function() {
                    var _arrangements = []
                    var _this = this

                    function findArrangementByTitle(title, title_extra) {
                        var foundIndex = -1;
                        for(var i=0; i<_arrangements.length; i++) {
                            if(_arrangements[i].title.toLowerCase() == title.toLowerCase() && (_arrangements[i].title_extra.toLowerCase() == title_extra.toLowerCase())) {
                                foundIndex = i;
                                i=_arrangements.length;
                            }
                        }
                        return foundIndex;
                    }

                    forEach(orders, function(order_id, order) {

                        if(_this.filter.date_range.start) {
                            var startDate = dateFns.startOfDay(_this.filter.date_range.start)
                            if(dateFns.isBefore(order.delivery_date.timestamp*1000, startDate)) return false
                        }
                        if(_this.filter.date_range.end) {
                            var endDate = dateFns.endOfDay(_this.filter.date_range.end)
                            if(dateFns.isAfter(order.delivery_date.timestamp*1000, endDate)) return false
                        }

                        forEach(order.items, function(item_id,item) {

                            //console.log(item)
                            //var newArrangement = item.title;//.toLowerCase();
                            //if(item.title_extra.length) newArrangement += " " + item.title_extra
                            var index = findArrangementByTitle(item.title, item.title_extra)
                            if(index == -1)
                                _arrangements.push({title: item.title, title_extra: item.title_extra, total: item.qty})
                            else
                                _arrangements[index].total += item.qty;
                        })

                        return order;
                    });

                    _arrangements = sortArrangements(_arrangements, {by: 'title', dir: 'asc'})

                    return _arrangements;
                },
                //for driver summary table
                drivers: function() {
                    var _this = this;

                    var drivers = this.driver_options.map(function(driverName) {
                        return {name: driverName, total: 0, fee: 0}
                    })

                    var unallocated = 0;

                    function driverIndexByName(name) {
                        var index = -1;
                        for(var i=0; i<drivers.length; i++) {
                            if(drivers[i].name.toLowerCase() == name.toLowerCase()) {
                                index = i;
                                i=drivers.length;
                            }
                        }
                        return index;
                    }

                    forEach(orders, function(order_id, order) {
                        if(_this.filter.date_range.start) {
                            var startDate = dateFns.startOfDay(_this.filter.date_range.start)
                            if(dateFns.isBefore(order.delivery_date.timestamp*1000, startDate)) return false
                        }
                        if(_this.filter.date_range.end) {
                            var endDate = dateFns.endOfDay(_this.filter.date_range.end)
                            if(dateFns.isAfter(order.delivery_date.timestamp*1000, endDate)) return false
                        }

                        if(!order.delivery_driver && order.delivery_or_pickup === 'delivery') {
                            unallocated ++;
                            return;
                        }
                        if(order.delivery_or_pickup !== 'delivery') return;

                        var fee = 0;
                        if(order.driver_fee && !isNaN(parseFloat(order.driver_fee))) {
                            fee = parseFloat(order.driver_fee)
                        }

                        var index = driverIndexByName(order.delivery_driver)
                        if(index == -1) {
                            drivers.push({name: order.delivery_driver, total: 1, fee: fee})
                        } else {
                            drivers[index].total ++;
                            drivers[index].fee += fee
                        }
                    })

                    drivers = drivers.filter(function(driver) {
                        return driver.total>0;
                    })

                    drivers.push({name: 'Unallocated', total: unallocated, fee: ""});

                    return drivers;
                },
                order_rows_delivery: function(){
                    var _this = this;
                    return this.order_rows.filter(function(order_row) {
                        return _this.orders[order_row.order_id].delivery_or_pickup === 'delivery';
                    });
                }
            },
            methods: {
                routeDeliveries: function() {
                    var _this = this;
                    var order_rows = _this.order_rows_delivery


                    function encodePart(string) {
                        string = string.replace(/\s+/, '+')
                        return encodeURIComponent(string)
                    }
                    function distinct(value,index,self) {
                        return self.indexOf(value) === index
                    }


                    var waypoints = [];

                    order_rows = order_rows.filter(distinct);
                    order_rows.map(function(order_row) {
                        var order = _this.orders[order_row.order_id]

                        var waypoint = order.address_1
                        if(order.address_2.length) waypoint += " " + order.address_2
                        waypoint += ", "+order.suburb
                        waypoint += ", "+order.state
                        waypoint += ' '+order.postcode

                        waypoints.push(waypoint)
                    })

                    //console.log('Waypoints', waypoints)

                    if(waypoints.length > 25) {
                        var $dialog = showDialog({
                            title: 'Address limit exceeded',
                            content: '<h3><strong>Address Limit Exceeded</strong></h3><p>The maximum number of addresses than can be routed at once is 25.</p>',
                        })

                        return;
                    }

                    var args = {
                        waypoints:waypoints
                    }
                    var data = Object.assign({}, {action: 'order_table_route_deliveries'}, args);

                    //console.log('sending', data)

                    _this.isLoading = true

                    ajaxPromise({
                        method: 'post',
                        url:window.order_table_data.admin_ajax,
                        data: data
                    }).then(function(resp) {

                        _this.isLoading = false

                        //console.log(resp)

                        if(resp.data && resp.data.error_message) {
                            showDialog({
                                title: 'Failed - Error',
                                content: '<p>There was an error requesting the route.</p> <p>Google says:</p> <p><strong>'+resp.data.error_message+'</strong></p>'
                            })
                            return;
                        }

                        if(!resp.data || !resp.data.geocoded_waypoints || !resp.data.routes || resp.data.routes.length < 1) {
                            showDialog({
                                title: 'Failed - Error',
                                content: '<p>There was an error requesting the route.</p> <p><strong>There was critical data missing from the API response.</strong></p>'
                            })
                            return;
                        }

                        var data = resp.data
                        var waypoints = data.geocoded_waypoints
                        var routes = data.routes
                        var route = routes[0]
                        var routeLegs = route.legs.slice(0, route.legs.length-1)
                        var waypointOrder = route.waypoint_order

                        var origin, origin_place_id,
                        destination, destination_place_id,
                            waypoint_list = [], waypoint_list_place_ids = []

                        routeLegs.map(function(leg, index) {
                            if(index===0) {
                                origin = encodePart(leg.start_address)
                            }
                            if(index === routeLegs.length-1) {
                                destination = encodePart(leg.end_address)
                            } else {
                                waypoint_list.push(encodePart(leg.end_address))
                            }
                        })

                        //console.log(origin, waypoint_list, destination)

                        /*var map_url = 'https://www.google.com/maps/dir/?api=1&dir_action=navigate&';
                        map_url += 'origin='+origin+'&destination='+destination+'&'
                        map_url += 'waypoints='+waypoint_list.join('|')*/

                        var map_url = 'https://www.google.com/maps/dir/The+Flower+Shed/';
                        map_url += waypoint_list.join('/')

                        console.log(map_url)

                        var win = window.open(map_url, '_blank');
                        win.focus();

                        if(!win || win.closed || typeof win.closed=='undefined') {
                            //POPUP BLOCKED
                            showDialog({
                                title: 'Route',
                                content: '<p>Success</p><p><strong><a href="'+map_url+'" target="_blank">View map</a></strong></p>'
                            })
                        }


                        return;

                    }).catch(function(err) {

                        _this.isLoading = false

                        console.error(err)
                        showDialog({
                            title: 'Failed - Error',
                            content: 'There was an error requesting the route. (Network error or bad request).'
                        })
                        return;

                    })
                },
                fetchOrders: function () {
                    var _this = this

                    this.isLoading = true;

                    var args = {};
                    //dateFns.format(this.filter.date_range.start, "YYYY-MM-DD")
                    if(this.filter.date_range.start && dateFns.isBefore(this.filter.date_range.start, dateFns.startOfToday()) ||
                        this.filter.date_range.end && dateFns.isBefore(this.filter.date_range.end, dateFns.startOfToday())) {
                        args.status = 'processing|on-hold|completed'
                    }
                    if(!this.filter.date_range.start && !this.filter.date_range.end) {
                        args.default_view = true;
                    }

                    if(this.filter.date_range.start) {
                        args.date_start = dateFns.format(this.filter.date_range.start, "YYYY-MM-DD")
                    }
                    if(this.filter.date_range.end) {
                        args.date_end = dateFns.format(this.filter.date_range.end, "YYYY-MM-DD")
                    }

                    var data = Object.assign({}, {action: 'order_table_get_orders'}, args);

                    //console.log('fetching', data)

                    ajaxPromise({
                        method: 'post',
                        url:window.order_table_data.admin_ajax,
                        data: data
                    }).then(function(resp) {

                        //console.log('debug', resp.data.debug)
                        //console.log('fetched: ', resp.data.orders)
                        _this.orders = resp.data.orders

                        _this.isLoading = false;

                        //TODO deal with paging?
                    }).catch(function(err) {
                        console.error(err)
                        alert('There was an error fetching the order data.')

                        _this.isLoading = false;
                    })
                },
                getRowClass: function(row) {
                    var order = this.orders[row.order_id];
                    var classes = [];
                    if(order.custom_status == 'urgent') classes.push('status-urgent');
                    if(order.custom_status == 'ready for pickup') classes.push('status-ready');
                    if(order.custom_status.substring(0, 'picked up'.length) == 'picked up') classes.push('status-picked-up')
                    if(order.status === 'completed') classes.push('status-completed');
                    return classes.join(" ");
                },
                toggleEditField: function(row_index, field) {
                    if(this.editingField || typeof row_index == "undefined") {
                        this.editingField = null;
                    } else {
                        this.editingField = {row: row_index, field: field}
                    }
                },
                isEditingField: function(row_index, field) {
                    return (this.editingField && this.editingField.row == row_index && this.editingField.field == field);
                },
                updateMeta: function(order_id, meta_key, meta_value) {
                    ajaxPromise({
                        method: 'post',
                        url:window.order_table_data.admin_ajax,
                        data: {
                            action: 'order_table_update_meta',
                            order_id: order_id,
                            meta_key: meta_key,
                            meta_value: meta_value
                        }
                    }).then(function(resp) {
                        //Todo toast or something?
                    });
                },
                onChangeUpdateHandler: function(order_id, event) {
                    var key = event.target.name;
                    var value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
                    if(event.target.type === 'checkbox' && event.target.value) value = event.target.checked ? event.target.value : null;

                    //console.log('Change', 'Key: '+key+', Value: '+value);
                    this.updateMeta(order_id, key, value);
                },
                toggleSort: function(by) {
                    this.sort.dir = this.sort.by!==by ? 'desc' : ( this.sort.dir === 'asc' ? 'desc' : 'asc' );
                    this.sort.by = by;
                },
                generatePdf(type, order_id, event) {
                    //console.log('Generate: '+type+' - ' + order_id)
                    var url =window.order_table_data.admin_ajax+'?action=order_table_pdf&document_type='+type+'&order_ids='+order_id+'&_wpnonce='+window.order_table_data.invoice_nonce
                    //console.log(url);
                    //window.location()
                    window.open(url,'_blank');
                },
                tomorrow() {
                    return dateFns.startOfTomorrow();
                },
                printPage: function (table) {
                    var args = {
                        'page': 'order-tables',
                        'tab': table,
                        'print': ''
                    }
                    if(this.filter.date_range.start) {
                        args['date_start'] = dateFns.format(this.filter.date_range.start, "YYYY-MM-DD")
                    }
                    if(this.filter.date_range.end) {
                        args['date_end'] = dateFns.format(this.filter.date_range.end, "YYYY-MM-DD")
                    }
                    if(this.sort) {
                        args['sort_by'] = this.sort.by
                        args['sort_dir'] = this.sort.dir
                    }
                    var arg_string = "";
                    for(var key in args) {
                        arg_string += key;
                        if(args[key]) {
                            arg_string += '='+args[key];
                        }
                        arg_string +='&';
                        //console.log('key', key)
                    }
                    arg_string = arg_string.replace(/&$/, '')
                    window.open('?'+arg_string, '_blank', 'menubar=no,location=no,resizable=yes,scrollbars=yes,status=no')
                }
            },
            directives: {
                focus: {
                    inserted (el) {
                        el.focus()
                    }
                }
            }
        })
    }


    function sortArrangements(arrangements, sort) {
        return arrangements.sort(function(a,b) {
            if(!sort.by) return 0
            var sortValue_A, sortValue_B

            sortValue_A = a[sort.by]
            sortValue_B = b[sort.by]

            if(sort.dir === 'desc') {
                return sortValue_B === sortValue_A ? 0 : sortValue_B < sortValue_A ? -1 : 1;
            } else {
                return sortValue_A === sortValue_B ? 0 : sortValue_A < sortValue_B ? -1 : 1;
            }
        })
    }


    function sortOrders(rows, sort, orders) {
        return rows.sort(function(a,b) {
            //console.log('Sort by: ', sort.by, sort.dir)
            if(!sort.by) return 0;

            var sortValue_A, sortValue_B;

            var orderId_A =a.order_id
            var orderId_B =b.order_id

            if(sort.by == 'title') {
                //Sort by row (item) data
                sortValue_A = a[sort.by]
                sortValue_B = b[sort.by]
            } else {
                //Sort by order data
                sortValue_A = orders[a.order_id][sort.by];
                sortValue_B = orders[b.order_id][sort.by];
            }


            if(sort.by === 'delivery_date') {
                sortValue_A = sortValue_A.timestamp;
                sortValue_B = sortValue_B.timestamp;
            }

            if(sort.dir === 'desc') {
                if(sortValue_B < sortValue_A) return -1;
                if(sortValue_B > sortValue_A) return 1;
                if(sort.by==='id') return 0;
                return orderId_B === orderId_A ? 0 : orderId_B < orderId_A ? -1 : 1;
                //return sortValue_B === sortValue_A ? 0 : sortValue_B < sortValue_A ? -1 : 1;
            } else {
                //return sortValue_A === sortValue_B ? 0 : sortValue_A < sortValue_B ? -1 : 1;
                if(sortValue_A < sortValue_B) return -1;
                if(sortValue_B > sortValue_A) return 1;
                if(sort.by==='id') return 0;
                return orderId_A === orderId_B ? 0 : orderId_A < orderId_B ? -1 : 1;
            }
        });
    }
    function filterOrders(rows, filter, orders) {

        if(
            !filter.delivery &&
            !filter.pickup &&
            !filter.delivery_driver &&
            !(filter.date_range.start || filter.date_range.end) &&
            !filter.custom_status &&
            !filter.title
        ) return rows;

        if(filter.date_range.start || filter.date_range.end) {
            rows = rows.filter(function(row) {
                var order = orders[row.order_id]
                return dateFns.isWithinRange(order.delivery_date.timestamp*1000, dateFns.startOfDay(filter.date_range.start), dateFns.endOfDay(filter.date_range.end))
            })
        }

        if(filter.delivery || filter.pickup) {
            rows = rows.filter(function(row) {
                var order = orders[row.order_id]
                if(filter.delivery && order.delivery_or_pickup === 'delivery') return true;
                if(filter.pickup && order.delivery_or_pickup === 'pickup') return true;
                return false;
            });
        }

        if(filter.delivery_driver) {
            rows = rows.filter(function(row) {
                var order = orders[row.order_id]
                return (filter.delivery_driver === order.delivery_driver)
            });
        }
        
        if(filter.custom_status) {
            rows = rows.filter(function(row) {
                var order = orders[row.order_id]
                return (filter.custom_status === order.custom_status)
            });
        }

        if(filter.title) {
            rows = rows.filter(function(row) {
                return (filter.title === row.title.toLowerCase())
            })
        }

        return rows;
    }


    function objectToArray(obj) {
        var arr = [];
        forEach(obj, function(key,value) {
            arr.push({key:key,value:value})
        });
        return arr;
    }

    function firstKey(obj) {
        return Object.keys(obj)[0];
    }
    function firstItem(obj) {
        return obj[firstKey(obj)]
    }


    function findGetParameter(parameterName) {
        var result = null,
            tmp = [];
        location.search
            .substr(1)
            .split("&")
            .forEach(function (item) {
                tmp = item.split("=");
                if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
            });
        return result;
    }


    function showDialog(opts) {

        var action = null;

        var $dialog = $('<div class="hidden" style="max-width:600px; min-width: 400px;">');

        var $dialogContent = $('<div>'+opts.content+'</div>')
        $dialogContent.appendTo($dialog)


        var buttons = typeof opts.buttons !== "undefined" ? opts.buttons : {
            "Cancel": function() {
                action = 'cancel'
                $dialog.dialog('close')
            }
        }

        $dialog.appendTo('body')

        function handleOverlayClick() {
            action = 'overlay'
            $dialog.dialog('close')
        }

        $dialog.dialog({
            title: opts.title,
            autoOpen: true,
            draggable: false,
            width: 'auto',
            modal: true,
            closeOnEscape: true,
            position: {
                my: "center",
                at: "center",
                of: window
            },
            open: function () {
                // close dialog by clicking the overlay behind it
                $('.ui-widget-overlay').on('click', handleOverlayClick)
            },
            create: function () {
                // style fix for WordPress admin
                $('.ui-dialog-titlebar-close').addClass('ui-button');
            },
            close: function() {
                $('.ui-widget-overlay').off('click', handleOverlayClick)
                //console.log('dialog closed', action)
                return true
            },
            buttons: buttons
        })

        return $dialog;
    }


})(jQuery, dateFns);