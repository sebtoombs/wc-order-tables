<div class="vue-app" data-table-name="driver-summary">

    <div class="table-wrapper filter-wrapper" style="max-width: 320px;">
        <table class="order-table-filters">
            <thead>
            <tr>
                <th>Delivery Date</th>
                <th>Driver</th>
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
            </tr>
            </tbody>
        </table>
    </div>


    <div class="table-wrapper" style="max-width: 320px;">
        <table>
            <thead>
            <tr>
                <th class="table-delivery_driver">Driver</th>
                <th class="table-total">Total</th>
                <th class="table-driver-fee">Driver<br/>Fee</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="driver,index in drivers">
                <td class="table-delivery_driver">
                    {{driver.name}}
                </td>
                <td class="table-total">
                    {{driver.total}}
                </td>
                <td class="table-driver-fee">{{driver.fee}}</td>
            </tr>
            </tbody>
        </table>
    </div>
</div>