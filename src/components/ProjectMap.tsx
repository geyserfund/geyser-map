import React, { useState } from 'react';
import { MapContainer } from 'react-leaflet';
import { Project, ProjectCategory, ProjectSubCategory } from '@/types/project';
import { GeoJsonObject } from 'geojson';

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
import MapTitle from './map/MapTitle';

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
  const defaultPosition: [number, number] = [25, 0];
  
  // State for hover and selection
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  
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
  
  // Use projects by country hook
  const { 
    countryProjects, 
    isLoadingProjects, 
    hasMoreProjects, 
    fetchProjectsForCountry, 
    loadMoreProjects 
  } = useProjectsByCountry(
    selectedCountry, 
    countryCodeMap, 
    selectedCategory, 
    selectedSubCategory || null, 
    showInactive,
    // Pass the country data directly instead of trying to access result property
    { projectCountriesGet: Object.entries(countryProjectCounts).map(([name, count]) => ({
      country: { name, code: Object.keys(countryCodeMap).find(code => countryCodeMap[code] === name) || '' },
      count
    })) }
  );
  
  // Generate legend items
  const legendItems = generateLegendItems(colorScaleThresholds, maxProjectCount);

  return (
    <div className="map-container">
      {/* Map Title */}
      <MapTitle />
      
      <MapContainer
        center={defaultPosition}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%', backgroundColor: '#f8f9fa' }}
        minZoom={isMobile ? 1 : 2}
        maxBounds={[[-60, -180], [85, 180]]}
        maxBoundsViscosity={1.0}
        worldCopyJump={false}
        zoomControl={!isMobile} // Hide zoom controls on mobile
        className={selectedCountry ? 'country-selected' : ''}
      >
        {/* Add bounds controller to enforce map boundaries */}
        <BoundsController />
        
        {/* Ensure map is centered on initial load */}
        <CenterMap center={defaultPosition} zoom={defaultZoom} />
        
        {/* Render world countries */}
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
        
        {/* Update map view when selected country changes, but only once */}
        {selectedCountry && (
          <SetMapView 
            center={getSelectedCountryCoordinates(selectedCountry, countryCodeMap, defaultPosition)} 
            zoom={countryZoom}
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
      />
    </div>
  );
};

export default ProjectMap; 