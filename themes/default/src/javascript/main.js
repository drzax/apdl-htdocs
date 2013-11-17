// Graph with d3
;(function(window, undefined){

	// All the local variables
	var width,		// the width of the graph SVG element
		height,		// The height of the graph SVG element
		force,		// The force directed layout
		container,	// The container to append the SVG.
		dataCache,	// Local cache of data
		hasLocStor, // Is local storage available
		svg,		// The SVG element which contains the graph
		nodes,		// An array of all nodes in the graph.
		links,		// An array of all links between nodes in the graph
		node,		// D3's collection of all nodes
		link,		// D3's collection of all links
		selected,	// The currently selected node
		buttons,	// A collection of buttons
		drag,		// Force drag handler
		title;		// The page title 

	// Get the main container element
	container = d3.select('#graph');

	// Don't do anything else if the graph container isn't here. Wrong page.
	if (!container[0][0]) return;

	// Check if local storage is available
	hasLocStor = !!window.sessionStorage;

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
		.friction(0.4)
		.charge(function(d){
			return -1500;
			// return (d.index === current.index) ? -100 : -4000;
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

	buttons = {
		expand: {
			selection: d3.select('#expand-this')
		},
		bookmark: {
			selection: d3.select('#bookmark-this')
		}
	};

	buttons.expand.selection.on('click', expandOrCollapse);
	buttons.expand.snap = new svgIcon( buttons.expand.selection[0][0], svgIconConfig, { easing : mina.elastic, speed: 600 } );

	load(container.attr('data-bib'), function(err, item){
		var n;
		n = makeOrFindNode(item);
		expandNode(n);
		selectNode(n);
	});

	// Select a node
	function selectNode(d) {
		var updates, updatesEntering, nId;

		selected = d;
		nodes.forEach(function(n){
			n.selected = (n==d);
		});

		// Change the state of the expand toggle button
		if (selected.expanded) {
			ensureToggled(buttons.expand.snap);
		} else {
			ensureUntoggled(buttons.expand.snap);
		}
		
		d3.select('.node.current').classed('current', false);
		d3.select('#node-'+selected.bib).classed('current', true);

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

		// Set the title and author
		title.text(selected.title);
		d3.select('.item-author').text(selected.author);

		load(d.bib, function(err, itemData){
			// Populate the info panel with the selected node's details
			// console.log(d);
			updates = d3.select('#timeline').selectAll('.update').data(itemData.timeline);

			// New update in the timeline
			updates.enter()
				.append('div')
				.attr('class', 'update');

			// Update new and existing update containers with the data
			updates.html(function(d){
				return (d.text) ? '<p>'+d.text+'</p>' : '';
			});
			
			// Remove superfluous updates
			updates.exit().remove(); 

		});
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
		selectNode(d);
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
			var container, bookmarks, enter, exit;
			container = d3.select('#bookmarks').selectAll('.bookmark').data(result);

			// New bookmark in the list
			container.enter()
				.append('div')
				.attr('class', 'bookmark');

			// Update new and existing bookmark containers containers with the data
			container.html(function(d){
				return '<p class="title">'+d.title+'</p><p class="author">'+d.author+'</p>';
			});
			
			// Remove superfluous containers
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

		var outgoingLinks = linksByNode(n, 'source');

		n.expanded = false;
		
		outgoingLinks.forEach(function(link){
			var i, targetNode;
			for (i=links.length; i--;) {
				if (links[i] == link) {
					links.splice(i,1);
				}
			}
			
			targetNode = link.target;
			
			// Recursively collapse 
			if (recursive) collapseNode(targetNode, recursive);
			
			// If the target node ends up with zero links remove it
			if ( ! linksByNode(targetNode).length && !targetNode.locked ) {
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
		if (i >= 0) return nodes.splice(i,1);
	}

	function linksByNode(node, type) {
		var ret = [];
		links.forEach(function (link) {
			if (!type) {
				if (link.target == node || link.source == node) ret.push(link);
			} else {
				if (link[type] == node) ret.push(link);
			}
		});
		return ret;
	}

	// A tick function for laying out elements on the force layout's tick event.
	function tick() {

		var xOffsetPct = 0.15;

		// Move each end of each link to where it should be (i.e. the location of the node it's attached to)
		link.attr("x1", function(d) { return d.source.x-width*xOffsetPct; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x-width*xOffsetPct; })
			.attr("y2", function(d) { return d.target.y; });

		// Move each node to where it should be
		node.attr("transform", function(d) {
			var transforms = [];
			transforms.push("translate(" + (d.x-width*xOffsetPct) + "," + d.y + ")");
			if (d.selected) transforms.push('scale(1.5)');
			return transforms.join(' '); 
		});

		// Keep it ticking.
		if (force.alpha() < 0.1) force.alpha(0.1);
	}

	// Add liked nodes for an item to the graph display.
	function expandNode(d) {

		d.expanded = true;

		// Do another load of this since there's no guarantee we have its friends.
		// If we do, it should be quick.
		load(d.bib, function(err, item){
			var n;
			n = makeOrFindNode(item);

			// Go through each nodes and find appropriate targets for links
			n.friends.forEach(function(targetData){
				target = makeOrFindNode(targetData);
				links.push({source: n, target: target, value: targetData.strength});
			});

			// Start the force layout.
			redraw();
		});
	}

	// redraw the force directed layout
	function redraw() {

		var nodeEntering, linkEntering, nodeDiameter;

		// Bind data to the link collection
		link = svg.selectAll('.link');
		link = link.data(force.links());

		nodeDiameter = 24;

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
			.attr('r', nodeDiameter/2)
		.transition()
			.attr("x", -nodeDiameter/2)
			.attr("y", -nodeDiameter/2)
			.attr("width", nodeDiameter)
			.attr("height", nodeDiameter);

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
			.attr("x", -nodeDiameter/2)
			.attr("y", -nodeDiameter/2)
			.attr("width", nodeDiameter)
			.attr("height", nodeDiameter);
		
		// Update data for all nodes
		node.attr('id', function(d){
			return 'node-'+d.bib;
		});

		// Define what to do when nodes are removed
		node.exit().selectAll('image').transition()
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", 0)
			.attr("height", 0)
			.each('end', function () {
				d3.select(this.parentNode).remove();
			});

		// Start the layout
		force.start();
	}

	/**
	 * Take node data returned from the API and either make (and add) or find an node in the graph.
	 * The comparison with existing nodes in the graph is made by node.bib.
	 * 
	 * @param  {Object} data Item data returned from the API
	 * @return {Object}	The node in the graph for this item.
	 */
	function makeOrFindNode(data) {
		var node;
		
		nodes.forEach(function(n, i){
			if (data.bib == n.bib) {
				node = n;
			}
		});
		
		if (node === undefined) {
			nodes.push(data);
			node = data;
		}

		
		if (data.friends) { 
			// Make sure we know this node's friends
			node.friends = data.friends;

			// Pre-fetch
			data.friends.forEach(function(f){
				load(f.bib);
			});
		}

		// Make sure we know about this node's timeline
		if (data.timeline) node.timeline = data.timeline;

		return node;
	}

	/**
	 * Load data for an item based on a BIB and call a callback (if passed).
	 * This method also caches the data in a local variable so it can safely be called multiple times without
	 * risk of another request on the server. This also means we can effectively pre-fetch data.
	 * 
	 * @param  {Number|String} bib The BIB of the item for which data should be fetched.
	 * @param  {Function} callback Callback to run once data is available.
	 * @return {null}
	 */
	function load(bib, callback) {
		if (dataCache[bib]) {
			if (callback) callback(null, dataCache[bib]);
		} else {
			d3.json('/api/item/'+bib, function(err, item){
				if (!err) dataCache[bib] = item;
				if (callback) callback(err, item);
			});
		}
	}

	
}(window));