// To avoid collision/confusion with externally sourced functions and variables,
// the suffix "_dm" was appended to those functions and variables defined for this application, giving them a distinct "namespace"
// It may be of interest to refactor this setup so that these _dm vars and functions are contained with a distinct class


function styleSetup_dm() {
	$('body').css("padding-top", nav_height_dm);
	$('.section, #map').css("height", `calc(100vh - ${nav_height_dm}px)`);
	var ts_height_dm = $('#map').height() - $('#filters').height() - $('#tsTitles').height() - 145; // the last term depends on the size of the elements above the chart
	$('#ts').css("height", ts_height_dm);
	$(window).resize(function(){location.reload()});
	// smoothScroll_dm('#extraUtility')
};

function makeSelected(element) {
	$('.selected').removeClass("selected");
	$(element).attr("class","selected");
}

function smoothScroll_dm(divId){
	$('html, body').animate({scrollTop:
		$(divId).offset().top - nav_height_dm}, 1000)
};

function transition_dm(element, content){
	$(element).fadeOut(function() {
		$(element).html(content);
		$(element).fadeIn();
	});
}

function summarySentence_dm(agency, usageDifference, targetValue, startDate, endDate){
	if (usageDifference < 0) {
		var differenceDescription = 'under'
	} else {
		var differenceDescription = 'over'
	}

	var parser = d3.time.format("'%Y-%m-%d'")
	var formatter = d3.time.format("%b %Y")
	startDate = parser.parse(startDate)
	endDate = parser.parse(endDate)

	var summary = 	`<b>Agency:</b> ${agency}<br>
	<b>Target:</b> ${targetValue} acre-feet<br>
	<b>Efficiency:</b> ${Math.abs(usageDifference)} acre-feet <em>${differenceDescription}</em> target in this scenario</b>
	`

	transition_dm('#summarySentence', summary)

};

function generateQuery_dm(gpcpd, pf, dayRange, where_clause, allDates=false) {

	var tsQuery_dm = `
	WITH cte_mwelo AS
	(SELECT
		*,
		population * ${gpcpd} * 30.437 * 3.06889*10^(-6) + residential_predicted_irr_area_sf * avg_eto * ${pf} * .62 * 3.06889*10^(-6) AS mwelo
		FROM ${tableName_dm})
	SELECT
	*,
	ROUND(100 * (residential_usage_gal * 3.06889*10^(-6) - mwelo) / CAST(mwelo AS FLOAT)) percentDifference,
	ROUND(residential_usage_gal * 3.06889*10^(-6)) af_usage
	FROM
	cte_mwelo
	${where_clause}
	ORDER BY percentDifference
	`

	var query_dm = `
	WITH cte_mwelo AS
	(SELECT     
		the_geom_webmercator,
		Min(cartodb_id) cartodb_id,
		Min(agencyname) agencyname,
		Min(agencyuniq) agencyuniq,
		ROUND(AVG(population)) population,
		ROUND(SUM(residential_usage_gal) * 3.06889*10^(-6)) af_usage,
		AVG(avg_eto) avg_eto,
		AVG(residential_predicted_irr_area_sf) residential_predicted_irr_area_sf,
		ROUND(AVG(population) * ${gpcpd} * ${dayRange} * 3.06889*10^(-6) + (${dayRange}/30.437)*(AVG(residential_predicted_irr_area_sf) * AVG(avg_eto) * ${pf} * .62 * 3.06889*10^(-6))) AS mwelo		
		FROM strawman_spatial_official
		${where_clause}
		GROUP BY agencyuniq, the_geom_webmercator)
	SELECT
	*,
	ROUND(100 * (af_usage - mwelo) / CAST(mwelo AS FLOAT)) percentDifference,
	(af_usage - mwelo) usageDifference
	FROM
	cte_mwelo
	ORDER BY
	percentDifference
	`

	if (allDates == true) {
		return tsQuery_dm
	} else { 
		return query_dm
	}
};

// This function could be drier
function mweloSetup_dm() {
	$('#pf')
	.val(.8)
	.keydown(function(e) {
		if(e.keyCode == 13) {
			vizState_dm.pf = $(this).val()
			query = generateQuery_dm(gpcpd=vizState_dm.gpcpd, pf=vizState_dm.pf, dayRange=vizState_dm.dayRange, where_clause=`WHERE usage_date BETWEEN ${vizState_dm.startDate} AND ${vizState_dm.endDate}`, allDates=false);
			sublayers_dm[0].setSQL(query);
			tsSetup_dm(vizState_dm.agencyID, vizState_dm.agencyName);
		}
	});

	$('#gpcpd')
	.val(55)
	.keydown(function(e) {
		if(e.keyCode == 13) {
			vizState_dm.gpcpd = $(this).val()
			query = generateQuery_dm(gpcpd=vizState_dm.gpcpd, pf=vizState_dm.pf, dayRange=vizState_dm.dayRange, where_clause=`WHERE usage_date BETWEEN ${vizState_dm.startDate} AND ${vizState_dm.endDate}`, allDates=false);
			sublayers_dm[0].setSQL(query);
			tsSetup_dm(vizState_dm.agencyID, vizState_dm.agencyName);
		}
	});
};

// function calSetup_dm() {
// 	$("#cal").datepicker({
// 		changeMonth: true,
// 		changeYear: true,
// 		dateFormat: 'MM yy',
// 		maxDate: new Date(2015, 11, 1),
// 		minDate: new Date(2014, 6, 1),
// 		onClose: function(dateText, inst) {
// 			var month = Number($("#ui-datepicker-div .ui-datepicker-month :selected").val());
// 			var year = $("#ui-datepicker-div .ui-datepicker-year :selected").val();
// 			$(this).datepicker('setDate', new Date(year, month, 1));
// 			vizState_dm.date = `'${year}-${month+1}-01'`
// 			query = generateQuery_dm(gpcpd=vizState_dm.gpcpd, pf=vizState_dm.pf, dayRange=30.437, where_clause=`WHERE usage_date BETWEEN ${vizState_dm.date} AND ${vizState_dm.date}`);
// 			sublayers_dm[0].setSQL(query);
// 		}
// 	})
// 	.datepicker("setDate", new Date(2015, 11, 1));
// };

function sliderSetup_dm() {
	// Programmatically generate an array--"dates"--for the slider to pull values from 
	var parser = d3.time.format("%Y-%m-%dT%XZ")
	var formatter = d3.time.format("%b %Y")

	query = `SELECT DISTINCT usage_date FROM ${tableName_dm}`;
	encoded_query = encodeURIComponent(query);
	$.getJSON("https://thenamesdave.carto.com/api/v2/sql?q="+encoded_query, function(dateData) {
		dates = $.map(dateData.rows, function(el) {
			tempDate = parser.parse(el.usage_date);
			return (tempDate.getTime())
		});
		dates.sort()
		
		var datesLength = dates.length-1
		
		$( "#slider-range" ).slider({
			range: true,
			min: 0,
			max: datesLength,
			step: 1,
			values: [1, 12],
			stop: function (event, ui) {
				var formatter = d3.time.format("%Y-%m-%d")
				startDate = dates[ui.values[0]]
				endDate = dates[ui.values[1]]
			dayRange = (endDate - startDate)*1.1574*.00000001 + 30.437; // convert uct to months
			vizState_dm.startDate = `'${formatter(new Date(startDate))}'`
			vizState_dm.endDate = `'${formatter(new Date(endDate))}'`
			vizState_dm.dayRange = dayRange;
			query = generateQuery_dm(gpcpd=vizState_dm.gpcpd, pf=vizState_dm.pf, dayRange=vizState_dm.dayRange, where_clause=`WHERE usage_date BETWEEN ${vizState_dm.startDate} AND ${vizState_dm.endDate}`, allDates=false);
			sublayers_dm[0].setSQL(query);
			tsSetup_dm(vizState_dm.agencyID, vizState_dm.agencyName);
			
		},
		slide: function(event, ui) {
			start = new Date(dates[ui.values[0]]);
			end = new Date(dates[ui.values[1]]);
			$("#cal").val(`${formatter(start)} - ${formatter(end)}`);
		}
	});

start = new Date(dates[$("#slider-range").slider("values", 0)])
end = new Date(dates[$("#slider-range").slider("values", 1)])
$("#cal").val(`${formatter(start)} - ${formatter(end)}`);
})

}


function tsSetup_dm(agencyID, agencyName) {
	var markers = [
	{'usage_date': new Date(vizState_dm.startDate), 'label': 'SCENARIO START DATE'},
	{'usage_date': new Date(vizState_dm.endDate), 'label': 'SCENARIO END DATE'}
	];
	query = generateQuery_dm(gpcpd=vizState_dm.gpcpd, pf=vizState_dm.pf, dayRange=vizState_dm.dayRange, where_clause="WHERE agencyuniq = " + agencyID, allDates=true);
	encoded_query = encodeURIComponent(query);
	$.getJSON("https://thenamesdave.cartodb.com/api/v2/sql?q="+encoded_query, function(utilityData) {
	tsData = MG.convert.date(utilityData.rows, 'usage_date', '%Y-%m-%dT%XZ'); // is this necessary?
	MG.data_graphic({
		// height: 180, // Ideally, this value would be fluid
		data: tsData,
		full_width: true,
		full_height: true,
		y_extended_ticks: true,
		x_extended_ticks: true,
		markers: markers,
		xax_format: d3.time.format('%b'),
		y_label: 'Water Volume (AF)',
		min_x: new Date('2014-06-01'),
		max_x: new Date(2015, 11, 1),
		aggregate_rollover: true,
		decimals: 0,
        target: "#ts", // the html element that the graphic is inserted in
        x_accessor: 'usage_date',  // the key that accesses the x value
        y_accessor: ['mwelo', 'af_usage'], // the key that accesses the y value
        legend:  ['Target', 'Usage'],
        legend_target: '#tsLegend'
        // mouseover: function(d, i) {
        // 	d3.select('svg .mg-active-datapoint')
        //         .html(`Target: ${Math.round(d.mwelo)} <br/> Usage: ${Math.round(d.af_usage)}` )   
        // }
    });

	d3.selectAll('.label')
	.attr('transform', 'translate(-14, 0) rotate(-90)');
});

};




function mapSetup_dm(){
	var map = new L.Map('map', {
		center: [37, -117],
		zoom: 6
	});

// Highlight feature setup below based on: http://bl.ocks.org/javisantana/d20063afd2c96a733002
var sql = new cartodb.SQL( {
	user: cartoAccount_dm,
	format: 'geojson' });
var polygon;

function showFeature(cartodb_id) {
	sql.execute(`select ST_Simplify(the_geom, 0.1) as the_geom from ${tableName_dm} where cartodb_id = {{cartodb_id}}`, {cartodb_id: cartodb_id} )
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

var agencyLayer = {
	user_name: cartoAccount_dm,
	type: 'cartodb',
	sublayers: [{
		sql: generateQuery_dm(gpcpd=vizState_dm.gpcpd, pf=vizState_dm.pf, dayRange=vizState_dm.dayRange, where_clause=`WHERE usage_date BETWEEN ${vizState_dm.startDate} AND ${vizState_dm.endDate}`, allDates=false),
		cartocss: strawmanStyles_dm,
		interactivity: ['agencyname','usagedifference', 'percentdifference', 'agencyuniq', 'af_usage', 'population', 'avg_eto', 'residential_predicted_irr_area_sf', 'cartodb_id', 'mwelo']
	}]
};

    // Pull tiles from OpenStreetMap
    L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
    }).addTo(map);

    $('#map').append(legend_dm.render().el);

    cartodb.createLayer(map, agencyLayer, options = {
    	https: true
    })
    .addTo(map, 0)
    .done(function(layer) {
    	for (var i = 0; i < layer.getSubLayerCount(); i++) {
    		sublayers_dm[i] = layer.getSubLayer(i);
    	};

    	showFeature(3314); // cartodb_id for Moulton Nigel (the default display)

    	sublayers_dm[0].setInteraction(true);
    	layer.leafletMap.viz.addOverlay({
    		type: 'tooltip',
    		layer: sublayers_dm[0],
    		template: tooltip_dm,
    		position: 'top|right',
    		fields: [{ agencyname:'agencyname'}] // Unclear how this option operates
    	});

    	layer.on('loading', function() {
    		 query = generateQuery_dm(gpcpd=vizState_dm.gpcpd, pf=vizState_dm.pf, dayRange=vizState_dm.dayRange, where_clause=`WHERE usage_date BETWEEN ${vizState_dm.startDate} AND ${vizState_dm.endDate}`, allDates=false);
    		 encoded_query = encodeURIComponent(query);
    		 $.getJSON("https://thenamesdave.carto.com/api/v2/sql?q="+encoded_query, function(utilityData) {
    		 	for (row in utilityData.rows) {
    		 		if (utilityData.rows[row].agencyname == vizState_dm.agencyName) {
    		 			console.log()
    		 			vizState_dm.mwelo = utilityData.rows[row].mwelo;
    		 			vizState_dm.usageDifference = utilityData.rows[row].usagedifference;
    		 			summarySentence_dm(vizState_dm.agencyName, vizState_dm.usageDifference, vizState_dm.mwelo, vizState_dm.startDate, vizState_dm.endDate);
    		 		}
    		 	}


    		 });
    	});



    	sublayers_dm[0].on('featureOver', function(e, latlng, pos, data) {
    		$('#map').css('cursor', 'pointer')
    	});

    	sublayers_dm[0].on('featureOut', function(e, latlng, pos, data) {
    		$('#map').css('cursor','')
    	});

    	sublayers_dm[0].on('featureClick', function(e, latlng, pos, data) {

    		showFeature(data.cartodb_id)
    		vizState_dm.agencyName = data.agencyname;
    		vizState_dm.agencyID = data.agencyuniq;
    		vizState_dm.mwelo = data.mwelo;
    		vizState_dm.usageDifference = data.usagedifference;

    		tsSetup_dm(vizState_dm.agencyID, vizState_dm.agencyName);
    		summarySentence_dm(vizState_dm.agencyName, vizState_dm.usageDifference, vizState_dm.mwelo, vizState_dm.startDate, vizState_dm.endDate);
    	});
    });
};