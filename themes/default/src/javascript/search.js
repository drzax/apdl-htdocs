;(function(window, $, undefined){

	// Search box
	var searchData, 
		searchDataUrl,
		hasLocalStorage;

	hasLocalStorage = !!window.sessionStorage;
	searchDataUrl = '/api/searchData';

	getDataFromCache(function(data){
		if (data === false) {
			getDataFromServer();
		} else {
			processData(data);
		}
	});

	// Attempt to get data from cache. False called back otherwise.
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

	// Get the data from the server
	function getDataFromServer() {
		$.ajax({
			dataType: "json",
			url: searchDataUrl,
			success: processDataFromServer
		});
	}

	// Process data coming from the server (i.e. store it in the cache)
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

	// Actually process the data and setup the autocomplete dooby.
	function processData(data) {
		var i;

		searchData = [];
		for (i=data.items.length;i--;){
			searchData.unshift({
				value: data.items[i].Title,
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
				lookupFilter: function (suggestion, originalQuery, queryLowerCase) {
					var suggestionString = (suggestion.data.Title || '' + ' ' + suggestion.data.ISBN || '' + ' ' + suggestion.data.Author || '').toLowerCase();
					return suggestionString.toLowerCase().indexOf(queryLowerCase) !== -1;
                },
				formatResult: function(suggestion, currentValue){
					var parts = [], meta = [];

					parts.push('<span class="title">'+suggestion.data.Title+'</span>');

					if (suggestion.data.Author) meta.push('<span class="author">'+suggestion.data.Author+'</span>');
					if (suggestion.data.ISBN) meta.push('<span class="isbn">ISBN: '+suggestion.data.ISBN+'</span>');
					if (meta.length) parts.push('<span class="meta">'+meta.join(' ')+'</span>');

					return parts.join(' ');
				}
			});
		});
	}
}(window, jQuery));