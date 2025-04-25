/**
 * GrünFinder Data Module
 * Handles data fetching, processing, and management
 */

const DataService = (() => {
    // Private variables
    let greenSpaces = [];
    let filteredGreenSpaces = [];
    let userLocation = null;
    let lastSearchedLocation = null;

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
            
            // Fetch BBQ areas data and merge with green spaces
            const bbqAreas = await fetchBBQAreas();
            
            // Fetch dog run areas data and merge with green spaces
            const dogRunAreas = await fetchDogRunAreas();
            
            // Merge all data
            const mergedData = [...data, ...bbqAreas, ...dogRunAreas];
            
            return processGreenSpaceData(mergedData);
        } catch (error) {
            console.error('Error fetching green spaces:', error);
            // Fallback to sample data
            return generateSampleData();
        }
    };
    
    /**
     * Fetch BBQ areas data from Berlin's Open Data Portal
     * Uses WMS service to get BBQ areas in Berlin
     */
    const fetchBBQAreas = async () => {
        try {
            console.log('Fetching BBQ areas from WMS service...');
            
            // Create a proxy URL to handle CORS issues
            // For a production app, you would set up a proper proxy server
            // For now, we'll use a CORS proxy service
            const corsProxy = 'https://corsproxy.io/?';
            
            // First, we need to get the BBQ areas as GeoJSON
            // We'll use the WMS GetFeatureInfo request to get information about features
            const wmsUrl = `${CONFIG.api.berlinGrillflaechen}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&LAYERS=grillflaechen&QUERY_LAYERS=grillflaechen&INFO_FORMAT=application/json&I=50&J=50&WIDTH=101&HEIGHT=101&CRS=EPSG:4326&BBOX=13.1,52.4,13.6,52.6`;
            
            const response = await fetch(corsProxy + encodeURIComponent(wmsUrl));
            
            if (!response.ok) {
                console.error('Fehler beim Abrufen der Grillflächen vom WMS-Dienst:', response.statusText);
                throw new Error('WMS-Dienst-Anfrage fehlgeschlagen. Es wird keine Ausweichoption verwendet.');
            }
            
            const data = await response.json();
            
            if (!data.features || data.features.length === 0) {
                console.log('Keine Grillflächen in der WMS-Antwort gefunden. Versuche mit einem anderen Ansatz...');
                return fetchBBQAreasWMS();
            }
            
            console.log('Grillflächen erfolgreich vom WMS-Dienst geladen:', data.features.length, 'Flächen gefunden');
            
            // Transform WMS data to our format
            return data.features.map(feature => ({
                id: 100 + (feature.id || Math.floor(Math.random() * 1000)),
                name: (feature.properties && feature.properties.name) || `Grillfläche ${feature.id || Math.floor(Math.random() * 100)}`,
                type: 'bbq_area',
                geometry: feature.geometry,
                properties: {
                    size_ha: (feature.properties && feature.properties.size_ha) || 0.5,
                    facilities: ['bbq'],
                    accessibility: [],
                    opening_hours: (feature.properties && feature.properties.opening_hours) || '8:00 - 22:00 (April - September)',
                    description: (feature.properties && feature.properties.description) || 'Offizielle Grillfläche in Berlin'
                }
            }));
        } catch (error) {
            console.error('Fehler beim Abrufen der Grillflächen vom WMS-Dienst:', error);
            throw new Error('Grillflächen konnten nicht vom WMS-Dienst geladen werden. Es wird keine Ausweichoption verwendet.');
        }
    };
    
    /**
     * Alternative approach to fetch BBQ areas using WMS GetMap
     * This is used if GetFeatureInfo doesn't return features
     */
    const fetchBBQAreasWMS = async () => {
        try {
            console.log('Versuche alternativen WMS-Ansatz für Grillflächen...');
            
            // Using a different approach with the WMS service
            const corsProxy = 'https://corsproxy.io/?';
            
            // Try with GetMap request to get the layer as an image
            // Then we'll use the GetFeatureInfo on specific points
            const wmsCapabilitiesUrl = CONFIG.api.berlinGrillflaechenCapabilities;
            
            const response = await fetch(corsProxy + encodeURIComponent(wmsCapabilitiesUrl));
            
            if (!response.ok) {
                throw new Error('WMS-Fähigkeiten konnten nicht abgerufen werden');
            }
            
            const text = await response.text();
            console.log('WMS-Fähigkeiten-Antwort erhalten, Länge:', text.length);
            
            // Parse the WMS capabilities to extract bbox and other information
            // This is a simplified approach - in a production app, you would use a proper WMS parser
            const bbox = extractBboxFromCapabilities(text);
            
            if (!bbox) {
                throw new Error('Konnte bbox nicht aus WMS-Fähigkeiten extrahieren');
            }
            
            console.log('Bbox aus WMS-Fähigkeiten extrahiert:', bbox);
            
            // Now use the bbox to make a more precise GetFeatureInfo request
            const wmsUrl = `${CONFIG.api.berlinGrillflaechen}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&LAYERS=grillflaechen&QUERY_LAYERS=grillflaechen&INFO_FORMAT=application/json&I=50&J=50&WIDTH=101&HEIGHT=101&CRS=EPSG:4326&BBOX=${bbox}`;
            
            const featureResponse = await fetch(corsProxy + encodeURIComponent(wmsUrl));
            
            if (!featureResponse.ok) {
                throw new Error('Fehler beim Abrufen von Features mit präziser Bbox');
            }
            
            const featureData = await featureResponse.json();
            
            if (!featureData.features || featureData.features.length === 0) {
                throw new Error('Keine Grillflächen in der WMS-Antwort mit präziser Bbox gefunden');
            }
            
            console.log('Grillflächen erfolgreich vom WMS-Dienst mit präziser Bbox geladen:', 
                      featureData.features.length, 'Flächen gefunden');
            
            // Transform WMS data to our format
            return featureData.features.map(feature => ({
                id: 100 + (feature.id || Math.floor(Math.random() * 1000)),
                name: (feature.properties && feature.properties.name) || `Grillfläche ${feature.id || Math.floor(Math.random() * 100)}`,
                type: 'bbq_area',
                geometry: feature.geometry,
                properties: {
                    size_ha: (feature.properties && feature.properties.size_ha) || 0.5,
                    facilities: ['bbq'],
                    accessibility: [],
                    opening_hours: (feature.properties && feature.properties.opening_hours) || '8:00 - 22:00 (April - September)',
                    description: (feature.properties && feature.properties.description) || 'Offizielle Grillfläche in Berlin'
                }
            }));
        } catch (error) {
            console.error('Fehler beim alternativen WMS-Ansatz:', error);
            throw new Error('Grillflächen konnten nicht mit dem alternativen WMS-Ansatz geladen werden. Es wird keine Ausweichoption verwendet.');
        }
    };
    
    /**
     * Extract bbox from WMS capabilities XML
     */
    const extractBboxFromCapabilities = (capabilitiesXml) => {
        try {
            // Simple regex approach to extract bbox
            // In a production app, you would use proper XML parsing
            const bboxMatch = capabilitiesXml.match(/<BoundingBox[^>]*CRS="EPSG:4326"[^>]*>(.*?)<\/BoundingBox>/s);
            
            if (bboxMatch) {
                const minxMatch = bboxMatch[1].match(/<minx>(.*?)<\/minx>/s);
                const minyMatch = bboxMatch[1].match(/<miny>(.*?)<\/miny>/s);
                const maxxMatch = bboxMatch[1].match(/<maxx>(.*?)<\/maxx>/s);
                const maxyMatch = bboxMatch[1].match(/<maxy>(.*?)<\/maxy>/s);
                
                if (minxMatch && minyMatch && maxxMatch && maxyMatch) {
                    return `${minxMatch[1]},${minyMatch[1]},${maxxMatch[1]},${maxyMatch[1]}`;
                }
            }
            
            // If regex approach fails, use default Berlin bbox
            return '13.1,52.4,13.6,52.6';
        } catch (error) {
            console.error('Fehler beim Extrahieren der Bbox aus den Fähigkeiten:', error);
            return '13.1,52.4,13.6,52.6'; // Standard-Berlin-Bbox
        }
    };
    
    /**
     * Fetch dog run areas data from Berlin's Open Data Portal
     * Uses WMS service to get dog run areas in Berlin
     */
    const fetchDogRunAreas = async () => {
        try {
            console.log('Hundefreilaufflächen vom WMS-Dienst abrufen...');
            
            // Create a proxy URL to handle CORS issues
            const corsProxy = 'https://corsproxy.io/?';
            
            // First, we need to get the dog run areas as GeoJSON
            // We'll use the WMS GetFeatureInfo request to get information about features
            const wmsUrl = `${CONFIG.api.berlinHundefreilauf}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&LAYERS=hundefreilauf&QUERY_LAYERS=hundefreilauf&INFO_FORMAT=application/json&I=50&J=50&WIDTH=101&HEIGHT=101&CRS=EPSG:4326&BBOX=13.1,52.4,13.6,52.6`;
            
            const response = await fetch(corsProxy + encodeURIComponent(wmsUrl));
            
            if (!response.ok) {
                console.error('Fehler beim Abrufen der Hundefreilaufflächen vom WMS-Dienst:', response.statusText);
                throw new Error('WMS-Dienst-Anfrage für Hundefreilaufflächen fehlgeschlagen.');
            }
            
            const data = await response.json();
            
            if (!data.features || data.features.length === 0) {
                console.log('Keine Hundefreilaufflächen in der WMS-Antwort gefunden. Versuche mit einem anderen Ansatz...');
                return fetchDogRunAreasWMS();
            }
            
            console.log('Hundefreilaufflächen erfolgreich vom WMS-Dienst geladen:', data.features.length, 'Flächen gefunden');
            
            // Transform WMS data to our format
            return data.features.map(feature => ({
                id: 300 + (feature.id || Math.floor(Math.random() * 1000)),
                name: (feature.properties && feature.properties.name) || `Hundefreilauffläche ${feature.id || Math.floor(Math.random() * 100)}`,
                type: 'park', // Use park type but mark as dog-friendly
                geometry: feature.geometry,
                properties: {
                    size_ha: (feature.properties && feature.properties.size_ha) || 0.3,
                    facilities: ['dog'], // Mark as dog-friendly
                    accessibility: [],
                    opening_hours: (feature.properties && feature.properties.opening_hours) || 'Täglich geöffnet',
                    description: (feature.properties && feature.properties.description) || 'Offizielle Hundefreilauffläche in Berlin'
                }
            }));
        } catch (error) {
            console.error('Fehler beim Abrufen der Hundefreilaufflächen vom WMS-Dienst:', error);
            console.log('Verwende alternative Methode für Hundefreilaufflächen...');
            return fetchDogRunAreasWMS();
        }
    };
    
    /**
     * Alternative approach to fetch dog run areas using WMS GetMap
     * This is used if GetFeatureInfo doesn't return features
     */
    const fetchDogRunAreasWMS = async () => {
        try {
            console.log('Versuche alternativen WMS-Ansatz für Hundefreilaufflächen...');
            
            // Using a different approach with the WMS service
            const corsProxy = 'https://corsproxy.io/?';
            
            // Try with GetMap request to get the layer as an image
            // Then we'll use the GetFeatureInfo on specific points
            const wmsCapabilitiesUrl = CONFIG.api.berlinHundefreilaufCapabilities;
            
            const response = await fetch(corsProxy + encodeURIComponent(wmsCapabilitiesUrl));
            
            if (!response.ok) {
                throw new Error('WMS-Fähigkeiten für Hundefreilaufflächen konnten nicht abgerufen werden');
            }
            
            const text = await response.text();
            console.log('WMS-Fähigkeiten-Antwort für Hundefreilaufflächen erhalten, Länge:', text.length);
            
            // Parse the WMS capabilities to extract bbox and other information
            const bbox = extractBboxFromCapabilities(text);
            
            if (!bbox) {
                throw new Error('Konnte bbox nicht aus WMS-Fähigkeiten für Hundefreilaufflächen extrahieren');
            }
            
            console.log('Bbox aus WMS-Fähigkeiten für Hundefreilaufflächen extrahiert:', bbox);
            
            // Now use the bbox to make a more precise GetFeatureInfo request
            const wmsUrl = `${CONFIG.api.berlinHundefreilauf}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&LAYERS=hundefreilauf&QUERY_LAYERS=hundefreilauf&INFO_FORMAT=application/json&I=50&J=50&WIDTH=101&HEIGHT=101&CRS=EPSG:4326&BBOX=${bbox}`;
            
            const featureResponse = await fetch(corsProxy + encodeURIComponent(wmsUrl));
            
            if (!featureResponse.ok) {
                throw new Error('Fehler beim Abrufen von Hundefreilaufflächen mit präziser Bbox');
            }
            
            const featureData = await featureResponse.json();
            
            if (!featureData.features || featureData.features.length === 0) {
                console.log('Keine Hundefreilaufflächen in der WMS-Antwort gefunden, verwende vordefinierte Standorte');
                return generateDogRunAreas();
            }
            
            console.log('Hundefreilaufflächen erfolgreich vom WMS-Dienst mit präziser Bbox geladen:', 
                      featureData.features.length, 'Flächen gefunden');
            
            // Transform WMS data to our format
            return featureData.features.map(feature => ({
                id: 300 + (feature.id || Math.floor(Math.random() * 1000)),
                name: (feature.properties && feature.properties.name) || `Hundefreilauffläche ${feature.id || Math.floor(Math.random() * 100)}`,
                type: 'park', // Use park type but mark as dog-friendly
                geometry: feature.geometry,
                properties: {
                    size_ha: (feature.properties && feature.properties.size_ha) || 0.3,
                    facilities: ['dog'], // Mark as dog-friendly
                    accessibility: [],
                    opening_hours: (feature.properties && feature.properties.opening_hours) || 'Täglich geöffnet',
                    description: (feature.properties && feature.properties.description) || 'Offizielle Hundefreilauffläche in Berlin'
                }
            }));
        } catch (error) {
            console.error('Fehler beim alternativen WMS-Ansatz für Hundefreilaufflächen:', error);
            return generateDogRunAreas();
        }
    };
    
    /**
     * Generate sample dog run areas data
     */
    const generateDogRunAreas = () => {
        // Sample dog run areas in Berlin
        console.log('Generiere Beispieldaten für Hundefreilaufflächen');
        return [
            {
                id: 301,
                name: 'Hundefreilauffläche Volkspark Friedrichshain',
                type: 'park',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [13.4350, 52.5290],
                            [13.4350, 52.5310],
                            [13.4370, 52.5310],
                            [13.4370, 52.5290],
                            [13.4350, 52.5290]
                        ]
                    ]
                },
                properties: {
                    size_ha: 0.4,
                    facilities: ['dog'],
                    accessibility: ['public_transport'],
                    opening_hours: 'Täglich geöffnet',
                    description: 'Hundefreilauffläche im Volkspark Friedrichshain'
                }
            },
            {
                id: 302,
                name: 'Hundefreilauffläche Tiergarten',
                type: 'park',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [13.3650, 52.5150],
                            [13.3650, 52.5170],
                            [13.3670, 52.5170],
                            [13.3670, 52.5150],
                            [13.3650, 52.5150]
                        ]
                    ]
                },
                properties: {
                    size_ha: 0.5,
                    facilities: ['dog'],
                    accessibility: ['public_transport'],
                    opening_hours: 'Täglich geöffnet',
                    description: 'Hundefreilauffläche im Tiergarten'
                }
            },
            {
                id: 303,
                name: 'Hundefreilauffläche Tempelhofer Feld',
                type: 'park',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [13.4000, 52.4730],
                            [13.4000, 52.4750],
                            [13.4020, 52.4750],
                            [13.4020, 52.4730],
                            [13.4000, 52.4730]
                        ]
                    ]
                },
                properties: {
                    size_ha: 0.6,
                    facilities: ['dog'],
                    accessibility: ['wheelchair', 'public_transport'],
                    opening_hours: '6:00 - 21:30',
                    description: 'Hundefreilauffläche auf dem Tempelhofer Feld'
                }
            }
        ];
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
                            [13.2015, 52.4805],
                            [13.2015, 52.4855],
                            [13.2115, 52.4855],
                            [13.2115, 52.4805],
                            [13.2015, 52.4805]
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
                name: 'Tempelhofer Feld',
                type: 'park',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [13.3915, 52.4705],
                            [13.3915, 52.4755],
                            [13.4015, 52.4755],
                            [13.4015, 52.4705],
                            [13.3915, 52.4705]
                        ]
                    ]
                },
                properties: {
                    size_ha: 355,
                    facilities: ['sports', 'bbq', 'dog'],
                    accessibility: ['wheelchair', 'parking', 'public_transport'],
                    opening_hours: '6:00 - 21:30',
                    description: 'Former airport transformed into a public park, perfect for cycling and kite-flying.'
                }
            },
            {
                id: 7,
                name: 'Viktoriapark',
                type: 'park',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [13.3815, 52.4905],
                            [13.3815, 52.4925],
                            [13.3865, 52.4925],
                            [13.3865, 52.4905],
                            [13.3815, 52.4905]
                        ]
                    ]
                },
                properties: {
                    size_ha: 13,
                    facilities: ['playground', 'water'],
                    accessibility: ['public_transport'],
                    opening_hours: 'Open 24 hours',
                    description: 'Park with a waterfall and a national monument on top of the Kreuzberg hill.'
                }
            },
            {
                id: 8,
                name: 'Volkspark Humboldthain',
                type: 'park',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [13.3815, 52.5455],
                            [13.3815, 52.5485],
                            [13.3865, 52.5485],
                            [13.3865, 52.5455],
                            [13.3815, 52.5455]
                        ]
                    ]
                },
                properties: {
                    size_ha: 29,
                    facilities: ['playground', 'sports', 'water'],
                    accessibility: ['wheelchair', 'public_transport'],
                    opening_hours: 'Open 24 hours',
                    description: 'Park with a rose garden, outdoor swimming pool, and WWII flak tower.'
                }
            },
            {
                id: 9,
                name: 'Görlitzer Park',
                type: 'park',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [13.4415, 52.4955],
                            [13.4415, 52.4985],
                            [13.4465, 52.4985],
                            [13.4465, 52.4955],
                            [13.4415, 52.4955]
                        ]
                    ]
                },
                properties: {
                    size_ha: 14,
                    facilities: ['playground', 'sports', 'bbq'],
                    accessibility: ['public_transport'],
                    opening_hours: 'Open 24 hours',
                    description: 'Popular park in Kreuzberg built on the grounds of a former railway station.'
                }
            },
            {
                id: 10,
                name: 'Volkspark Jungfernheide',
                type: 'park',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [13.2715, 52.5355],
                            [13.2715, 52.5385],
                            [13.2765, 52.5385],
                            [13.2765, 52.5355],
                            [13.2715, 52.5355]
                        ]
                    ]
                },
                properties: {
                    size_ha: 146,
                    facilities: ['playground', 'water', 'sports', 'bbq'],
                    accessibility: ['wheelchair', 'parking', 'public_transport'],
                    opening_hours: 'Open 24 hours',
                    description: 'Large park with a high ropes course, mini-golf, and a lake for swimming.'
                }
            }
        ];
        
        // Add BBQ areas
        const bbqAreas = [
            {
                id: 201,
                name: 'Volkspark Friedrichshain Grillzone',
                type: 'bbq_area',
                geometry: {
                    type: 'Point',
                    coordinates: [13.4317, 52.5285]
                },
                properties: {
                    size_ha: 0.3,
                    facilities: ['bbq'],
                    accessibility: ['wheelchair', 'public_transport'],
                    opening_hours: '8:00 - 22:00 (April - September)',
                    description: 'Offizielle Grillfläche im Volkspark Friedrichshain'
                }
            },
            {
                id: 202,
                name: 'Tiergarten Grillzone',
                type: 'bbq_area',
                geometry: {
                    type: 'Point',
                    coordinates: [13.3777, 52.5159]
                },
                properties: {
                    size_ha: 0.5,
                    facilities: ['bbq'],
                    accessibility: ['public_transport'],
                    opening_hours: '8:00 - 22:00 (April - September)',
                    description: 'Offizielle Grillfläche im Tiergarten'
                }
            },
            {
                id: 203,
                name: 'Tempelhofer Feld Grillzone',
                type: 'bbq_area',
                geometry: {
                    type: 'Point',
                    coordinates: [13.3965, 52.4725]
                },
                properties: {
                    size_ha: 0.8,
                    facilities: ['bbq'],
                    accessibility: ['wheelchair', 'public_transport'],
                    opening_hours: '8:00 - 21:00 (April - September)',
                    description: 'Offizielle Grillfläche auf dem Tempelhofer Feld'
                }
            }
        ];
        
        return [...sampleData, ...bbqAreas];
    };

    /**
     * Get weather information for a specific location
     */
    const getWeather = async (lat, lng) => {
        try {
            // Check if API key is available
            if (!CONFIG.api.openWeatherMapKey) {
                console.warn('OpenWeatherMap API key is missing. Using fallback weather data.');
                return getBerlinWeatherFallback();
            }
            
            // Use OpenWeatherMap API to get current weather
            const url = `${CONFIG.api.openWeatherMap}?lat=${lat}&lon=${lng}&units=metric&appid=${CONFIG.api.openWeatherMapKey}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                console.error('Error fetching weather data:', response.statusText);
                return getBerlinWeatherFallback();
            }
            
            const data = await response.json();
            
            return {
                temp: Math.round(data.main.temp),
                condition: data.weather[0].main,
                icon: getWeatherIcon(data.weather[0].id),
                windSpeed: data.wind.speed,
                windIcon: getWindIcon(data.wind.speed)
            };
        } catch (error) {
            console.error('Error fetching weather:', error);
            return getBerlinWeatherFallback();
        }
    };
    
    /**
     * Get fallback weather data for Berlin
     */
    const getBerlinWeatherFallback = () => {
        // Get current date to determine season-appropriate weather
        const now = new Date();
        const month = now.getMonth(); // 0-11
        
        // Seasonal weather patterns for Berlin
        if (month >= 5 && month <= 8) { // Summer (Jun-Sep)
            return { 
                temp: 24, 
                condition: 'Sonnig', 
                icon: 'fa-sun',
                windSpeed: 8,
                windIcon: 'fa-wind'
            };
        } else if (month >= 9 && month <= 10) { // Fall (Oct-Nov)
            return { 
                temp: 12, 
                condition: 'Teilweise bewölkt', 
                icon: 'fa-cloud-sun',
                windSpeed: 12,
                windIcon: 'fa-wind'
            };
        } else if (month >= 11 || month <= 1) { // Winter (Dec-Feb)
            return { 
                temp: 2, 
                condition: 'Bewölkt', 
                icon: 'fa-cloud',
                windSpeed: 15,
                windIcon: 'fa-wind'
            };
        } else { // Spring (Mar-May)
            return { 
                temp: 16, 
                condition: 'Teilweise bewölkt', 
                icon: 'fa-cloud-sun',
                windSpeed: 10,
                windIcon: 'fa-wind'
            };
        }
    };
    
    /**
     * Get appropriate weather icon based on weather condition ID
     */
    const getWeatherIcon = (conditionId) => {
        // Map OpenWeatherMap condition codes to Font Awesome icons
        // See https://openweathermap.org/weather-conditions for codes
        if (conditionId >= 200 && conditionId < 300) { // Thunderstorm
            return 'fa-bolt';
        } else if (conditionId >= 300 && conditionId < 400) { // Drizzle
            return 'fa-cloud-rain';
        } else if (conditionId >= 500 && conditionId < 600) { // Rain
            return 'fa-cloud-showers-heavy';
        } else if (conditionId >= 600 && conditionId < 700) { // Snow
            return 'fa-snowflake';
        } else if (conditionId >= 700 && conditionId < 800) { // Atmosphere (fog, mist, etc.)
            return 'fa-smog';
        } else if (conditionId === 800) { // Clear
            return 'fa-sun';
        } else if (conditionId > 800 && conditionId < 900) { // Clouds
            return 'fa-cloud';
        } else { // Default
            return 'fa-cloud-sun';
        }
    };
    
    /**
     * Get appropriate wind icon based on wind speed
     */
    const getWindIcon = (windSpeed) => {
        // Simple wind icon based on speed
        if (windSpeed < 5) {
            return 'fa-wind'; // Light breeze
        } else if (windSpeed < 10) {
            return 'fa-wind'; // Moderate wind
        } else {
            return 'fa-wind'; // Strong wind
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
        // Average speeds in meters per minute
        const speeds = {
            walking: 80, // ~5 km/h
            cycling: 200, // ~12 km/h
            public_transport: 400, // ~24 km/h (including waiting time)
            driving: 500 // ~30 km/h (urban average with traffic)
        };
        
        const speed = speeds[mode] || speeds.walking;
        const timeMinutes = Math.round(distance / speed);
        
        // Format time
        if (timeMinutes < 1) {
            return 'Less than a minute';
        } else if (timeMinutes === 1) {
            return '1 minute';
        } else if (timeMinutes < 60) {
            return `${timeMinutes} minutes`;
        } else {
            const hours = Math.floor(timeMinutes / 60);
            const mins = timeMinutes % 60;
            if (mins === 0) {
                return `${hours} hour${hours > 1 ? 's' : ''}`;
            } else {
                return `${hours} hour${hours > 1 ? 's' : ''} and ${mins} minute${mins > 1 ? 's' : ''}`;
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
            // Get coordinates from the first point of the polygon
            // In a production app, we would calculate the center point of the polygon
            const spaceLat = space.geometry.coordinates[0][0][1];
            const spaceLng = space.geometry.coordinates[0][0][0];
            
            const distance = calculateDistance(lat, lng, spaceLat, spaceLng);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearest = { ...space, distance };
            }
        });
        
        return nearest;
    };
    
    /**
     * Geocode an address to get coordinates
     * Uses Nominatim OpenStreetMap service with a CORS proxy
     */
    const geocodeAddress = async (address) => {
        if (!address || address.trim() === '') return null;
        
        try {
            // Add Berlin to the search query if not already included
            if (!address.toLowerCase().includes('berlin')) {
                address += ', Berlin';
            }
            
            // Encode the address for URL
            const encodedAddress = encodeURIComponent(address);
            
            // For demo purposes, we'll use a mock geocoding response based on common Berlin locations
            // This avoids CORS issues in the browser preview
            console.log('Geocoding address:', address);
            
            // Simple mock geocoding for common Berlin locations
            const berlinLocations = {
                'alexanderplatz': { lat: 52.5219, lng: 13.4132, name: 'Alexanderplatz, Berlin' },
                'brandenburger tor': { lat: 52.5163, lng: 13.3777, name: 'Brandenburger Tor, Berlin' },
                'potsdamer platz': { lat: 52.5096, lng: 13.3739, name: 'Potsdamer Platz, Berlin' },
                'kurfürstendamm': { lat: 52.5033, lng: 13.3267, name: 'Kurfürstendamm, Berlin' },
                'friedrichstraße': { lat: 52.5208, lng: 13.3875, name: 'Friedrichstraße, Berlin' },
                'checkpoint charlie': { lat: 52.5075, lng: 13.3904, name: 'Checkpoint Charlie, Berlin' },
                'fernsehturm': { lat: 52.5208, lng: 13.4094, name: 'Fernsehturm, Berlin' },
                'zoologischer garten': { lat: 52.5063, lng: 13.3344, name: 'Zoologischer Garten, Berlin' },
                'hackescher markt': { lat: 52.5225, lng: 13.4022, name: 'Hackescher Markt, Berlin' },
                'kreuzberg': { lat: 52.4965, lng: 13.3896, name: 'Kreuzberg, Berlin' },
                'prenzlauer berg': { lat: 52.5429, lng: 13.4106, name: 'Prenzlauer Berg, Berlin' },
                'friedrichshain': { lat: 52.5170, lng: 13.4546, name: 'Friedrichshain, Berlin' },
                'neukölln': { lat: 52.4811, lng: 13.4395, name: 'Neukölln, Berlin' },
                'charlottenburg': { lat: 52.5157, lng: 13.3031, name: 'Charlottenburg, Berlin' },
                'mitte': { lat: 52.5200, lng: 13.4050, name: 'Mitte, Berlin' },
                'tiergarten': { lat: 52.5145, lng: 13.3501, name: 'Tiergarten, Berlin' },
                'tempelhofer feld': { lat: 52.4747, lng: 13.4023, name: 'Tempelhofer Feld, Berlin' }
            };
            
            // Try to match the input with known locations
            const normalizedInput = address.toLowerCase().replace(/,\s*berlin/i, '');
            
            // Check if the input contains any of the known locations
            for (const [key, location] of Object.entries(berlinLocations)) {
                if (normalizedInput.includes(key)) {
                    console.log('Found location match:', key);
                    return {
                        lat: location.lat,
                        lng: location.lng,
                        displayName: location.name
                    };
                }
            }
            
            // If no match found, use a default central Berlin location
            console.warn('No exact match found for address, using default Berlin location');
            return {
                lat: 52.5200, // Central Berlin latitude
                lng: 13.4050, // Central Berlin longitude
                displayName: 'Berlin (approximate location)'
            };
        } catch (error) {
            console.error('Error geocoding address:', error);
            return null;
        }
    };
    
    /**
     * Filter green spaces based on search criteria
     */
    const filterGreenSpaces = async (filters) => {
        if (!greenSpaces.length) return [];
        
        // If there's a search term, treat it as an address and geocode it
        if (filters.searchTerm && filters.searchTerm.trim() !== '') {
            lastSearchedLocation = await geocodeAddress(filters.searchTerm);
            
            // If geocoding failed, show a notification and continue with other filters
            if (!lastSearchedLocation) {
                console.warn('Could not find the address: ' + filters.searchTerm);
                // We'll continue with other filters but without address-based sorting
            }
        } else {
            lastSearchedLocation = null;
        }
        
        // Apply all other filters first
        let filteredSpaces = greenSpaces.filter(space => {
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
        
        // If we have a valid searched location, calculate distances and sort by proximity
        if (lastSearchedLocation) {
            // Calculate distance from the searched location for each space
            filteredSpaces = filteredSpaces.map(space => {
                const spaceLat = space.geometry.coordinates[0][0][1];
                const spaceLng = space.geometry.coordinates[0][0][0];
                const distance = calculateDistance(
                    lastSearchedLocation.lat,
                    lastSearchedLocation.lng,
                    spaceLat,
                    spaceLng
                );
                
                // Add distance to the space object
                return {
                    ...space,
                    distanceToSearched: distance
                };
            });
            
            // Sort by proximity (closest first)
            filteredSpaces.sort((a, b) => a.distanceToSearched - b.distanceToSearched);
        }
        
        return filteredSpaces;
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
    
    /**
     * Reset the last searched location
     */
    const resetSearchedLocation = () => {
        lastSearchedLocation = null;
    };
    
    /**
     * Get the last searched location
     */
    const getLastSearchedLocation = () => {
        return lastSearchedLocation;
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
        
        filterGreenSpaces: async function(filters) {
            filteredGreenSpaces = await filterGreenSpaces(filters);
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
        },
        
        resetSearchedLocation: function() {
            resetSearchedLocation();
        },
        
        getLastSearchedLocation: function() {
            return getLastSearchedLocation();
        }
    };
})();
