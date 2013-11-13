;(function(window, undefined){

	var hasLocalStorage, displayOptions;

	hasLocalStorage = !!window.sessionStorage;

	// Menu
	require(['jquery', 'svg-icons', 'svgicons-config'], function($, b) {
		var $container, $button, icon;


		$button = $('#nav-trigger');
		$container = $('body');
		$pusher = $('#pusher');

		icon = new svgIcon( $button.get(0), svgIconConfig, { easing : mina.elastic, speed: 600 } );

		$button.on('click', function(){
			$container.toggleClass('nav-open'); 
			return false;
		});
	});

	// Options
	require(['jquery'], function(){
		var $optionFields;

		displayOptions = [];
		$optionFields = $('input.opt');

		$optionFields.each(function(){
			var $opt;

			$opt = $(this);

			$opt.on('change', function(){
				displayOptions[$opt.attr('id')] = $opt.val();
				if (hasLocalStorage) {
					sessionStorage[$opt.attr('id')] = $opt.val();
				}
			});

			// If the option is in the local storage restore it
			if (hasLocalStorage && sessionStorage[$opt.attr('id')]) {
				$opt.val(sessionStorage[$opt.attr('id')]);
			} else {
				$opt.val($opt.data('default'));
			}

			displayOptions[$opt.attr('id')] = $opt.val();

		});
	});

	// Search box
	require(['jquery','jquery.autocomplete'], function($){

		var searchData, searchDataUrl;

		searchDataUrl = '/api/searchData';

		getDataFromCache(function(data){
			if (data === false) {
				getDataFromServer();
			} else {
				processData(data);
			}
		});


		function getDataFromCache(callback) {
			if (
				hasLocalStorage &&
				typeof sessionStorage[searchDataUrl] === 'string'
			) {
				try{
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

			// Put it in the cache.
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
			for (i=data.items.length;i--;){
				searchData.unshift({
					value: data.items[i].Title + ' ' + data.items[i].ISBN + ' ' + data.items[i].Author,
					data: data.items[i]
				});
			}

			// Wait for the DOM
			$(function(){
				
				$('#search').autocomplete({
					lookup: searchData,
					onSelect: function (suggestion) {
						window.location = window.location.protocol + '//' + window.location.host + '/view/item/' + suggestion.data.BIB;
					},
					formatResult: function(suggestion, currentValue){
						return suggestion.data.Title;
					}
				});
			});
		}

	});

	// Graph
	require(['d3'], function($){

		var width, 		// the width of the graph SVG element
			height, 	// The height of the graph SVG element
			force, 		// The force directed layout
			container,	// The container to append the SVG.
			dataCache, 	// Local cache of data
			svg, 		// The SVG element which contains the graph
			nodes, 		// An array of all nodes in the graph.
			links, 		// An array of all links between nodes in the graph
			node, 		// D3's collection of all nodes
			link,		// D3's collection of all links
			current, 	// The most recently clicked node
			expand,		// Selection of the expand button
			bookmark,	// Selection of the bookmark button
			drag, 		// Force drag handler
			title; 		// The page title

		// Get the main container element
		container = d3.select('#graph');
		
		// Don't do anything else if the graph container isn't here. Wrong page.
		if (!container[0][0]) return;

		// Initialise width and height
		width = window.innerWidth;
		height = window.innerHeight;

		// Initialise the data cache
		dataCache = [];

		// Setup the node/link data arrays
		nodes = [];
		links = [];
		
		// Setup a force directed layout
		force = d3.layout.force()
			.nodes(nodes)
			.links(links)
			.friction(.4)
			.charge(function(d){
				return -1500;
				return (d.index === current.index) ? -100 : -4000;
			})
			.linkDistance(function(d){
				return 100*(1.5-d.value);
			})
			.size([width, height])
			.on('tick', tick);

		drag = force.drag()
			.on('drag', function(d){
				// Leave nodes where they're put.
				d.fixed = true;
				d3.select(this).classed("fixed", true);
			});

		// Setup the SVG element for the graph.
		svg = container.append("svg")
			.attr("width", width)
			.attr("height", height);

		// Setup d3 collections we need to know about
		link = svg.selectAll('.link');
		node = svg.selectAll('.node');

		// The item title
		title = d3.select('.item-title');

		// Setup the size
		d3.select(window).on("resize", resize);
		resize();

		bookmark = d3.select('#bookmark-this').on('click', bookmarkCurrentNode);
		expand = d3.select('#expand-this').on('click', expandOrContract);

		// Start the party
		load(container.attr('data-bib'), function(err, item){
			addLikedNodes(err, item);
			selectNode(err, item);
		});

		// Load data for an item based on a BIB and call a callback
		function load(bib, callback) {
			if (dataCache[bib]) {
				callback(null, dataCache[bib]);
			} else {
				d3.json('/api/item/'+bib, callback);
			}
		}

		// Select a node
		function selectNode(err, item) {
			var updates, updatesEntering, nId;

			nId = makeOrFindNode(item);

			current = nodes[nId];

			// Change the state of the expand toggle button
			if (current.expanded) {
				expand.classed('collapse', true).text('collapse');
			} else {
				expand.classed('collapse', false).text('expand');
			}
			
			d3.select('.node.current').classed('current', false);
			d3.select('#node-'+current.bib).classed('current', true);

			// Populate the info panel with the selected node's details
			// console.log(d);
			updates = d3.select('#timeline').selectAll('.update').data(current.timeline);

			// New update in the timeline
			updates.enter()
				.append('div')
				.attr('class', 'update');

			// Update new and existing update containers with the data
			updates.html(function(d){
				// todo: Change this to text.
				return '<p>'+d.title+'</p>';
			});
			
			// Remove superfluous updates
			updates.exit().remove(); 

			// Set the title text
			title.text(current.title);
		}

		// What to do with a click on a node
		function nodeClick(d){

			// Ignore the click generated from a drag event.
			// The force.drag listener prevents default so we chan check for that.
			if (d3.event.defaultPrevented) return; 

			// If it's a fixed element just unfix it
			if (d.fixed) {
				d.fixed = false;
				d3.select(this).classed("fixed", false);
				return;
			}

			// Otherwise, it's a click baby!
			
			// Do this before as well so the user has some feedback while loading.
			d3.select('.node.current').classed('current', false);
			d3.select('#node-'+d.bib).classed('current', true);

			// load
			load(d.bib, selectNode);
		}

		// Resize the window and the graph resizes too!
		function resize() {
			width = window.innerWidth;
			height = window.innerHeight;
			container.attr("width", width).attr("height", height);
			svg.attr("width", width).attr("height", height);
			force.size([width, height]).resume();
		}

		// Send a bookmark ajax request for the current node
		function bookmarkCurrentNode() {
			d3.event.preventDefault();
			d3.json('/api/bookmark/'+current.bib, function(err, result){
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

			nodesToKeep = [n];
			linksToKeep = [];

			links.forEach(function(link) {
				if (link.source.bib != n.bib) {
					linksToKeep.push(link);
				}
			});

			// console.log(links);
			// console.log(linksToKeep);

			nodes.forEach(function(node) {
				linksToKeep.forEach(function(link){
					if (node.bib == link.source.bib || node.bib == link.target.bib) {
						nodesToKeep.push(node);
					}
				});
			});

			force.links(linksToKeep);
			links = force.links();
			// link.data(links);

			force.nodes(nodesToKeep);
			nodes = force.nodes();

			force.start();
			n.expanded = false;
			// node.data(nodes);

			// console.log(nodes);
			// console.log(nodesToKeep);
			// console.log(linksToKeep);
			// node.data(nodesToKeep);
			// link.data(linksToKeep);

			redraw();
			// console.log(nodesToRemove);
		}

		// A tick function for laying out elements on the force layout's tick event.
		function tick() {

			// Move each end of each link to where it should be (i.e. the location of the node it's attached to)
			link.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });

			// Move each node to where it should be
			node.attr("transform", function(d) {
				return "translate(" + d.x + "," + d.y + ")"; 
			});

			if (force.alpha() < 0.1) force.alpha(0.1);
		}

		// Loop through the collection of nodes and match with the passed data based on the 'bib' property.
		// If no match is found, add the new data to the nodes array.
		// Return the index of the node.
		function makeOrFindNode(data) {
			var nodeIndex;
			
			nodes.forEach(function(n, i){
				if (data.bib == n.bib) {
					nodeIndex = i;
				}
			});
			
			if (nodeIndex === undefined) {
				nodes.push(data);
				nodeIndex = nodes.length-1
			}

			// Make sure we know this node's friends and timeline
			if (!nodes[nodeIndex].friends) nodes[nodeIndex].friends = data.friends;
			if (!nodes[nodeIndex].timeline) nodes[nodeIndex].timeline = data.timeline;

			return nodeIndex;
		}

		

		// Runs once new node data has arrived.
		function addLikedNodes(error, item) {
			var sourceIndex;

			// Find the index of the source node in the nodes array
			sourceIndex = makeOrFindNode(item);
			
			nodes[sourceIndex].expanded = true;

			// Go through each nodes and find appropriate targets for links
			item.friends.forEach(function(target){
				targetIndex = makeOrFindNode(target);
				links.push({source: nodes[sourceIndex], target: nodes[targetIndex], value: target.strength});
			});

			// Start the force layout.
			redraw();

			// Return the indexx for the source node
			return sourceIndex;
		}

		// redraw the force directed layout
		function redraw() {

			var nodeEntering, linkEntering;

			// Bind data to the link collection
			link = svg.selectAll('.link');
			link = link.data(force.links());

			// Define what to do when links are added
			// Save a reference to the entering elements so we can add multiple children
			linkEntering = link.enter().insert('line', '.node')
				.attr('class', 'link')
				.style('stroke-width', '1');

			// Define what to do when links are removed
			link.exit().remove();

			// Bind data to the node collection
			node = svg.selectAll('.node');
			node = node.data(force.nodes(), function(d){
				return 'node-'+d.bib;
			});

			// Define what to do when nodes are added
			nodeEntering = node.enter().append('g')
				.attr('class','node')
				.call(force.drag)
				.on('click', nodeClick);

			nodeEntering.append('circle')
				.attr('stroke-width', 0)
				.attr('fill', 'transparent')
				.attr('r', 16)
			.transition()
				.attr("x", -16)
				.attr("y", -16)
				.attr("width", 32)
				.attr("height", 32);

			nodeEntering.append('image')
				.attr("xlink:href", function(d){
					var cat, base;
					base = '/themes/default/images/icon-';
					cat = (d.category) ? d.category.replace(/ /g, '-') : 'default';
					return (cat.length) ? base+cat+'.svg' : base+'default.svg';
				})
				.attr("x", 0)
				.attr("y", 0)
				.attr("width", 0)
				.attr("height", 0)
			.transition()
				.attr("x", -16)
				.attr("y", -16)
				.attr("width", 32)
				.attr("height", 32);
			
			// Update data for all nodes
			node.attr('id', function(d){
				return 'node-'+d.bib
			});

			// Define what to do when nodes are removed
			node.exit().remove(); 

			// Start the layout
			force.start();
		}
		
	});
	
}(window));