<?php
/**
 * Capitularia Dynamic Menu global functions.
 *
 * @package Capitularia_Dynamic_Menu
 */

namespace cceh\capitularia\dynamic_menu;

use cceh\capitularia\lib;

const MAGIC_MENU  = '#cap_dynamic_menu#';

/**
 * Add current namespace
 *
 * @param string $function_name The class or function name without namespace
 *
 * @return string Name with namespace
 */

function ns ($function_name)
{
    return __NAMESPACE__ . '\\' . $function_name;
}

/**
 * Enqueue Javascript and CSS for the front page.
 *
 * @return void
 */

function on_enqueue_scripts ()
{
    lib\load_plugin_textdomain (DOMAIN, __FILE__);
}

/**
 * Add attribute data-cap-dynamic-menu and dynamic url to login menu.
 *
 * Puts the item description into the HTML attribute
 * data-cap-dynamic-menu.  Otherwise it would get lost.
 *
 * @param array    $atts  The old HTML attributes.
 * @param WP_Post  $item  The current menu item.
 * @param stdClass $args  An object of wp_nav_menu() arguments.
 * @param int      $depth Depth of menu item. Used for padding.
 *
 * @return array  The updated HTML attributes.
 *
 * @see src/js/front.js for more information.
 */

function on_nav_menu_link_attributes ($atts, $item, $args, $depth) // phpcs:ignore
{
    if (isset ($item->url)) {
        if (strcmp ($item->url, MAGIC_MENU) === 0) {
            $atts['data-cap-dynamic-menu'] = $item->description;
            // enqueue only if a dynamic menu is on the page
            // script must be enqueued in the footer!
            lib\enqueue_from_manifest ('cap-dynamic-menu-front.js', ['cap-theme-front.js']);
            $item->title = '<i class="fas fa-spinner fa-spin"></i>';
        }
    }
    return $atts;
}
