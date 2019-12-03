<div class="vue-app" data-table-name="detailed-orders">

    <div class="table-wrapper filter-wrapper">
        <table class="order-table-filters">
            <thead>
            <tr>
                <th>Totals</th>
                <th>Delivery Date</th>
                <th>Delivery/Pickup</th>
                <th>Driver</th>
                <th>Status</th>
                <th>Arrangement</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td>
                    <div style="text-align: center">
                        <div style="display:flex;">
                            <div style="width:33.333%;"><strong>Today</strong></div>
                            <div style="width:33.333%;"><strong>Tomorrow</strong></div>
                            <div style="width:33.333%;"><strong>Future</strong></div>
                        </div>
                        <div style="display:flex;">
                            <div style="width:33.333%;">{{orderTotal.today}}</div>
                            <div style="width:33.333%;">{{orderTotal.tomorrow}}</div>
                            <div style="width:33.333%;">{{orderTotal.future}}</div>
                        </div>
                    </div>
                </td>
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
                    <span><strong>Total orders:</strong> {{orderTotalDateRange}}</span>
                </td>
                <td>
                    <label>
                        <input type="checkbox" v-model="filter.delivery">
                        <span>Delivery</span>
                    </label>
                    <label>
                        <input type="checkbox" v-model="filter.pickup">
                        <span>Pickup</span>
                    </label>
                </td>
                <td>
                    <select v-model="filter.delivery_driver">
                        <option v-for="driver in driver_options" v-bind:value="driver">{{driver}}</option>
                    </select>
                </td>
                <td>
                    <select v-model="filter.custom_status">
                        <option v-for="status in custom_status_options" v-bind:value="status">{{status}}</option>
                    </select>
                </td>
                <td>
                    <select v-model="filter.title">
                        <option v-for="arrangement in arrangement_options" v-bind:value="arrangement">{{arrangement}}</option>
                    </select>
                </td>
            </tr>
            </tbody>
        </table>
    </div>


    <div v-if="false">
        <p>Toggle columns</p>
        <div>
            <label>
                <input type="checkbox" v-model="columns['delivery-date']"/>
                <span>Date</span>
            </label>
            <label>
                <input type="checkbox" v-model="columns['custom-status']" />
                <span>Status</span>
            </label>
        </div>
    </div>

    <div class="table-wrapper">
        <table>
            <thead>
            <tr>
                <th class="table-order-number" v-on:click="toggleSort('id')">
                    <span class="table-sortable" v-bind:class="{'sort-asc': sort.by=='id'&&sort.dir=='asc', 'sort-desc': sort.by=='id'&&sort.dir=='desc'}">Order<br/>Number</span>
                </th>
                <th class="table-delivery-date" v-on:click="toggleSort('delivery_date')" v-if="columns['delivery-date']">
                    <span class="table-sortable" v-bind:class="{'sort-asc': sort.by=='delivery_date'&&sort.dir=='asc', 'sort-desc': sort.by=='delivery_date'&&sort.dir=='desc'}">Delivery<br/>Date</span>
                </th>
                <th class="table-custom-status" v-if="columns['custom-status']">Status</th>
                <th class="table-title">Arrangement</th>
                <th class="table-add-ons">Add-ons</th>
                <th class="table-suburb" v-on:click="toggleSort('suburb')">
                    <span class="table-sortable" v-bind:class="{'sort-asc': sort.by=='suburb'&&sort.dir=='asc', 'sort-desc': sort.by=='suburb'&&sort.dir=='desc'}">Suburb</span>
                </th>
                <th class="table-delivery-pickup" v-on:click="toggleSort('delivery_or_pickup')">
                    <span class="table-sortable" v-bind:class="{'sort-asc': sort.by=='delivery_or_pickup'&&sort.dir=='asc', 'sort-desc': sort.by=='delivery_or_pickup'&&sort.dir=='desc'}">Delivery<br/>Pickup</span>
                </th>
                <th class="table-delivery-note">Notes</th>
                <th class="table-invoice-status">Inv.?</th>
                <th class="table-pdf">PDF</th>
                <th class="table-delivery-driver">Driver</th>
                <th class="table-driver-fee">Driver<br/>Fee</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="row,index in order_rows" v-bind:class="getRowClass(row)">
                <td class="table-order-number">
                    <a v-bind:href="'post.php?post='+row.order_id+'&action=edit'" target="_blank">{{row.order_id}}</a>
                    <span class="dashicons dashicons-yes" v-if="orders[row.order_id].status === 'completed'"></span>
                </td>
                <td class="table-delivery-date" v-if="columns['delivery-date']"><div>{{row.id ? orders[row.order_id].delivery_date.display : '&nbsp;'}}</div></td>
                <td class="table-custom-status" v-if="columns['custom-status']" v-on:dblclick="toggleEditField(index, 'custom_status')">
                    <div>
                        <span v-if="!isEditingField(index, 'custom_status')" class="table-editable" v-bind:class="{'empty' : !orders[row.order_id].custom_status}">{{orders[row.order_id].custom_status}}</span>
                        <select
                                v-model="orders[row.order_id].custom_status"
                                name="custom_status"
                                v-else
                                v-focus
                                @blur="toggleEditField(); $emit('update')"
                                @change="onChangeUpdateHandler(row.order_id, $event); $event.target.blur();">
                            <option v-for="custom_status in custom_status_options" v-bind:value="custom_status">{{custom_status}}</option>
                        </select>
                    </div>
                </td>
                <td class="table-title">{{row.qty}} x <strong>{{row.title}}</strong><span v-if="row.title_extra"> {{row.title_extra}}</span></td>
                <td class="table-add-ons">
                    <ul v-if="row.add_ons.length">
                        <li v-for="add_on in row.add_ons" v-html="add_on"></li>
                    </ul>
                </td>
                <template v-if="row.id">
                    <td class="table-suburb"><div>{{orders[row.order_id].suburb}}</div></td>
                    <td class="table-delivery-pickup"><div>{{orders[row.order_id].delivery_or_pickup}}</div></td>

                    <td class="table-delivery-note" v-on:dblclick="toggleEditField(index, 'delivery_note')">
                        <div>
                            <span v-if="!isEditingField(index, 'delivery_note')" class="table-editable" v-bind:class="{'empty' : !orders[row.order_id].delivery_note}">{{orders[row.order_id].delivery_note}}</span>
                            <textarea
                                    v-model="orders[row.order_id].delivery_note"
                                    name="delivery_note"
                                    v-else
                                    @blur="toggleEditField(); $emit('update')"
                                    @keydown.enter.exact.prevent="$event.target.blur(); $emit('update')"
                                    @change="onChangeUpdateHandler(row.order_id, $event)"
                                    v-focus
                            ></textarea>
                        </div>
                    </td>

                    <td class="table-invoice-status">
                        <div>
                            <input type="checkbox" value="invoiced" v-model="orders[row.order_id].invoice_status" name="invoice_status" @change="onChangeUpdateHandler(row.order_id, $event)"/>
                        </div>
                    </td>

                    <td class="table-pdf">
                        <div style="width: 55px;">
                            <button class="table-pdf-button" v-on:click="generatePdf('invoice', row.id, $event)">
                                <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="file-invoice-dollar" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" class="svg-inline--fa fa-file-invoice-dollar fa-w-12 fa-2x"><path fill="currentColor" d="M377 105L279.1 7c-4.5-4.5-10.6-7-17-7H256v128h128v-6.1c0-6.3-2.5-12.4-7-16.9zm-153 31V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zM64 72c0-4.42 3.58-8 8-8h80c4.42 0 8 3.58 8 8v16c0 4.42-3.58 8-8 8H72c-4.42 0-8-3.58-8-8V72zm0 80v-16c0-4.42 3.58-8 8-8h80c4.42 0 8 3.58 8 8v16c0 4.42-3.58 8-8 8H72c-4.42 0-8-3.58-8-8zm144 263.88V440c0 4.42-3.58 8-8 8h-16c-4.42 0-8-3.58-8-8v-24.29c-11.29-.58-22.27-4.52-31.37-11.35-3.9-2.93-4.1-8.77-.57-12.14l11.75-11.21c2.77-2.64 6.89-2.76 10.13-.73 3.87 2.42 8.26 3.72 12.82 3.72h28.11c6.5 0 11.8-5.92 11.8-13.19 0-5.95-3.61-11.19-8.77-12.73l-45-13.5c-18.59-5.58-31.58-23.42-31.58-43.39 0-24.52 19.05-44.44 42.67-45.07V232c0-4.42 3.58-8 8-8h16c4.42 0 8 3.58 8 8v24.29c11.29.58 22.27 4.51 31.37 11.35 3.9 2.93 4.1 8.77.57 12.14l-11.75 11.21c-2.77 2.64-6.89 2.76-10.13.73-3.87-2.43-8.26-3.72-12.82-3.72h-28.11c-6.5 0-11.8 5.92-11.8 13.19 0 5.95 3.61 11.19 8.77 12.73l45 13.5c18.59 5.58 31.58 23.42 31.58 43.39 0 24.53-19.05 44.44-42.67 45.07z" class=""></path></svg>
                            </button>
                            <button class="table-pdf-button" v-on:click="generatePdf('packing-slip', row.id, $event)">
                                <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="box-check" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="svg-inline--fa fa-box-check fa-w-20 fa-2x"><path fill="currentColor" d="M240 0H98.6c-20.7 0-39 13.2-45.5 32.8L2.5 184.6c-.8 2.4-.8 4.9-1.2 7.4H240V0zm235.2 81.7l-16.3-48.8C452.4 13.2 434.1 0 413.4 0H272v157.4C315.9 109.9 378.4 80 448 80c9.2 0 18.3.6 27.2 1.7zM208 320c0-34.1 7.3-66.6 20.2-96H0v240c0 26.5 21.5 48 48 48h256.6C246.1 468.2 208 398.6 208 320zm240-192c-106 0-192 86-192 192s86 192 192 192 192-86 192-192-86-192-192-192zm114.1 147.8l-131 130c-4.3 4.3-11.3 4.3-15.6-.1l-75.7-76.3c-4.3-4.3-4.2-11.3.1-15.6l26-25.8c4.3-4.3 11.3-4.2 15.6.1l42.1 42.5 97.2-96.4c4.3-4.3 11.3-4.2 15.6.1l25.8 26c4.2 4.3 4.2 11.3-.1 15.5z" class=""></path></svg>
                            </button>
                        </div>
                    </td>

                    <td class="table-delivery-driver" v-on:dblclick="toggleEditField(index, 'delivery_driver')">
                        <div>
                            <span v-if="!isEditingField(index, 'delivery_driver')" class="table-editable" v-bind:class="{'empty' : !orders[row.order_id].delivery_driver}">{{orders[row.order_id].delivery_driver}}</span>
                            <select
                                    v-model="orders[row.order_id].delivery_driver"
                                    name="delivery_driver"
                                    v-else
                                    v-focus
                                    @blur="toggleEditField(); $emit('update')"
                                    @change="onChangeUpdateHandler(row.order_id, $event); $event.target.blur();">
                                <option v-for="driver in driver_options" v-bind:value="driver">{{driver}}</option>
                            </select>
                        </div>
                    </td>

                    <td class="table-driver-fee" v-on:dblclick="toggleEditField(index, 'driver_fee')">
                        <div>
                            <span v-if="!isEditingField(index, 'driver_fee')" class="table-editable" v-bind:class="{'empty' : !orders[row.order_id].driver_fee}">{{orders[row.order_id].driver_fee}}</span>
                            <input
                                    type="text"
                                    v-model="orders[row.order_id].driver_fee"
                                    name="driver_fee"
                                    v-else
                                    @blur="toggleEditField(); $emit('update')"
                                    @keydown.enter.exact.prevent="$event.target.blur(); $emit('update')"
                                    @change="onChangeUpdateHandler(row.order_id, $event)"
                                    v-focus
                            />
                        </div>
                    </td>
                </template>
                <template v-else>
                    <td class="table-empty-col" colspan="4">&nbsp;</td>
                </template>

            </tr>
            </tbody>
        </table>
        <div class="table-loader" v-bind:class="{'loading':isLoading, 'padded': orders.length>5}">
            <div class="table-loader--inner">
                <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
            </div>
        </div>
    </div>
</div>