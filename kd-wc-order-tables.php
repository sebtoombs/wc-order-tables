<?php

/*
Plugin Name: Woocommerce Order Management Tables
Plugin URI: https://kingsdesign.com.au
Description: Order management tables for Woocommerce
Version: 1.0.0
Author: KingsDesign <seb@kingsdesign.com.au>
Author URI: https://kingsdesign.com.au
Text Domain: kd-wc-order-table
*/

//define('KD_ORDER_TABLE_ENV', 'development');
define('KD_ORDER_TABLE_ENV', 'production');

define('KD_WC_OT_SCRIPT_VER', '1.0.4');
define('KD_WC_OT_STYLE_VER', '1.0.4');

if(!class_exists('KD_WC_Order_Tables')) {
    class KD_WC_OrderTables {

        private $_assetsEnqueued; //Prevent enqueueing assets twice

        function __construct() {
            $this->_assetsEnqueued = false;
            add_shortcode('wc_order_table', array($this, 'do_shortcode'));

            add_action('wp', array($this, 'maybe_add_hooks'));
            $this->add_ajax_hooks();

            //Allow pdf generation
            add_action('wp_ajax_order_table_pdf', array($this, 'ajax__pdf_invoice'));
            add_action('wp_ajax_nopriv_order_table_pdf', array($this, 'ajax__pdf_invoice'));

            //Maps
            add_action('wp_ajax_order_table_route_deliveries', array($this, 'ajax__route_deliveries'));

            //Admin
            add_action( 'admin_menu', array($this, 'add_admin_page'));
            add_action('acf/init', array($this, 'add_options_page'));
            add_action( 'admin_enqueue_scripts', array($this, 'admin_enqueue_scripts' ));
            add_action('admin_footer', array($this, 'admin_footer'));
            //add_action( 'admin_init', array($this, 'add_options_page') );

            add_filter( 'post_password_required', function($passwordRequired, $post) {
                if($passwordRequired && is_page('arrangement-summary') && is_user_logged_in() && current_user_can('manage_woocommerce')) {
                    return false;
                }
                return $passwordRequired;
            }, 10, 2 );
        }

        public function do_shortcode($atts, $content) {
            $defaults = [
                'table'=>'detailed_orders'
            ];
            $atts = shortcode_atts($defaults, $atts);

            $callback = false;
            switch($atts['table']) {
                case 'detailed_orders':
                    $callback = 'detailed_orders';
                    break;
                case 'arrangement_summary':
                    $callback = 'arrangement_summary';
                    break;
                case 'driver_summary':
                    $callback = 'driver_summary';
                    break;
                case 'detailed_deliveries':
                    $callback = 'detailed_deliveries';
                    break;
            }

            if($callback) {
                $this->_shouldAddHooks = true;
                //$this->add_hooks();
                return call_user_func(array($this, 'render_table__'.$callback), $atts);
            }
            return null;
        }


        /*
         * Maybe add conditional hooks
         */
        public function maybe_add_hooks() {
            global $post;
            if( !is_null($post) && is_object($post) && property_exists($post, 'post_content') && isset($post->post_content) && has_shortcode( $post->post_content, 'wc_order_table') ) {
                $this->add_conditional_hooks();
            }
        }

        /*
         * Add conditional hooks
         */
        public function add_conditional_hooks() {
            if(!$this->_assetsEnqueued) {
                add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
                $this->_assetsEnqueued = true;
            }
        }

        /*
         * Add ajax hooks
         */
        public function add_ajax_hooks() {
            //TODO, check for user logged in
            add_action('wp_ajax_order_table_update_meta', array($this, 'ajax__update_meta'));
            add_action('wp_ajax_nopriv_order_table_update_meta', array($this, 'ajax__update_meta'));

            add_action('wp_ajax_order_table_get_orders', array($this, 'ajax__get_orders'));
        }

        /*
         * Enqueue assets
         */
        public function enqueue_scripts() {
            $assets = [
                //Table styles
                [
                    'type'=>'style',
                    'handle'=>'kd-wc-order-table',
                    'src'=>plugin_dir_url(__FILE__).'order-table.css',
                    'deps'=>array(),
                    'ver'=>KD_ORDER_TABLE_ENV === 'production' ? KD_WC_OT_STYLE_VER : null
                ],
                //Vue
                //TODO bundle/serve locally?
                [
                    'type'=>'script',
                    'handle'=>'kd-wc-ot-vue',
                    'src'=>KD_ORDER_TABLE_ENV === 'production' ? plugin_dir_url(__FILE__).'vendor/vue-2.6.0.min.js' : 'https://cdn.jsdelivr.net/npm/vue/dist/vue.js',
                    'deps'=>array(),
                    'ver'=>null
                ],
                //Promise polyfill
                [
                    'type'=>'script',
                    'handle'=>'kd-wc-ot-promise-polyfill',
                    //'src'=>'https://cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.min.js',
                    'src'=>plugin_dir_url(__FILE__) .'vendor/promise-polyfill-8.min.js',
                    'deps'=>array(),
                    'ver'=>null,
                ],
                //Main script
                [
                    'type'=>'script',
                    'handle'=>'kd-wc-order-table',
                    'src'=>plugin_dir_url(__FILE__). 'order-table.js',
                    'deps'=>array('kd-wc-ot-vue', 'jquery', 'kd-wc-ot-promise-polyfill', 'v-calendar', 'kd-wc-ot-date-fns'),
                    'ver'=>KD_ORDER_TABLE_ENV === 'production' ? KD_WC_OT_SCRIPT_VER : null
                ]
            ];

            wp_enqueue_script('jquery-ui-core');
            wp_enqueue_script( 'jquery-ui-dialog' ); // jquery and jquery-ui should be dependencies, didn't check though...
            wp_enqueue_style( 'wp-jquery-ui-dialog' );

            //wp_enqueue_script('v-calendar', 'https://cdn.jsdelivr.net/npm/v-calendar@0.9.7/lib/v-calendar.min.js', array('kd-wc-ot-vue'), null, true);
            wp_enqueue_script('v-calendar', plugin_dir_url(__FILE__) .'vendor/v-calendar-0.9.7.min.js', array('kd-wc-ot-vue'), null, true);
            //wp_enqueue_style('v-calendar', 'https://cdn.jsdelivr.net/npm/v-calendar@0.9.7/lib/v-calendar.min.css', array(), null);
            wp_enqueue_style('v-calendar', plugin_dir_url(__FILE__) .'vendor/v-calendar-0.9.7.min.css', array(), null);
            //wp_enqueue_script('kd-wc-ot-date-fns', 'http://cdn.date-fns.org/v1.9.0/date_fns.js', array(), null, true);
            wp_enqueue_script('kd-wc-ot-date-fns', plugin_dir_url(__FILE__) .'vendor/date_fns-1.9.0.js', array(), null, true);

            foreach($assets as $asset) {
                $callback = 'wp_enqueue_'.$asset['type'];
                $args = [
                    $asset['handle'],
                    $asset['src'],
                    $asset['deps'],
                    $asset['ver']
                ];
                if($asset['type'] == 'script') $args[] = true;

                call_user_func_array($callback, $args);
            }

            $this->localize_order_data();
        }


        public function map_orders($orders) {
            return array_map(function($order_id) {
                $order = wc_get_order($order_id);
                $order_items = $order->get_items();

                //echo '<!-- ORDER META '."\n";
                //print_r($order->get_meta_data());
                //echo '--> '."\n";

                $delivery_or_pickup = strpos(strtolower($order->get_meta('pickup')), 'pickup')===0 ? 'PICKUP' : 'delivery';
                $delivery_date = $order->get_meta('delivery_date');
                $delivery_date_obj = null;
                try {
                    $delivery_date_obj = new DateTime($delivery_date . ' AEST');
                } catch(Exception $error) {

                }

                $dev_all_order_meta = [];
                foreach($order->get_meta_data() as $meta_datum) {
                    $dev_all_order_meta[$meta_datum->key] = $meta_datum->value;
                }

                return [
                    '_all_meta'=>$dev_all_order_meta,
                    'id'=>$order_id,
                    //'shipping_method'=>$order->get_shipping_method(),
                    'delivery_or_pickup'=> $delivery_or_pickup, //strpos(strtolower($order->get_shipping_method()), 'pickup') ? 'pickup' : 'delivery',
                    'delivery_date'=>[
                        //'display'=>$order->get_date_created()->date('d M Y h:m a'), //Todo replace with gform data
                        //'timestamp'=>$order->get_date_created()->getTimestamp()
                        'display'=> $delivery_date_obj ? $delivery_date_obj->format('d M Y') : $delivery_date,
                        'short'=> $delivery_date_obj ? $delivery_date_obj->format('d M y') : $delivery_date,
                        'timestamp'=>$delivery_date_obj ? $delivery_date_obj->getTimestamp() : null
                    ],
                    'status'=>$order->get_status(),
                    'custom_status'=>$order->get_meta('custom_status'),
                    'delivery_note'=>$order->get_customer_note(),//$order->get_meta('delivery_note'),
                    'suburb'=>$order->get_shipping_city(),
                    'invoice_status'=>$order->get_meta('invoice_status'),
                    'delivery_driver'=>$order->get_meta('delivery_driver'),
                    'driver_fee'=>$order->get_meta('driver_fee'),
                    'recipient_contact_number'=>$order->get_meta('recipient_contact_number'),
                    'recipient_name'=>$order->get_formatted_shipping_full_name(),
                    'address_1'=>$order->get_shipping_address_1(), //123 Street name
                    'address_2'=>$order->get_shipping_address_2(), // unit 4
                    'state'=>$order->get_shipping_state(),
                    'postcode'=>$order->get_shipping_postcode(),
                    'items'=>array_map(function($item) {
                        $item_product = $item->get_product();

                        //Title
                        $arrangement = $item_product ? $item_product->get_title() : '';

                        //Title extra bits
                        $extra_flowers_keys = ['Add More Flowers?', 'Add more flowers?', 'Size', 'Add More Flower?'];
                        $extra_flowers = false;
                        foreach($extra_flowers_keys as $extra_flowers_key) {
                            $extra_flowers_value = $item->get_meta($extra_flowers_key);
                            if($extra_flowers_value && !empty($extra_flowers_value)) $extra_flowers = $extra_flowers_value;
                        }
                        if(strcmp($extra_flowers, 'Leave as is')==0) $extra_flowers = null;

                        //
                        $colour = $item->get_meta('Colour');


                        $title_extra = "";
                        if(!empty($extra_flowers)) $title_extra = $extra_flowers;
                        if(!empty($colour)) {
                            if(!empty($title_extra)) $title_extra .= ', ';
                            $title_extra .= $colour;
                        }

                        //Add ons
                        $add_ons = [];
                        $add_on_keys = ['Ecoya Candles', 'Greeting Card', 'Balloons', 'Chocolate', 'T2 Tea', 'Teddy Bear', 'Wine', 'Vase'];
                        foreach($add_on_keys as $add_on_key) {
                            $add_on_value = $item->get_meta($add_on_key);
                            if($add_on_value && !empty($add_on_value) && !in_array($add_on_value, ['None', 'Complimentary Card'])) {
                                $add_ons[] = $add_on_value;
                            }
                        }


                        $dev_all_item_meta = [];
                        foreach($item->get_meta_data() as $meta_datum) {
                            $dev_all_item_meta[$meta_datum->key] = $meta_datum->value;
                        }

                        return [
                            '_all_meta'=>$dev_all_item_meta,
                            'title'=>$arrangement,
                            'title_extra'=>$title_extra, //$extra_flowers,
                            'add_ons'=>$add_ons,
                            'qty'=>$item->get_quantity()
                        ];
                    }, $order_items)
                ];
            }, $orders);
        }

        /**
         * Localise order data (make order data available at render)
         */
        public function localize_order_data() {
            /*$query = new WC_Order_Query( array(
                'limit' => 500,
                'orderby' => 'ID',
                'order' => 'DESC',
                'return' => 'ids',
                'status' => ['processing', 'on-hold'] //pending
            ) );
            $orders = $query->get_orders();

            $order_data = $this->map_orders($orders);

            $order_object = array_combine($orders, $order_data);

            /*$order_totals = [
                'today'=>0,
                'tomorrow'=>0,
                'future'=>0
            ];
            foreach($order_object as $order) {

            }*/

            $tab = isset($_GET['tab']) ? $_GET['tab'] : 'detailed-orders';

            $params = array();
            $params['default_view'] = true;
            if($tab !== 'detailed-orders') {
                $params['default_view'] = false;
            } /*else if($tab === 'detailed-deliveries') {
                $today = $this->>get_today_formatted()
                $params['date_start'] = $today;
                $params['date_end'] = $today;
            }*/
            $data = $this->get_orders($params);

            $driver_options = get_field('drivers', 'options');
            if($driver_options && !empty($driver_options)) {
                $driver_options = array_map(function($driver_row) {
                    return $driver_row['driver'];
                }, $driver_options);
            } else {
                $driver_options = [];
            }
            $driver_options =array_merge([''], $driver_options);

            wp_localize_script('kd-wc-order-table', 'order_table_data', [
                'env'=>KD_ORDER_TABLE_ENV,
                'orders'=>$data['orders'],
                'driver_options'=>$driver_options,
                'admin_ajax'=>admin_url('admin-ajax.php'),
                'invoice_nonce' => wp_create_nonce('order_table_pdf')
            ]);
        }

        // ---------------------
        // Render Table Functions
        // ---------------------

        /*
         * Render Detailed Orders Table
         */
        public function render_table__detailed_orders($args) {
            ob_start();

            include 'order-table.vue';

            return ob_get_clean();
        }

        /*
         * Render Arrangement Summary Table
         */
        public function render_table__arrangement_summary($args) {
            ob_start();
            echo '<div class="order-table-back"><a href="'.admin_url('admin.php?page=order-tables').'" class="button">Back to Order Tables</a></div>';
            include 'views/arrangement_summary.vue';
            return ob_get_clean();
        }

        /*
         * Render Driver Summary Table
         */
        public function render_table__driver_summary($args) {
            ob_start();
            include 'views/driver_summary.vue';
            return ob_get_clean();
        }

        /*
         * Render Details Deliveries Table
         */
        public function render_table__detailed_deliveries($args) {
            ob_start();
            include 'views/detailed_deliveries.vue';
            return ob_get_clean();
        }


        public function get_today() {
            $today = (new DateTime("now", new DateTimeZone(get_option('timezone_string'))));
            return $today;
        }
        public function get_today_formatted($fmt = 'Y-m-d') {
            return $this->get_today()->format($fmt);
        }

        public function get_orders($params=array()) {

            $status = isset($params['status']) ? $params['status'] : false;
            $date_start = isset($params['date_start']) ? $params['date_start'] : null;
            $date_end = isset($params['date_end']) ? $params['date_end'] : null;
            $default_view = isset($params['default_view']) ? $params['default_view'] : false;



            $args = array(
                'limit' => 500,
                'orderby' => 'ID',
                'order' => 'DESC',
                'return' => 'ids',
                'status' => ['processing', 'on-hold'] //pending
            );
            if($status) $args['status'] = $status;
            $query = new WC_Order_Query( $args );


            $today = $this->get_today_formatted();

            //$query = new WC_Order_Query( $args );
            $orders = $query->get_orders();

            if($date_start || $date_end || $default_view) {
                $orders = array_filter($orders, function ($order) use ($date_start, $date_end, $default_view, $today) {
                    $order = wc_get_order($order);
                    $status = $order->get_status();
                    $custom_status = $order->get_meta('custom_status');
                    $delivery_date = $order->get_meta('delivery_date');
                    try {
                        $delivery_date_obj = new DateTime($delivery_date . ' AEST');
                    } catch(Exception $error) {
                        // print_r($error);
                    }
                    if(!$delivery_date_obj) return false;

                    $compare = $delivery_date_obj->format('Y-m-d');


                    if($default_view) {
                        if($compare > $today) return false;
                        if($compare < $today) {
                            if(substr($custom_status, 0, strlen('picked up') ) !== "picked up") return true;
                            return false;
                        }
                    } else {
                        if ($date_start && $compare < $date_start) {
                            return false;
                        }
                        if ($date_end && $compare > $date_end) {
                            return false;
                        }
                    }


                    return true;
                });
            }

            //$rowcount = $wpdb->get_var("SELECT COUNT(ID) FROM $wpdb->posts WHERE post_type='shop_order' AND post_status IN('".implode("', '", $args['status'])."')");
            //$rowcount = $query->max_num_pages;
            $rowcount = 0;

            $order_data = $this->map_orders($orders);

            $order_object = array_combine($orders, $order_data);

            return ['orders'=>$order_object, 'count'=>0];
        }
        // ---------------------
        // Ajax Functions
        // ---------------------

        public function ajax__get_orders() {

            $debug = array();

            $status =isset($_POST['status']) ? explode("|", $_POST['status']) : null;

            $date_start = isset($_POST['date_start']) ? $_POST['date_start'] : null;
            $date_end = isset($_POST['date_end']) ? $_POST['date_end'] : null;


            $default_view = isset($_POST['default_view']);

            $debug['default_view'] = $default_view;

            $data = $this->get_orders(array(
                'date_start'=>$date_start,
                'date_end'=>$date_end,
                'default_view'=>$default_view,
                'status'=>$status
            ));

            wp_send_json_success(['message'=>'ok','orders'=>$data['orders'],'count'=>$data['count'], 'debug'=>$debug]);
            exit;
        }

        /**
         * Update meta
         */
        public function ajax__update_meta() {
            $order_id = isset($_POST['order_id']) ? $_POST['order_id'] : null;

            if(!$order_id) {
                wp_send_json_error(['message'=>'invalid order id']);
                exit;
            }

            $order = wc_get_order($order_id);
            if(!$order) {
                wp_send_json_error(['message'=>'invalid order']);
                exit;
            }

            $meta_key = isset($_POST['meta_key']) ? sanitize_text_field($_POST['meta_key']) : null;
            $meta_value = isset($_POST['meta_value']) ? sanitize_text_field($_POST['meta_value']) : null; //currently can only be string. no serialised etc. for safety.

            if(empty($meta_key)) {
                wp_send_json_error(['message'=>'no key specified']);
                exit;
            }

            $whitelist_meta_keys = ['custom_status', 'delivery_note', 'invoice_status', 'delivery_driver', 'driver_fee'];

            if(!in_array($meta_key, $whitelist_meta_keys)) {
                wp_send_json_error(['message'=>'invalid key']);
                exit;
            }

            if($meta_key === 'delivery_note') {
                $order_data = array(
                    'order_id' => $order_id,
                    'customer_note' => $meta_value
                );
                wc_update_order( $order_data );
            } else {
                $order->update_meta_data($meta_key, $meta_value);
                $order->save();
            }

            wp_send_json_success(['message'=>'meta updated','key'=>$meta_key,'value'=>$meta_value]);
            exit;
        }


        /**
         * PDF Invoice
         */
        function ajax__pdf_invoice() {
            /*if(!isset($_REQUEST['_wpnonce'])) {
                wp_die('Invalid request');
            }
            if(wp_verify_nonce($_REQUEST['_wpnonce'], 'order_table_pdf') !== 1) {
                wp_die('Invalid request');
            }*/
            //add_filter( 'wpo_wcpdf_check_privs', function($allowed, $order_ids) {}, 10, 2 );

            //http://localhost/~sebtoombs/flowershed/wp-admin/admin-ajax.php?action=order_table_pdf&document_type=invoice&order_ids=12371&_wpnonce=68225e95ea

            $document_type = isset($_REQUEST['document_type']) ? $_REQUEST['document_type'] : 'invoice';
            $order_ids = isset($_REQUEST['order_ids']) ? $_REQUEST['order_ids'] : false;
            $order_ids = (array) array_map( 'absint', explode( 'x', $order_ids ) );
            // Process oldest first: reverse $order_ids array
            $order_ids = array_reverse( $order_ids );

            $document = wcpdf_get_document( $document_type, $order_ids, true );

            if ( $document ) {
                $output_format = WPO_WCPDF()->settings->get_output_format( $document_type );
                // allow URL override
                if ( isset( $_GET['output'] ) && in_array( $_GET['output'], array( 'html', 'pdf' ) ) ) {
                    $output_format = $_GET['output'];
                }
                switch ( $output_format ) {
                    case 'html':
                        add_filter( 'wpo_wcpdf_use_path', '__return_false' );
                        $document->output_html();
                        break;
                    case 'pdf':
                    default:
                        if ( has_action( 'wpo_wcpdf_created_manually' ) ) {
                            do_action( 'wpo_wcpdf_created_manually', $document->get_pdf(), $document->get_filename() );
                        }
                        $output_mode = WPO_WCPDF()->settings->get_output_mode( $document_type );
                        $document->output_pdf( $output_mode );
                        break;
                }
            } else {
                wp_die( sprintf( __( "Document of type '%s' for the selected order(s) could not be generated", 'woocommerce-pdf-invoices-packing-slips' ), $document_type ) );
            }
        }

        private function encodeURIPart($string) {
            $string = preg_replace('/\s+/', '+', $string);
            return urlencode($string);
        }

        /**
         * Route deliveries
         */
        public function ajax__route_deliveries() {

            $waypoints = isset($_POST['waypoints']) ? $_POST['waypoints'] : null;

            if(!$waypoints || empty($waypoints)) {
                wp_send_json_error(['message'=>'waypoints missing']);
                exit;
            }

            $api_url = 'https://maps.googleapis.com/maps/api/directions/json?';

            $origin = $this->encodeURIPart('18 Essex St, Footscray VIC 3011');

            $params = array(
                'key'=>'AIzaSyDuYcGxtaULk8-sA900yTn8uKaCRFVInrA',
                'origin'=>$origin,
                'destination'=>$this->encodeURIPart('Hobart, TAS 7000, Australia')
            );

            $waypoints = array_map(array($this,'encodeURIPart'), $waypoints);

            $params['waypoints'] = 'optimize:true|' . implode('|', $waypoints);

            array_walk($params, function(&$value, $key) {
                $value = $key.'='.$value;
            });
            $params_string = implode('&', $params);

            $request_url = $api_url . $params_string;

            $api_response = wp_remote_get( $request_url,
                array(
                    'timeout'   => 45
                )
            );

            // Check it is a valid request
            if ( ! is_wp_error( $api_response ) ) {

                $json_string = $api_response['body'];
                $response_data = @json_decode( $json_string, true );

                if(empty($response_data)) {
                    wp_send_json_error(['message'=>'invalid json']);
                    exit;
                }

                // Make sure that the valid response from google is not an error message
                if ( isset( $response_data['error'] ) ) {
                    wp_send_json_error($response_data);
                    exit;
                }

                wp_send_json_success($response_data);
                exit;

            } else {
                wp_send_json_error(['message'=>'api error']);
                exit;
            }


        }




        // Admin
        function add_options_page() {
            if( function_exists('acf_add_options_page') ) {

                /*$option_page = acf_add_options_page(array(
                    'page_title'    => __('Order Management Settings'),
                    'menu_title'    => __('Order Management Settings'),
                    'menu_slug'     => 'order-management-settings',
                    'capability'    => 'manage_options',
                    'redirect'      => false
                ));*/

                acf_add_options_sub_page(array(
                    'page_title'    => __('Order Table Settings'),
                    'menu_title'    => __('Settings'),
                    'parent_slug' 	=> 'order-tables',
                ));

            }
        }
        function add_admin_page() {
            // add top level menu page
            add_menu_page(
                'Order Tables',
                'Order Tables',
                'manage_options',
                'order-tables',
                array($this, 'admin_page_html'),
                'dashicons-editor-table',
                40
            );
        }
        public function admin_page_html() {
            // check user capabilities
            if ( ! current_user_can( 'manage_options' ) ) {
                return;
            }

            $tab = isset($_GET['tab']) ? $_GET['tab'] : 'detailed-orders';
            ?>
            <div class="wrap order-tables-admin">
                <h1 class="page-title"><?php echo esc_html( get_admin_page_title() ); ?></h1>
                <nav class="nav-tab-wrapper">
                    <a href="?page=order-tables&tab=detailed-orders" class="nav-tab <?php if($tab==='detailed-orders'): ?>nav-tab-active<?php endif;?>">Detailed Order Summary</a>
                    <a href="?page=order-tables&tab=driver-summary" class="nav-tab <?php if($tab==='driver-summary'): ?>nav-tab-active<?php endif;?>">Driver Summary</a>
                    <a href="?page=order-tables&tab=detailed-deliveries" class="nav-tab <?php if($tab==='detailed-deliveries'): ?>nav-tab-active<?php endif;?>">Detailed Deliveries</a>
                    <a href="<?php echo home_url('/arrangement-summary'); ?>" class="nav-tab" target="_blank">Arrangement Summary</a>
                </nav>
                <div class="tab-content">
                <?php
                switch($tab) {
                    case 'driver-summary':
                        include 'views/driver_summary.vue';
                        break;
                    case 'detailed-deliveries':
                        include 'views/detailed_deliveries.vue';
                        break;
                    default:
                        include 'order-table.vue';
                        break;
                }
                ?>
                </div>
            </div>
            <?php
        }
        public function admin_enqueue_scripts($screen) {
            if('toplevel_page_order-tables' !== $screen) return;

            $this->enqueue_scripts();
            //wp_enqueue_script('order-table-admin', plugin_dir_url( __FILE__ ) . 'order-table-admin.js', array('kd-wc-ot-vue'), null, true);
            //wp_enqueue_script('order-table', plugin_dir_url(__FILE__).'order-table.js', array('jquery'), null, true);

            if(isset($_GET['print'])) {
                wp_enqueue_style('order-table-print', plugin_dir_url(__FILE__).'order-table-print.css', array(), KD_ORDER_TABLE_ENV === 'production' ? KD_WC_OT_SCRIPT_VER : null);
            }
        }

        public function admin_footer() {
            if(isset($_GET['print']) && isset($_GET['page']) && $_GET['page'] === 'order-tables') {
                ?>
                <script>
                    (function($) {
                        setTimeout(function() {
                            window.print();
                        },100)
                    })(jQuery);
                </script>
                <?php
            }
        }

    }
}
new KD_WC_OrderTables();