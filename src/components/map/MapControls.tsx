import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface SetMapViewProps {
  center: [number, number];
  zoom: number;
}

// Component to set the map view
export const SetMapView: React.FC<SetMapViewProps> = ({ center, zoom }) => {
  const map = useMap();
  
  // Use refs to track if we've already set the view for this center/zoom
  const hasSetViewRef = React.useRef(false);
  const centerRef = React.useRef<[number, number]>(center);
  const zoomRef = React.useRef<number>(zoom);
  const isInitialRender = React.useRef(true);
  
  // Only update the view when the center or zoom actually changes
  useEffect(() => {
    // Check if the center or zoom has actually changed
    const isSameCenter = centerRef.current[0] === center[0] && centerRef.current[1] === center[1];
    const isSameZoom = zoomRef.current === zoom;
    
    if (!isSameCenter || !isSameZoom || isInitialRender.current) {
      // Center or zoom has changed, update the refs and reset the view flag
      centerRef.current = center;
      zoomRef.current = zoom;
      hasSetViewRef.current = false;
      isInitialRender.current = false;
    }
  }, [center, zoom]);
  
  useEffect(() => {
    // Only set the view once per center/zoom change
    if (!hasSetViewRef.current) {
      console.log('Setting map view to:', center, zoom);
      
      // Mark as set immediately to prevent multiple calls
      hasSetViewRef.current = true;
      
      // Use a small timeout to ensure the map is ready
      setTimeout(() => {
        // First stop any ongoing animations
        map.stop();
        
        // Disable map interactions temporarily
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.keyboard.disable();
        
        // Use setView with minimal animation options
        map.setView(center, zoom, {
          animate: false,
          duration: 0
        });
        
        // Re-enable map interactions after a short delay
        setTimeout(() => {
          map.dragging.enable();
          map.touchZoom.enable();
          map.doubleClickZoom.enable();
          map.scrollWheelZoom.enable();
          map.keyboard.enable();
          
          // Force a redraw to ensure everything is displayed correctly
          map.invalidateSize();
        }, 150);
      }, 50);
    }
  }, [center, zoom, map]);
  
  return null;
};

// Component to center the map on initial load
interface CenterMapProps {
  center: [number, number];
  zoom: number;
}

export const CenterMap: React.FC<CenterMapProps> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    // Center the map on initial load
    map.setView(center, zoom);
    
    // Fit the map to ensure all content is visible
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [center, zoom, map]);
  
  return null;
};

// Component to enforce map boundaries
export const BoundsController: React.FC = () => {
  const map = useMap();
  
  useEffect(() => {
    // Ensure the map stays within bounds
    const enforceMapBounds = () => {
      const bounds = map.getBounds();
      const maxBounds = map.options.maxBounds as L.LatLngBounds | undefined;
      
      if (maxBounds && !maxBounds.contains(bounds)) {
        map.panInsideBounds(maxBounds, { animate: false });
      }
    };
    
    // Add event listeners
    map.on('drag', enforceMapBounds);
    map.on('zoomend', enforceMapBounds);
    
    return () => {
      // Clean up event listeners
      map.off('drag', enforceMapBounds);
      map.off('zoomend', enforceMapBounds);
    };
  }, [map]);
  
  return null;
}; 