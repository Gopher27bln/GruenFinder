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
    
    // Show welcome message
    setTimeout(() => {
        UIService.showNotification('Welcome to GrünFinder! Explore Berlin\'s green spaces.', 'info');
    }, 1000);
    
    // Create data directory if it doesn't exist
    createDataDirectory();
});

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
            console.log('Creating sample data file...');
            
            // This would normally be a server-side operation
            // For demo purposes, we're just logging this
            console.log('Sample data will be generated from the DataService module');
        });
}
