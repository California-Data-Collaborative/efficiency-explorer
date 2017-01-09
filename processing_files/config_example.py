# Extract and transform routine
database = "<DATABASE_NAME>"
user = "<USER_NAME>"
password = "<USER_PASSWORD>"
host = "<HOST_NAME>"
port = "<PORT_NUMBER>"

anonymityDict = {"<UTILITY_ID>" : "<UTILITY_RANDOM_PREFIX>"}

carto_user = "<CARTO_USER>"

current_users = [{"agencyID":"<UTILITY_ID>",
                  "county_shapefile":"<SHAPEFILE_NAME>",
                  "where_clause":"<UNIQUE_WHERE_CLAUSE>", # For example, "WHERE geoid10 != '060590626431004' AND usage_et_amount IS NOT NULL AND cust_loc_is_current = 'TRUE'"
                  "pop_col" : "<POPULATION_COLUMN>",
                  "irr_area_col" :"<LANDSCAPE_AREA_COLUMN>",
                  "eto_col" : "<ETo_COLUMN>"
                 }]


# Load routine
apikey = "<CARTO_API_KEY>"