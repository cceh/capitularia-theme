import * as tools from "tools";

/* The vue.js instance for the collation output section. */
Vue.component ('cap-collation-user-results', {
    'data'  : function () {
        return {
            'corresp'   : '',
            'sigla'     : [],
            'witnesses' : {
                'metadata' : [],
                'table'    : [],
            },
            'unsorted_tables' : [],
            'tables'          : [],
            'hovered'         : null,  // siglum of hovered witness
            'spinner'         : false,
        };
    },
    'methods' : {
        collate (data) {
            const vm   = this;

            vm.tables  = [];
            vm.corresp = data.corresp;
            vm.spinner = true;

            const p = tools.ajax ('load_collation', data);
            p.done (function () {
                vm.update_tables (p.responseJSON.witnesses);
                vm.sort_like (data.selected);
            }).always (function () {
                vm.spinner   = false;
            });
            return p;
        },
        /**
         * Transpose a table returned by CollateX
         *
         * Turn rows into columns and vice versa.
         *
         * @param array matrix The CollateX table
         *
         * @return array
         */

        transpose (matrix) {
            return _.zip (...matrix);
        },

        /**
         * Calculate the cell width in characters
         *
         * @param array $cell The array of tokens in the cell
         *
         * @return integer The width in characters
         */

        cell_width (cell) {
            const tokens = cell.map (token => token.t.trim ());
            return tokens.join (' ').length;
        },

        /**
         * Split a table in columns every n characters
         *
         * @param array   $in_table  The table to split
         * @param integer $max_width Split after this many characters
         *
         * @return array An array of tables
         */

        split_table (table, max_width) {
            const out_tables = [];
            let tmp_table = [];
            let width = 0;

            for (const column of table) {
                const column_width = 2 + Math.max (... column.map (cell => this.cell_width (cell)));
                if (width + column_width > max_width) {
                    // start a new table
                    out_tables.push (tmp_table.slice ());
                    tmp_table = [];
                    width = 0;
                }
                tmp_table.push (column);
                width += column_width;
            }
            if (tmp_table.length > 0) {
                out_tables.push (tmp_table);
            }
            return out_tables;
        },

        /**
         * Format a CollateX table into HTML
         *
         * @param string[] sigla The witnesses' sigla in table order
         * @param array    table The collation table in column-major orientation
         * @param string[] order The witnesses' sigla in the order they should be displayed
         *
         * @return string[] The rows of the formatted table
         *
         * @return void
         *
         * The Collate-X response:
         *
         * {
         *   "witnesses":["A","B"],
         *   "table":[
         *     [ [ {"t":"A","ref":123 } ],      [ {"t":"A" } ] ],
         *     [ [ {"t":"black","adj":true } ], [ {"t":"white","adj":true } ] ],
         *     [ [ {"t":"cat","id":"xyz" } ],   [ {"t":"kitten.","n":"cat" } ] ]
         *   ]
         * }
         */

        format_table (witnesses, table, order) {
            if (order.length === 0) {
                return  [];
            }
            const sigla  = witnesses.map (ms => ms.siglum);
            const titles = witnesses.map (ms => ms.title);
            const out_table = {
                'class' : '',
                'rows'  : [],
            };
            let is_master = true;

            // first witness will become the master text
            let  master_text = null;

            // ouput the witnesses in the correct order
            for (const siglum of order) {
                const index = sigla.indexOf (siglum);
                if (index === -1) {
                    continue; // user messed with mss. list but didn't start another collation
                }
                const row = {
                    'siglum' : siglum,
                    'title'  : titles[index],
                    'class'  : '',
                    'cells'  : [],
                };
                if (master_text === null) {
                    master_text = table[index];
                }
                const ms_text = table[index];

                for (const [ms_set, master_set] of _.zip (ms_text, master_text)) {
                    let class_ = 'tokens';
                    const master = master_set.map (token => token.t).join (' ').trim ();
                    const text   = ms_set.map     (token => token.t).join (' ').trim ();
                    if (!is_master && (master.toLowerCase () === text.toLowerCase ())) {
                        class_ += ' equal';
                    }
                    if (text === '') {
                        class_ += ' missing';
                    }
                    row.cells.push ({ 'class' : class_, 'text' : text });
                }
                out_table.rows.push (row);
                is_master = false;
            }
            return out_table;
        },

        update_tables (witnesses) {
            const max_width = 120 - Math.max (... witnesses.metadata.map (ms => ms.title.length));
            this.witnesses = witnesses;
            this.unsorted_tables = this
                .split_table (witnesses.table, max_width)
                .map (table => this.transpose (table));
        },

        sort_like (order) {
            this.tables = this.unsorted_tables.map (table => this.format_table (
                this.witnesses.metadata,
                table,
                order
            ));
            if (this.tables.length > 0) {
                this.tables[0].class = 'first';
                this.tables[this.tables.length - 1].class = 'last';
            }
        },

        get_sigla (item) {
            // Get the sigla of all witnesses to collate in user-specified order
            return $ (item).closest ('table').find ('tr[data-siglum]').map (function () {
                return this.getAttribute ('data-siglum');
            })
                .get ();
        },

        row_class (row, dummy_index) {
            const cls = [];
            /* if (row.siglum !== tools.bk_id) { */
            cls.push ('sortable');
            if (this.hovered === row.siglum) {
                cls.push ('highlight-witness');
            }
            return cls;
        },
    },
    mounted () {
    },
    updated () {
        const vm = this;
        const $tbodies = $ (this.$el).find ('table.collation tbody');
        $tbodies.disableSelection ().sortable ({
            'items'       : 'tr.sortable',
            'handle'      : 'th.handle',
            'axis'        : 'y',
            'cursor'      : 'move',
            'containment' : 'parent',
            'update'      : function (event, ui) {
                vm.$emit ('reordered', vm.get_sigla (ui.item));
            },
        });
    },
});