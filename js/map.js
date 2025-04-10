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
     * Initialize the map with MapLibre GL JS
     */
    const initMap = () => {
        // Create a new map instance
        map = new maplibregl.Map({
            container: 'map',
            style: CONFIG.map.alternativeStyle, // Use the free alternative style
            center: CONFIG.map.center,
            zoom: CONFIG.map.zoom,
            minZoom: CONFIG.map.minZoom,
            maxZoom: CONFIG.map.maxZoom
        });
        
        // Add map controls
        map.addControl(new maplibregl.NavigationControl(), 'top-right');
        map.addControl(new maplibregl.FullscreenControl(), 'top-right');
        map.addControl(new maplibregl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true
        }), 'top-right');
        map.addControl(new maplibregl.ScaleControl({
            maxWidth: 100,
            unit: 'metric'
        }), 'bottom-left');
        
        // Create popup but don't add it to the map yet
        popup = new maplibregl.Popup({
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
            
            // Create a tree icon element for markers
            const treeIcon = document.createElement('div');
            treeIcon.className = 'tree-marker-icon';
            treeIcon.innerHTML = '<i class="fas fa-tree"></i>';
            
            // Add CSS for the tree icon
            const style = document.createElement('style');
            style.textContent = `
                .tree-marker-icon {
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
                }
                
                .tree-marker-icon:hover {
                    transform: scale(1.1);
                }
                
                .tree-marker-icon i {
                    font-size: 18px;
                    color: #4CAF50;
                }
                
                .tree-marker-icon.park i { color: ${CONFIG.greenSpaceTypes.park.color}; }
                .tree-marker-icon.garden i { color: ${CONFIG.greenSpaceTypes.garden.color}; }
                .tree-marker-icon.forest i { color: ${CONFIG.greenSpaceTypes.forest.color}; }
                .tree-marker-icon.playground i { color: ${CONFIG.greenSpaceTypes.playground.color}; }
                .tree-marker-icon.cemetery i { color: ${CONFIG.greenSpaceTypes.cemetery.color}; }
                .tree-marker-icon.meadow i { color: ${CONFIG.greenSpaceTypes.meadow.color}; }
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
        if (map.hasControl(maplibregl.GeolocateControl)) {
            const geolocateControl = map._controls.find(control => control instanceof maplibregl.GeolocateControl);
            
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
     * Render green spaces on the map as tree markers
     */
    const renderGreenSpaces = (greenSpaces) => {
        if (!map) return;
        
        // Remove existing markers
        greenSpaceMarkers.forEach(marker => marker.remove());
        greenSpaceMarkers = [];
        
        // Add new markers for each green space
        greenSpaces.forEach(space => {
            // Calculate center point of the polygon
            const coordinates = space.geometry.coordinates[0];
            const bounds = coordinates.reduce((bounds, coord) => {
                return bounds.extend(coord);
            }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
            
            const center = [
                (bounds.getWest() + bounds.getEast()) / 2,
                (bounds.getNorth() + bounds.getSouth()) / 2
            ];
            
            // Create marker element
            const el = document.createElement('div');
            el.className = `tree-marker-icon ${space.type}`;
            el.innerHTML = '<i class="fas fa-tree"></i>';
            el.setAttribute('data-id', space.id);
            
            // Create marker
            const marker = new maplibregl.Marker(el)
                .setLngLat(center)
                .addTo(map);
            
            // Add click event
            el.addEventListener('click', () => {
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
                
                popup.setLngLat(center)
                    .setHTML(popupContent)
                    .addTo(map);
                
                // Add event listener to the "View Details" link
                setTimeout(() => {
                    const detailLink = document.querySelector(`.popup-link[data-id="${space.id}"]`);
                    if (detailLink) {
                        detailLink.addEventListener('click', (event) => {
                            event.preventDefault();
                            UIService.showGreenSpaceDetails(space.id);
                        });
                    }
                }, 100);
            });
            
            // Store marker reference
            greenSpaceMarkers.push(marker);
        });
    };
    
    /**
     * Add or update user location marker on the map
     */
    const updateUserLocationMarker = (lat, lng) => {
        if (!map) return;
        
        // Remove existing marker if it exists
        if (userLocationMarker) {
            userLocationMarker.remove();
        }
        
        // Create a new marker
        userLocationMarker = new maplibregl.Marker({
            color: '#2196F3',
            draggable: false
        })
            .setLngLat([lng, lat])
            .addTo(map);
        
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
        
        // Get the center of the polygon
        const coordinates = greenSpace.geometry.coordinates[0];
        const bounds = coordinates.reduce((bounds, coord) => {
            return bounds.extend(coord);
        }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
        
        // Calculate center point
        const center = [
            (bounds.getWest() + bounds.getEast()) / 2,
            (bounds.getNorth() + bounds.getSouth()) / 2
        ];
        
        // Fly to the green space
        map.flyTo({
            center: center,
            zoom: 15,
            duration: 1000
        });
        
        // Find the marker for this green space and trigger its click event
        const markerElement = document.querySelector(`.tree-marker-icon[data-id="${id}"]`);
        if (markerElement) {
            // Simulate a click on the marker
            setTimeout(() => {
                markerElement.click();
            }, 1100); // Wait for the flyTo animation to complete
        } else {
            // If marker not found, show popup manually
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
                    detailLink.addEventListener('click', (event) => {
                        event.preventDefault();
                        UIService.showGreenSpaceDetails(greenSpace.id);
                    });
                }
            }, 100);
        }
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
                        resolve({ lat: latitude, lng: longitude });
                    },
                    (error) => {
                        console.error('Error getting user location:', error);
                        reject(error);
                    },
                    { enableHighAccuracy: true }
                );
            } else {
                reject(new Error('Geolocation is not supported by this browser.'));
            }
        });
    };
    
    // Public API
    return {
        init: function() {
            initMap();
        },
        
        renderGreenSpaces: function(greenSpaces) {
            renderGreenSpaces(greenSpaces);
        },
        
        updateUserLocation: async function() {
            try {
                const location = await getUserLocation();
                DataService.setUserLocation(location);
                updateUserLocationMarker(location.lat, location.lng);
                return location;
            } catch (error) {
                console.error('Failed to update user location:', error);
                UIService.showNotification('Could not access your location. Please check your browser settings.', 'error');
                return null;
            }
        },
        
        focusOnGreenSpace: function(id) {
            focusOnGreenSpace(id);
        },
        
        getUserLocation: function() {
            return getUserLocation();
        }
    };
})();
