import React, { useState, useRef, useEffect } from 'react';
import { MapContainer } from 'react-leaflet';
import { Project, ProjectCategory, ProjectSubCategory } from '@/types/project';
import { GeoJsonObject } from 'geojson';
import L from 'leaflet';

// Import custom hooks
import { useCountryData } from '@/hooks/useCountryData';
import { useProjectsByCountry } from '@/hooks/useProjectsByCountry';
import { useMapResponsiveness } from '@/hooks/useMapResponsiveness';
import { useWorldGeoJSON } from '@/hooks/useWorldGeoJSON';

// Import sub-components
import { BoundsController, CenterMap, SetMapView } from './map/MapControls';
import GeoJsonLayer from './map/GeoJsonLayer';
import MapLegend, { generateLegendItems } from './map/MapLegend';
import ProjectSidebar from './map/ProjectSidebar';

// Import utilities
import { getSelectedCountryCoordinates } from '@/utils/countryUtils';

interface ProjectMapProps {
  projects?: Project[];
  selectedCategory: ProjectCategory | null;
  selectedSubCategory?: ProjectSubCategory | null;
  showInactive: boolean;
}

const ProjectMap: React.FC<ProjectMapProps> = ({ 
  selectedCategory, 
  selectedSubCategory,
  showInactive 
}) => {
  // Default center position (centered on the world)
  const defaultPosition: [number, number] = [10, 0];
  
  // State for hover and selection
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  
  // Reference to the map container
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Use custom hooks
  const { isMobile, defaultZoom, countryZoom, legendVisible, toggleLegend } = useMapResponsiveness();
  const { worldGeoJSON, countryCodeMap: geoJsonCountryCodeMap } = useWorldGeoJSON();
  const { 
    countryProjectCounts, 
    countryCodeMap: apiCountryCodeMap, 
    maxProjectCount, 
    colorScaleThresholds,
    countryDataLoading,
  } = useCountryData(selectedCategory, selectedSubCategory || null);
  
  // Merge country code maps from GeoJSON and API
  const countryCodeMap = { ...geoJsonCountryCodeMap, ...apiCountryCodeMap };
  
  // Prepare country data for the hook
  const countryData = {
    projectCountriesGet: Object.entries(countryProjectCounts).map(([name, count]) => ({
      country: { 
        name, 
        code: Object.keys(countryCodeMap).find(code => countryCodeMap[code] === name) || '' 
      },
      count
    }))
  };
  
  // Use projects by country hook
  const { 
    countryProjects, 
    isLoadingProjects, 
    hasMoreProjects, 
    fetchProjectsForCountry, 
    loadMoreProjects 
  } = useProjectsByCountry(
    selectedCountry,
    selectedCategory,
    selectedSubCategory || null, 
    showInactive,
    countryData
  );
  
  // Generate legend items
  const legendItems = generateLegendItems(colorScaleThresholds, maxProjectCount);

  // Function to handle deselecting a country and resetting the map view
  const handleDeselectCountry = () => {
    // Deselect the country
    setSelectedCountry(null);
    
    // Reset the map view
    setTimeout(() => {
      // Find the Leaflet map instance
      const container = document.querySelector('.leaflet-container');
      if (!container) return;
      
      // Get the Leaflet map instance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const leafletMap = (container as any)._leaflet_map as L.Map;
      if (!leafletMap) return;
      
      // Re-enable all map controls
      leafletMap.touchZoom.enable();
      leafletMap.doubleClickZoom.enable();
      leafletMap.scrollWheelZoom.enable();
      leafletMap.keyboard.enable();
      leafletMap.dragging.enable();
      
      // Reset the view with animation
      leafletMap.setView(defaultPosition, defaultZoom, {
        animate: true,
        duration: 1
      });
      
      // Force a redraw
      setTimeout(() => {
        leafletMap.invalidateSize();
      }, 100);
      
      // Remove active class from all countries
      document.querySelectorAll('.leaflet-interactive').forEach(el => {
        el.classList.remove('active');
      });
      
      // Remove country-selected class from map container
      const mapContainer = document.querySelector('.map-container');
      if (mapContainer) {
        mapContainer.classList.remove('country-selected');
      }
    }, 50);
  };

  // Calculate map bounds from GeoJSON data
  const mapBounds = worldGeoJSON ? L.geoJSON(worldGeoJSON as GeoJsonObject).getBounds() : undefined;

  // Ensure the map is properly centered and zoomed on initial load
  useEffect(() => {
    // Force a redraw of the map after a short delay to ensure proper rendering
    const timer = setTimeout(() => {
      const container = document.querySelector('.leaflet-container');
      if (!container) return;
      
      // Get the Leaflet map instance
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const leafletMap = (container as any)._leaflet_map as L.Map;
      if (!leafletMap) return;
      
      // Force a redraw
      leafletMap.invalidateSize();
      
      // Ensure the view is set correctly
      leafletMap.setView(defaultPosition, defaultZoom, {
        animate: false
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [defaultPosition, defaultZoom]);

  return (
    <div className={`map-container ${selectedCountry ? 'country-selected' : ''}`} ref={mapContainerRef}>
      <MapContainer 
        center={defaultPosition} 
        zoom={defaultZoom} 
        scrollWheelZoom={true}
        zoomControl={false}
        attributionControl={false}
        className="map-element"
        style={{ 
          width: '100%', 
          height: '100%', 
          backgroundColor: 'var(--map-background)',
          marginTop: '10px'
        }}
      >
        {/* Map Controls */}
        <SetMapView 
          center={selectedCountry 
            ? getSelectedCountryCoordinates(selectedCountry, apiCountryCodeMap, defaultPosition) 
            : defaultPosition
          }
          zoom={selectedCountry ? countryZoom : defaultZoom}
        />
        {/* Only use CenterMap when no country is selected */}
        {!selectedCountry && <CenterMap bounds={mapBounds} />}
        <BoundsController maxBounds={[[-90, -180], [90, 180]]} />
        
        {/* GeoJSON Layer */}
        {worldGeoJSON && (
          <GeoJsonLayer 
            geoJsonData={worldGeoJSON as GeoJsonObject}
            countryProjectCounts={countryProjectCounts}
            selectedCountry={selectedCountry}
            hoveredCountry={hoveredCountry}
            setHoveredCountry={setHoveredCountry}
            setSelectedCountry={setSelectedCountry}
            fetchProjectsForCountry={fetchProjectsForCountry}
            colorScaleThresholds={colorScaleThresholds}
          />
        )}
      </MapContainer>
      
      {/* Map Legend */}
      <MapLegend 
        legendItems={legendItems}
        legendVisible={legendVisible}
        isMobile={isMobile}
        toggleLegend={toggleLegend}
        selectedCategory={selectedCategory}
        selectedSubCategory={selectedSubCategory || null}
        countryDataLoading={countryDataLoading}
      />
      
      {/* Project Sidebar */}
      <ProjectSidebar 
        selectedCountry={selectedCountry}
        countryProjects={countryProjects}
        isLoadingProjects={isLoadingProjects}
        hasMoreProjects={hasMoreProjects}
        loadMoreProjects={loadMoreProjects}
        setSelectedCountry={setSelectedCountry}
        onClose={handleDeselectCountry}
      />
    </div>
  );
};

export default ProjectMap; 