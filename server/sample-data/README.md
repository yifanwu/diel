# Data Sources

These data sources are rather large. Download it from these hosted sources to get started!

You should take the `.sqlite` files from the respective download folders and directly place them in this directory, with the names specified in the respective sections:

## Charlottesville Twitter

Set file name to: `charlottesville.sqlite`

Tweet information, here are the __columns__:

| table | descpription |
| ----- | ------------ |
| id | |
| user_id | |
| user_name | |
| screen_name | |
| user_statuses_count | |
| user_favorites_count | |
| friends_count | |
| followers_count | |
| user_location | |
| user_description | |
| user_time_zone | |
| user_profile_text_color | |
| user_profile_background_color | |
| full_text | |
| created_at | |
| is_retweet | |
| retweeted_status_text | |
| retweeted_status_id | |
| quoted_status_text | |
| quoted_status_id | |
| in_reply_to_screen_name | |
| in_reply_to_status_id | |
| in_reply_to_user_id | |
| hashtags | |

[download link](https://www.kaggle.com/vincela9/charlottesville-on-twitter)

## Pitchfork

Set file name to: `pitchfork.sqlite`

18,393 Reviews, with the following columns: artists, content, genres, labels, reviews, years

[download link](https://www.kaggle.com/nolanbconaway/pitchfork-data)

Suggested Questions:

* Do review scores for individual artists generally improve over time, or go down?
* How has Pitchfork's review genre selection changed over time?
* Who are the most highly rated artists? The least highly rated artists?

## US Wildfires

Set file name to: `fires.sqlite`

[download link](https://www.kaggle.com/rtatman/188-million-us-wildfires/version/1#)

1.88 Million instances, including wildfire data for the period of 1992-2015 compiled from US federal, state, and local reporting systems.

| column | description |
| ------ | ----------- |
|FOD_ID| Global unique identifier.|
|FPA_ID| Unique identifier that contains information necessary to track back to the original record in the source dataset.|
|SOURCE_SYSTEM_TYPE| Type of source database or system that the record was drawn from (federal, nonfederal, or interagency).|
|SOURCE_SYSTEM| Name of or other identifier for source database or system that the record was drawn from.
|NWCG_REPORTING_AGENCY| Active National Wildlife Coordinating Group (NWCG) Unit Identifier for the agency preparing the fire report|
|NWCG_REPORTING_UNIT_ID| Active NWCG Unit Identifier for the unit preparing the fire report.|
|NWCG_REPORTING_UNIT_NAME| Active NWCG Unit Name for the unit preparing the fire report.|
|SOURCE_REPORTING_UNIT| Code for the agency unit preparing the fire report, based on code/name in the source dataset.|
|SOURCE_REPORTING_UNIT_NAME| Name of reporting agency unit preparing the fire report, based on code/name in the source dataset.|
|LOCAL_FIRE_REPORT_ID| Number or code that uniquely identifies an incident report for a particular reporting unit and a particular calendar year.|
|LOCAL_INCIDENT_ID| Number or code that uniquely identifies an incident for a particular local fire management organization within a particular calendar year.|
|FIRE_CODE| Code used within the interagency wildland fire community to track and compile cost information for emergency fire suppression |
|FIRE_NAME| Name of the incident, from the fire report (primary) or ICS-209 report (secondary).|
|ICS_209_INCIDENT_NUMBER| Incident (event) identifier, from the ICS-209 report.|
|ICS_209_NAME| Name of the incident, from the ICS-209 report.|
|MTBS_ID| Incident identifier, from the MTBS perimeter dataset.|
|MTBS_FIRE_NAME| Name of the incident, from the MTBS perimeter dataset.|
|COMPLEX_NAME| Name of the complex under which the fire was ultimately managed, when discernible.|
|FIRE_YEAR| Calendar year in which the fire was discovered or confirmed to exist.|
|DISCOVERY_DATE| Date on which the fire was discovered or confirmed to exist.|
|DISCOVERY_DOY| Day of year on which the fire was discovered or confirmed to exist.|
|DISCOVERY_TIME| Time of day that the fire was discovered or confirmed to exist.|
|STAT_CAUSE_CODE| Code for the (statistical) cause of the fire.|
|STAT_CAUSE_DESCR| Description of the (statistical) cause of the fire.|
|CONT_DATE| Date on which the fire was declared contained or otherwise controlled (mm/dd/yyyy where mm=month, dd=day, and yyyy=year).|
|CONT_DOY| Day of year on which the fire was declared contained or otherwise controlled.|
|CONT_TIME| Time of day that the fire was declared contained or otherwise controlled (hhmm where hh=hour, mm=minutes).|
|FIRE_SIZE| Estimate of acres within the final perimeter of the fire.|
|FIRE_SIZE_CLASS| Code for fire size based on the number of acres within the final fire perimeter expenditures (A=greater than 0 but less than or |equal to 0.25 acres, B=0.26-9.9 acres, C=10.0-99.9 acres, D=100-299 acres, E=300 to 999 acres, F=1000 to 4999 acres, and G=5000+ acres).
|LATITUDE| Latitude (NAD83) for point location of the fire (decimal degrees).|
|LONGITUDE| Longitude (NAD83) for point location of the fire (decimal degrees).|
|OWNER_CODE| Code for primary owner or entity responsible for managing the land at the point of origin of the fire at the time of the incident.|
|OWNER_DESCR| Name of primary owner or entity responsible for managing the land at the point of origin of the fire at the time of the incident.|
|STATE| Two-letter alphabetic code for the state in which the fire burned (or originated), based on the nominal designation in the fire report.|
|COUNTY| County, or equivalent, in which the fire burned (or originated), based on nominal designation in the fire report.|
|FIPS_CODE| Three-digit code from the Federal Information Process Standards (FIPS) publication 6-4 for representation of counties and equivalent entities.|
|FIPS_NAME| County name from the FIPS publication 6-4 for representation of counties and equivalent entities.|
|NWCG_UnitIDActive_20170109 | Look-up table containing all NWCG identifiers for agency units that were active (i.e., valid) as of 9 January 2017
|UnitId| NWCG Unit ID.|
|GeographicArea| Two-letter code for the geographic area in which the unit is located (NA=National, IN=International, AK=Alaska, CA=California, |EA=Eastern Area, GB=Great Basin, NR=Northern Rockies, NW=Northwest, RM=Rocky Mountain, SA=Southern Area, and SW=Southwest).
|Gacc| Seven or eight-letter code for the Geographic Area Coordination Center in which the unit is located |
|WildlandRole| Role of the unit within the wildland fire community.|
|UnitType| Type of unit (e.g., federal, state, local).|
|Department| Department (or state/territory) to which the unit belongs |
|Agency| Agency or bureau to which the unit belongs |
|Parent| Agency subgroup to which the unit belongs |
|Country| Country in which the unit is located (e.g. US| United States).|
|State| Two-letter code for the state in which the unit is located (or primarily affiliated).|
|Code| Unit code (follows state code to create UnitId).|
|Name| Unit name.|


Questions suggested:

* Have wildfires become more or less frequent over time?
* What counties are the most and least fire-prone?
* Given the size, location and date, can you predict the cause of a fire wildfire?
