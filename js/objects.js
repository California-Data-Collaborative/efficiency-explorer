////// visualization state object and global data object
state = {
	"placeID" : "<PLACE_IDENTIFIER>",
	"hrName" : "<HUMAN_READABLE_IDENTIFIER>",
	"startDate" : "<SCENARIO_START>",
	"endDate" : "<SCENARIO_END>",
	"gpcd" : "<GPCD>",
	"pf" : "<PLANT_FACTOR>"
}

globals = {
	"dateData" : "<DATE_DATA>",
	"sublayers" : [],
}

//// Set default state values and store global non-state-dependent data
function dataSetup(callback) {
	// choose random place for default placeID
	query = `	SELECT DISTINCT ${config.column_names.unique_id}
	FROM ${config.attribute_table}`;
	encoded_query = encodeURIComponent(query);
	url = `https://${config.account}.carto.com/api/v2/sql?q=${encoded_query}`
	$.getJSON(url, function(idData) {
		var	min = 0,
		max = idData.total_rows,
		randIdx =  Math.floor(Math.random() * (max - min)) + min,
		randomPlace = idData.rows[randIdx][config.column_names.unique_id];
		state.placeID = randomPlace
		// calculate most recent full^* month and 1 year back for default end and start dates, respectively
		// ^*I exclude the actual most recent month because not every block contains these data
		query = `	SELECT DISTINCT ${config.column_names.date}
		FROM ${config.attribute_table}
		ORDER BY ${config.column_names.date} DESC`;
		encoded_query = encodeURIComponent(query);
		url = `https://${config.account}.carto.com/api/v2/sql?q=${encoded_query}`
		$.getJSON(url, function(dateData) {
			state.endDate = dateData.rows[1][config.column_names.date];
			state.startDate = dateData.rows[12][config.column_names.date]; 
			state.gpcd = 55
			state.pf = .8

			globals.dateData = dateData
			callback()
		});
	});
}



////// cartography object

var cartography = {
	"cartocss" : "<GEOM_DEPENDENT>",
	"legend" : new cdb.geo.ui.Legend({
		type: "choropleth",
		show_title: true,
		title: "Percent over/under Target",
		data: [{
			value: "< 0%"
		}, {
			value: "> 50%"
		}, {
			name: "bin1",
			value: "#3EAB45"
		}, {
			name: "bin2",
			value: "#D9C24F"
		}, {
			name: "bin3",
			value: "#D9534F"
		}]
	}),
	'tooltip' :
	`
	<div class="cartodb-tooltip-content-wrapper light">
	<div class="cartodb-tooltip-content">
	<h4>Place</h4>
	<p>{{hr_name}}</p>
	<h4>Percent Over/Under Target</h4>
	<p>{{percentdifference}}%</p>
	<h4>Population</h4>
	<p>{{population}}</p>
	</div>
	</div>
	`

}

if (config.geom_type == "point") {
	cartography.cartocss =
	`#table {
		marker-fill-opacity: .75;
		marker-line-width: 0;
		marker-width: 10;
		marker-fill: #333;
		marker-allow-overlap: true;
		polygon-comp-op: multiply;

		marker-width: ramp([population], range(10, 20), quantiles(5)); }

		#table [ percentdifference > 50] {marker-fill: #D9534F;}
		#table [ percentdifference <= 50] { marker-fill: #D9C24F; }
		#table [ percentdifference <= 0] { marker-fill: #3EAB45; }
		`
	}
	else if (config.geom_type == "polygon") {
		cartography.cartocss =
		`#table {
			polygon-fill: #333;
			polygon-opacity: 0.6;
			line-width: 0.2;
			line-color: #222;
			line-opacity: 0.8;
		}

		#table [ percentdifference >= 50] {polygon-fill: #D9534F;}
		#table [ percentdifference < 50] {polygon-fill: #D9C24F;}
		#table [ percentdifference <= 0] {polygon-fill: #3EAB45;}
		`
	};