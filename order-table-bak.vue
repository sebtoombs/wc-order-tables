<div id="vue-app">

    <p>Date:

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
    </p>

    <p>Filters</p>
    <div>
        <label>
            <input type="checkbox" v-model="filter.delivery">
            <span>Delivery</span>
        </label>
        <label>
            <input type="checkbox" v-model="filter.pickup">
            <span>Pickup</span>
        </label>
    </div>
    <div>
        Driver:
        <select v-model="filter.delivery_driver">
            <option v-for="driver in driver_options" v-bind:value="driver">{{driver}}</option>
        </select>
    </div>
    <div>
        Status:
        <select v-model="filter.custom_status">
            <option v-for="status in custom_status_options" v-bind:value="status">{{status}}</option>
        </select>
    </div>
    <div>
        Arrangement:
        <select v-model="filter.arrangement">
            <option v-for="arrangement in arrangement_options" v-bind:value="arrangement">{{arrangement}}</option>
        </select>
    </div>


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
                <td class="table-order-number">{{row.id ? row.id : 'as above'}}</td>
                <td class="table-delivery-date" v-if="columns['delivery-date']"><div>{{row.id ? orders[row.order_id].delivery_date.display : '&nbsp;'}}</div></td>
                <td class="table-custom-status" v-if="columns['custom-status']" v-on:dblclick="row.id ? editStatus(row.order_id) : null">
                    <div>
                        <span v-if="!editingStatus(row.order_id)" class="table-editable" v-bind:class="{'empty' : !orders[row.order_id].custom_status}">{{orders[row.order_id].custom_status}}</span>
                        <select
                                v-model="orders[row.order_id].custom_status"
                                name="custom_status"
                                v-else
                                v-focus
                                @blur="editStatus(row.order_id); $emit('update')"
                                @change="onChangeUpdateHandler(row.order_id, $event); $event.target.blur();">
                            <option v-for="custom_status in custom_status_options" v-bind:value="custom_status">{{custom_status}}</option>
                        </select>
                    </div>
                </td>
                <td class="table-title"><strong>{{row.title}}</strong><span v-if="row.title_extra"> {{row.title_extra}}</span></td>
                <td class="table-add-ons">
                    <ul v-if="row.add_ons.length">
                        <li v-for="add_on in row.add_ons" v-html="add_on"></li>
                    </ul>
                </td>
                <template v-if="row.id">
                    <td class="table-suburb"><div>{{orders[row.order_id].suburb}}</div></td>
                    <td class="table-delivery-pickup"><div>{{orders[row.order_id].delivery_or_pickup}}</div></td>

                    <td class="table-delivery-note" v-on:dblclick="editNotes(row.order_id)">
                        <div>
                            <span v-if="!editingNote(row.order_id)" class="table-editable" v-bind:class="{'empty' : !orders[row.order_id].delivery_note}">{{orders[row.order_id].delivery_note}}</span>
                            <textarea
                                    v-model="orders[row.order_id].delivery_note"
                                    name="delivery_note"
                                    v-else
                                    @blur="editNotes(row.order_id); $emit('update')"
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
                        <div>
                            <button class="table-pdf-button" v-on:click="generatePdf('invoice', row.id, $event)">
                                <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="file-pdf" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" class="svg-inline--fa fa-file-pdf fa-w-12 fa-3x"><path fill="currentColor" d="M181.9 256.1c-5-16-4.9-46.9-2-46.9 8.4 0 7.6 36.9 2 46.9zm-1.7 47.2c-7.7 20.2-17.3 43.3-28.4 62.7 18.3-7 39-17.2 62.9-21.9-12.7-9.6-24.9-23.4-34.5-40.8zM86.1 428.1c0 .8 13.2-5.4 34.9-40.2-6.7 6.3-29.1 24.5-34.9 40.2zM248 160h136v328c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V24C0 10.7 10.7 0 24 0h200v136c0 13.2 10.8 24 24 24zm-8 171.8c-20-12.2-33.3-29-42.7-53.8 4.5-18.5 11.6-46.6 6.2-64.2-4.7-29.4-42.4-26.5-47.8-6.8-5 18.3-.4 44.1 8.1 77-11.6 27.6-28.7 64.6-40.8 85.8-.1 0-.1.1-.2.1-27.1 13.9-73.6 44.5-54.5 68 5.6 6.9 16 10 21.5 10 17.9 0 35.7-18 61.1-61.8 25.8-8.5 54.1-19.1 79-23.2 21.7 11.8 47.1 19.5 64 19.5 29.2 0 31.2-32 19.7-43.4-13.9-13.6-54.3-9.7-73.6-7.2zM377 105L279 7c-4.5-4.5-10.6-7-17-7h-6v128h128v-6.1c0-6.3-2.5-12.4-7-16.9zm-74.1 255.3c4.1-2.7-2.5-11.9-42.8-9 37.1 15.8 42.8 9 42.8 9z" class=""></path></svg>
                                Invoice
                            </button>
                            <button class="table-pdf-button" v-on:click="generatePdf('packing-slip', row.id, $event)">
                                <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="file-pdf" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" class="svg-inline--fa fa-file-pdf fa-w-12 fa-3x"><path fill="currentColor" d="M181.9 256.1c-5-16-4.9-46.9-2-46.9 8.4 0 7.6 36.9 2 46.9zm-1.7 47.2c-7.7 20.2-17.3 43.3-28.4 62.7 18.3-7 39-17.2 62.9-21.9-12.7-9.6-24.9-23.4-34.5-40.8zM86.1 428.1c0 .8 13.2-5.4 34.9-40.2-6.7 6.3-29.1 24.5-34.9 40.2zM248 160h136v328c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V24C0 10.7 10.7 0 24 0h200v136c0 13.2 10.8 24 24 24zm-8 171.8c-20-12.2-33.3-29-42.7-53.8 4.5-18.5 11.6-46.6 6.2-64.2-4.7-29.4-42.4-26.5-47.8-6.8-5 18.3-.4 44.1 8.1 77-11.6 27.6-28.7 64.6-40.8 85.8-.1 0-.1.1-.2.1-27.1 13.9-73.6 44.5-54.5 68 5.6 6.9 16 10 21.5 10 17.9 0 35.7-18 61.1-61.8 25.8-8.5 54.1-19.1 79-23.2 21.7 11.8 47.1 19.5 64 19.5 29.2 0 31.2-32 19.7-43.4-13.9-13.6-54.3-9.7-73.6-7.2zM377 105L279 7c-4.5-4.5-10.6-7-17-7h-6v128h128v-6.1c0-6.3-2.5-12.4-7-16.9zm-74.1 255.3c4.1-2.7-2.5-11.9-42.8-9 37.1 15.8 42.8 9 42.8 9z" class=""></path></svg>
                                Packing Slip
                            </button>
                        </div>
                    </td>

                    <td class="table-delivery-driver" v-on:dblclick="editDriver(row.order_id)">
                        <div>
                            <span v-if="!editingDriver(row.order_id)" class="table-editable" v-bind:class="{'empty' : !orders[row.order_id].delivery_driver}">{{orders[row.order_id].delivery_driver}}</span>
                            <select
                                    v-model="orders[row.order_id].delivery_driver"
                                    name="delivery_driver"
                                    v-else
                                    v-focus
                                    @blur="editDriver(row.order_id); $emit('update')"
                                    @change="onChangeUpdateHandler(row.order_id, $event); $event.target.blur();">
                                <option v-for="driver in driver_options" v-bind:value="driver">{{driver}}</option>
                            </select>
                        </div>
                    </td>

                    <td class="table-driver-fee" v-on:dblclick="editDriverFee(row.order_id)">
                        <div>
                            <span v-if="!editingDriverFee(row.order_id)" class="table-editable" v-bind:class="{'empty' : !orders[row.order_id].driver_fee}">{{orders[row.order_id].driver_fee}}</span>
                            <input
                                    type="text"
                                    v-model="orders[row.order_id].driver_fee"
                                    name="driver_fee"
                                    v-else
                                    @blur="editDriverFee(row.order_id); $emit('update')"
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
    </div>
</div>