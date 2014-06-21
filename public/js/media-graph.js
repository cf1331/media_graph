;(function ($) {

    'use strict';

    var graphContainer = d3.select('#graph-container');

    var w = parseInt(graphContainer.style('width')),
        h = parseInt(graphContainer.style('height'));


    var zoom = d3.behavior.zoom()
        .size([w, h])
        .scaleExtent([.25, 10])
        .on('zoom', zoomed);


    var svg = graphContainer.append('svg:svg')
        .attr('width', w + 'px')
        .attr('height', h + 'px')
        .call(zoom);

    var container = svg.append('g');

    var rect = container.append('rect')
        .attr('width', 2 * w)
        .attr('height', 2 * h)
        .attr('transform', '')
        .style('fill', 'none')
        .style('pointer-events', 'all');

    var force = d3.layout.force()
        .charge(-750)
        .gravity(0.025)
        .linkDistance(125)
        .size([w, h]);

    var rootNode = null;

    var term = termFromLocation();
    d3.json('/data/term/' + term, function (error, graph) {
        // Find the root node
        for(var i = 0; i < graph.nodes.length; i++) {
            var node = graph.nodes[i];
            if (node.data.phrase === term) {
                rootNode = node;
                break;
            }
        }

        // Fix the root node at the center of the graph.
        rootNode.x = w / 2;
        rootNode.y = h / 2;
        rootNode.fixed = true;
        
        // Start force layout
        force
            .nodes(graph.nodes)
            .links(graph.links)
            .start();

        // Create a line element for each link
        var link = container.selectAll('.link')
            .data(graph.links)
            .enter().append('line')
                .attr('class', 'link');

        // Create a circle elements for each link
        var node = container.selectAll('.node')
            .data(graph.nodes)
            .enter().append('g')
                .attr('class', function(d) { return rootNode === d ? 'node root' : 'node'; })
                .on('click', function(d) { focusNode(d); });
        node.append('circle')
            .attr('r', 30);

        // Append phrase as text element within each node circle.
        node.append('text')
            .text(function (d) { return d.data.phrase; });

        // Update graph element positions after each force iteration.
        force.on('tick', function () {
            link
                .attr('x1', function (d) { return d.source.x; })
                .attr('y1', function (d) { return d.source.y; })
                .attr('x2', function (d) { return d.target.x; })
                .attr('y2', function (d) { return d.target.y; });

            node
                .attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });
        });
    });

/**
 * Focus the specified node.
 *
 * The newly focused node will be moved to the center of the layout. Force
 * simulation will be resumed to allow other nodes to arrange themselves 
 * around the newly focused node.
 *
 * @param d Data object of the node to focus.
 */
    function focusNode(d) {
        // Determine the new root node's target position.
        rootNode.fixed = false;
        d.fixed = true;
        var tx = w / 2;
        var ty = h / 2;
        rootNode = d;

        // Update node classes.
        container.selectAll('.node')
            .attr('class', function(d) { return d === rootNode ? 'node root' : 'node'; });

        // Animate the new root node's position to the center of the layout.
        var el = d3.select('.node.root');
        el.transition()
            .duration(1000)
            .attrTween('d', function (d) {
                var ipx = d3.interpolate(d.x, tx);
                var ipy = d3.interpolate(d.y, ty);
                return function (t) {
                    d.px = ipx(t);
                    d.py = ipy(t);
                    return d;
                }
            });

        // Pan so that the new root node is centered.
        var svgSize = zoom.size();
        var svgScale = zoom.scale(); 
        var sx = tx - (svgSize[0] * svgScale / 2);
        var sy = ty - (svgSize[1] * svgScale / 2);
        svg.transition()
            .duration(1000)
            .call(zoom.translate([sx, sy]).event);

        // Resume force layout so that the rest of the graph arranges itself
        // around the new root node.
        force.resume();
    }

/**
 * Extract a term string from the current window location.
 *
 * @return Term string.
 */
    function termFromLocation() {
        var parts = window.location.pathname.split('/');
        for (var i = 0; i < (parts.length - 1); i++) {
            if (parts[i] === 'term')
                return parts[i + 1];
        }
        return 'budget';
    }

/**
 * Window resize handler.
 *
 * Update sizes and positions to ensure the graph layout functions
 * correctly.
 *
 */
    window.onresize = function() {
        w = parseInt(graphContainer.style('width'));
        h = parseInt(graphContainer.style('height'));
        zoom.size([w, h]);
        force.size([w, h]);
        svg.attr('width', w + 'px').attr('height', h + 'px');
        focusNode(rootNode); 
    };

/**
 * Zoomed event handler.
 *
 * Update the translation and scale of container based on the zoom behavior.
 *
 */
    function zoomed() {
        container.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
    }

})(jQuery)
