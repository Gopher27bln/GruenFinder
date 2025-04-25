/**
 * GrünFinder Main Application
 * Initializes and coordinates all components
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI components
    UIService.init();
    
    // Initialize map
    MapService.init();
    
    // Set up custom icon management
    setupIconManagement();
    
    // Show welcome message
    setTimeout(() => {
        UIService.showNotification('Willkommen bei GrünFinder! Entdecke Berlins Grünflächen.', 'info');
    }, 1000);
    
    // Create data directory if it doesn't exist
    createDataDirectory();
});

/**
 * Set up custom icon management functionality
 */
function setupIconManagement() {
    // This function allows users to register custom icons programmatically
    // Example usage:
    //
    // GrünFinder.registerCustomIcon('playground', 'assets/icons/custom-playground.svg');
    //
    // This will register a custom icon for the 'playground' type
    
    // Create global object for public API
    window.GrünFinder = window.GrünFinder || {};
    
    // Add method to register custom icons
    window.GrünFinder.registerCustomIcon = function(type, iconPath) {
        if (!type || !iconPath) {
            console.error('Sowohl type als auch iconPath werden benötigt, um ein benutzerdefiniertes Icon zu registrieren');
            return false;
        }
        
        // Register the icon with the IconService
        IconService.registerIcon(type, iconPath);
        
        // Refresh the map if it's already initialized
        if (MapService && typeof MapService.renderGreenSpaces === 'function') {
            const greenSpaces = DataService.getFilteredGreenSpaces();
            MapService.renderGreenSpaces(greenSpaces);
        }
        
        return true;
    };
    
    // Add method to get all available icon types
    window.GrünFinder.getIconTypes = function() {
        return IconService.getIconTypes();
    };
}

/**
 * Create data directory and sample data file if they don't exist
 */
function createDataDirectory() {
    // In a real application, this would be handled by the server
    // For this client-side only demo, we'll check if the data file exists
    // and create it if it doesn't
    
    fetch('data/green_spaces.json')
        .catch(() => {
            // If the file doesn't exist, create the directory and file
            console.log('Beispieldatendatei wird erstellt...');
            
            // This would normally be a server-side operation
            // For demo purposes, we're just logging this
            console.log('Beispieldaten werden vom DataService-Modul generiert');
        });
}
