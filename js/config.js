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
        style: 'https://api.maptiler.com/maps/streets/style.json?key=get_your_own_key', // Replace with your MapTiler key or use another style URL
        alternativeStyle: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json' // Free alternative
    },
    
    // API endpoints
    api: {
        berlinOpenData: 'https://daten.berlin.de/api/3/action/datastore_search',
        openWeatherMap: 'https://api.openweathermap.org/data/2.5/weather',
        openWeatherMapKey: '' // Add your OpenWeatherMap API key here
    },
    
    // Green space types and their colors
    greenSpaceTypes: {
        park: {
            name: 'Park',
            color: '#7CB342'
        },
        garden: {
            name: 'Garden',
            color: '#8BC34A'
        },
        forest: {
            name: 'Forest',
            color: '#33691E'
        },
        playground: {
            name: 'Playground',
            color: '#FFCA28'
        },
        cemetery: {
            name: 'Cemetery',
            color: '#78909C'
        },
        meadow: {
            name: 'Meadow',
            color: '#AED581'
        },
        other: {
            name: 'Other Green Space',
            color: '#A5D6A7'
        }
    },
    
    // Size categories in hectares
    sizeCategories: {
        small: { min: 0, max: 1, name: 'Small' },
        medium: { min: 1, max: 10, name: 'Medium' },
        large: { min: 10, max: Infinity, name: 'Large' }
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
