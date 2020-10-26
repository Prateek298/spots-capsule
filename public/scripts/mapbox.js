mapboxgl.accessToken = mapToken;
var map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/streets-v11', // stylesheet location
	center: coord, // starting position [lng, lat]
	zoom: 11 // starting zoom
});

new mapboxgl.Marker()
	.setLngLat(coord)
	.addTo(map)