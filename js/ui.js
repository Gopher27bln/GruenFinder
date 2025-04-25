/**
 * GrünFinder UI Module
 * Handles user interface interactions and updates
 */

const UIService = (() => {
    // Private variables
    let detailTemplate;
    let activeFilters = {
        searchTerm: '',
        maxDistance: null,
        sizes: [],
        facilities: [],
        accessibility: []
    };
    
    /**
     * Initialize UI components and event listeners
     */
    const init = () => {
        // Get template for detail panel
        detailTemplate = document.getElementById('detail-template');
        
        // Set up event listeners
        setupEventListeners();
    };
    
    /**
     * Set up event listeners for UI elements
     */
    const setupEventListeners = () => {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
        
        // Close detail panel
        const closeDetailBtn = document.getElementById('close-detail');
        closeDetailBtn.addEventListener('click', () => {
            hideGreenSpaceDetails();
        });
        
        // Search functionality
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');
        
        searchButton.addEventListener('click', () => {
            activeFilters.searchTerm = searchInput.value.trim();
            applyFilters();
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                activeFilters.searchTerm = searchInput.value.trim();
                applyFilters();
            }
        });
        
        // Find nearest button
        const findNearestBtn = document.getElementById('find-nearest');
        findNearestBtn.addEventListener('click', findNearestGreenSpace);
        
        // Distance filter
        const distanceFilter = document.getElementById('distance-filter');
        distanceFilter.addEventListener('change', () => {
            const value = distanceFilter.value;
            activeFilters.maxDistance = value === 'all' ? null : parseInt(value);
            applyFilters();
        });
        
        // Size filters
        const sizeCheckboxes = document.querySelectorAll('input[name="size"]');
        sizeCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                updateSizeFilters();
            });
        });
        
        // Facility filters
        const facilityCheckboxes = document.querySelectorAll('input[name="facility"]');
        facilityCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                updateFacilityFilters();
            });
        });
        
        // Accessibility filters
        const accessibilityCheckboxes = document.querySelectorAll('input[name="accessibility"]');
        accessibilityCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                updateAccessibilityFilters();
            });
        });
        
        // Apply filters button
        const applyFiltersBtn = document.getElementById('apply-filters');
        applyFiltersBtn.addEventListener('click', () => {
            applyFilters();
        });
        
        // Reset filters button
        const resetFiltersBtn = document.getElementById('reset-filters');
        resetFiltersBtn.addEventListener('click', resetFilters);
    };
    
    /**
     * Update size filters based on checkbox selection
     */
    const updateSizeFilters = () => {
        const sizeCheckboxes = document.querySelectorAll('input[name="size"]:checked');
        activeFilters.sizes = Array.from(sizeCheckboxes).map(checkbox => checkbox.value);
    };
    
    /**
     * Update facility filters based on checkbox selection
     */
    const updateFacilityFilters = () => {
        const facilityCheckboxes = document.querySelectorAll('input[name="facility"]:checked');
        activeFilters.facilities = Array.from(facilityCheckboxes).map(checkbox => checkbox.value);
    };
    
    /**
     * Update accessibility filters based on checkbox selection
     */
    const updateAccessibilityFilters = () => {
        const accessibilityCheckboxes = document.querySelectorAll('input[name="accessibility"]:checked');
        activeFilters.accessibility = Array.from(accessibilityCheckboxes).map(checkbox => checkbox.value);
    };
    
    /**
     * Apply all active filters to the green spaces
     */
    const applyFilters = () => {
        // Update all filter arrays
        updateSizeFilters();
        updateFacilityFilters();
        updateAccessibilityFilters();
        
        // Apply filters to data (async operation)
        DataService.filterGreenSpaces(activeFilters).then(filteredSpaces => {
            // Update map with filtered spaces
            MapService.renderGreenSpaces(filteredSpaces);
            
            // Show notification with count
            if (activeFilters.searchTerm && activeFilters.searchTerm.trim() !== '') {
                const location = DataService.getLastSearchedLocation();
                if (location) {
                    showNotification(`${filteredSpaces.length} Grünflächen in der Nähe von ${activeFilters.searchTerm} gefunden, sortiert nach Entfernung.`, 'info');
                } else {
                    showNotification(`Adresse "${activeFilters.searchTerm}" nicht gefunden. Zeige ${filteredSpaces.length} Grünflächen mit anderen Filtern an.`, 'warning');
                }
            } else {
                showNotification(`${filteredSpaces.length} Grünflächen gefunden, die deinen Kriterien entsprechen.`, 'info');
            }
        });
    };
    
    /**
     * Reset all filters to their default values
     */
    const resetFilters = () => {
        // Reset search input
        document.getElementById('search-input').value = '';
        
        // Reset distance filter
        document.getElementById('distance-filter').value = 'all';
        
        // Reset checkboxes
        const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
        allCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Reset active filters object
        activeFilters = {
            searchTerm: '',
            maxDistance: null,
            sizes: [],
            facilities: [],
            accessibility: []
        };
        
        // Reset the last searched location
        DataService.resetSearchedLocation();
        
        // Apply reset filters
        const allGreenSpaces = DataService.getAllGreenSpaces();
        MapService.renderGreenSpaces(allGreenSpaces);
        
        // Show notification
        showNotification('Filter wurden zurückgesetzt.', 'info');
    };
    
    /**
     * Find the nearest green space to the user's location
     */
    const findNearestGreenSpace = async () => {
        try {
            // Get user location
            const location = await MapService.updateUserLocation();
            if (!location) return;
            
            // Find nearest green space
            const nearest = DataService.findNearestGreenSpace(location.lat, location.lng);
            
            if (nearest) {
                // Focus on the green space
                MapService.focusOnGreenSpace(nearest.id);
                
                // Show details
                showGreenSpaceDetails(nearest.id);
                
                // Show notification
                showNotification(`Nächste Grünfläche gefunden: ${nearest.name} (${nearest.travelTime})`, 'success');
            } else {
                showNotification('Es konnten keine Grünflächen gefunden werden.', 'error');
            }
        } catch (error) {
            console.error('Fehler beim Finden der nächsten Grünfläche:', error);
            showNotification('Fehler beim Finden der nächsten Grünfläche. Bitte versuche es erneut.', 'error');
        }
    };
    
    /**
     * Show detailed information about a green space
     */
    const showGreenSpaceDetails = async (id) => {
        const greenSpace = DataService.getGreenSpaceById(id);
        if (!greenSpace) return;
        
        // Get detail panel and content elements
        const detailPanel = document.getElementById('detail-panel');
        const detailContent = document.getElementById('detail-content');
        
        // Clone the template content
        const content = document.importNode(detailTemplate.content, true);
        
        // Fill in the details
        content.querySelector('.detail-title').textContent = greenSpace.name;
        content.querySelector('.detail-type').textContent = CONFIG.greenSpaceTypes[greenSpace.type].name;
        content.querySelector('.detail-size span').textContent = `${greenSpace.properties.size_ha} Hektar`;
        
        // Get weather information
        try {
            const spaceLat = greenSpace.geometry.coordinates[0][0][1];
            const spaceLng = greenSpace.geometry.coordinates[0][0][0];
            const weather = await DataService.getWeatherForLocation(spaceLat, spaceLng);
            
            content.querySelector('.detail-weather i').className = `fas ${weather.icon}`;
            content.querySelector('.detail-weather span').textContent = `${weather.temp}°C, ${weather.condition}`;
            
            // Display wind speed information
            console.log('Weather data:', weather);
            try {
                content.querySelector('.detail-wind i').className = `fas ${weather.windIcon}`;
                content.querySelector('.detail-wind span').textContent = `${weather.windSpeed} m/s`;
                console.log('Wind speed element updated');
            } catch (windError) {
                console.error('Error updating wind display:', windError);
            }
        } catch (error) {
            console.error('Error fetching weather:', error);
            content.querySelector('.detail-weather').style.display = 'none';
            content.querySelector('.detail-wind').style.display = 'none';
        }
        
        // Calculate distance and travel time if user location is available
        const userLocation = DataService.getUserLocation();
        if (userLocation) {
            const spaceLat = greenSpace.geometry.coordinates[0][0][1];
            const spaceLng = greenSpace.geometry.coordinates[0][0][0];
            
            const distance = DataService.calculateDistance(
                userLocation.lat,
                userLocation.lng,
                spaceLat,
                spaceLng
            );
            
            const walkingTime = DataService.calculateTravelTime(distance, 'walking');
            content.querySelector('.detail-distance span').textContent = walkingTime;
            
            // Set up route button with direct href link for better compatibility
            const routeBtn = content.querySelector('.route-btn');
            
            // Create Google Maps URL with the destination
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spaceLat},${spaceLng}`;
            
            // Make the button act like a link
            routeBtn.setAttribute('data-maps-url', googleMapsUrl);
            
            // Remove any existing event listeners by cloning and replacing the button
            const newRouteBtn = routeBtn.cloneNode(true);
            routeBtn.parentNode.replaceChild(newRouteBtn, routeBtn);
            
            // Add the event listener to the new button
            newRouteBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const url = this.getAttribute('data-maps-url');
                console.log('Opening Google Maps with URL:', url);
                
                // Try multiple methods to open the URL
                try {
                    // Method 1: Direct window.open
                    window.open(url, '_blank');
                } catch (err) {
                    console.warn('First method failed, trying alternative...', err);
                    
                    // Method 2: Create and click a link
                    const link = document.createElement('a');
                    link.href = url;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            });
            
            // Also make it work as a regular link for better accessibility
            newRouteBtn.style.cursor = 'pointer';
            newRouteBtn.title = 'Route in Google Maps öffnen';
        } else {
            content.querySelector('.detail-distance').style.display = 'none';
        }
        
        // Add facilities
        const facilitiesList = content.querySelector('.facilities-list');
        if (greenSpace.properties.facilities && greenSpace.properties.facilities.length > 0) {
            greenSpace.properties.facilities.forEach(facility => {
                const li = document.createElement('li');
                const icon = CONFIG.facilityIcons[facility] || 'fa-check';
                li.innerHTML = `<i class="fas ${icon}"></i> ${facility.charAt(0).toUpperCase() + facility.slice(1)}`;
                facilitiesList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'Keine Informationen verfügbar';
            facilitiesList.appendChild(li);
        }
        
        // Add accessibility information
        const accessibilityList = content.querySelector('.accessibility-list');
        if (greenSpace.properties.accessibility && greenSpace.properties.accessibility.length > 0) {
            greenSpace.properties.accessibility.forEach(feature => {
                const li = document.createElement('li');
                const icon = CONFIG.accessibilityIcons[feature] || 'fa-check';
                li.innerHTML = `<i class="fas ${icon}"></i> ${feature.charAt(0).toUpperCase() + feature.slice(1).replace('_', ' ')}`;
                accessibilityList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'Keine Informationen verfügbar';
            accessibilityList.appendChild(li);
        }
        
        // Add opening hours
        const hoursText = content.querySelector('.hours-text');
        hoursText.textContent = greenSpace.properties.opening_hours || 'Keine Informationen verfügbar';
        
        // Clear previous content and add new content
        detailContent.innerHTML = '';
        detailContent.appendChild(content);
        
        // Double-check that the wind element is properly displayed after DOM insertion
        setTimeout(() => {
            const windElement = detailPanel.querySelector('.detail-wind');
            if (windElement) {
                console.log('Wind element found in DOM after insertion');
                // Ensure it's visible
                windElement.style.display = 'flex';
            } else {
                console.error('Wind element not found in DOM after insertion');
            }
        }, 100);
        
        // Show the panel
        detailPanel.classList.remove('hidden');
    };
    
    /**
     * Hide the green space details panel
     */
    const hideGreenSpaceDetails = () => {
        const detailPanel = document.getElementById('detail-panel');
        detailPanel.classList.add('hidden');
    };
    
    /**
     * Show a notification message to the user
     */
    const showNotification = (message, type = 'info') => {
        // Check if notification container exists, create if not
        let notificationContainer = document.querySelector('.notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
            
            // Add styles for notifications
            const style = document.createElement('style');
            style.textContent = `
                .notification-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                }
                
                .notification {
                    padding: 12px 20px;
                    margin-bottom: 10px;
                    border-radius: 4px;
                    color: white;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    animation: slide-in 0.3s ease-out forwards;
                    max-width: 300px;
                }
                
                .notification.info {
                    background-color: #2196F3;
                }
                
                .notification.success {
                    background-color: #4CAF50;
                }
                
                .notification.error {
                    background-color: #F44336;
                }
                
                .notification.warning {
                    background-color: #FF9800;
                }
                
                .notification i {
                    margin-right: 10px;
                }
                
                @keyframes slide-in {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes fade-out {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Add icon based on type
        let icon = 'fa-info-circle';
        if (type === 'success') icon = 'fa-check-circle';
        if (type === 'error') icon = 'fa-exclamation-circle';
        if (type === 'warning') icon = 'fa-exclamation-triangle';
        
        notification.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
        
        // Add to container
        notificationContainer.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'fade-out 0.3s ease-out forwards';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    };
    
    // Public API
    return {
        init: function() {
            init();
        },
        
        showGreenSpaceDetails: function(id) {
            showGreenSpaceDetails(id);
        },
        
        hideGreenSpaceDetails: function() {
            hideGreenSpaceDetails();
        },
        
        showNotification: function(message, type) {
            showNotification(message, type);
        },
        
        applyFilters: function() {
            applyFilters();
        },
        
        resetFilters: function() {
            resetFilters();
        },
        
        findNearestGreenSpace: function() {
            findNearestGreenSpace();
        }
    };
})();
