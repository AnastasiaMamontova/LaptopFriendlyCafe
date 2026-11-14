# Berlin address autocomplete

In **Map** view, use **Find an address in Berlin**. Type at least three characters
of a street name and, optionally, a building number. Choose a suggestion by
touch/click or with the arrow keys and Enter. Escape closes the list.

The map centers on the chosen address at street zoom and adds a separate purple
location marker. Cafe markers stay on the map. Clearing the address removes the
location marker and restores the filtered cafe overview. Address selection does
not create or modify cafe records and is separate from catalog text search.

## Service and city restriction

- Uses the public [Photon](https://github.com/komoot/photon) geocoder based on
  OpenStreetMap, without an API key, registration or billing.
- Requests are restricted to a Berlin bounding box and biased toward the city
  center. The client additionally requires a Berlin city/state property, valid
  coordinates inside the box and a German country code when one is present.
  The administrative check excludes neighboring Brandenburg addresses inside
  the rectangular search area.
- Street suggestions and building addresses are supported. Availability and
  precision depend on the provider's OpenStreetMap data.
- Queries are sent only after a 450 ms pause, with cancellation of obsolete
  requests, an eight-second timeout, up to six displayed suggestions and a
  bounded in-memory cache of 40 successful queries. Nothing is stored in
  Supabase or persistent browser storage by address search.
- Address search requires internet. The UI handles an unavailable service,
  throttling, no matches and offline mode; existing cafe markers remain usable.
- Photon/OpenStreetMap attribution is visible in the suggestions list. The
  existing Leaflet map and its tile attribution remain in place.

The public Photon endpoint permits reasonable project use, may throttle heavy
traffic and does not guarantee availability. It is not an unlimited hosted
service. For higher traffic, run a Photon instance and set the optional public
build variable `VITE_ADDRESS_SEARCH_URL` to its `/api/` endpoint. The instance
must support browser CORS. No additional paid service is enabled by this change.

The existing **Find coordinates by address** button in the cafe editor remains
an explicit one-off Nominatim search. It is not used for autocomplete, which the
[public Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/)
prohibits.

## Verification

The public Photon API was queried using an HTTPS client with normal certificate
validation. Responses included Berlin and neighboring-city results; filtering is
covered by tests. CORS was verified for browser and Capacitor local origins.
Automated browser scenarios intercept provider and tile requests, use fixture
cafes, and never change production data.
