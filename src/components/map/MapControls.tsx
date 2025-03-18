import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface SetMapViewProps {
  center: [number, number];
  zoom: number;
}

// Component to set the map view
export const SetMapView: React.FC<SetMapViewProps> = ({ center, zoom }) => {
  const map = useMap();
  const prevCenterRef = useRef<[number, number] | null>(null);
  const prevZoomRef = useRef<number | null>(null);
  const viewSetRef = useRef<boolean>(false);
  const initialRenderRef = useRef<boolean>(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Set the initial view only once
  useEffect(() => {
    if (initialRenderRef.current) {
      console.log(`Initial map view set to center: [${center[0]}, ${center[1]}], zoom: ${zoom}`);
      map.setView(center, zoom, { animate: false });
      initialRenderRef.current = false;
      prevCenterRef.current = center;
      prevZoomRef.current = zoom;
      viewSetRef.current = true;
    }
  }, [map, center, zoom]);
  
  // Track changes to center and zoom
  useEffect(() => {
    // Skip the initial render since we handle it separately
    if (initialRenderRef.current) return;
    
    // Only update view when there's a very significant change
    // We're making this more strict to avoid unnecessary view updates
    const isSignificantChange = 
      (prevCenterRef.current && 
       (Math.abs(prevCenterRef.current[0] - center[0]) > 20 || 
        Math.abs(prevCenterRef.current[1] - center[1]) > 20)) ||
      (prevZoomRef.current && Math.abs(prevZoomRef.current - zoom) > 1.5);
    
    if (isSignificantChange) {
      console.log(`Significant change detected: [${center[0]}, ${center[1]}], zoom: ${zoom}`);
      prevCenterRef.current = center;
      prevZoomRef.current = zoom;
      viewSetRef.current = false;
      
      // Clear any existing timeout to prevent race conditions
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [center, zoom]);
  
  // Set the map view when needed
  useEffect(() => {
    // Skip the initial render since we handle it separately
    if (initialRenderRef.current) return;
    
    if (!viewSetRef.current && prevCenterRef.current && prevZoomRef.current) {
      console.log(`Updating map view to center: [${center[0]}, ${center[1]}], zoom: ${zoom}`);
      
      // Disable interactions temporarily
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.keyboard.disable();
      map.dragging.disable();
      
      // Set the view with animation for better user experience
      map.setView(center, zoom, { animate: true, duration: 0.5 });
      
      // Mark that we've set the view for this center/zoom combination
      viewSetRef.current = true;
      
      // Re-enable interactions after a short delay
      timeoutRef.current = setTimeout(() => {
        console.log('Re-enabling map interactions');
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
        map.keyboard.enable();
        map.dragging.enable();
        
        // Force a redraw of the map
        map.invalidateSize();
        
        timeoutRef.current = null;
      }, 600);
    }
    
    // Clean up timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Ensure map controls are enabled when component unmounts
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.keyboard.enable();
      map.dragging.enable();
    };
  }, [map, center, zoom]);
  
  // Add an effect to ensure controls are re-enabled if the component stays mounted
  // but the view doesn't change for a while
  useEffect(() => {
    const ensureControlsEnabled = () => {
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.keyboard.enable();
      map.dragging.enable();
    };
    
    // Set a backup timeout to ensure controls are re-enabled
    const backupTimeout = setTimeout(ensureControlsEnabled, 2000);
    
    return () => {
      clearTimeout(backupTimeout);
    };
  }, [map]);
  
  return null;
};

// Component to center the map on initial load
interface CenterMapProps {
  bounds?: L.LatLngBoundsExpression;
}

export const CenterMap: React.FC<CenterMapProps> = ({ bounds }) => {
  const map = useMap();
  const centeredRef = useRef(false);
  
  useEffect(() => {
    if (!centeredRef.current && bounds) {
      console.log('Centering map on initial load');
      
      // Fit the map to the bounds
      map.fitBounds(bounds);
      
      // Mark that we've centered the map
      centeredRef.current = true;
      
      // Force a redraw after a short delay
      setTimeout(() => {
        map.invalidateSize();
        
        // Ensure controls are enabled
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
        map.keyboard.enable();
        map.dragging.enable();
      }, 100);
    }
  }, [map, bounds]);
  
  return null;
};

// Component to enforce map boundaries
interface BoundsControllerProps {
  maxBounds: L.LatLngBoundsExpression;
}

export const BoundsController: React.FC<BoundsControllerProps> = ({ maxBounds }) => {
  const map = useMap();
  
  useEffect(() => {
    if (maxBounds) {
      map.setMaxBounds(maxBounds);
      map.on('drag', () => {
        map.panInsideBounds(maxBounds, { animate: false });
      });
    }
    
    return () => {
      map.off('drag');
    };
  }, [map, maxBounds]);
  
  return null;
}; 