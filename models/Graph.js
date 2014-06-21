var _ = require('underscore'),
    neo4j = require('neo4j');


var db = new neo4j.GraphDatabase('http://localhost:7474/');


var Graph = module.exports = function () {
    this.links = [];
    this.nodes = [];
    this._nodeIndexes = [];
    this._linkIndexes = [];
};

Graph.prototype = {

    /**
    * Get an object containing just the nodes and edges of the graph.
    *
    * @return A d3 compatible representation of the graph.
    */
    data: function () {
        return { nodes: this.nodes, links: this.links };
    },

    /**
    * Add a neo4j node to the internal graph representation. 
    *
    * @param node A neo4j Node object.
    */
    _addNode: function (node) {
        if (this._nodeIndexes[node.id] !== undefined)
            return;
        var n = {
            id: node.id,
            data: node.data
        };
        this._nodeIndexes[node.id] = this.nodes.push(n) - 1;
    },

    /**
    * Add a neo4j relationship to the internal graph representation.
    *
    * @param link A neo4j Relationship object.
    */
    _addLink: function (link) {
        if (this._linkIndexes[link.id] !== undefined)
            return
        var l = {
            id: link.id,
            source: this._nodeIndexes[link.start.id],
            target: this._nodeIndexes[link.end.id],
            type: link.type
        };
        this._linkIndexes[link.id] = this.links.push(l);
    }

};


/**
 * Get a Graph instance for a term.
 *
 * @param term A term string.
 * @param ready Callback function for when the graph is ready.
                Signature: ready(graph)
 */
Graph.fromTerm = function (term, ready) {
    var cypher = [
		'MATCH (start:Term {phrase:{phrase}})<-[r*1..5]-(w2:Term),',
        '      path = (w2)-->(w1:Term)',
        'WITH DISTINCT path as path',
		'RETURN nodes(path) as nodes, rels(path) as relations'
	].join('\n');

    var params = { phrase: term };

    db.query(cypher, params, function (err, results) {
        if (err) throw err;
        var graph = new Graph();
        results.forEach(function (row) {
            row.nodes.forEach(function (node) {
                graph._addNode(node);
            });
            row.relations.forEach(function (rel) {
                graph._addLink(rel);
            });
        });
        if(ready)
            ready(graph);
    });
};
