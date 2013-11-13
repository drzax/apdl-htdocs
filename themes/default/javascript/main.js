(function(window, undefined) {
    var hasLocalStorage, displayOptions;
    hasLocalStorage = !!window.sessionStorage;
    require([ "jquery", "svg-icons", "svgicons-config" ], function($, b) {
        var $container, $button, icon;
        $button = $("#nav-trigger");
        $container = $("body");
        $pusher = $("#pusher");
        icon = new svgIcon($button.get(0), svgIconConfig, {
            easing: mina.elastic,
            speed: 600
        });
        $button.on("click", function() {
            $container.toggleClass("nav-open");
            return false;
        });
    });
    require([ "jquery" ], function() {
        var $optionFields;
        displayOptions = [];
        $optionFields = $("input.opt");
        $optionFields.each(function() {
            var $opt;
            $opt = $(this);
            $opt.on("change", function() {
                displayOptions[$opt.attr("id")] = $opt.val();
                if (hasLocalStorage) {
                    sessionStorage[$opt.attr("id")] = $opt.val();
                }
            });
            if (hasLocalStorage && sessionStorage[$opt.attr("id")]) {
                $opt.val(sessionStorage[$opt.attr("id")]);
            } else {
                $opt.val($opt.data("default"));
            }
            displayOptions[$opt.attr("id")] = $opt.val();
        });
    });
    require([ "jquery", "jquery.autocomplete" ], function($) {
        var searchData, searchDataUrl;
        searchDataUrl = "/api/searchData";
        getDataFromCache(function(data) {
            if (data === false) {
                getDataFromServer();
            } else {
                processData(data);
            }
        });
        function getDataFromCache(callback) {
            if (hasLocalStorage && typeof sessionStorage[searchDataUrl] === "string") {
                try {
                    searchData = JSON.parse(sessionStorage[searchDataUrl]);
                    callback(searchData);
                } catch (e) {
                    callback(false);
                }
            } else {
                callback(false);
            }
        }
        function getDataFromServer() {
            $.ajax({
                dataType: "json",
                url: searchDataUrl,
                success: processDataFromServer
            });
        }
        function processDataFromServer(data, status, xhr) {
            if (hasLocalStorage) {
                try {
                    window.sessionStorage[searchDataUrl] = JSON.stringify(data);
                } catch (e) {
                    window.sessionStorage[searchDataUrl] = null;
                }
            }
            processData(data);
        }
        function processData(data) {
            var i;
            searchData = [];
            for (i = data.items.length; i--; ) {
                searchData.unshift({
                    value: data.items[i].Title + " " + data.items[i].ISBN + " " + data.items[i].Author,
                    data: data.items[i]
                });
            }
            $(function() {
                $("#search").autocomplete({
                    lookup: searchData,
                    onSelect: function(suggestion) {
                        window.location = window.location.protocol + "//" + window.location.host + "/view/item/" + suggestion.data.BIB;
                    },
                    formatResult: function(suggestion, currentValue) {
                        return suggestion.data.Title;
                    }
                });
            });
        }
    });
    require([ "d3" ], function($) {
        var width, height, force, container, dataCache, svg, nodes, links, node, link, current, expand, bookmark, drag, title;
        container = d3.select("#graph");
        if (!container[0][0]) return;
        width = window.innerWidth;
        height = window.innerHeight;
        dataCache = [];
        nodes = [];
        links = [];
        force = d3.layout.force().nodes(nodes).links(links).friction(.4).charge(function(d) {
            return -1500;
            return d.index === current.index ? -100 : -4e3;
        }).linkDistance(function(d) {
            return 100 * (1.5 - d.value);
        }).size([ width, height ]).on("tick", tick);
        drag = force.drag().on("drag", function(d) {
            d.fixed = true;
            d3.select(this).classed("fixed", true);
        });
        svg = container.append("svg").attr("width", width).attr("height", height);
        link = svg.selectAll(".link");
        node = svg.selectAll(".node");
        title = d3.select(".item-title");
        d3.select(window).on("resize", resize);
        resize();
        bookmark = d3.select("#bookmark-this").on("click", bookmarkCurrentNode);
        expand = d3.select("#expand-this").on("click", expandOrContract);
        load(container.attr("data-bib"), function(err, item) {
            addLikedNodes(err, item);
            selectNode(err, item);
        });
        function load(bib, callback) {
            if (dataCache[bib]) {
                callback(null, dataCache[bib]);
            } else {
                d3.json("/api/item/" + bib, callback);
            }
        }
        function selectNode(err, item) {
            var updates, updatesEntering, nId;
            nId = makeOrFindNode(item);
            current = nodes[nId];
            if (current.expanded) {
                expand.classed("collapse", true).text("collapse");
            } else {
                expand.classed("collapse", false).text("expand");
            }
            d3.select(".node.current").classed("current", false);
            d3.select("#node-" + current.bib).classed("current", true);
            updates = d3.select("#timeline").selectAll(".update").data(current.timeline);
            updates.enter().append("div").attr("class", "update");
            updates.html(function(d) {
                return "<p>" + d.title + "</p>";
            });
            updates.exit().remove();
            title.text(current.title);
        }
        function nodeClick(d) {
            if (d3.event.defaultPrevented) return;
            if (d.fixed) {
                d.fixed = false;
                d3.select(this).classed("fixed", false);
                return;
            }
            d3.select(".node.current").classed("current", false);
            d3.select("#node-" + d.bib).classed("current", true);
            load(d.bib, selectNode);
        }
        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            container.attr("width", width).attr("height", height);
            svg.attr("width", width).attr("height", height);
            force.size([ width, height ]).resume();
        }
        function bookmarkCurrentNode() {
            d3.event.preventDefault();
            d3.json("/api/bookmark/" + current.bib, function(err, result) {
                console.log(result);
            });
        }
        function expandOrContract() {
            if (current.expanded) {
                removeLikedNodes(current);
            } else {
                load(current.bib, addLikedNodes);
            }
        }
        function removeLikedNodes(n) {
            var nodesToRemove, linksToRemove;
            nodesToKeep = [ n ];
            linksToKeep = [];
            links.forEach(function(link) {
                if (link.source.bib != n.bib) {
                    linksToKeep.push(link);
                }
            });
            nodes.forEach(function(node) {
                linksToKeep.forEach(function(link) {
                    if (node.bib == link.source.bib || node.bib == link.target.bib) {
                        nodesToKeep.push(node);
                    }
                });
            });
            force.links(linksToKeep);
            links = force.links();
            force.nodes(nodesToKeep);
            nodes = force.nodes();
            force.start();
            n.expanded = false;
            redraw();
        }
        function tick() {
            link.attr("x1", function(d) {
                return d.source.x;
            }).attr("y1", function(d) {
                return d.source.y;
            }).attr("x2", function(d) {
                return d.target.x;
            }).attr("y2", function(d) {
                return d.target.y;
            });
            node.attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
            if (force.alpha() < .1) force.alpha(.1);
        }
        function makeOrFindNode(data) {
            var nodeIndex;
            nodes.forEach(function(n, i) {
                if (data.bib == n.bib) {
                    nodeIndex = i;
                }
            });
            if (nodeIndex === undefined) {
                nodes.push(data);
                nodeIndex = nodes.length - 1;
            }
            if (!nodes[nodeIndex].friends) nodes[nodeIndex].friends = data.friends;
            if (!nodes[nodeIndex].timeline) nodes[nodeIndex].timeline = data.timeline;
            return nodeIndex;
        }
        function addLikedNodes(error, item) {
            var sourceIndex;
            sourceIndex = makeOrFindNode(item);
            nodes[sourceIndex].expanded = true;
            item.friends.forEach(function(target) {
                targetIndex = makeOrFindNode(target);
                links.push({
                    source: nodes[sourceIndex],
                    target: nodes[targetIndex],
                    value: target.strength
                });
            });
            redraw();
            return sourceIndex;
        }
        function redraw() {
            var nodeEntering, linkEntering;
            link = svg.selectAll(".link");
            link = link.data(force.links());
            linkEntering = link.enter().insert("line", ".node").attr("class", "link").style("stroke-width", "1");
            link.exit().remove();
            node = svg.selectAll(".node");
            node = node.data(force.nodes(), function(d) {
                return "node-" + d.bib;
            });
            nodeEntering = node.enter().append("g").attr("class", "node").call(force.drag).on("click", nodeClick);
            nodeEntering.append("circle").attr("stroke-width", 0).attr("fill", "transparent").attr("r", 16).transition().attr("x", -16).attr("y", -16).attr("width", 32).attr("height", 32);
            nodeEntering.append("image").attr("xlink:href", function(d) {
                var cat, base;
                base = "/themes/default/images/icon-";
                cat = d.category ? d.category.replace(/ /g, "-") : "default";
                return cat.length ? base + cat + ".svg" : base + "default.svg";
            }).attr("x", 0).attr("y", 0).attr("width", 0).attr("height", 0).transition().attr("x", -16).attr("y", -16).attr("width", 32).attr("height", 32);
            node.attr("id", function(d) {
                return "node-" + d.bib;
            });
            node.exit().remove();
            force.start();
        }
    });
})(window);