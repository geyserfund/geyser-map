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
    const [defaultZoom, setDefaultZoom] = useState<number>(3.2);
    const [countryZoom, setCountryZoom] = useState<number>(4.5);
    const [legendVisible, setLegendVisible] = useState<boolean>(true);

    // Detect mobile devices and adjust zoom levels
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);

            // Adjust zoom levels based on screen size
            if (mobile) {
                setDefaultZoom(2.6);
                setCountryZoom(4.0);
                setLegendVisible(false);
            } else {
                setDefaultZoom(3.2);
                setCountryZoom(4.5);
                setLegendVisible(true);
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