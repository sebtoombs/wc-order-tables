<div class="vue-app" data-table-name="arrangement-summary">

    <div class="table-wrapper filter-wrapper" style="max-width:420px;">
        <table class="order-table-filters">
            <thead>
            <tr>
                <th>Delivery Date</th>
                <th>Arrangement</th>
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
                    <span><strong>Total orders:</strong> {{orderTotalDateRange}}</span>
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


    <div class="table-wrapper" style="max-width:420px;">
        <table>
            <thead>
            <tr>
                <th class="table-arrangement">Arrangement</th>
                <th class="table-total">Total</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="arr,index in arrangements">
                <td class="table-arrangement">
                    <strong>{{arr.title}}</strong> {{arr.title_extra}}
                </td>
                <td class="table-total">
                    {{arr.total}}
                </td>
            </tr>
            </tbody>
        </table>
    </div>
</div>