function styleSetup_dm() {
	$('body').css("padding-top", nav_height_dm);
	$('.section, #map, #map_intra,  #splash').css("height", `calc(100vh - ${nav_height_dm}px)`);
	var ts_height_dm = $('#map').height() - $('#filters').height() - $('#tsTitles').height() - 146; // the last term depends on the size of the elements above the chart
	$('#ts, #ts_intra').css("height", ts_height_dm);
	$(window).resize(function(){location.reload()});
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

function summarySentence_dm(summaryTarget, agency, usageDifference, percentDifference, targetValue, startDate, endDate){
	if (usageDifference < 0) {
		var differenceDescription = 'under'
	} else {
		var differenceDescription = 'over'
	}

	var parser = d3.time.format("'%Y-%m-%d'")
	var formatter = d3.time.format("%b %Y")
	startDate = parser.parse(startDate)
	endDate = parser.parse(endDate)

	var summary = 	`<b>Place:</b> ${agency}<br>
	<b>Residential Usage Target:</b> ${targetValue} acre-feet<br>
	<b>Efficiency:</b> ${Math.abs(usageDifference)} acre-feet <em>${differenceDescription}</em> target in this scenario | ${percentDifference}%
	`

	transition_dm(summaryTarget, summary)

};

function generateQuery_dm(gpcpd, pf, dayRange, where_clause, allDates=false, appObj) {

	var tsQuery_dm = `
	WITH cte_mwelo AS
	(SELECT
		*,
		${appObj.col_names.population} * ${gpcpd} * 30.437 * 3.06889*10^(-6) + ${appObj.col_names.irr_area} * ${appObj.col_names.avg_eto} * ${pf} * .62 * 3.06889*10^(-6) AS mwelo,
		${appObj.col_names.population} * ${gpcpd} * 30.437 + ${appObj.col_names.irr_area} * ${appObj.col_names.avg_eto} * ${pf} * .62 AS mwelo_gal
		FROM ${appObj.tableName_dm})
	SELECT
	*,
	ROUND(100 * (${appObj.col_names.residential_usage_gal} * 3.06889*10^(-6) - mwelo) / CAST(mwelo AS FLOAT)) percentDifference,
	ROUND(${appObj.col_names.residential_usage_gal} * 3.06889*10^(-6)) af_usage,
	ROUND(${appObj.col_names.residential_usage_gal}) gal_usage
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
		Min(${appObj.col_names.name}) agencyname,
		${appObj.col_names.uniq} agencyuniq,
		ROUND(AVG(${appObj.col_names.population})) population,
		ROUND(SUM(${appObj.col_names.residential_usage_gal}) * 3.06889*10^(-6)) af_usage,
		ROUND(SUM(${appObj.col_names.residential_usage_gal})) gal_usage,
		AVG(${appObj.col_names.avg_eto}) avg_eto,
		AVG(${appObj.col_names.irr_area}) residential_predicted_irr_area_sf,
		ROUND(AVG(${appObj.col_names.population}) * ${gpcpd} * ${dayRange} * 3.06889*10^(-6) + (${dayRange}/30.437)*(AVG(${appObj.col_names.irr_area}) * AVG(${appObj.col_names.avg_eto}) * ${pf} * .62 * 3.06889*10^(-6))) AS mwelo		
		FROM ${appObj.tableName_dm}
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
function mweloSetup_dm(pfTarget, gpcdTarget, tsTarget, legendTarget, appObj) {
	$(pfTarget)
	.val(.8)
	.keydown(function(e) {
		if(e.keyCode == 13) {
			appObj.vizState_dm.pf = $(this).val()
			query = generateQuery_dm(gpcpd=appObj.vizState_dm.gpcpd, pf=appObj.vizState_dm.pf, dayRange=appObj.vizState_dm.dayRange, where_clause=`WHERE usage_date BETWEEN ${appObj.vizState_dm.startDate} AND ${appObj.vizState_dm.endDate}`, allDates=false, appObj);
			appObj.sublayers_dm[0].setSQL(query);
			tsSetup_dm(tsTarget, legendTarget, appObj.vizState_dm.agencyID, appObj.vizState_dm.agencyName, appObj);
		}
	});

	$(gpcdTarget)
	.val(55)
	.keydown(function(e) {
		if(e.keyCode == 13) {
			appObj.vizState_dm.gpcpd = $(this).val()
			query = generateQuery_dm(gpcpd=appObj.vizState_dm.gpcpd, pf=appObj.vizState_dm.pf, dayRange=appObj.vizState_dm.dayRange, where_clause=`WHERE usage_date BETWEEN ${appObj.vizState_dm.startDate} AND ${appObj.vizState_dm.endDate}`, allDates=false, appObj);
			appObj.sublayers_dm[0].setSQL(query);
			tsSetup_dm(tsTarget, legendTarget, appObj.vizState_dm.agencyID, appObj.vizState_dm.agencyName, appObj);
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
// 			appObj.vizState_dm.date = `'${year}-${month+1}-01'`
// 			query = generateQuery_dm(gpcpd=appObj.vizState_dm.gpcpd, pf=appObj.vizState_dm.pf, dayRange=30.437, where_clause=`WHERE usage_date BETWEEN ${appObj.vizState_dm.date} AND ${appObj.vizState_dm.date}`);
// 			appObj.sublayers_dm[0].setSQL(query);
// 		}
// 	})
// 	.datepicker("setDate", new Date(2015, 11, 1));
// };

function sliderSetup_dm(sliderTarget, datesTarget, tsTarget, legendTarget, appObj) {
	// Programmatically generate an array--"dates"--for the slider to pull values from 
	var parser = d3.time.format("%Y-%m-%dT%XZ")
	var formatter = d3.time.format("%b %Y")

	query = `SELECT DISTINCT usage_date FROM ${appObj.tableName_dm} WHERE usage_date IS NOT NULL`;
	
	encoded_query = encodeURIComponent(query);
	$.getJSON("https://thenamesdave.carto.com/api/v2/sql?q="+encoded_query, function(dateData) {
		appObj.dates = $.map(dateData.rows, function(el) {
			tempDate = parser.parse(el.usage_date);
			return (tempDate.getTime())
		});
		appObj.dates.sort()
		
		var datesLength = appObj.dates.length-1

		//there exists a better place to do this
		appObj.minDate = appObj.dates[0]
		appObj.maxDate = appObj.dates[datesLength]
		

		startPosition = (
			appObj.dates
			.indexOf(
				new Date(appObj.vizState_dm.startDate).getTime()
				)
			)

		endPosition = (
			appObj.dates
			.indexOf(
				new Date(appObj.vizState_dm.endDate).getTime()
				)
			)


		
		$( sliderTarget ).slider({
			range: true,
			min: 0,
			max: datesLength,
			step: 1,
			values: [startPosition, endPosition],
			stop: function (event, ui) {
				var formatter = d3.time.format("%Y-%m-%d")
				startDate = appObj.dates[ui.values[0]]
				endDate = appObj.dates[ui.values[1]]
			dayRange = (endDate - startDate)*1.1574*.00000001 + 1 + 30.437; // convert uct to months
			console.log('calculated dayRange:'+dayRange)
			console.log('default dayRange:'+appObj.vizState_dm.dayRange)
			appObj.vizState_dm.startDate = `'${formatter(new Date(startDate))}'`
			appObj.vizState_dm.endDate = `'${formatter(new Date(endDate))}'`
			appObj.vizState_dm.dayRange = dayRange;
			query = generateQuery_dm(gpcpd=appObj.vizState_dm.gpcpd, pf=appObj.vizState_dm.pf, dayRange=appObj.vizState_dm.dayRange, where_clause=`WHERE usage_date BETWEEN ${appObj.vizState_dm.startDate} AND ${appObj.vizState_dm.endDate}`, allDates=false, appObj);
			appObj.sublayers_dm[0].setSQL(query);
			tsSetup_dm(tsTarget, legendTarget, appObj.vizState_dm.agencyID, appObj.vizState_dm.agencyName, appObj);
			
		},
		slide: function(event, ui) {
			start = new Date(appObj.dates[ui.values[0]]);
			end = new Date(appObj.dates[ui.values[1]]);
			$(datesTarget).val(`${formatter(start)} - ${formatter(end)}`);
		}
	});

start = new Date(appObj.dates[$(sliderTarget).slider("values", 0)])
end = new Date(appObj.dates[$(sliderTarget).slider("values", 1)])
$(datesTarget).val(`${formatter(start)} - ${formatter(end)}`);
})

}


function tsSetup_dm(tsTarget, legendTarget, agencyID, agencyName, appObj) {
	var markers = [
	{'usage_date': new Date(appObj.vizState_dm.startDate), 'label': 'SCENARIO START DATE'},
	{'usage_date': new Date(appObj.vizState_dm.endDate), 'label': 'SCENARIO END DATE'}
	];

	// var minX = new Date(appObj.minDate)
	// minX.setMonth(minX.getMonth() - 1);

	// var maxX = new Date(appObj.maxDate);
	// maxX.setMonth(maxX.getMonth() - 1);

	query = generateQuery_dm(gpcpd=appObj.vizState_dm.gpcpd, pf=appObj.vizState_dm.pf, dayRange=appObj.vizState_dm.dayRange, where_clause=`WHERE ${appObj.col_names.uniq} = ${agencyID}`, allDates=true, appObj);
	encoded_query = encodeURIComponent(query);
	$.getJSON("https://thenamesdave.carto.com/api/v2/sql?q="+encoded_query, function(utilityData) {
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
		y_label: 'Water Volume (Gal)',
		min_x: appObj.minDate, 
		max_x: appObj.maxDate,
		aggregate_rollover: true,
		decimals: 0,
        target: tsTarget, // the html element that the graphic is inserted in
        x_accessor: 'usage_date',  // the key that accesses the x value
        y_accessor: ['mwelo_gal', 'gal_usage'], // the key that accesses the y value
        legend:  ['Target', 'Usage'],
        legend_target: legendTarget
        // mouseover: function(d, i) {
        // 	d3.select('svg .mg-active-datapoint')
        //         .html(`Target: ${Math.round(d.mwelo)} <br/> Usage: ${Math.round(d.af_usage)}` )   
        // }
    });

	d3.selectAll('.label')
	.attr('transform', 'translate(-14, 0) rotate(-90)');
});

};




function mapSetup_dm(mapTarget, summaryTarget, tsTarget, legendTarget, appObj){
	var mapContainer = mapTarget.slice(1, mapTarget.length)

	var map = new L.Map(mapContainer, {
		center: appObj.coords,
		zoom: appObj.zoom
	});

// Highlight feature setup below based on: http://bl.ocks.org/javisantana/d20063afd2c96a733002
var sql = new cartodb.SQL( {
	user: cartoAccount_dm,
	format: 'geojson' });
var polygon;

function showFeature(cartodb_id) {

	sql.execute(`select ST_Centroid(the_geom) as the_geom from ${appObj.tableName_dm} where cartodb_id = {{cartodb_id}}`, {cartodb_id: cartodb_id} )
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
		sql: generateQuery_dm(gpcpd=appObj.vizState_dm.gpcpd, pf=appObj.vizState_dm.pf, dayRange=appObj.vizState_dm.dayRange, where_clause=`WHERE usage_date BETWEEN ${appObj.vizState_dm.startDate} AND ${appObj.vizState_dm.endDate}`, allDates=false, appObj),
		cartocss: appObj.strawmanStyles_dm,
		interactivity: ['agencyname','usagedifference', 'percentdifference', 'agencyuniq', 'af_usage', 'population', 'avg_eto', 'residential_predicted_irr_area_sf', 'cartodb_id', 'mwelo']
	}]
};

    // Pull tiles from OpenStreetMap
    L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
    }).addTo(map);

    $(mapTarget).append(appObj.legend_dm.render().el);


    cartodb.createLayer(map, agencyLayer, options = {
    	https: true
    })
    .addTo(map, 0)
    .done(function(layer) {
    	for (var i = 0; i < layer.getSubLayerCount(); i++) {
    		appObj.sublayers_dm[i] = layer.getSubLayer(i);
    	};

    	showFeature(appObj.cartodb_id); // cartodb_id for default display

    	appObj.sublayers_dm[0].setInteraction(true);
    	layer.leafletMap.viz.addOverlay({
    		type: 'tooltip',
    		layer: appObj.sublayers_dm[0],
    		template: appObj.tooltip_dm,
    		position: 'top|right',
    		fields: [{ agencyname:'agencyname'}] // Unclear how this option operates
    	});

    	layer.on('loading', function() {
    		 query = generateQuery_dm(gpcpd=appObj.vizState_dm.gpcpd, pf=appObj.vizState_dm.pf, dayRange=appObj.vizState_dm.dayRange, where_clause=`WHERE usage_date BETWEEN ${appObj.vizState_dm.startDate} AND ${appObj.vizState_dm.endDate}`, allDates=false, appObj);
    		 
    		 encoded_query = encodeURIComponent(query);
    		 $.getJSON("https://thenamesdave.carto.com/api/v2/sql?q="+encoded_query, function(utilityData) {

    		 	for (row in utilityData.rows) {
    		 		//console.log(utilityData.rows[row].agencyname )

    		 		if (utilityData.rows[row].agencyname == appObj.vizState_dm.agencyName) {

    		 			
    		 			appObj.vizState_dm.mwelo = utilityData.rows[row].mwelo;
    		 			appObj.vizState_dm.usageDifference = utilityData.rows[row].usagedifference;
    		 			appObj.vizState_dm.percentDifference = utilityData.rows[row].percentdifference;
    		 			summarySentence_dm(summaryTarget, appObj.vizState_dm.agencyName, appObj.vizState_dm.usageDifference, appObj.vizState_dm.percentDifference, appObj.vizState_dm.mwelo, appObj.vizState_dm.startDate, appObj.vizState_dm.endDate);
    		 		}
    		 	}


    		 });
    	});



    	appObj.sublayers_dm[0].on('featureOver', function(e, latlng, pos, data) {
    		$(mapTarget).css('cursor', 'pointer')
    	});

    	appObj.sublayers_dm[0].on('featureOut', function(e, latlng, pos, data) {
    		$(mapTarget).css('cursor','')
    	});

    	appObj.sublayers_dm[0].on('featureClick', function(e, latlng, pos, data) {
    		

    		showFeature(data.cartodb_id)
    		appObj.vizState_dm.agencyName = data.agencyname;
    		appObj.vizState_dm.agencyID = data.agencyuniq;
    		appObj.vizState_dm.mwelo = data.mwelo;
    		appObj.vizState_dm.usageDifference = data.usagedifference;
    		appObj.vizState_dm.percentDifference = data.percentdifference;

    		tsSetup_dm(tsTarget, legendTarget, appObj.vizState_dm.agencyID, appObj.vizState_dm.agencyName, appObj);
    		summarySentence_dm(summaryTarget, appObj.vizState_dm.agencyName, appObj.vizState_dm.usageDifference, appObj.vizState_dm.percentDifference, appObj.vizState_dm.mwelo, appObj.vizState_dm.startDate, appObj.vizState_dm.endDate);
    	});
    });
};

