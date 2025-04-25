/**
 * GrünFinder Icons Module
 * Manages custom icons for the application
 */

const IconService = (() => {
    // Map of icon types to their file paths
    const iconMap = {
        // Default icons (SVG files)
        bbq_area: 'assets/icons/bbq.svg',
        forest: 'assets/icons/forest.svg',
        park: 'assets/icons/park.svg',
        
        // Fallback to Font Awesome icons for types without custom SVG
        garden: null,
        playground: null,
        cemetery: null,
        meadow: null,
        other: null
    };
    
    // Log available icons for debugging
    console.log('IconService initialized with icons:', iconMap);
    
    // Cache for loaded SVG content
    const svgCache = {};
    
    /**
     * Preload all SVG icons to ensure they're available when needed
     */
    const preloadIcons = async () => {
        console.log('Preloading SVG icons...');
        const preloadPromises = [];
        
        for (const [type, path] of Object.entries(iconMap)) {
            if (path) {
                preloadPromises.push(loadSvgIcon(path).then(content => {
                    if (content) {
                        console.log(`Successfully preloaded icon for ${type}`);
                    } else {
                        console.error(`Failed to preload icon for ${type}`);
                    }
                }));
            }
        }
        
        await Promise.all(preloadPromises);
        console.log('Finished preloading SVG icons');
    };
    
    /**
     * Load an SVG icon from the given path
     */
    const loadSvgIcon = async (path) => {
        // Check cache first
        if (svgCache[path]) {
            console.log(`Using cached SVG for ${path}`);
            return svgCache[path];
        }
        
        try {
            console.log(`Attempting to load SVG icon from ${path}`);
            // Use a timestamp to prevent caching
            const timestamp = new Date().getTime();
            const response = await fetch(`${path}?t=${timestamp}`, { 
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                console.error(`Failed to load SVG icon from ${path}: ${response.status} ${response.statusText}`);
                return null;
            }
            
            const svgText = await response.text();
            console.log(`Successfully loaded SVG icon from ${path}, content length: ${svgText.length}`);
            
            // Validate SVG content
            if (!svgText.includes('<svg') || !svgText.includes('</svg>')) {
                console.error(`Invalid SVG content from ${path}`);
                return null;
            }
            
            svgCache[path] = svgText;
            return svgText;
        } catch (error) {
            console.error(`Error loading SVG icon from ${path}:`, error);
            return null;
        }
    };
    
    /**
     * Create an icon element for a specific green space type
     */
    const createIconElement = async (type) => {
        const iconPath = iconMap[type];
        const typeColor = CONFIG.greenSpaceTypes[type]?.color || '#4CAF50';
        
        // Create container element
        const el = document.createElement('div');
        el.className = `marker-icon ${type}`;
        
        if (iconPath) {
            console.log(`Creating icon for ${type} using SVG path: ${iconPath}`);
            // Try to load custom SVG icon
            const svgContent = await loadSvgIcon(iconPath);
            
            if (svgContent) {
                // Use custom SVG icon
                el.innerHTML = svgContent;
                el.classList.add('svg-icon');
                
                // Apply type-specific styling to SVG
                const svgElement = el.querySelector('svg');
                if (svgElement) {
                    // Ensure SVG fills the container
                    svgElement.setAttribute('width', '100%');
                    svgElement.setAttribute('height', '100%');
                    svgElement.style.display = 'block';
                    
                    // For park and forest types, apply specific styling
                    if (type === 'park') {
                        // Find and style the main elements of the park SVG
                        const pathElements = svgElement.querySelectorAll('path');
                        const rectElements = svgElement.querySelectorAll('rect');
                        
                        // Apply color to all path elements
                        pathElements.forEach(path => {
                            if (path.getAttribute('style')?.includes('fill:#')) {
                                // If the path already has a fill style, modify it
                                const style = path.getAttribute('style');
                                path.setAttribute('style', style.replace(/fill:#[0-9a-fA-F]+/, `fill:${typeColor}`));
                            } else {
                                // Otherwise add the fill directly
                                path.setAttribute('fill', typeColor);
                            }
                        });
                        
                        console.log(`Applied park-specific styling to SVG paths`);
                    } else if (type === 'forest') {
                        // Apply forest-specific styling
                        svgElement.style.fill = typeColor;
                    } else if (type === 'bbq_area') {
                        // BBQ areas already have styling in the SVG
                        el.style.backgroundColor = '#FFECB3';
                        el.style.border = `2px solid ${typeColor}`;
                    }
                }
                
                console.log(`Successfully created SVG icon for ${type}`);
                return el;
            } else {
                console.log(`Failed to load SVG for ${type}, falling back to Font Awesome`);
            }
        } else {
            console.log(`No SVG path defined for ${type}, using Font Awesome icon`);
        }
        
        // Fallback to Font Awesome icons
        if (type === 'bbq_area') {
            el.innerHTML = '<i class="fas fa-fire"></i>';
            el.style.backgroundColor = '#FFECB3';
            el.style.border = `2px solid ${typeColor}`;
        } else {
            el.innerHTML = '<i class="fas fa-tree"></i>';
            el.querySelector('i').style.color = typeColor;
        }
        
        return el;
    };
    
    /**
     * Register a custom icon for a specific type
     */
    const registerIcon = (type, path) => {
        iconMap[type] = path;
        // Clear cache for this type if it exists
        if (svgCache[iconMap[type]]) {
            delete svgCache[iconMap[type]];
        }
        console.log(`Registered custom icon for ${type}: ${path}`);
    };
    
    /**
     * Get all registered icon types
     */
    const getIconTypes = () => {
        return Object.keys(iconMap);
    };
    
    // Preload icons when the service is initialized
    setTimeout(() => {
        preloadIcons();
    }, 500);
    
    // Public API
    return {
        createIconElement,
        registerIcon,
        getIconTypes,
        preloadIcons
    };
})();
