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
- phone (school phone)
- enrollmentOrSize
- districtOrLeague
- primaryContactName
- primaryContactTitle
- primaryContactEmail
- primaryContactPhone
- athleticDirectorName
- athleticDirectorEmail
- athleticDirectorPhone
- headCoachName
- headCoachEmail
- headCoachPhone
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
- activities_director_name -> primaryContactName + athleticDirectorName
- activities_director_email -> primaryContactEmail + athleticDirectorEmail
- activities_director_phone_number -> primaryContactPhone + athleticDirectorPhone
- head_coach_name / coach_name / football_head_coach_name -> headCoachName
- head_coach_email / coach_email / football_head_coach_email -> headCoachEmail
- head_coach_phone_number / head_coach_phone / coach_phone / football_head_coach_phone -> headCoachPhone
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
- headCoachEmail (if present) basic email format
