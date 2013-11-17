(function($, undefined) {
    window.personaLoggedInUser = "$MemberEmail";
    if (!window.personaLoggedInUser) window.personaLoggedInUser = null;
    $(document).on("click", ".persona-button.login", function() {
        navigator.id.request();
        return false;
    });
    $(document).on("click", ".persona-button.logout", function() {
        navigator.id.logout();
        return false;
    });
    navigator.id.watch({
        loggedInUser: window.personaLoggedInUser,
        onlogin: function(assertion) {
            $.ajax({
                type: "POST",
                url: "/persona/verify",
                data: {
                    assertion: assertion
                },
                success: function(res, status, xhr) {
                    if (window.personaLoggedInUser !== res.email) {
                        window.location.reload();
                    }
                },
                error: function(xhr, status, err) {
                    navigator.id.logout();
                    alert("Login failure: " + err);
                }
            });
        },
        onlogout: function() {
            $.ajax({
                type: "POST",
                url: "/persona/logout",
                success: function(res, status, xhr) {
                    if (window.personaLoggedInUser !== null) {
                        window.location.reload();
                    }
                },
                error: function(xhr, status, err) {
                    alert("Logout failure: " + err);
                }
            });
        }
    });
})(jQuery);

var svgIconConfig = {
    hamburgerCross: {
        url: "themes/default/images/hamburger.svg",
        animation: [ {
            el: "path:nth-child(1)",
            animProperties: {
                from: {
                    val: '{"path" : "m 5.0916789,20.818994 53.8166421,0"}'
                },
                to: {
                    val: '{"path" : "M 12.972944,50.936147 51.027056,12.882035"}'
                }
            }
        }, {
            el: "path:nth-child(2)",
            animProperties: {
                from: {
                    val: '{"transform" : "s1 1", "opacity" : 1}',
                    before: '{"transform" : "s0 0"}'
                },
                to: {
                    val: '{"opacity" : 0}'
                }
            }
        }, {
            el: "path:nth-child(3)",
            animProperties: {
                from: {
                    val: '{"path" : "m 5.0916788,42.95698 53.8166422,0"}'
                },
                to: {
                    val: '{"path" : "M 12.972944,12.882035 51.027056,50.936147"}'
                }
            }
        } ]
    },
    maximizeRotate: {
        url: "themes/default/images/maximize.svg",
        animation: [ {
            el: "path:nth-child(1)",
            animProperties: {
                from: {
                    val: '{"transform" : "r0 16 16 t0 0"}'
                },
                to: {
                    val: '{"transform" : "r180 16 16 t-5 -5"}'
                }
            }
        }, {
            el: "path:nth-child(2)",
            animProperties: {
                from: {
                    val: '{"transform" : "r0 48 16 t0 0"}'
                },
                to: {
                    val: '{"transform" : "r-180 48 16 t5 -5"}'
                }
            }
        }, {
            el: "path:nth-child(3)",
            animProperties: {
                from: {
                    val: '{"transform" : "r0 16 48 t0 0"}'
                },
                to: {
                    val: '{"transform" : "r-180 16 48 t-5 5"}'
                }
            }
        }, {
            el: "path:nth-child(4)",
            animProperties: {
                from: {
                    val: '{"transform" : "r0 48 48 t0 0"}'
                },
                to: {
                    val: '{"transform" : "r180 48 48 t5 5"}'
                }
            }
        } ]
    }
};

(function(window, $, undefined) {
    var $container, $button, icons;
    $button = $("#nav-trigger");
    $container = $("body");
    $pusher = $("#pusher");
    icons = [];
    icons.push(new svgIcon($button.get(0), svgIconConfig, {
        easing: mina.elastic,
        speed: 600
    }));
    $button.on("click", function() {
        $container.toggleClass("nav-open");
        return false;
    });
})(window, jQuery);

(function(window, $, undefined) {
    var searchData, searchDataUrl, hasLocalStorage;
    hasLocalStorage = !!window.sessionStorage;
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
})(window, jQuery);

(function(window, undefined) {
    var width, height, force, container, dataCache, hasLocStor, svg, nodes, links, node, link, selected, expand, bookmark, drag, title;
    container = d3.select("#graph");
    if (!container[0][0]) return;
    hasLocStor = !!window.sessionStorage;
    width = window.innerWidth;
    height = window.innerHeight;
    dataCache = [];
    nodes = [];
    links = [];
    force = d3.layout.force().nodes(nodes).links(links).friction(.4).charge(function(d) {
        return -1500;
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
    buttons = {
        expand: {
            selection: d3.select("#expand-this")
        },
        bookmark: {
            selection: d3.select("#bookmark-this")
        }
    };
    buttons.expand.selection.on("click", expandOrCollapse);
    buttons.expand.snap = new svgIcon(buttons.expand.selection[0][0], svgIconConfig, {
        easing: mina.elastic,
        speed: 600
    });
        var n;
        n = makeOrFindNode(item);
        expandNode(n);
        selectNode(n);
    });
    function selectNode(d) {
        var updates, updatesEntering, nId;
        selected = d;
        nodes.forEach(function(n) {
            n.selected = n == d;
        });
        if (selected.expanded) {
            ensureToggled(buttons.expand.snap);
        } else {
            ensureUntoggled(buttons.expand.snap);
        }
        d3.select(".node.current").classed("current", false);
        d3.select("#node-" + selected.bib).classed("current", true);
        populateInfoPanel(d);
    }
    function ensureToggled(svgIcon) {
        if (!svgIcon.toggled) {
            svgIcon.toggle(true);
        }
    }
    function ensureUntoggled(svgIcon) {
        if (svgIcon.toggled) {
            svgIcon.toggle(true);
        }
    }
    function populateInfoPanel(d) {
        title.text(selected.title);
        d3.select(".item-author").text(selected.author);
        load(d.bib, function(err, itemData) {
            updates = d3.select("#timeline").selectAll(".update").data(itemData.timeline);
            updates.enter().append("div").attr("class", "update");
            updates.html(function(d) {
                return d.text ? "<p>" + d.text + "</p>" : "";
            });
            updates.exit().remove();
        });
    }
    function nodeClick(d) {
        if (d3.event.defaultPrevented) return;
        if (d.fixed) {
            d.fixed = false;
            d3.select(this).classed("fixed", false);
            return;
        }
        selectNode(d);
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
            var container, bookmarks, enter, exit;
            container = d3.select("#bookmarks").selectAll(".bookmark").data(result);
            container.enter().append("div").attr("class", "bookmark");
            container.html(function(d) {
                return '<p class="title">' + d.title + '</p><p class="author">' + d.author + "</p>";
            });
            container.exit().remove();
        });
    }
    function expandOrCollapse() {
        d3.event.preventDefault();
        if (selected.expanded) {
            collapseNode(selected);
        } else {
            expandNode(selected);
        }
    }
    function collapseNode(n, recursive) {
        var outgoingLinks = linksByNode(n, "source");
        n.expanded = false;
        outgoingLinks.forEach(function(link) {
            var i, targetNode;
            for (i = links.length; i--; ) {
                if (links[i] == link) {
                    links.splice(i, 1);
                }
            }
            targetNode = link.target;
            if (recursive) collapseNode(targetNode, recursive);
            if (!linksByNode(targetNode).length && !targetNode.locked) {
                removeNode(targetNode);
            }
        });
        redraw();
    }
    function collapseTree(node) {
        node.locked = true;
        collapseNode(node, true);
        node.locked = false;
    }
    function removeNode(n) {
        var i;
        i = nodes.indexOf(n);
        if (i >= 0) return nodes.splice(i, 1);
    }
    function linksByNode(node, type) {
        var ret = [];
        links.forEach(function(link) {
            if (!type) {
                if (link.target == node || link.source == node) ret.push(link);
            } else {
                if (link[type] == node) ret.push(link);
            }
        });
        return ret;
    }
    function tick() {
        var xOffsetPct = .15;
        link.attr("x1", function(d) {
            return d.source.x - width * xOffsetPct;
        }).attr("y1", function(d) {
            return d.source.y;
        }).attr("x2", function(d) {
            return d.target.x - width * xOffsetPct;
        }).attr("y2", function(d) {
            return d.target.y;
        });
        node.attr("transform", function(d) {
            var transforms = [];
            transforms.push("translate(" + (d.x - width * xOffsetPct) + "," + d.y + ")");
            if (d.selected) transforms.push("scale(1.5)");
            return transforms.join(" ");
        });
        if (force.alpha() < .1) force.alpha(.1);
    }
    function expandNode(d) {
        d.expanded = true;
        load(d.bib, function(err, item) {
            var n;
            n = makeOrFindNode(item);
            n.friends.forEach(function(targetData) {
                target = makeOrFindNode(targetData);
                links.push({
                    source: n,
                    target: target,
                    value: targetData.strength
                });
            });
            redraw();
        });
    }
    function redraw() {
        var nodeEntering, linkEntering, nodeDiameter;
        link = svg.selectAll(".link");
        link = link.data(force.links());
        nodeDiameter = 24;
        linkEntering = link.enter().insert("line", ".node").attr("class", "link").style("stroke-width", "1");
        link.exit().remove();
        node = svg.selectAll(".node");
        node = node.data(force.nodes(), function(d) {
            return "node-" + d.bib;
        });
        nodeEntering = node.enter().append("g").attr("class", "node").call(force.drag).on("click", nodeClick);
        nodeEntering.append("circle").attr("stroke-width", 0).attr("fill", "transparent").attr("r", nodeDiameter / 2).transition().attr("x", -nodeDiameter / 2).attr("y", -nodeDiameter / 2).attr("width", nodeDiameter).attr("height", nodeDiameter);
        nodeEntering.append("image").attr("xlink:href", function(d) {
            var cat, base;
            base = "/themes/default/images/icon-";
            cat = d.category ? d.category.replace(/ /g, "-") : "default";
            return cat.length ? base + cat + ".svg" : base + "default.svg";
        }).attr("x", 0).attr("y", 0).attr("width", 0).attr("height", 0).transition().attr("x", -nodeDiameter / 2).attr("y", -nodeDiameter / 2).attr("width", nodeDiameter).attr("height", nodeDiameter);
        node.attr("id", function(d) {
            return "node-" + d.bib;
        });
        node.exit().selectAll("image").transition().attr("x", 0).attr("y", 0).attr("width", 0).attr("height", 0).each("end", function() {
            d3.select(this.parentNode).remove();
        });
        force.start();
    }
    function makeOrFindNode(data) {
        var node;
        nodes.forEach(function(n, i) {
            if (data.bib == n.bib) {
                node = n;
            }
        });
        if (node === undefined) {
            nodes.push(data);
            node = data;
        }
        if (data.friends) {
            node.friends = data.friends;
            data.friends.forEach(function(f) {
                load(f.bib);
            });
        }
        if (data.timeline) node.timeline = data.timeline;
        return node;
    }
    function load(bib, callback) {
        if (dataCache[bib]) {
            if (callback) callback(null, dataCache[bib]);
        } else {
            d3.json("/api/item/" + bib, function(err, item) {
                if (!err) dataCache[bib] = item;
                if (callback) callback(err, item);
            });
        }
    }
})(window);