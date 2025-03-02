import { useState, useEffect } from 'react';

interface UseMapResponsivenessResult {
    isMobile: boolean;
    defaultZoom: number;
    countryZoom: number;
    legendVisible: boolean;
    toggleLegend: () => void;
}

export const useMapResponsiveness = (): UseMapResponsivenessResult => {
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [defaultZoom, setDefaultZoom] = useState<number>(2.3);
    const [countryZoom, setCountryZoom] = useState<number>(3.5);
    const [legendVisible, setLegendVisible] = useState<boolean>(true);

    // Detect mobile devices and adjust zoom levels
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);

            // Adjust zoom levels based on screen size
            if (mobile) {
                setDefaultZoom(1.8); // Zoomed out more on mobile
                setCountryZoom(3.0); // Less zoom when selecting a country on mobile
                setLegendVisible(false); // Hide legend by default on mobile
            } else {
                setDefaultZoom(2.3); // Default zoom for desktop
                setCountryZoom(3.5); // Default country zoom for desktop
                setLegendVisible(true); // Always show legend on desktop
            }
        };

        // Check on initial load
        checkMobile();

        // Add resize listener
        window.addEventListener('resize', checkMobile);

        // Clean up
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Toggle legend visibility
    const toggleLegend = () => {
        setLegendVisible(prev => !prev);
    };

    return {
        isMobile,
        defaultZoom,
        countryZoom,
        legendVisible,
        toggleLegend
    };
}; 