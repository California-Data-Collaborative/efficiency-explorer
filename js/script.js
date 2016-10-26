// style components
nav_height = $(".navbar").height();

function styleSetup() {
	$("body").css("padding-top", nav_height);
	$(".section, #map").css("height", `calc(100vh - ${nav_height}px)`);
	var ts_height = $("#map").height() - $("#filters").height() - $("#tsTitles").height() - 146; // the last term depends on the size of the elements above the chart
	$("#ts").css("height", ts_height);
	$(window).resize(function(){location.reload()});
};

function makeSelected(element) {
	$(".selected").removeClass("selected");
	$(element).attr("class","selected");
};

function smoothScroll(divId){
	$("html, body").animate({scrollTop:
		$(divId).offset().top - nav_height}, 1000)
};

function transition(element, content){
	$(element).fadeOut(function() {
		$(element).html(content);
		$(element).fadeIn();
	});
}

// visualization components
function generateQuery(where_clause, allDates=false) {
	var milliunix_start = new Date(state.startDate).getTime(),
		milliunix_end = new Date(state.endDate).getTime(),
		dayRange = (milliunix_end - milliunix_start)*1.1574*.00000001 + 30.437; // convert milliunix to days
		
	
	
	var tsQuery = `
	WITH cte_targets AS
	(SELECT
		*,
		${config.column_names.population} * ${state.gpcd} * 30.437 * 3.06889*10^(-6) + ${config.column_names.irrigable_area} * ${config.column_names.average_eto} * ${state.pf} * .62 * 3.06889*10^(-6) AS target_af,
		${config.column_names.population} * ${state.gpcd} * 30.437 + ${config.column_names.irrigable_area} * ${config.column_names.average_eto} * ${state.pf} * .62 AS target_gal
		FROM ${config.attribute_table}
		)
	SELECT
	*,
	ROUND(100 * (${config.column_names.residential_usage_gal} * 3.06889*10^(-6) - target_af) / CAST(target_af AS FLOAT)) percentDifference,
	ROUND(${config.column_names.residential_usage_gal} * 3.06889*10^(-6)) af_usage,
	${config.column_names.residential_usage_gal} gal_usage
	FROM
	cte_targets
	${where_clause}
	ORDER BY ${config.column_names.date}
	`
	// usage_ccf is still hard-coded
	var query = `
	WITH cte_otf AS
	(SELECT
		${config.geometry_table}.the_geom_webmercator,
		${config.geometry_table}.cartodb_id,
		${config.geometry_table}.${config.column_names.unique_id},
		${config.attribute_table}.${config.column_names.population},
		${config.attribute_table}.${config.column_names.irrigable_area},
		${config.attribute_table}.${config.column_names.average_eto},
		${config.attribute_table}.usage_ccf,
		${config.attribute_table}.${config.column_names.date}
		FROM
		${config.geometry_table},
		${config.attribute_table}
		WHERE
		${config.geometry_table}.${config.column_names.unique_id} = ${config.attribute_table}.${config.column_names.unique_id}
		
		),
	cte_targets AS
	(SELECT     
		the_geom_webmercator,
		Min(cartodb_id) cartodb_id,
		Min(${config.column_names.hr_name}) hr_name,
		${config.column_names.unique_id},
		ROUND(AVG(${config.column_names.population})) population,
		SUM(${config.column_names.residential_usage_gal}) * 3.06889*10^(-6) af_usage,
		SUM(${config.column_names.residential_usage_gal}) gal_usage,
		AVG(${config.column_names.average_eto}) avg_eto,
		AVG(${config.column_names.irrigable_area}) irr_area,
		SUM(${config.column_names.population} * ${state.gpcd} * 30.437 * 3.06889*10^(-6) + ${config.column_names.irrigable_area} * ${config.column_names.average_eto} * ${state.pf} * .62 * 3.06889*10^(-6)) AS target_af,
		SUM(${config.column_names.population} * ${state.gpcd} * 30.437 + ${config.column_names.irrigable_area} * ${config.column_names.average_eto} * ${state.pf} * .62) AS target_gal
		FROM cte_otf
		${where_clause}
		
		GROUP BY ${config.column_names.unique_id}, the_geom_webmercator)

	SELECT
	*,
	ROUND(100 * (gal_usage - target_gal) / CAST(target_gal AS FLOAT)) percentDifference,
	ROUND(CAST(af_usage AS NUMERIC), 2) - ROUND(CAST(target_af AS NUMERIC), 2) usageDifference,
	ROUND(CAST(target_af AS NUMERIC), 2) target_af_round

	FROM
	cte_targets



	ORDER BY
	percentDifference
	`

	if (allDates == true) {
		return tsQuery
	} else { 
		return query
	}
};

function tsSetup() {
	// "usage_date" should really be: config.column_names.date
	var markers = [	{"usage_date": new Date(state.startDate), "label": "SCENARIO START DATE"},
					{"usage_date": new Date(state.endDate), "label": "SCENARIO END DATE"}
				],
		query = generateQuery(where_clause=`WHERE ${config.column_names.unique_id} = ${state.placeID}`, allDates=true),
		encoded_query = encodeURIComponent(query),
		url = `https://${config.account}.carto.com/api/v2/sql?q=${encoded_query}`;
	$.getJSON(url, function(utilityData) {
		console.log(utilityData)
		var tsData = MG.convert.date(utilityData.rows, config.column_names.date, '%Y-%m-%dT%XZ'); // is this necessary?
		MG.data_graphic({
			data: tsData,
			full_width: true,
			full_height: true,
			y_extended_ticks: true,
			x_extended_ticks: true,
			markers: markers,
			xax_format: d3.time.format('%b'),
			y_label: 'Water Volume (Gal)',
			min_x: utilityData.rows[0][config.column_names.date], // probably should generate with min and max of dataset, not utility.
			max_x: utilityData.rows[utilityData.total_rows - 1][config.column_names.date], // this would highlight missing data
			aggregate_rollover: true,
			decimals: 0,
        	target: "#ts", // the html element that the graphic is inserted in
        	x_accessor: config.column_names.date,  // the key that accesses the x value
        	y_accessor: ['target_gal', 'gal_usage'], // the key that accesses the y value
        	legend:  ['Target', 'Usage'],
        	legend_target: "#tsLegend"
        });
		d3.selectAll('.label')
		.attr('transform', 'translate(-14, 0) rotate(-90)');
	});
};

function standardsSetup() {
	$("#pf")
	.val(state.pf)
	.keydown(function(e) {
		if(e.keyCode == 13) {
			state.pf = $(this).val()
			var query = generateQuery(where_clause=`WHERE ${config.column_names.date} BETWEEN '${state.startDate}' AND '${state.endDate}'`, allDates=false);
			globals.sublayers[0].setSQL(query);
			tsSetup();
		}
	});

	$("#gpcd")
	.val(state.gpcd)
	.keydown(function(e) {
		if(e.keyCode == 13) {
			state.gpcd = $(this).val()
			var query = generateQuery(where_clause=`WHERE ${config.column_names.date} BETWEEN '${state.startDate}' AND '${state.endDate}'`, allDates=false);
			globals.sublayers[0].setSQL(query);
			tsSetup();
		}
	});
};

function sliderSetup(datesTarget, tsTarget, legendTarget) {
	var formatter = d3.time.format("%b %Y"),
		parser = d3.time.format("%Y-%m-%dT%XZ"),
		dates = $.map(globals.dateData.rows, function(el) {
					var tempDate = parser.parse(el[config.column_names.date]);
					return (tempDate.getTime())
				}).sort()

	var datesLength = dates.length - 1,
		startPosition = (
			dates.indexOf(
				parser.parse(state.startDate).getTime()
				)
			),
		endPosition = (
			dates.indexOf(
				parser.parse(state.endDate).getTime()
			)
		);
		

	$("#range_slider").slider({
		range: true,
		min: 0,
		max: datesLength - 1,  // exclude most recent month because data may not be available for all months
		step: 1,
		values: [startPosition, endPosition],
		stop: function (event, ui) {
			var formatter = d3.time.format("%Y-%m-%dT%XZ"),
				startDate = dates[ui.values[0]],
				endDate = dates[ui.values[1]]
			
			state.startDate = `${formatter(new Date(startDate))}`
			state.endDate = `${formatter(new Date(endDate))}`
			query = generateQuery(where_clause=`WHERE usage_date BETWEEN '${state.startDate}' AND '${state.endDate}'`, allDates=false);
			globals.sublayers[0].setSQL(query);
			tsSetup();
		},
		slide: function(event, ui) {
			var start = new Date(dates[ui.values[0]]),
				end = new Date(dates[ui.values[1]]);
			$("#cal").val(`${formatter(start)} - ${formatter(end)}`);
		}
	});
	var start = new Date(dates[$("#range_slider").slider("values", 0)]),
		end = new Date(dates[$("#range_slider").slider("values", 1)])
	$("#cal").val(`${formatter(start)} - ${formatter(end)}`);
}

function mapSetup_dm() {
	var map = new L.Map("map", {
		center: config.coordinates,
		zoom: config.zoom
	});

// Highlight feature setup below based on: http://bl.ocks.org/javisantana/d20063afd2c96a733002
var sql = new cartodb.SQL( {
	user: config.account,
	format: 'geojson' });
var polygon;

function showFeature(cartodb_id) {

	sql.execute(`select ST_Centroid(the_geom) as the_geom from ${config.geometry_table} where cartodb_id = {{cartodb_id}}`, {cartodb_id: cartodb_id} )
	.done(function(geojson) {
		if (polygon) {
			
			map.removeLayer(polygon);

		}
		polygon = L.geoJson(geojson, { 
			style: {}
		}).addTo(map);
	});
}
// End highlight feature setup

var placeLayer = {
	user_name: config.account,
	type: 'cartodb',
	sublayers: [{
		sql: generateQuery(where_clause=`WHERE usage_date BETWEEN '${state.startDate}' AND '${state.endDate}'`, allDates=false),
		cartocss: cartography.cartocss,
		interactivity: ['cartodb_id', 'usagedifference', 'percentdifference', 'target_af_round', 'target_af', 'population', 'gal_usage', 'af_usage', 'target_gal', `${config.column_names.unique_id}`]
	}]
};

    // Pull tiles from OpenStreetMap
    L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
    }).addTo(map);

    $("#map").append(cartography.legend.render().el);


    cartodb.createLayer(map, placeLayer, options = {
    	https: true
    })
    .addTo(map, 0)
    .done(function(layer) {
    	for (var i = 0; i < layer.getSubLayerCount(); i++) {
    		globals.sublayers[i] = layer.getSubLayer(i);
    	};

    	globals.sublayers[0].setInteraction(true);
    	layer.leafletMap.viz.addOverlay({
    		type: 'tooltip',
    		layer: globals.sublayers[0],
    		template: cartography.tooltip,
    		position: 'top|right',
    		fields: [{ population:'population'}] // Unclear how this option operates
    	});

    	layer.on('loading', function() {
    		 query = generateQuery(where_clause=`WHERE usage_date BETWEEN '${state.startDate}' AND '${state.endDate}'`, allDates=false);
    		 encoded_query = encodeURIComponent(query);
    		 url = `https://${config.account}.carto.com/api/v2/sql?q=${encoded_query}`;
    		 $.getJSON(url, function(utilityData) {
    		 	for (row in utilityData.rows) {
    		 		if (utilityData.rows[row][config.column_names.unique_id] == state.placeID) {
    		 			var target_af = utilityData.rows[row].target_af_round,
    		 				usagedifference = utilityData.rows[row].usagedifference,
    		 				percentdifference = utilityData.rows[row].percentdifference;
    		 			summarySentence_dm(usagedifference, percentdifference, target_af);
    		 			showFeature(utilityData.rows[row].cartodb_id);
    		 		};
    		 	};
    		 });
    	});


    	
    	globals.sublayers[0].on('featureOver', function(e, latlng, pos, data) {
    		$("#map").css('cursor', 'pointer')
    	});

    	globals.sublayers[0].on('featureOut', function(e, latlng, pos, data) {
    		$("#map").css('cursor','')
    	});

    	globals.sublayers[0].on('featureClick', function(e, latlng, pos, data) {
    		showFeature(data.cartodb_id)
    		state.placeID = data[config.column_names.unique_id];
    		var target_af = data.target_af_round,
    		 	usagedifference = data.usagedifference,
    		 	percentdifference = data.percentdifference;
    		summarySentence_dm(usagedifference, percentdifference, target_af);
    		tsSetup(data.af_usage)
    		
    	});
    });
};

function summarySentence_dm(usageDifference, percentDifference, targetValue){
	if (usageDifference < 0) {
		var differenceDescription = 'under'
	} else {
		var differenceDescription = 'over'
	}
	var summary = `
	<b>Place:</b> ${state.placeID}<br>
	<b>Residential Usage Target:</b> ${targetValue} acre-feet<br>
	<b>Efficiency:</b> ${Math.abs(usageDifference)} acre-feet <em>${differenceDescription}</em> target in this scenario | ${percentDifference}%
	`
	transition("#summarySentence", summary)
};


// app build
function main(){

	// style setup
	styleSetup()	
	smoothScroll('#intraUtility') // prescribe starting div

	// visualization setup
	sliderSetup();
	standardsSetup();
	tsSetup();
	mapSetup_dm();
}