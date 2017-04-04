var config = {
	"account" : "<CARTO_ACCOUNT>",
	"trackingID" : "<ANALYTICS_TRACKING_ID>",

	"geometry_table" : "<BLOCKGROUP_SHAPEFILE>",
	"zoom" : "<ZOOM_LEVEL>",
	"coordinates" : "<MAP_CENTER>",
	"geom_type" : "<GEOM_TYPE>",

	"attribute_table" : "<AGENCY_CSV>",
	"column_names" : {
		"unique_id" : "<COL_NAME>",
		"date" : "<COL_NAME>",
		"population" : "<COL_NAME>",
		"irrigable_area": "<COL_NAME>",
		"average_eto": "<COL_NAME>",
		"usage": "<COL_NAME>",
		"hr_name": "<COL_NAME>",
		"month_days" : "<COL_NAME>"
	},
	"conversion_to_gal" : "<CONVERSION_FACTOR>"
}

//// set config values 
config.account = ""
config.trackingID = ""

// cartography related configuration
config.geometry_table = ""
config.zoom = ""
config.coordinates = ""
config.geom_type = "" // "point" or "polygon"

// attribute related configuration
config.attribute_table = ""
config.column_names.unique_id = ""
config.column_names.hr_name = "" // human-readable name. use unique_id if no human-readable column exists
config.column_names.month_days = ""
config.column_names.date = ""
config.column_names.population = ""
config.column_names.irrigable_area = "" // square footage of irrigable area
config.column_names.average_eto = ""
config.column_names.usage = ""
config.conversion_to_gal = ""
