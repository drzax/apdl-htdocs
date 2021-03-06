(function($, undefined) {
    if (!navigator.id) return;
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
                    logIn();
                },
                error: function(xhr, status, err) {
                    logOut();
                    alert("Login failure: " + err);
                }
            });
        },
        onlogout: function() {
            $.ajax({
                type: "POST",
                url: "/persona/logout",
                success: function(res, status, xhr) {
                    window.personaLoggedInUser = null;
                    logOut();
                },
                error: function(xhr, status, err) {
                    alert("Logout failure: " + err);
                }
            });
        }
    });
    function logIn() {
        $("#bookmark-this").show();
        $(".persona-button").removeClass("login").addClass("logout").find("span").text("Sign out");
    }
    function logOut() {
        $("#bookmark-this").hide();
        $("#bookmarks").empty();
        $(".persona-button").removeClass("logout").addClass("login").find("span").text("Sign in with your email");
    }
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
    flag: {
        url: "themes/default/images/flag.svg",
        animation: [ {
            el: "path",
            animProperties: {
                from: {
                    val: '{"path" : "m 11.75,11.75 c 0,0 10.229631,3.237883 20.25,0 10.020369,-3.2378833 20.25,0 20.25,0 l 0,27 c 0,0 -6.573223,-3.833185 -16.007359,0 -9.434136,3.833185 -24.492641,0 -24.492641,0 z"}'
                },
                to: {
                    val: '{"path" : "m 11.75,11.75 c 0,0 8.373476,-4.8054563 17.686738,0 9.313262,4.805456 22.813262,0 22.813262,0 l 0,27 c 0,0 -11.699747,4.363515 -22.724874,0 C 18.5,34.386485 11.75,38.75 11.75,38.75 z"}'
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
                value: data.items[i].Title,
                data: data.items[i]
            });
        }
        $(function() {
            $("#search").autocomplete({
                lookup: searchData,
                onSelect: function(suggestion) {
                    window.location = window.location.protocol + "//" + window.location.host + "/view/item/" + suggestion.data.BIB;
                },
                lookupFilter: function(suggestion, originalQuery, queryLowerCase) {
                    var suggestionString = (suggestion.data.Title || "" + " " + suggestion.data.ISBN || "" + " " + suggestion.data.Author || "").toLowerCase();
                    return suggestionString.toLowerCase().indexOf(queryLowerCase) !== -1;
                },
                formatResult: function(suggestion, currentValue) {
                    var parts = [], meta = [];
                    parts.push('<span class="title">' + suggestion.data.Title + "</span>");
                    if (suggestion.data.Author) meta.push('<span class="author">' + suggestion.data.Author + "</span>");
                    if (suggestion.data.ISBN) meta.push('<span class="isbn">ISBN: ' + suggestion.data.ISBN + "</span>");
                    if (meta.length) parts.push('<span class="meta">' + meta.join(" ") + "</span>");
                    return parts.join(" ");
                }
            });
        });
    }
})(window, jQuery);

(function(window, undefined) {
    var width, height, force, container, dataCache, hasLocStor, svg, nodes, links, node, link, selected, nodeDiameter, nodeScale, buttons, drag, playTimeout, playInterval, title;
    container = d3.select("#graph");
    if (!container[0][0]) return;
    hasLocStor = !!window.sessionStorage;
    width = window.innerWidth;
    height = window.innerHeight;
    nodeDiameter = 34;
    nodeScale = 1.5;
    dataCache = [];
    nodes = [];
    links = [];
    force = d3.layout.force().nodes(nodes).links(links).friction(.8).gravity(.2).charge(-3100).linkStrength(function(d) {
        return selected && selected.bib == d.bib ? 1 : .5;
    }).linkDistance(function(d) {
        return 60 * (1.5 - d.value);
    }).size([ width, height ]).on("tick", tick);
    drag = force.drag().on("drag", function(d) {
        d.fixed = true;
        d3.select(this).classed("fixed", true);
    });
    svg = container.append("svg").attr("width", width).attr("height", height);
    svg.append("svg:defs").append("svg:marker").attr("id", "end-arrow").attr("viewBox", "0 -5 10 10").attr("refX", 6).attr("markerWidth", 5).attr("markerHeight", 5).attr("orient", "auto").append("svg:path").attr("d", "M0,-5L10,0L0,5").attr("fill", "#000");
    link = svg.selectAll(".link");
    node = svg.selectAll(".node");
    title = d3.select(".item-title");
    d3.select(window).on("resize", resize).on("mousemove", function() {
        stop();
    }).on("popstate", function(e) {
        var bib;
        bib = bibFromUrl();
        if (bib) load(bib, function(err, item) {
            selectNode(makeOrFindNode(item));
        });
    });
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
    if (buttons.expand.selection[0][0]) {
        buttons.expand.snap = new svgIcon(buttons.expand.selection[0][0], svgIconConfig, {
            easing: mina.elastic,
            speed: 800
        });
    }
    buttons.bookmark.selection.on("click", bookmarkCurrentNode);
    if (buttons.bookmark.selection[0][0]) {
        buttons.bookmark.snap = new svgIcon(buttons.bookmark.selection[0][0], svgIconConfig, {
            easing: mina.elastic,
            speed: 800
        });
    }
    (function() {
        var bib = bibFromUrl();
        if (bib) load(bib, function(err, item) {
            var n;
            n = makeOrFindNode(item);
            expandNode(n);
            selectNode(n);
        });
        stop();
    })();
    function bibFromUrl(url) {
        var match;
        url = url || window.location.href;
        match = url.match(/view\/item\/([0-9]+)/);
        return match[1];
    }
    function stop() {
        clearTimeout(playTimeout);
        clearInterval(playInterval);
        playTimeout = setTimeout(function() {
            play();
        }, 3e5);
    }
    function play() {
        clearTimeout(playTimeout);
        playInterval = setInterval(function() {
            var node, filtered;
            if (nodes.length > 25) {
                filtered = nodes.filter(function(n) {
                    return n.expanded;
                });
            }
            if (!filtered || filtered.length < 1) {
                filtered = nodes;
            }
            node = filtered[Math.floor(Math.random() * filtered.length)];
            if (node.expanded) {
                collapseNode(node);
            } else {
                expandNode(node);
            }
            selectNode(node);
            nodes.forEach(function(n) {
                if (n != selected && linksByNode(n).length < 1) {
                    removeNode(n);
                }
            });
        }, 5e3);
    }
    function selectNode(d) {
        var updates, updatesEntering, nId;
        selected = d;
        nodes.forEach(function(n) {
            n.selected = n == d;
        });
        force.alpha(.1);
        if (selected.expanded) {
            ensureToggled(buttons.expand.snap);
        } else {
            ensureUntoggled(buttons.expand.snap);
        }
        d3.select(".node.current").classed("current", false);
        d3.select("#node-" + selected.bib).classed("current", true);
        if (selected.bib != bibFromUrl()) {
            history.pushState(null, null, "/view/item/" + selected.bib);
        }
        populateInfoPanel(d);
    }
    function ensureToggled(svgIcon) {
        if (svgIcon && !svgIcon.toggled) {
            svgIcon.toggle(true);
        }
    }
    function ensureUntoggled(svgIcon) {
        if (svgIcon && svgIcon.toggled) {
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
        d3.json("/api/bookmark/" + selected.bib, function(err, result) {
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
        link.attr("d", function(d) {
            var deltaX, deltaY, dist, normX, normY, sourcePadding, targetPadding, sourceX, sourceY, targetX, targetY;
            deltaX = d.target.x - d.source.x;
            deltaY = d.target.y - d.source.y;
            dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            normX = deltaX / dist;
            normY = deltaY / dist;
            sourcePadding = d.source.selected ? nodeDiameter / 2 * nodeScale : nodeDiameter / 2;
            targetPadding = d.target.selected ? nodeDiameter / 2 * nodeScale : nodeDiameter / 2;
            sourceX = d.source.x + sourcePadding * normX - width * xOffsetPct;
            sourceY = d.source.y + sourcePadding * normY;
            targetX = d.target.x - targetPadding * normX - width * xOffsetPct;
            targetY = d.target.y - targetPadding * normY;
            return "M" + sourceX + "," + sourceY + "L" + targetX + "," + targetY;
        });
        node.attr("transform", function(d) {
            var transforms = [];
            transforms.push("translate(" + (d.x - width * xOffsetPct) + "," + d.y + ")");
            if (d.selected) transforms.push("scale(" + nodeScale + ")");
            return transforms.join(" ");
        });
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
        var nodeEntering, linkEntering;
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
        link = link.data(force.links());
        link.enter().insert("svg:path", ".node").attr("class", "link");
        link.style("marker-end", "url(#end-arrow)");
        link.exit().remove();
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