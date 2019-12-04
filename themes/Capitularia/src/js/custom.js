/** @module themes/capitularia */

/**
 * This file contains the Javascript for the Capitularia theme.
 *
 * @file
 */

(function ($) {
    'use strict';

    /**
     * Initialize the back to top link: on click do a smooth scroll to the top
     * of the page.
     *
     * @alias module:themes/capitularia.initBackToTop
     */

    function initBackToTop () {
        $ ('.back-to-top').click (function () {
            $ ('body,html').animate ({ 'scroll-top' : 0 }, 600);
            return false;
        });
    }

    /**
     * Initialize all links on the page to do a smooth scroll to their
     * respective targets.
     *
     * @alias module:themes/capitularia.initSmoothScrollLinks
     */

    function initSmoothScrollLinks () {
        $ ('a').each (function () {
            if ($ (this).hasClass ('ssdone')) {
                return;
            }
            $ (this).addClass ('ssdone');

            var href = $ (this).attr ('href');
            if (href === undefined) {
                return;
            }
            href = href.replace ('.', '\\.');
            var io = href.indexOf ('#');
            // only act on page-internal links
            if (io !== 0) {
                return;
            }

            // only act on existing targets
            var target;
            try {
                target = $ (href);
            } catch (e) {
                return;
            }
            if (target.length === 0) {
                return;
            }

            $ (this).addClass ('sscontrolled');
            $ (this).on ('click', function (event) {
                var off = target.first ().offset ().top;
                $ ('body,html').animate ({ 'scroll-top' : off }, 600);
                event.preventDefault ();
                return true;
            });
        });
    }

    /**
     * Initialize reset buttons to reset input and select controls on the parent
     * form.
     *
     * @alias module:themes/capitularia.initResetForm
     */

    function initResetForm () {
        $ ('.reset-form').click (function () {
            $ (this).closest ('form').find ('input[type="text"]').val ('');
            $ (this).closest ('form').find ('select').each (function () {
                var v = $ (this).children ().first ().val ();
                $ (this).val (v);
            });
        });
    }

    /**
     * Initialize the footnote refs, ie. the '*', to open a popup on mouse
     * hover.  The popup contains the footnote text.
     *
     * @alias module:themes/capitularia.initFootnoteTooltips
     */

    function initFootnoteTooltips () {
        $ ('a.annotation-ref').tooltip ({
            'placement' : 'top',
            'title'     : function () {
                var href = $ (this).attr ('href');
                return $ (href).closest ('div.annotation-content').prop ('outerHTML');
            },
            'html'    : true,
            'trigger' : 'manual',
            // 'boundary'   : 'window',
        }).on ('mouseenter', function () {
            // keeps the tooltip open as long as the user hovers over it,
            // the user may click on links
            var that = this;
            $ (this).tooltip ('show');
            $ ('.tooltip').on ('mouseleave', function () {
                $ (that).tooltip ('hide');
            });
        }).on ('mouseleave', function () {
            var that = this;
            setTimeout (function () {
                if (!$ ('.tooltip:hover').length) {
                    $ (that).tooltip ('hide');
                }
            }, 300);
        });
    }

    /**
     * Initialize the legend slide-out.  Make the legend slide out (and back in)
     * if the user clicks on the respective tab.
     *
     * @alias module:themes/capitularia.initLegend
     */

    function initLegend () {
        // the Key (Legend) slide-out
        var legend = $ ('#legend');
        if (legend.length) {
            var wrapper = $ ('<div class="slideout screen-only"><div class="slideout-tab"></div>'
                             + '<div class="slideout-inner"></div></div>');
            $ ('body').append (wrapper);
            var legend_copy = legend.clone ();
            legend.addClass ('print-only');
            $ ('div.slideout-inner').append (legend_copy);
            $ ('div.slideout-tab').append ($ ('div.slideout-inner h5'));
            $ ('div.slideout-tab, div.slideout-inner').click (function () {
                $ (this).parent ().toggleClass ('slideout-active');
            });
        }
    }

    $ (document).ready (function () {
        setTimeout (initBackToTop, 0);
        setTimeout (initSmoothScrollLinks, 0);
        setTimeout (initResetForm, 0);
        initFootnoteTooltips ();

        // FIXME: somehow extract this value from bootstrap files
        // if ($('body').css ('content') == 'sm')
        if (window.matchMedia ('(min-width: 768px)').matches) {
            initLegend ();
        }
    });
} (jQuery));

function toggle (control) {
    var elem = document.getElementById (control);
    if (elem.style.display === 'none') {
        elem.style.display = 'block';
    } else {
        elem.style.display = 'none';
    }
}
