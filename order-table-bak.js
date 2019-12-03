(function($, dateFns) {
    console.log(window.order_table_data);

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

    //Add some extra data
    orders = forEach(orders, function(order_id, order) {
        order.editingStatus = false;
        order.editingNote = false;
        order.editingDriver = false;
        order.editingDriverFee = false;

        forEach(order.items, function(item_id,item) {
            //console.log(item._all_meta);
            var newArrangement = item.title.toLowerCase();
            if(arrangement_options.indexOf(newArrangement) == -1)
                arrangement_options.push(newArrangement)
        })

        return order;
    });

    var app = new Vue({
        el: '#vue-app',
        data: {
            orders: orders,
            driver_options: window.order_table_data.driver_options,
            custom_status_options: ['','urgent', 'ready for pickup', 'picked up by driver', 'picked up by customer'],
            arrangement_options: arrangement_options,
            filter: {
                delivery: false,
                pickup: false,
                delivery_driver: null,
                date_range: {
                    start: null,//new Date(),
                    end: null, //new Date()
                },
                custom_status: null,
                arrangement: null,
            },
            sort: {
                by: 'id',
                dir: 'desc'
            },
            showRow: [],
            columns: {
                'delivery-date': true,
                'custom-status': true
            }
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
            order_rows: function() {
                var rows = [];
                var _orders = this.orders;

                _orders = objectToArray(_orders);

                _orders = filterOrders(_orders, this.filter)

                _orders = sortOrders(_orders, this.sort)

                _orders.map(function(order) {
                    var items = objectToArray(order.value.items)
                    rows.push({
                        id:order.key,
                        order_id:order.key,
                        title: items[0].value.title,
                        title_extra: items[0].value.title_extra,
                        show: false,
                        add_ons: items[0].value.add_ons
                    });
                    if(items.length > 1) {
                        for(var i=1; i<items.length; i++) {
                            rows.push({
                                id: null,
                                order_id:order.key,
                                title: items[i].value.title,
                                title_extra: items[i].value.title_extra,
                                show: false,
                                add_ons: items[i].value.add_ons
                            })
                        }
                    }
                });

                return rows;
            }
        },
        methods: {
            getRowClass: function(row) {
                var order = this.orders[row.order_id];
                var classes = [];
                if(order.custom_status == 'urgent') classes.push('status-urgent');
                if(order.custom_status == 'ready for pickup') classes.push('status-ready');
                if(order.custom_status == 'picked up by driver' || order.custom_status == 'picked up by customer') classes.push('status-picked-up')
                return classes.join(" ");
            },
            editStatus: function(order_id) {
                if(typeof this.orders[order_id] == "undefined") return;
                this.orders[order_id].editingStatus = !this.orders[order_id].editingStatus;
            },
            editingStatus: function(order_id) {
                if(typeof this.orders[order_id] == "undefined") return false;
                return this.orders[order_id].editingStatus;
            },
            editNotes: function(order_id) {
                console.log('edit!', order_id)
                if(typeof this.orders[order_id] == "undefined") return;
                this.orders[order_id].editingNote = !this.orders[order_id].editingNote;
            },
            editingNote: function(order_id) {
                if(typeof this.orders[order_id] == "undefined") return false;
                return this.orders[order_id].editingNote;
            },
            editDriver: function(order_id) {
                if(typeof this.orders[order_id] == "undefined") return;
                this.orders[order_id].editingDriver = !this.orders[order_id].editingDriver
            },
            editingDriver: function(order_id) {
                if(typeof this.orders[order_id] == "undefined") return false;
                return this.orders[order_id].editingDriver
            },
            editDriverFee: function(order_id) {
               if(typeof this.orders[order_id] == "undefined") return;
               this.orders[order_id].editingDriverFee = !this.orders[order_id].editingDriverFee
            },
            editingDriverFee: function(order_id) {
                if(typeof this.orders[order_id] == "undefined") return false;
                return this.orders[order_id].editingDriverFee
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
            toggleShowRow(index) {
                this.showRow.splice(index, 1, typeof this.showRow[index] === "undefined" ? true : !this.showRow[index]);
            },
            generatePdf(type, order_id, event) {
                console.log('Generate: '+type+' - ' + order_id)
                var url =window.order_table_data.admin_ajax+'?action=order_table_pdf&document_type='+type+'&order_ids='+order_id+'&_wpnonce='+window.order_table_data.invoice_nonce
                console.log(url);
                //window.location()
                window.open(url,'_blank');
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


    function sortOrders(orders, sort) {
        return orders.sort(function(a,b) {
            //console.log('Sort by: ', sort.by, sort.dir)
            if(!sort.by) return 0;

            var sortValue_A = a.value[sort.by];
            var sortValue_B = b.value[sort.by];


            if(sort.by === 'delivery_date') {
                sortValue_A = sortValue_A.timestamp;
                sortValue_B = sortValue_B.timestamp;
            }

            if(sort.dir === 'desc') {
                return sortValue_B === sortValue_A ? 0 : sortValue_B < sortValue_A ? -1 : 1;
            } else {
                return sortValue_A === sortValue_B ? 0 : sortValue_A < sortValue_B ? -1 : 1;
            }
        });
    }
    function filterOrders(orders, filter) {

        if(
            !filter.delivery &&
            !filter.pickup &&
            !filter.delivery_driver &&
            !(filter.date_range.start || filter.date_range.end) &&
            !filter.custom_status &&
            !filter.arrangement
        ) return orders;

        if(filter.date_range.start || filter.date_range.end) {
            orders = orders.filter(function(order) {
                return dateFns.isWithinRange(order.value.delivery_date.timestamp*1000, dateFns.startOfDay(filter.date_range.start), dateFns.endOfDay(filter.date_range.end))
            })
        }

        if(filter.delivery || filter.pickup) {
            orders = orders.filter(function(order) {
                if(filter.delivery && order.value.delivery_or_pickup === 'delivery') return true;
                if(filter.pickup && order.value.delivery_or_pickup === 'pickup') return true;
                return false;
            });
        }

        if(filter.delivery_driver) {
            orders = orders.filter(function(order) {
                return (filter.delivery_driver === order.value.delivery_driver)
            });
        }
        
        if(filter.custom_status) {
            orders = orders.filter(function(order) {
                return (filter.custom_status === order.value.custom_status)
            });
        }

        if(filter.arrangement) {
            orders = orders.filter(function(order) {
                return (filter.arrangement === order.value.title.toLowerCase())
            })
        }

        return orders;
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

})(jQuery, dateFns);