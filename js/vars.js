// To avoid collision/confusion with externally sourced functions and variables,
// the suffix "_dm" was appended to those functions and variables defined for this application, giving them a distinct "namespace"
// It may be of interest to refactor this setup so that these _dm vars and functions are contained with a distinct class

//Probably don't need both agencyName and agencyID
var vizState_dm = {
	"startDate":"'2014-06-01'",
	"endDate":"'2015-07-01'",
	"dayRange": 365.434856,
	"gpcpd":55,
	"pf":.8,
	"agencyName":'Moulton Niguel Water District',
	"agencyID":1663
}


var cartoAccount_dm = "thenamesdave"
var tableName_dm = "strawman_spatial_official"
var sublayers_dm = []


var nav_height_dm = $(".navbar").height();


// Change population to af_usage
var strawmanStyles_dm = `

#${tableName_dm} {
	marker-fill-opacity: .8;
	marker-line-color: black;
	marker-line-width: 0;
	marker-line-opacity: 1;
	marker-width: 10;
	marker-fill: #D9534F;
	marker-allow-overlap: true; }

	#${tableName_dm} [ percentdifference <= 100] { marker-fill: #D9C24F; }
	#${tableName_dm} [ percentdifference <= 0] { marker-fill: #3EAB45; }
	#${tableName_dm} [ population <= 4000000] { marker-width: 20.0; }
	#${tableName_dm} [ population <= 217600] { marker-width: 18.3; }
	#${tableName_dm} [ population <= 162600] { marker-width: 16.7; }
	#${tableName_dm} [ population <= 121263] { marker-width: 15.0; }
	#${tableName_dm} [ population <= 91627] { marker-width: 13.3; }
	#${tableName_dm} [ population <= 68134] { marker-width: 11.7; }
	#${tableName_dm} [ population <= 46989] { marker-width: 10.0; }
	#${tableName_dm} [ population <= 32693] { marker-width: 8.3; }
	#${tableName_dm} [ population <= 21647] { marker-width: 6.7; }
	#${tableName_dm} [ population <= 13000] { marker-width: 5.0; }
	`
	


	// #${tableName_dm} [ af_usage <= 35000] { marker-width: 20.0; }
	// #${tableName_dm} [ af_usage <= 1616.43326232499] { marker-width: 18.3; }
	// #${tableName_dm} [ af_usage <= 1055.44230786826] { marker-width: 16.7; }
	// #${tableName_dm} [ af_usage <= 749.664639295821] { marker-width: 15.0; }
	// #${tableName_dm} [ af_usage <= 554.011211043499] { marker-width: 13.3; }
	// #${tableName_dm} [ af_usage <= 416.5821576689485] { marker-width: 11.7; }
	// #${tableName_dm} [ af_usage <= 310.066577194462] { marker-width: 10.0; }
	// #${tableName_dm} [ af_usage <= 228.183469280518] { marker-width: 8.3; }
	// #${tableName_dm} [ af_usage <= 163.533728240873] { marker-width: 6.7; }
	// #${tableName_dm} [ af_usage <= 100] { marker-width: 5.0; }

	var bubble_dm = new cdb.geo.ui.Legend({
		type: "bubble",
		show_title: true,
		title: "District Population",
		data: [
		{ value: "13,000" },
		{ value: "4,000,000" },
		{ name: "graph_color", value: "#ccc" }
		]
	});


	var choropleth_dm = new cdb.geo.ui.Legend({
		type: "choropleth",
		show_title: true,
		title: "Percent over/under MWELO Target",
		data: [{
			value: "< 0%"
		}, {
			value: "> 100%"
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
	});


	var legend_dm = new cdb.geo.ui.StackedLegend({
		legends: [bubble_dm, choropleth_dm]
	});


	var tooltip_dm =	`<div class="cartodb-tooltip-content-wrapper light">
	<div class="cartodb-tooltip-content">
	<h4>Agency Name</h4>
	<p>{{agencyname}}</p>
	<h4>Percent Over/Under Target</h4>
	<p>{{percentdifference}}%</p>
	<h4>District Population</h4>
	<p>{{population}}</p>
	<h4>Total Usage</h4>
	<p>{{af_usage}} Acre-Feet</p>
	

	</div>
	</div>`
							// Other tool tip fields
							// <h4>Predicted Irrigable Area</h4>
							// <p>{{residential_predicted_irr_area_sf}}</p>
							// <h4>Average eto</h4>
							// <p>{{avg_eto}}</p>
							// <h4>Population</h4>
							// <p>{{population}}</p>
							
