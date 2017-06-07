////// visualization state object and global data object
var state = {
	"placeID" : "<PLACE_IDENTIFIER>",
	"hrName" : "<HUMAN_READABLE_IDENTIFIER>",
	"startDate" : "<SCENARIO_START>",
	"endDate" : "<SCENARIO_END>",
	"gpcd" : "<GPCD>",
	"pf" : "<PLANT_FACTOR>"
}

var globals = {
	"dateData" : "<DATE_DATA>",
	"sublayers" : [],
}

//// set default state values and store global non-state-dependent data
function dataSetup(callback) {
	// choose random place for default placeID
	var query = `
		SELECT DISTINCT ${config.column_names.unique_id}, ${config.column_names.hr_name} 
		FROM ${config.attribute_table}`,

		encoded_query = encodeURIComponent(query),
		url = `https://${config.account}.carto.com/api/v2/sql?q=${encoded_query}`;
	$.support.cors = true;
	$.getJSON(url, function(idData) {
		var	min = 0,
			max = idData.total_rows,
			randIdx =  Math.floor(Math.random() * (max - min)) + min,
			randomPlace = idData.rows[randIdx][config.column_names.unique_id];
			state.placeID = randomPlace
			randomName = idData.rows[randIdx][config.column_names.hr_name];
			state.hrName = randomName
			$("#hrName").val(randomName)
		// calculate most recent full^* month and 1 year back for default end and start dates, respectively
		// ^*I exclude the actual most recent month because not every block contains these data
		var query = `
			SELECT DISTINCT ${config.column_names.date}
			FROM ${config.attribute_table}
			ORDER BY ${config.column_names.date} DESC`,

			encoded_query = encodeURIComponent(query),
			url = `https://${config.account}.carto.com/api/v2/sql?q=${encoded_query}`;
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
	"legend" : "<GEOM_DEPENDENT>",
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
	<h4>Data Quality Uncertainty</h4>
	<p>{{uncertainty}}</p>
	</div>
	</div>
	`

}

// define legend
// (should probably be contained within some cartographySetup() function for increased elegance)
choropleth = new cdb.geo.ui.Legend({
	type: "choropleth",
	show_title: true,
	title: "Percent Over Target",
	data: [{
			value: "------------ 0% -------- 16% ------- 33% ------- 50% ----------"
		}, {
			value: ""
		}, {
			name: "bin1",
			value: "#A0CB4A"
		}, {
			name: "bin2",
			value: "#3FAE3F"
		}, {
			name: "bin3",
			value: "#2F8282"
		}, {
			name: "bin4",
			value: "#3E5792"
		},		{
			name: "bin5",
			value: "#554196"
		}]
	})

if (config.geom_type == "point") {
	var bubble = new cdb.geo.ui.Legend({
		type: "bubble",
		show_title: true,
		title: "District Population",
		data: [
			{ value: "Smallest" },
			{ value: "Largest" },
			{ name: "graph_color", value: "#ccc" }
			]
		})
	cartography.legend = new cdb.geo.ui.StackedLegend({
		legends: [bubble, choropleth]
	})
}

else if (config.geom_type == "polygon") {
		cartography.legend = choropleth
};

// define cartocss
if (config.geom_type == "point") {
	cartography.cartocss =
	`#table {
		marker-fill-opacity: .8;
		marker-line-width: 0;
		marker-width: 10;
		marker-allow-overlap: true;
		polygon-comp-op: multiply;

		marker-width: ramp([population], range(5, 30), jenks(10));

		marker-fill: gray;
	}

		#table [ percentdifference <= 0 ] {marker-fill: #A0CB4A}
		#table [ percentdifference > 0 ] {marker-fill: #3FAE3F}
		#table [ percentdifference > 16 ] {marker-fill: #2F8282}
		#table [ percentdifference > 33 ] {marker-fill: #3E5792}
		#table [ percentdifference > 50 ] {marker-fill: #554196}

		#table [ uncertainty != 'Useful first approximation' ] {marker-fill: gray}
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

		#table [ percentdifference <= 0] {polygon-fill: #A0CB4A;}
		#table [ percentdifference > 0] {polygon-fill: #3FAE3F;}
		#table [ percentdifference > 16] {polygon-fill: #2F8282;}
		#table [ percentdifference > 33] {polygon-fill: #3E5792;}
		#table [ percentdifference > 50] {polygon-fill: #554196;}

		#table [ uncertainty != 'Useful first approximation' ] {polygon-fill: gray}
		`
	};