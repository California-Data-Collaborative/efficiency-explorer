////// visualization state object and global data object
var state = {
	"placeID": "<PLACE_IDENTIFIER>",
	"hrName": "<HUMAN_READABLE_IDENTIFIER>",
	"startDate": "<SCENARIO_START>",
	"endDate": "<SCENARIO_END>",
	"gpcd": "<GPCD>",
	"pf": "<PLANT_FACTOR>"
};

var globals = {
	"dateData": "<DATE_DATA>",
	"sublayers": []

	//// set default state values and store global non-state-dependent data
};function dataSetup(callback) {
	// choose random place for default placeID
	var query = "\n\t\tSELECT DISTINCT " + config.column_names.unique_id + ", " + config.column_names.hr_name + " \n\t\tFROM " + config.attribute_table,
	    encoded_query = encodeURIComponent(query),
	    url = "https://" + config.account + ".carto.com/api/v2/sql?q=" + encoded_query;
	$.support.cors = true;
	$.getJSON(url, function (idData) {
		var min = 0,
		    max = idData.total_rows,
		    randIdx = Math.floor(Math.random() * (max - min)) + min,
		    randomPlace = idData.rows[randIdx][config.column_names.unique_id];
		state.placeID = randomPlace;
		randomName = idData.rows[randIdx][config.column_names.hr_name];
		state.hrName = randomName;
		$("#hrName").val(randomName);
		// calculate most recent full^* month and 1 year back for default end and start dates, respectively
		var query = "\n\t\t\tSELECT DISTINCT " + config.column_names.date + "\n\t\t\tFROM " + config.attribute_table + "\n\t\t\tORDER BY " + config.column_names.date + " DESC",
		    encoded_query = encodeURIComponent(query),
		    url = "https://" + config.account + ".carto.com/api/v2/sql?q=" + encoded_query;
		$.getJSON(url, function (dateData) {
			state.endDate = dateData.rows[0][config.column_names.date];
			state.startDate = dateData.rows[11][config.column_names.date];
			state.gpcd = 55;
			state.pf = .8;

			globals.dateData = dateData;
			callback();
		});
	});
}

////// cartography object

var cartography = {
	"cartocss": "<GEOM_DEPENDENT>",
	"legend": "<GEOM_DEPENDENT>",
	'tooltip': "\n\t<div class=\"cartodb-tooltip-content-wrapper light\">\n\t<div class=\"cartodb-tooltip-content\">\n\t<h4>Place</h4>\n\t<p>{{hr_name}}</p>\n\t<h4>Percent Over/Under Goal</h4>\n\t<p>{{percentdifference}}%</p>\n\t<h4>Population</h4>\n\t<p>{{population}}</p>\n\t<h4>Data Quality Uncertainty</h4>\n\t<p>{{uncertainty}}</p>\n\t</div>\n\t</div>\n\t"

	// define legend
	// (should probably be contained within some cartographySetup() function for increased elegance)
};choropleth = new cdb.geo.ui.Legend({
	type: "choropleth",
	show_title: true,
	title: "Percent Over Goal",
	data: [{
		value: "--------- 0% ----- 16% ---- 33% ---- 50% ----- Data Concern"
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
	}, {
		name: "bin5",
		value: "#554196"
	}, {
		name: "space",
		value: "gray"
	}, {
		name: "nodata",
		value: "gray"
	}]
});

if (config.geom_type == "point") {
	var bubble = new cdb.geo.ui.Legend({
		type: "bubble",
		show_title: true,
		title: "District Population",
		data: [{ value: "Smallest" }, { value: "Largest" }, { name: "graph_color", value: "#ccc" }]
	});
	cartography.legend = new cdb.geo.ui.StackedLegend({
		legends: [bubble, choropleth]
	});
} else if (config.geom_type == "polygon") {
	cartography.legend = choropleth;
};

// define cartocss
if (config.geom_type == "point") {
	cartography.cartocss = "#table {\n\t\tmarker-fill-opacity: .8;\n\t\tmarker-line-width: 0;\n\t\tmarker-width: 10;\n\t\tmarker-allow-overlap: true;\n\t\tpolygon-comp-op: multiply;\n\n\t\tmarker-width: ramp([population], range(5, 30), jenks(10));\n\n\t\tmarker-fill: gray;\n\t}\n\n\t\t#table [ percentdifference <= 0 ] {marker-fill: #A0CB4A}\n\t\t#table [ percentdifference > 0 ] {marker-fill: #3FAE3F}\n\t\t#table [ percentdifference > 16 ] {marker-fill: #2F8282}\n\t\t#table [ percentdifference > 33 ] {marker-fill: #3E5792}\n\t\t#table [ percentdifference > 50 ] {marker-fill: #554196}\n\n\t\t#table [ uncertainty != 'Useful first approximation' ] {marker-fill: gray}\n\t\t";
} else if (config.geom_type == "polygon") {
	cartography.cartocss = "#table {\n\t\t\tpolygon-fill: #333;\n\t\t\tpolygon-opacity: 0.6;\n\t\t\tline-width: 0.2;\n\t\t\tline-color: #222;\n\t\t\tline-opacity: 0.8;\n\t\t}\n\n\t\t#table [ percentdifference <= 0] {polygon-fill: #A0CB4A;}\n\t\t#table [ percentdifference > 0] {polygon-fill: #3FAE3F;}\n\t\t#table [ percentdifference > 16] {polygon-fill: #2F8282;}\n\t\t#table [ percentdifference > 33] {polygon-fill: #3E5792;}\n\t\t#table [ percentdifference > 50] {polygon-fill: #554196;}\n\n\t\t#table [ uncertainty != 'Useful first approximation' ] {polygon-fill: gray}\n\t\t";
};
