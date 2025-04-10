/**
 * GrünFinder Data Module
 * Handles data fetching, processing, and management
 */

const DataService = (() => {
    // Private variables
    let greenSpaces = [];
    let filteredGreenSpaces = [];
    let userLocation = null;

    /**
     * Fetch green space data from Berlin's Open Data Portal
     * For demo purposes, we'll use sample data until API integration is complete
     */
    const fetchGreenSpaces = async () => {
        try {
            // In a production app, this would fetch from the actual API
            // For now, we'll use sample data
            const response = await fetch('data/green_spaces.json');
            
            // If the file doesn't exist yet, use sample data
            if (!response.ok) {
                console.log('Using sample data instead of API');
                return generateSampleData();
            }
            
            const data = await response.json();
            return processGreenSpaceData(data);
        } catch (error) {
            console.error('Error fetching green spaces:', error);
            // Fallback to sample data
            return generateSampleData();
        }
    };

    /**
     * Process raw data from API into a usable format
     */
    const processGreenSpaceData = (data) => {
        // In a real app, this would transform API data into our format
        return data;
    };

    /**
     * Generate sample data for development and demo purposes
     */
    const generateSampleData = () => {
        const sampleData = [
            {
                id: 1,
                name: 'Tiergarten',
                type: 'park',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [13.3465, 52.5145],
                            [13.3465, 52.5195],
                            [13.3765, 52.5195],
                            [13.3765, 52.5145],
                            [13.3465, 52.5145]
                        ]
                    ]
                },
                properties: {
                    size_ha: 210,
                    facilities: ['playground', 'water', 'bbq', 'sports', 'cafe', 'toilet'],
                    accessibility: ['wheelchair', 'parking', 'public_transport'],
                    opening_hours: 'Open 24 hours',
                    description: 'Berlin\'s most popular inner-city park, covering 210 hectares.'
                }
            },
            {
                id: 2,
                name: 'Volkspark Friedrichshain',
                type: 'park',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [13.4315, 52.5275],
                            [13.4315, 52.5325],
                            [13.4415, 52.5325],
                            [13.4415, 52.5275],
                            [13.4315, 52.5275]
                        ]
                    ]
                },
                properties: {
                    size_ha: 52,
                    facilities: ['playground', 'sports', 'water', 'cafe'],
                    accessibility: ['wheelchair', 'public_transport'],
                    opening_hours: 'Open 24 hours',
                    description: 'The oldest public park in Berlin with sports facilities and monuments.'
                }
            },
            {
                id: 3,
                name: 'Treptower Park',
                type: 'park',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [13.4615, 52.4875],
                            [13.4615, 52.4925],
                            [13.4715, 52.4925],
                            [13.4715, 52.4875],
                            [13.4615, 52.4875]
                        ]
                    ]
                },
                properties: {
                    size_ha: 84,
                    facilities: ['playground', 'water', 'bbq'],
                    accessibility: ['wheelchair', 'parking', 'public_transport'],
                    opening_hours: 'Open 24 hours',
                    description: 'Large park along the Spree river with the Soviet War Memorial.'
                }
            },
            {
                id: 4,
                name: 'Mauerpark',
                type: 'park',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [13.4015, 52.5405],
                            [13.4015, 52.5455],
                            [13.4065, 52.5455],
                            [13.4065, 52.5405],
                            [13.4015, 52.5405]
                        ]
                    ]
                },
                properties: {
                    size_ha: 15,
                    facilities: ['playground', 'sports'],
                    accessibility: ['public_transport'],
                    opening_hours: 'Open 24 hours',
                    description: 'Popular park on the former death strip of the Berlin Wall, famous for its Sunday flea market and karaoke.'
                }
            },
            {
                id: 5,
                name: 'Grunewald',
                type: 'forest',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [13.1965, 52.4795],
                            [13.1965, 52.5095],
                            [13.2565, 52.5095],
                            [13.2565, 52.4795],
                            [13.1965, 52.4795]
                        ]
                    ]
                },
                properties: {
                    size_ha: 3000,
                    facilities: ['water', 'sports', 'dog'],
                    accessibility: ['parking', 'public_transport'],
                    opening_hours: 'Open 24 hours',
                    description: 'Berlin\'s largest forested area with lakes and hiking trails.'
                }
            },
            {
                id: 6,
                name: 'Körnerpark',
                type: 'garden',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [13.4365, 52.4815],
                            [13.4365, 52.4835],
                            [13.4395, 52.4835],
                            [13.4395, 52.4815],
                            [13.4365, 52.4815]
                        ]
                    ]
                },
                properties: {
                    size_ha: 2.4,
                    facilities: ['cafe'],
                    accessibility: ['wheelchair', 'public_transport'],
                    opening_hours: '8:00 - 20:00',
                    description: 'A small but beautiful sunken park with a Baroque design.'
                }
            },
            {
                id: 7,
                name: 'Tempelhofer Feld',
                type: 'meadow',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [13.3915, 52.4695],
                            [13.3915, 52.4795],
                            [13.4215, 52.4795],
                            [13.4215, 52.4695],
                            [13.3915, 52.4695]
                        ]
                    ]
                },
                properties: {
                    size_ha: 355,
                    facilities: ['sports', 'bbq', 'dog', 'bike'],
                    accessibility: ['wheelchair', 'parking', 'public_transport'],
                    opening_hours: '6:00 - 21:30 (summer), 7:30 - 19:00 (winter)',
                    description: 'Former airport turned into a massive public park, popular for cycling, skating, and kite flying.'
                }
            },
            {
                id: 8,
                name: 'Viktoriapark',
                type: 'park',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [13.3815, 52.4875],
                            [13.3815, 52.4905],
                            [13.3865, 52.4905],
                            [13.3865, 52.4875],
                            [13.3815, 52.4875]
                        ]
                    ]
                },
                properties: {
                    size_ha: 13,
                    facilities: ['playground', 'water'],
                    accessibility: ['public_transport'],
                    opening_hours: 'Open 24 hours',
                    description: 'Park on a hill with a waterfall and a national monument.'
                }
            },
            {
                id: 9,
                name: 'Botanischer Garten',
                type: 'garden',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [13.3015, 52.4475],
                            [13.3015, 52.4525],
                            [13.3115, 52.4525],
                            [13.3115, 52.4475],
                            [13.3015, 52.4475]
                        ]
                    ]
                },
                properties: {
                    size_ha: 43,
                    facilities: ['cafe', 'toilet'],
                    accessibility: ['wheelchair', 'parking', 'public_transport'],
                    opening_hours: '9:00 - 19:00 (summer), 9:00 - 16:30 (winter)',
                    description: 'One of the world\'s most important botanical gardens with over 22,000 plant species.'
                }
            },
            {
                id: 10,
                name: 'Görlitzer Park',
                type: 'park',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [13.4365, 52.4965],
                            [13.4365, 52.5005],
                            [13.4465, 52.5005],
                            [13.4465, 52.4965],
                            [13.4365, 52.4965]
                        ]
                    ]
                },
                properties: {
                    size_ha: 14,
                    facilities: ['playground', 'sports', 'dog'],
                    accessibility: ['public_transport'],
                    opening_hours: 'Open 24 hours',
                    description: 'Popular park in Kreuzberg on the site of a former railway station.'
                }
            }
        ];
        
        return sampleData;
    };

    /**
     * Get weather information for a specific location
     */
    const getWeather = async (lat, lng) => {
        if (!CONFIG.api.openWeatherMapKey) {
            return {
                temp: 22,
                condition: 'Sunny',
                icon: 'fa-sun'
            };
        }
        
        try {
            const url = `${CONFIG.api.openWeatherMap}?lat=${lat}&lon=${lng}&units=metric&appid=${CONFIG.api.openWeatherMapKey}`;
            const response = await fetch(url);
            const data = await response.json();
            
            let icon = 'fa-cloud';
            if (data.weather[0].main === 'Clear') icon = 'fa-sun';
            if (data.weather[0].main === 'Rain') icon = 'fa-cloud-rain';
            if (data.weather[0].main === 'Snow') icon = 'fa-snowflake';
            if (data.weather[0].main === 'Thunderstorm') icon = 'fa-bolt';
            
            return {
                temp: Math.round(data.main.temp),
                condition: data.weather[0].main,
                icon: icon
            };
        } catch (error) {
            console.error('Error fetching weather:', error);
            return {
                temp: 22,
                condition: 'Sunny',
                icon: 'fa-sun'
            };
        }
    };

    /**
     * Calculate distance between two points in meters
     */
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // Distance in meters
    };

    /**
     * Calculate travel time based on distance and mode of transport
     */
    const calculateTravelTime = (distance, mode = 'walking') => {
        if (mode === 'walking') {
            const timeMinutes = Math.round(distance / CONFIG.walkingSpeed);
            if (timeMinutes < 60) {
                return `${timeMinutes} min walking`;
            } else {
                const hours = Math.floor(timeMinutes / 60);
                const mins = timeMinutes % 60;
                return `${hours} h ${mins} min walking`;
            }
        } else if (mode === 'cycling') {
            const timeMinutes = Math.round(distance / CONFIG.cyclingSpeed);
            if (timeMinutes < 60) {
                return `${timeMinutes} min cycling`;
            } else {
                const hours = Math.floor(timeMinutes / 60);
                const mins = timeMinutes % 60;
                return `${hours} h ${mins} min cycling`;
            }
        }
    };

    /**
     * Find the nearest green space to a given location
     */
    const findNearestGreenSpace = (lat, lng) => {
        if (!greenSpaces.length) return null;
        
        let nearest = null;
        let minDistance = Infinity;
        
        greenSpaces.forEach(space => {
            // For simplicity, we'll use the first coordinate of the polygon as the center
            const spaceLat = space.geometry.coordinates[0][0][1];
            const spaceLng = space.geometry.coordinates[0][0][0];
            
            const distance = calculateDistance(lat, lng, spaceLat, spaceLng);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearest = {
                    ...space,
                    distance: distance,
                    travelTime: calculateTravelTime(distance)
                };
            }
        });
        
        return nearest;
    };

    /**
     * Filter green spaces based on search criteria
     */
    const filterGreenSpaces = (filters) => {
        if (!greenSpaces.length) return [];
        
        return greenSpaces.filter(space => {
            // Filter by name if search term is provided
            if (filters.searchTerm && !space.name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
                return false;
            }
            
            // Filter by distance if user location and max distance are provided
            if (userLocation && filters.maxDistance) {
                const spaceLat = space.geometry.coordinates[0][0][1];
                const spaceLng = space.geometry.coordinates[0][0][0];
                const distance = calculateDistance(
                    userLocation.lat, 
                    userLocation.lng, 
                    spaceLat, 
                    spaceLng
                );
                
                if (distance > filters.maxDistance) {
                    return false;
                }
            }
            
            // Filter by size
            if (filters.sizes && filters.sizes.length > 0) {
                const size = space.properties.size_ha;
                let matchesSize = false;
                
                filters.sizes.forEach(sizeCategory => {
                    const { min, max } = CONFIG.sizeCategories[sizeCategory];
                    if (size >= min && size <= max) {
                        matchesSize = true;
                    }
                });
                
                if (!matchesSize) return false;
            }
            
            // Filter by facilities
            if (filters.facilities && filters.facilities.length > 0) {
                const spaceFacilities = space.properties.facilities || [];
                let hasAllFacilities = true;
                
                filters.facilities.forEach(facility => {
                    if (!spaceFacilities.includes(facility)) {
                        hasAllFacilities = false;
                    }
                });
                
                if (!hasAllFacilities) return false;
            }
            
            // Filter by accessibility
            if (filters.accessibility && filters.accessibility.length > 0) {
                const spaceAccessibility = space.properties.accessibility || [];
                let hasAllAccessibility = true;
                
                filters.accessibility.forEach(feature => {
                    if (!spaceAccessibility.includes(feature)) {
                        hasAllAccessibility = false;
                    }
                });
                
                if (!hasAllAccessibility) return false;
            }
            
            return true;
        });
    };

    /**
     * Get size category (small, medium, large) based on hectares
     */
    const getSizeCategory = (hectares) => {
        if (hectares < CONFIG.sizeCategories.small.max) {
            return 'small';
        } else if (hectares < CONFIG.sizeCategories.medium.max) {
            return 'medium';
        } else {
            return 'large';
        }
    };

    // Public API
    return {
        init: async function() {
            greenSpaces = await fetchGreenSpaces();
            filteredGreenSpaces = [...greenSpaces];
            return greenSpaces;
        },
        
        getAllGreenSpaces: function() {
            return greenSpaces;
        },
        
        getFilteredGreenSpaces: function() {
            return filteredGreenSpaces;
        },
        
        setUserLocation: function(location) {
            userLocation = location;
        },
        
        getUserLocation: function() {
            return userLocation;
        },
        
        findNearestGreenSpace: function(lat, lng) {
            return findNearestGreenSpace(lat, lng);
        },
        
        filterGreenSpaces: function(filters) {
            filteredGreenSpaces = filterGreenSpaces(filters);
            return filteredGreenSpaces;
        },
        
        getGreenSpaceById: function(id) {
            return greenSpaces.find(space => space.id === id);
        },
        
        getWeatherForLocation: async function(lat, lng) {
            return await getWeather(lat, lng);
        },
        
        calculateDistance: function(lat1, lon1, lat2, lon2) {
            return calculateDistance(lat1, lon1, lat2, lon2);
        },
        
        calculateTravelTime: function(distance, mode) {
            return calculateTravelTime(distance, mode);
        },
        
        getSizeCategory: function(hectares) {
            return getSizeCategory(hectares);
        }
    };
})();
