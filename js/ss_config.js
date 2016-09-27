var config = {
	"account" : "<CARTO_ACCOUNT>",
	"key" : "<API_KEY>",

	"geometry_table" : "<BLOCKGROUP_SHAPEFILE>", // This could eventually be a single shapefile of all blockgroups in California
	"zoom" : "<ZOOM_LEVEL>",
	"coordinates" : "<MAP_CENTER>",

	"attribute_table" : "<AGENCY_CSV>",
	"column_names" : {
		"unique_id" : "<COL_NAME>",
		"date" : "<COL_NAME>",
		"population" : "<COL_NAME>",
		"irrigable_area": "<COL_NAME>",
		"average_eto": "<COL_NAME>",
		"residential_usage_gal": "<COL_NAME>",
		"hr_name": "<COL_NAME>"
	}
}



config.account = "california-data-collaborative"
config.geometry_table = "oc_census_blocks_2010"
config.zoom = 12
config.coordinates = [33.56,-117.69]
config.attribute_table = "bfh5gpcbwjq4lzh0_census_block_usage"//"mnwd_census_block_usage"
config.column_names.unique_id = "geoid10"
config.column_names.hr_name = "geoid10"
config.column_names.date = "usage_date"
config.column_names.population = "hhsize"
config.column_names.irrigable_area = "irr_area_sf"
config.column_names.average_eto = "usage_et_amount"
config.column_names.residential_usage_gal = "usage_ccf*748.052"
