/**
 * GrünFinder Map Module
 * Handles map initialization, rendering, and interactions
 */

const MapService = (() => {
    // Private variables
    let map;
    let greenSpacesSource;
    let userLocationMarker;
    let popup;
    
    /**
     * Initialize the map with Mapbox GL JS
     */
    const initMap = () => {
        // Set Mapbox access token
        mapboxgl.accessToken = CONFIG.map.mapboxAccessToken;
        
        // Create a new map instance
        map = new mapboxgl.Map({
            container: 'map',
            style: CONFIG.map.outdoorsStyle, // Use the outdoors style for green spaces
            center: CONFIG.map.center,
            zoom: CONFIG.map.zoom,
            minZoom: CONFIG.map.minZoom,
            maxZoom: CONFIG.map.maxZoom
        });
        
        // Add map controls
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
        
        // Add GeolocateControl with event listener to update user location
        const geolocateControl = new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true
        });
        
        map.addControl(geolocateControl, 'top-right');
        
        // When the geolocate control is triggered, update the user location
        geolocateControl.on('geolocate', (e) => {
            const location = {
                lat: e.coords.latitude,
                lng: e.coords.longitude
            };
            DataService.setUserLocation(location);
            updateUserLocationMarker(location.lat, location.lng);
        });
        map.addControl(new mapboxgl.ScaleControl({
            maxWidth: 100,
            unit: 'metric'
        }), 'bottom-left');
        
        // Create popup but don't add it to the map yet
        popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: true,
            maxWidth: '300px'
        });
        
        // Wait for map to load before adding sources and layers
        map.on('load', () => {
            // Add empty GeoJSON source for green spaces
            map.addSource('green-spaces', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });
            
            // Store reference to the source
            greenSpacesSource = map.getSource('green-spaces');
            
            // Add CSS for marker icons
            const style = document.createElement('style');
            style.textContent = `
                .marker-icon {
                    width: 30px;
                    height: 30px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    border-radius: 50%;
                    background-color: white;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                    cursor: pointer;
                    transition: transform 0.2s;
                    overflow: hidden;
                }
                
                .marker-icon:hover {
                    transform: scale(1.1);
                    z-index: 10;
                }
                
                /* Font Awesome icon styling */
                .marker-icon i {
                    font-size: 18px;
                    color: #4CAF50;
                }
                
                /* SVG icon styling */
                .marker-icon.svg-icon {
                    padding: 3px;
                    overflow: visible;
                }
                
                .marker-icon.svg-icon svg {
                    width: 100% !important;
                    height: 100% !important;
                    display: block;
                    object-fit: contain;
                }
                
                /* Type-specific styling */
                .marker-icon.park i { color: ${CONFIG.greenSpaceTypes.park.color}; }
                .marker-icon.garden i { color: ${CONFIG.greenSpaceTypes.garden.color}; }
                .marker-icon.forest i { color: ${CONFIG.greenSpaceTypes.forest.color}; }
                .marker-icon.playground i { color: ${CONFIG.greenSpaceTypes.playground.color}; }
                .marker-icon.cemetery i { color: ${CONFIG.greenSpaceTypes.cemetery.color}; }
                .marker-icon.meadow i { color: ${CONFIG.greenSpaceTypes.meadow.color}; }
                .marker-icon.bbq_area i { color: ${CONFIG.greenSpaceTypes.bbq_area.color}; }
                
                /* Special styling for park type */
                .marker-icon.park {
                    background-color: rgba(255, 255, 255, 0.9);
                }
                
                /* Special styling for forest type */
                .marker-icon.forest {
                    background-color: rgba(255, 255, 255, 0.9);
                }
                
                /* Special styling for BBQ areas */
                .marker-icon.bbq_area {
                    background-color: #FFECB3;
                    border: 2px solid ${CONFIG.greenSpaceTypes.bbq_area.color};
                }
                
                /* Fix for Mapbox marker positioning */
                .mapboxgl-marker {
                    cursor: pointer;
                }
                
                /* User location marker styling */
                .user-location-marker {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    border-radius: 50%;
                    background-color: #2196F3;
                    color: white;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                }
                
                .user-location-marker i {
                    font-size: 14px;
                }
            `;
            document.head.appendChild(style);
            
            // Add event listeners
            addMapEventListeners();
            
            // Fetch and render green spaces
            DataService.init().then(greenSpaces => {
                renderGreenSpaces(greenSpaces);
            });
        });
    };
    
    /**
     * Add event listeners to the map
     */
    const addMapEventListeners = () => {
        // We don't need these event listeners anymore since we're using markers
        // The click events are now handled directly on the marker elements
        
        // Handle geolocation control events
        if (map.hasControl(mapboxgl.GeolocateControl)) {
            const geolocateControl = map._controls.find(control => control instanceof mapboxgl.GeolocateControl);
            
            if (geolocateControl) {
                geolocateControl.on('geolocate', (e) => {
                    const { latitude, longitude } = e.coords;
                    DataService.setUserLocation({ lat: latitude, lng: longitude });
                });
            }
        }
    };
    
    // Store markers for green spaces
    let greenSpaceMarkers = [];
    
    /**
     * Render green spaces on the map as custom icon markers
     */
    const renderGreenSpaces = async (greenSpaces) => {
        if (!map) return;
        
        // Remove existing markers
        greenSpaceMarkers.forEach(marker => marker.remove());
        greenSpaceMarkers = [];
        
        // Add new markers for each green space
        for (const space of greenSpaces) {
            // Calculate center point of the polygon
            const coordinates = space.geometry.coordinates[0];
            const bounds = coordinates.reduce((bounds, coord) => {
                return bounds.extend(coord);
            }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
            
            const center = [
                (bounds.getWest() + bounds.getEast()) / 2,
                (bounds.getNorth() + bounds.getSouth()) / 2
            ];
            
            // Create marker element with custom icon
            const el = await IconService.createIconElement(space.type);
            el.classList.add('marker-icon'); // Add marker-icon class for styling
            el.setAttribute('data-id', space.id);
            
            // Create popup content
            const popupContent = `
                <div class="popup-content">
                    <h3 class="popup-title">${space.name}</h3>
                    <p class="popup-type">${CONFIG.greenSpaceTypes[space.type].name}</p>
                    <p>Size: ${space.properties.size_ha} hectares</p>
                    <div class="popup-details">
                        <a href="#" class="popup-link" data-id="${space.id}">View Details</a>
                    </div>
                </div>
            `;
            
            // Create popup
            const markerPopup = new mapboxgl.Popup({
                closeButton: true,
                closeOnClick: true,
                maxWidth: '300px',
                offset: [0, -15]
            }).setHTML(popupContent);
            
            // Create marker with popup
            const marker = new mapboxgl.Marker(el)
                .setLngLat(center)
                .setPopup(markerPopup) // Attach popup directly to marker
                .addTo(map);
            
            // Add click event for "View Details" link after popup is open
            marker.getElement().addEventListener('click', () => {
                // Wait for popup to be added to DOM
                setTimeout(() => {
                    const detailLink = document.querySelector(`.popup-link[data-id="${space.id}"]`);
                    if (detailLink) {
                        detailLink.addEventListener('click', (e) => {
                            e.preventDefault();
                            UIService.showGreenSpaceDetails(space.id);
                            markerPopup.remove(); // Close popup when viewing details
                        });
                    }
                }, 100);
            });
            
            // Store marker reference
            greenSpaceMarkers.push(marker);
        }
    };
    
    /**
     * Add or update user location marker on the map
     */
    const updateUserLocationMarker = (lat, lng) => {
        if (!map) return;
        
        // Create marker for user location if it doesn't exist
        if (!userLocationMarker) {
            const el = document.createElement('div');
            el.className = 'user-location-marker';
            el.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
            
            userLocationMarker = new mapboxgl.Marker(el)
                .setLngLat([lng, lat])
                .addTo(map);
        } else {
            userLocationMarker.setLngLat([lng, lat]);
        }
        
        // Pan to the marker
        map.flyTo({
            center: [lng, lat],
            zoom: 14,
            essential: true
        });
    };
    
    /**
     * Focus on a specific green space on the map
     */
    const focusOnGreenSpace = (id) => {
        if (!map) return;
        
        const greenSpace = DataService.getGreenSpaceById(id);
        if (!greenSpace) return;
        
        // Calculate center point of the polygon
        const coordinates = greenSpace.geometry.coordinates[0];
        const bounds = coordinates.reduce((bounds, coord) => {
            return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
        
        const center = [
            (bounds.getWest() + bounds.getEast()) / 2,
            (bounds.getNorth() + bounds.getSouth()) / 2
        ];
        
        // Fly to the green space
        map.flyTo({
            center: center,
            zoom: 15,
            essential: true
        });
        
        // Open popup for the green space
        const popupContent = `
            <div class="popup-content">
                <h3 class="popup-title">${greenSpace.name}</h3>
                <p class="popup-type">${CONFIG.greenSpaceTypes[greenSpace.type].name}</p>
                <p>Size: ${greenSpace.properties.size_ha} hectares</p>
                <div class="popup-details">
                    <a href="#" class="popup-link" data-id="${greenSpace.id}">View Details</a>
                </div>
            </div>
        `;
        
        popup.setLngLat(center)
            .setHTML(popupContent)
            .addTo(map);
        
        // Add event listener to the "View Details" link
        setTimeout(() => {
            const detailLink = document.querySelector(`.popup-link[data-id="${greenSpace.id}"]`);
            if (detailLink) {
                detailLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    UIService.showGreenSpaceDetails(greenSpace.id);
                });
            }
        }, 100);
    };
    
    /**
     * Get the user's current location
     */
    const getUserLocation = () => {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        const location = { lat: latitude, lng: longitude };
                        // Store the location in DataService for use by other components
                        DataService.setUserLocation(location);
                        resolve(location);
                    },
                    (error) => {
                        console.error('Error getting user location:', error);
                        reject(error);
                    }
                );
            } else {
                console.error('Geolocation is not supported by this browser');
                reject(new Error('Geolocation not supported'));
            }
        });
    };
    
    // Public API
    return {
        init: initMap,
        renderGreenSpaces,
        updateUserLocation: (location) => {
            if (location && location.lat && location.lng) {
                // Store the location in DataService for use by other components
                DataService.setUserLocation(location);
                updateUserLocationMarker(location.lat, location.lng);
            } else {
                getUserLocation()
                    .then(({ lat, lng }) => {
                        // Location is already stored in DataService by getUserLocation()
                        updateUserLocationMarker(lat, lng);
                    })
                    .catch(error => {
                        console.error('Error updating user location:', error);
                        UIService.showNotification('Could not get your location. Please check your browser settings.', 'error');
                    });
            }
        },
        focusOnGreenSpace,
        getUserLocation
    };
})();
