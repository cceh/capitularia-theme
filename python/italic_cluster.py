#!/usr/bin/env python3
# -*- coding: utf-8 -*-
#

import argparse
import os.path
import re
import sys

import pandas as pd
import numpy as np
import matplotlib
import matplotlib.pyplot as plt

from sklearn.feature_extraction.text import CountVectorizer

import cluster

def debug (*a, **kw):
    if args.debug:
        print (*a, file=sys.stderr, **kw)


def bk_tokenizer (s):
    return s.split ()


def natural_sort_bk (key):
    m = re.match ('^BK.([0-9]+)(.*)$', key)
    if m:
        return m.group (1).zfill (3) + m.group (2)
    return key


def load_feature_matrix (args):
    ms_seq = cluster.scan_xml_file (args.input, 'ms', 'capitulare')

    cluster.fix_include_bks (args, ms_seq)

    mss = cluster.MSS
    if args.sort:
        mss = sorted (mss, key = cluster.natural_sort_key)

    vectorizer = CountVectorizer (tokenizer = bk_tokenizer, binary = True, lowercase = False,
                                  ngram_range = (args.min_ngrams, args.max_ngrams),
                                  min_df = args.min_df)

    corpus = [' '.join (map (cluster.key_to_df,  ms_seq[ms])) for ms in mss]
    X = vectorizer.fit_transform (corpus)
    return pd.DataFrame (X.toarray (), index = mss, columns = vectorizer.get_feature_names ())


def idf (args, df):
    f, axes = plt.subplots (1, 1, figsize = cluster.PAPER)

    vmin = df[df > 0].min ().min ()
    df[df==0] = -np.inf # make background white

    im = cluster.heat_matrix_df (f, axes, df, 100, 200,
                                 cmap=cluster.colormap_idf (),
                                 vmin = vmin)
    cluster.title (axes, args, "Manuscripts × Capitulars")

    cluster.colorbar (im, cmap = cluster.colormap_idf (),
                      cbarlabel="Inverse Document Frequency of Capitular")
    return f


def ms_sim (args, df):
    f, axes = plt.subplots (1, 1, figsize = cluster.PAPER)
    im = cluster.heat_matrix_df (f, axes, df, 100, 100,
                                 cmap=cluster.colormap_affinity ())
    cluster.title (axes, args, "Similarity of Manuscripts")

    cluster.colorbar (im, cmap = cluster.colormap_affinity (),
                      cbarlabel = 'Manuscript Similarity (cosine metric)')

    labels = np.around (df.values, decimals = 2)
    colors = np.empty (df.shape, object)
    colors[:] = "black"
    colors[df.values > 0.6] = "white"
    cluster.annotate (im, labels, colors, fontweight = "bold")

    return f


def cap_sim (args, df):
    f, axes = plt.subplots (1, 1, figsize = cluster.PAPER)
    im = cluster.heat_matrix_df (f, axes, df, 100, 100,
                                 cmap=cluster.colormap_affinity ())
    cluster.title (axes, args, "Similarity of Capitulars")

    cluster.colorbar (im, cmap = cluster.colormap_affinity (),
                      cbarlabel = 'Capitulary Similarity (cosine metric)')

    labels = np.around (df.values, decimals = 2)
    colors = np.empty (df.shape, object)
    colors[:] = "black"
    colors[df > 0.6] = "white"
    cluster.annotate (im, labels, colors, fontweight = "bold")

    return f


def rest (args):
    if args.hierarchical_cluster:
        for i, metric in enumerate (METRICS):
            hierarchical_cluster (Dms[metric], mslabels)

        for i, metric in enumerate (METRICS):
            hierarchical_cluster (Dbk[metric], bklabels)

    if args.gephi:
        # Gephi graph of capitulars
        G = nx.Graph (Dbk['cosine'])
        for n, label in enumerate (bklabels):
            data = G.nodes[n]
            data.update (classify (label))
            data['size'] = 15 + math.sqrt (df_k[n,0] * 100)

        G.remove_edges_from (nx.selfloop_edges (G))
        G.remove_nodes_from (list (nx.isolates (G)))

        nx.write_gexf (G, "/tmp/bk.gexf")

        # Gephi graph of documents
        G = nx.Graph (Dms['cosine'])
        for n, label in enumerate (mslabels):
            data = G.nodes[n]
            data['label'] = label
            data['size'] = 15 + math.sqrt (tf_d[0,n] * 100)

        G.remove_edges_from (nx.selfloop_edges (G))
        G.remove_nodes_from (list (nx.isolates (G)))

        nx.write_gexf (G, "/tmp/ms.gexf")


if __name__ == '__main__':

    parser = argparse.ArgumentParser (
        formatter_class = argparse.RawDescriptionHelpFormatter,  # don't wrap my description
        description = """Build diagrams of Capitulars."""
    )

    parser.add_argument ('-s', '--sort', action='store_true',
                         help="Sort manuscripts alphabetically (default: by age)")
    parser.add_argument ('-p', '--plot', action='store_true',
                         help="Show plot on screen")
    parser.add_argument ('-t', '--title',
                         help="The plot title (caption)")
    parser.add_argument ('-o', '--output',
                         help="Output file (eg. /tmp/file%s.png) (default: no output)")
    parser.add_argument ('-d', '--debug', action='store_true',
                         help="Turn on debugging output")
    parser.add_argument ('--idf', action='store_true',
                         help="Include an IDF diagram")
    parser.add_argument ('--mss', action='store_true',
                         help="Include a Manuscript Similarity diagram")
    parser.add_argument ('--bks', action='store_true',
                         help="Include a Capitulary Similarity diagram")
    cluster.add_range_args (parser)
    parser.add_argument ('--min-ngrams', type=int, default = 1,
                         help="Use n-grams of size=MIN (default=1)")
    parser.add_argument ('--max-ngrams', type=int, default = 1,
                         help="Use n-grams of size=MAX (default=1)")
    parser.add_argument ('--min-df', type=int, default = 2,
                         help="Drop features that don't occur at least this often.")
    parser.add_argument ('--gephi', action='store_true',
                         help="Output Gephi files")
    parser.add_argument ('--hierarchical_cluster', action='store_true',
                         help="Do scikit-learn hierarchical clustering")
    parser.add_argument ('input',
                         help="Input file")

    args = parser.parse_args ()
    args.sorted_by = "Alphabetical" if args.sort else "by Date"
    args.max_ngrams = max (args.min_ngrams, args.max_ngrams)

    feat = load_feature_matrix (args)
    mss  = feat.index
    bks  = feat.columns
    debug (feat)
    tf_idf_ms = cluster.tf_idf (args, feat)
    debug (tf_idf_ms)

    columns = list (map (cluster.key_to_df, args.include_bks))

    if len (args.include_bks) > 0:
        # remove unwanted capitularies from tf_idf_ms
        keep_columns = tf_idf_ms.columns.intersection (columns)
        tf_idf_ms = tf_idf_ms.loc[:, keep_columns]

    if args.idf:
        f = idf (args, tf_idf_ms)
        f.savefig (args.output, dpi=300, transparent=False)

    if args.mss:
        sim_ms = cluster.to_similarity_matrix (tf_idf_ms, 'cosine')
        debug (sim_ms)
        f = ms_sim  (args, sim_ms)
        f.savefig (args.output, dpi=300, transparent=False)

    if args.bks:
        tf_idf_bk = cluster.tf_idf (args, feat.T)
        debug (tf_idf_bk)
        sim_bk = cluster.to_similarity_matrix (tf_idf_bk, 'cosine')
        debug (sim_bk)

        if len (args.include_bks) > 0:
            debug (columns)
            # remove unwanted capitularies from sim_bk
            keep_columns = sim_bk.index.intersection (columns)
            sim_bk = sim_bk.loc[:, keep_columns]
            # rows: keep only bks with similarity > 0.5 to any of the selected ones
            sim_bk = sim_bk.loc[sim_bk[sim_bk >= 0.5].any (axis="columns")]

        f = cap_sim (args, sim_bk)
        f.savefig (args.output, dpi=300, transparent=False)

    if args.plot:
        plt.show ()
