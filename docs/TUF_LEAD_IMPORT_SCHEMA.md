# TUF Lead Import Schema

## Universal normalized fields
- organizationName (required)
- accountType (required)
- sourceUrl
- websiteUrl
- brandColors
- address
- city (required)
- state (required)
- zip
- phone
- enrollmentOrSize
- districtOrLeague
- primaryContactName
- primaryContactTitle
- primaryContactEmail
- primaryContactPhone
- sportsOffered
- sportUrls
- tufZone
- territory
- tufPriority
- sourceType
- duplicateKey
- validationErrors

## Account type values
High School, Middle School, Youth Program, Club Program, Rec Program, YMCA, College, Athletic Department, Other.

## MN CSV mapping
- school_name -> organizationName
- school_url -> sourceUrl
- school_colors -> brandColors
- address -> address (+ city/state/zip parse)
- phone_number -> phone
- enrollment -> enrollmentOrSize
- isd_number -> districtOrLeague
- website_link -> websiteUrl
- activities_director_name -> primaryContactName
- activities_director_email -> primaryContactEmail
- activities_director_phone_number -> primaryContactPhone
- football_offered / basketball_offered / hockey_offered / baseball_offered -> sportsOffered
- football_urls / basketball_urls / hockey_urls / baseball_urls -> sportUrls
- tuf_zone -> tufZone/territory
- tuf_priority -> tufPriority

## Sport normalization
Normalize to: Football, Basketball, Hockey, Baseball, Softball, Volleyball, Soccer, Lacrosse, Wrestling, Track, Cheer, Dance, All Athletics.

## Territory/zone normalization
Map zones to: metro, north, west, south.

## Duplicate detection
`duplicateKey = normalize(organizationName) + '|' + state`.

## Validation rules
- organizationName, city, state required
- accountType required and must be allowed value
- territory (if present) must map to metro/north/west/south
- primaryContactEmail (if present) basic email format
