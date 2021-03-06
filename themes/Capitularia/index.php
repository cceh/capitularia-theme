<?php

/**
 * Template for single posts or multiple excerpts.
 *
 * @package Capitularia
 */

namespace cceh\capitularia\theme;

get_header ();

get_main_start ('index-php');

get_sidebar_start ();
// This sidebar gets displayed on all posts.
dynamic_sidebar ('Post-Sidebar');
// This sidebar gets displayed on all posts and pages.
dynamic_sidebar ('Sidebar');
get_sidebar_end ();

get_content_start ();

$page_msg = __ ('Page:', 'capitularia');

$pagination = paginate_links (
    array (
        'current'            => max (1, get_query_var ('paged')),
        'total'              => $wp_query->max_num_pages,
        'before_page_number' => "<span class='screen-reader-text'>$page_msg </span>",
        'prev_text'          => __ ('« Previous', 'capitularia'),
        'next_text'          => __ ('Next »', 'capitularia'),
    )
);

if (have_posts ()) {
    echo ("<header class='index-header cap-page-header'>\n");
    if ($pagination) {
        echo ("  <div class='pagination-nav index-pagination-nav pagination-nav-top'>$pagination</div>\n");
    }
    echo ("</header>\n");

    echo ("<div class='index-results'>\n");

    while (have_posts ()) {
        the_post ();
        $id = get_the_ID ();
        $class = is_single () ? 'post' : 'excerpt';
        $classes = implode (' ', get_post_class ($class));
        $title = get_the_title ($id);
        if (!is_single ()) {
            $title = get_permalink_a () . $title . '</a>';
        }
        echo ("<article id='post-$id' class='$classes'>\n");
        echo ("  <header class='article-header $class-header'>\n");
        echo ("    <h2>$title</h2>\n");
        echo ("  </header>\n");
        echo ("  <div class='$class'>\n");
        if (is_single ()) {
            the_content ();
        } else {
            if (has_post_thumbnail ()) {
                echo (get_permalink_a ());
                the_post_thumbnail ('featured-slider');
                echo ('</a>');
            }
            the_excerpt ();
        }
        echo ("  </div>\n");
        echo ("</article>\n");
    }

    echo ("<footer class='index-footer'>\n");
    if ($pagination) {
        echo ("<div class='pagination-nav index-pagination-nav pagination-nav-bottom'>\n$pagination\n</div>\n");
    }
    echo ("</footer>\n");

    echo ("</div>\n");
}

get_content_end ();

get_main_end ();

get_footer ();
