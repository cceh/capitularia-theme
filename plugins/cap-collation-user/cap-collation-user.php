<?php
/*
 * Plugin Name: Capitularia Collation Tool
 * Plugin URI:
 * Description: Collates TEI files.
 * Version:     0.2.1
 * Author:      Marcello Perathoner
 * Author URI:
 * License:     GPLv2 or later
 * Text Domain: cap-collation-user
 * Domain Path: /languages
 */

/**
 * Capitularia Collation Tool plugin.
 *
 * The *Collation Tool plugin* lets any member of the general public do
 * collations of different versions of the same chapter from different
 * manuscripts.
 *
 * This plugin provides a dashboard where the user can request collations of
 * sections of manuscripts.  The dashboard is implemented in javascript with
 * Vue.js.  The PHP code of this plugin basically only serves the Javascript
 * code to the user.
 *
 * The actual collation is done on the Capitularia API Server with a customized
 * version of CollateX for Java.
 *
 * A big Makefile, run by cron on the API server, uses XSLT and Saxon to extract
 * the relevant sections from the TEI files and pre-processes them for
 * collation.  In the end all TEI tags are removed and only the normalized text
 * is stored into the Postgres database.  On an incoming collation request the
 * API server reads the pre-processed texts from the database and sends them to
 * CollateX.
 *
 * See: :mod:`collatex_server`, :ref:`collation overview<collation-tool-overview>`.
 *
 * @package Capitularia Collation Tool
 */

namespace cceh\capitularia\collation_user;

defined ('ABSPATH') or die ('General Protection Fault: Windows will now restart.');

/** The name of the plugin. */
const NAME = 'Capitularia Collation Tool';

/** The Text Domain of the plugin. */
const LANG = 'cap-collation-user';

require_once 'functions.php';

add_action ('wp_enqueue_scripts', ns ('on_enqueue_scripts'));

add_shortcode ('cap_collation_dashboard', ns ('on_shortcode'));

// for side effect only: to get it in the .po file
__ ('Capitularia Collation Tool');
__ ('Collates TEI files.');
