/**
 * GrünFinder Configuration
 * Contains constants and configuration settings for the application
 */

const CONFIG = {
    // Map configuration
    map: {
        center: [13.404954, 52.520008], // Berlin center coordinates [longitude, latitude]
        zoom: 11,
        minZoom: 9,
        maxZoom: 18,
        mapboxAccessToken: 'pk.eyJ1IjoiZ29waGVyMjciLCJhIjoiY205Y2lxdHU0MDNsYjJxczV0OWd3ZHRuMyJ9.Z_tnP1WQ06Py0QHgqRwf7A', // Replace with your actual Mapbox access token
        style: 'mapbox://styles/mapbox/streets-v12', // Mapbox Streets style
        satelliteStyle: 'mapbox://styles/mapbox/satellite-streets-v12', // Satellite style with streets
        outdoorsStyle: 'mapbox://styles/mapbox/outdoors-v12' // Outdoors style for nature areas
    },
    
    // API endpoints
    api: {
        berlinOpenData: 'https://daten.berlin.de/api/3/action/datastore_search',
        berlinGrillflaechen: 'https://gdi.berlin.de/services/wms/grillflaechen',
        berlinGrillflaechenCapabilities: 'https://gdi.berlin.de/services/wms/grillflaechen?REQUEST=GetCapabilities&SERVICE=wms',
        berlinHundefreilauf: 'https://gdi.berlin.de/services/wms/hundefreilauf',
        berlinHundefreilaufCapabilities: 'https://gdi.berlin.de/services/wms/hundefreilauf?REQUEST=GetCapabilities&SERVICE=wms',
        openWeatherMap: 'https://api.openweathermap.org/data/2.5/weather',
        openWeatherMapKey: '' // API key will be loaded from config.local.js
    },
    
    // Green space types and their colors
    greenSpaceTypes: {
        park: {
            name: 'Park',
            color: '#7CB342'
        },
        garden: {
            name: 'Garten',
            color: '#8BC34A'
        },
        forest: {
            name: 'Wald',
            color: '#33691E'
        },
        playground: {
            name: 'Spielplatz',
            color: '#FFCA28'
        },
        cemetery: {
            name: 'Friedhof',
            color: '#78909C'
        },
        meadow: {
            name: 'Wiese',
            color: '#AED581'
        },
        bbq_area: {
            name: 'Grillfläche',
            color: '#FF5722'
        },
        other: {
            name: 'Andere Grünfläche',
            color: '#A5D6A7'
        }
    },
    
    // Size categories in hectares
    sizeCategories: {
        small: { min: 0, max: 1, name: 'Klein' },
        medium: { min: 1, max: 10, name: 'Mittel' },
        large: { min: 10, max: Infinity, name: 'Groß' }
    },
    
    // Facility icons
    facilityIcons: {
        playground: 'fa-child',
        bbq: 'fa-fire',
        water: 'fa-water',
        sports: 'fa-futbol',
        dog: 'fa-dog',
        cafe: 'fa-coffee',
        toilet: 'fa-restroom',
        bike: 'fa-bicycle'
    },
    
    // Accessibility icons
    accessibilityIcons: {
        wheelchair: 'fa-wheelchair',
        parking: 'fa-parking',
        public_transport: 'fa-bus'
    },
    
    // Walking speed in meters per minute for time calculations
    walkingSpeed: 80,
    
    // Cycling speed in meters per minute for time calculations
    cyclingSpeed: 250
};
