<div class="vue-app" data-table-name="detailed-deliveries">

    <div class="table-wrapper filter-wrapper" v-if="!hideFilter">
        <table class="order-table-filters">
            <thead>
            <tr>
                <th>Delivery Date</th>
                <th>Driver</th>
                <th>Print</th>
                <th>Route</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td>
                    <span>
                        <v-date-picker
                                mode='range'
                                v-model='filter.date_range'>
                            <slot scope='props'>
                                <input type='text' v-model="dateRangeFilterModel">
                                <button v-if="filter.date_range.start || filter.date_range.end" v-on:click="filter.date_range.start = null; filter.date_range.end = null;">Clear</button>
                            </slot>
                        </v-date-picker>
                    </span>
                    <button v-on:click="filter.date_range.start = filter.date_range.end = new Date();">Today</button>
                    <button v-on:click="filter.date_range.start = filter.date_range.end = tomorrow()">Tomorrow</button>
                    <span><strong>Total orders:</strong> {{order_rows_delivery.length}}</span>
                </td>
                <td>
                    <select v-model="filter.delivery_driver">
                        <option v-for="driver in driver_options" v-bind:value="driver">{{driver}}</option>
                    </select>
                </td>
                <td><button v-on:click="printPage('detailed-deliveries')">Print</button></td>
                <td><button v-on:click="routeDeliveries()" v-bind:disabled="order_rows_delivery.length===0">Route</button></td>
            </tr>
            </tbody>
        </table>
    </div>


    <div class="table-wrapper">
        <table>
            <thead>
            <tr>
                <th class="table-order-number" v-on:click="toggleSort('id')">
                    <span class="table-sortable" v-bind:class="{'sort-asc': sort.by=='id'&&sort.dir=='asc', 'sort-desc': sort.by=='id'&&sort.dir=='desc'}">Order</span>
                </th>
                <th class="table-delivery-date" v-on:click="toggleSort('delivery_date')" v-if="columns['delivery-date']">
                    <span class="table-sortable" v-bind:class="{'sort-asc': sort.by=='delivery_date'&&sort.dir=='asc', 'sort-desc': sort.by=='delivery_date'&&sort.dir=='desc'}">Delivery</span>
                </th>
                <th class="table-title">Arrangement</th>
                <th class="table-recipient">Recipient</th>
                <th class="table-recipient-phone">Ph. No.</th>
                <th class="table-addr1">Unit</th>
                <th class="table-addr2">Address</th>
                <th class="table-suburb" v-on:click="toggleSort('suburb')">
                    <span class="table-sortable" v-bind:class="{'sort-asc': sort.by=='suburb'&&sort.dir=='asc', 'sort-desc': sort.by=='suburb'&&sort.dir=='desc'}">Suburb</span>
                </th>
                <th class="table-add-ons">Add-ons</th>
                <!--<th class="table-delivery-note">Notes</th>-->
                <th class="table-delivery-driver">Driver</th>
            </tr>
            </thead>
            <tbody>
            <!-- TODO FILTER BY DELIVERY -->
            <tr v-for="row,index in order_rows_delivery">
                <td class="table-order-number">
                    <a v-bind:href="'post.php?post='+row.order_id+'&action=edit'" target="_blank">{{row.order_id}}</a>
                </td>
                <td class="table-delivery-date"><div>{{row.id ? orders[row.order_id].delivery_date.short : '&nbsp;'}}</div></td>
                <td class="table-title">{{row.qty}} x <strong>{{row.title}}</strong><span v-if="row.title_extra"> {{row.title_extra}}</span></td>
                <td class="table-recipient">{{orders[row.order_id].recipient_name}}</td>
                <td class="table-recipient-phone">{{orders[row.order_id].recipient_contact_number}}</td>
                <td class="table-addr1">{{orders[row.order_id].address_2}}</td>
                <td class="table-addr2">{{orders[row.order_id].address_1}}</td>
                <td class="table-suburb"><div>{{orders[row.order_id].suburb}}</div></td>
                <td class="table-add-ons">
                    <ul v-if="row.add_ons.length">
                        <li v-for="add_on in row.add_ons" v-html="add_on"></li>
                    </ul>
                </td>
                <!--<td class="table-delivery-note">
                    <div>
                        <span>{{orders[row.order_id].delivery_note}}</span>
                    </div>
                </td>-->
                <td class="table-delivery-driver">
                    <div>
                        <span>{{orders[row.order_id].delivery_driver}}</span>
                    </div>
                </td>

            </tr>
            </tbody>
        </table>
    </div>
</div>