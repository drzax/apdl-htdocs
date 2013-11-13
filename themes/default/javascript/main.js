(function(window, undefined) {
    var hasLocalStorage;
    hasLocalStorage = !!window.sessionStorage;
    require([ "jquery" ], function($) {
        var $container, $button;
        $button = $("#nav-trigger");
        $container = $("body");
        $pusher = $("#pusher");
        $button.on("click", function() {
            $container.addClass("nav-open");
            $pusher.one("click", function() {
                $container.removeClass("nav-open");
                return false;
            });
            return false;
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
        var width, height, force, container, svg, nodes, links, node, link, clicked, drag, title;
        container = d3.select("#graph");
        if (container.length < 1) return;
        width = window.innerWidth;
        height = window.innerHeight;
        nodes = [];
        links = [];
        force = d3.layout.force().nodes(nodes).links(links).friction(.2).charge(-1e3).linkDistance(function(d) {
            return 100 * (-d.value + 1.5);
        }).size([ width, height ]).on("tick", tick);
        drag = force.drag().on("drag", function(d) {
            d.fixed = true;
        });
        svg = container.append("svg").attr("width", width).attr("height", height);
        link = svg.selectAll(".link");
        node = svg.selectAll(".node");
        title = d3.select("div.title");
        d3.select(window).on("resize", resize);
        resize();
        load(container.attr("data-bib"));
        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            container.attr("width", width).attr("height", height);
            svg.attr("width", width).attr("height", height);
            force.size([ width, height ]).resume();
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
        }
        function makeOrFindNode(data) {
            var nodeIndex;
            nodes.forEach(function(n, i) {
                if (data.bib == n.bib) {
                    nodeIndex = i;
                }
            });
            if (nodeIndex === undefined) {
                if (nodes[clicked]) {
                    data.x = nodes[clicked].x;
                    data.y = nodes[clicked].y;
                }
                console.log(data.x, data.y);
                nodes.push(data);
                nodeIndex = nodes.length - 1;
            }
            return nodeIndex;
        }
        function load(bib) {
            d3.json("/api/item/" + bib, loadCallback);
        }
        function loadCallback(error, item) {
            var sourceIndex;
            d3.select("div.title").html(item.title);
            sourceIndex = makeOrFindNode(item);
            item.friends.forEach(function(target) {
                targetIndex = makeOrFindNode(target);
                links.push({
                    source: nodes[sourceIndex],
                    target: nodes[targetIndex],
                    value: target.strength
                });
            });
            start();
        }
        function pageContent(item) {
            $("div.title").text(item.title);
        }
        function start() {
            var nodeEntering, linkEntering;
            link = svg.selectAll(".link");
            link = link.data(force.links());
            linkEntering = link.enter().insert("line", ".node").attr("class", "link").style("stroke-width", "1");
            link.exit().remove();
            node = svg.selectAll(".node");
            node = node.data(force.nodes());
            nodeEntering = node.enter().append("g").attr("class", "node").call(force.drag).on("click", function(d) {
                if (d3.event.defaultPrevented) return;
                if (d.fixed) {
                    d.fixed = false;
                    return;
                }
                clicked = d.index;
                load(d.bib);
            });
            nodeEntering.append("image").attr("xlink:href", function(d) {
                var cat, base;
                base = "/themes/default/images/icon-";
                cat = d.category ? d.category.replace(/ /g, "-") : "default";
                return cat.length ? base + cat + ".svg" : base + "default.svg";
            }).attr("x", 0).attr("y", 0).attr("width", 0).attr("height", 0).transition().attr("x", -16).attr("y", -16).attr("width", 32).attr("height", 32);
            node.exit().remove();
            force.start();
        }
    });
})(window);