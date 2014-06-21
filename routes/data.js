var Graph = require('../models/Graph');

/**
 * Get a d3 compatible representation of the graph for a term.
 *
 */
exports.term = function (req, res) {
    var term = req.param('term');
    var graph = Graph.fromTerm(term, function(graph) {
        res.json(200, graph.data());
    });
};
