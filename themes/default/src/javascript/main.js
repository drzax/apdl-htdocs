;(function(window, undefined){

	var hasLocalStorage;

	hasLocalStorage = !!window.sessionStorage;

	// Menu
	require(['jquery'], function($) {
		var $container, $button;

		$button = $('#nav-trigger');
		$container = $('body');
		$pusher = $('#pusher');

		$button.on('click', function(){

			$container.addClass('nav-open'); 
			$pusher.one('click', function(){
				$container.removeClass('nav-open');
				return false;
			});

			return false;
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
			svg, 		// The SVG element which contains the graph
			nodes, 		// An array of all nodes in the graph.
			links, 		// An array of all links between nodes in the graph
			node, 		// D3's collection of all nodes
			link,		// D3's collection of all links
			clicked, 	// Index of the most recently clicked node
			drag, 		// Force drag handler
			title; 		// The page title

		// Get the main container element
		container = d3.select('#graph');
		if (container.length < 1) return;

		// Initialise width and height
		width = window.innerWidth;
		height = window.innerHeight;

		// Setup the node/link data arrays
		nodes = [];
		links = [];

		// Setup a force directed layout
		force = d3.layout.force()
			.nodes(nodes)
			.links(links)
			.friction(.2)
			.charge(-1000)
			.linkDistance(function(d){
				return 100*(-d.value+1.5);
			})
			.size([width, height])
			.on('tick', tick);

		drag = force.drag()
			.on('drag', function(d){
				// Leave nodes where they're put.
				d.fixed = true;
			});

		// Setup the SVG element for the graph.
		svg = container.append("svg")
			.attr("width", width)
			.attr("height", height);

		// Setup d3 collections we need to know about
		link = svg.selectAll('.link');
		node = svg.selectAll('.node');

		title = d3.select('div.title');

		// Setup the size
		d3.select(window).on("resize", resize);
		resize();
		

		// Start the party
		load(container.attr('data-bib'));

		function resize() {
			width = window.innerWidth;
			height = window.innerHeight;
			container.attr("width", width).attr("height", height);
			svg.attr("width", width).attr("height", height);
			force.size([width, height]).resume();
		}

		// A tick function for laying out elements on the force layout's tick event.
		function tick() {

			// Move each end of each link to where it should be (i.e. the location of the node it's attached to)
			link.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });

			// Move each node to where it should be
			node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
		}

		// Loop through the collection of nodes and match with the passed data based on the 'bib' property.
		// If no match is found, add the new data to the nodes array.
		// Return the index of the node.
		function makeOrFindNode(data) {
			var nodeIndex;
			// console.log(data);
			nodes.forEach(function(n, i){
				// console.log(data.bib, n.bib);
				if (data.bib == n.bib) {
					nodeIndex = i;
				}
			});
			// console.log(nodeIndex, nodes);
			if (nodeIndex === undefined) {
				// console.log(nodes[clicked]);
				if (nodes[clicked]) {
					data.x = nodes[clicked].x;
					data.y = nodes[clicked].y;
				}
				console.log(data.x, data.y);
				nodes.push(data);
				nodeIndex = nodes.length-1
			}
			return nodeIndex;
		}

		// Load data for an item based on a BIB and add that data to the graph
		function load(bib) {
			d3.json('/api/item/'+bib, loadCallback);
		}

		// Runs once new node data has arrived.
		function loadCallback(error, item) {
			var sourceIndex;

			// pageContent(item);
			d3.select('div.title').html(item.title);

			// Find the index of the source node in the nodes array
			sourceIndex = makeOrFindNode(item);
			
			// Go through each nodes and find appropriate targets for links
			item.friends.forEach(function(target){
				targetIndex = makeOrFindNode(target);
				links.push({source: nodes[sourceIndex], target: nodes[targetIndex], value: target.strength});
			});
			
			// Start the force layout.
			start();
		}

		function pageContent(item) {
			$('div.title').text(item.title);
		}

		// Start the force directed layout
		function start() {

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
			node = node.data(force.nodes());

			// Define what to do when nodes are added
			nodeEntering = node.enter().append('g')
				.attr('class','node')
				.call(force.drag)
				.on('click', function(d){

					// Ignore the click generated from a drag event.
					// The force.drag listener prevents default so we chan check for that.
					if (d3.event.defaultPrevented) return; 

					// If it's a fixed element just unfix it
					if (d.fixed) {
						d.fixed = false;
						return;
					}

					// Otherwise, it's a click baby!
  					clicked = d.index;
  					load(d.bib);
				});

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
				
			
			// Define what to do when nodes are removed
			node.exit().remove(); 

			// Start the layout
			force.start();
		}
	});
	
}(window));