import React from 'react';
import { GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { Feature, GeoJsonObject } from 'geojson';
import { primaryColors } from '@/styles/colors';

interface GeoJsonLayerProps {
  geoJsonData: GeoJsonObject;
  countryProjectCounts: Record<string, number>;
  selectedCountry: string | null;
  hoveredCountry: string | null;
  setHoveredCountry: (country: string | null) => void;
  setSelectedCountry: (country: string | null) => void;
  fetchProjectsForCountry: (country: string) => void;
  colorScaleThresholds: number[];
}

const GeoJsonLayer: React.FC<GeoJsonLayerProps> = ({
  geoJsonData,
  countryProjectCounts,
  selectedCountry,
  hoveredCountry,
  setHoveredCountry,
  setSelectedCountry,
  fetchProjectsForCountry,
  colorScaleThresholds
}) => {
  // Get color based on project count using dynamic thresholds
  const getCountryColor = (countryName: string) => {
    let count = countryProjectCounts[countryName] || 0;
    
    // Special handling for United States
    if (countryName === 'United States of America' || countryName === 'United States') {
      count = countryProjectCounts['United States'] || 
              countryProjectCounts['USA'] || 
              countryProjectCounts['United States of America'] || 0;
      
      if (count > 0) {
        console.log(`Using special count for US color: ${count}`);
      }
    }
    
    // No projects case - light grey fill
    if (count === 0) return '#F5F5F5';
    
    // If we have no thresholds yet, use the default scale
    if (colorScaleThresholds.length === 0) {
      if (count === 1) return primaryColors[200];
      if (count <= 3) return primaryColors[300];
      if (count <= 5) return primaryColors[400];
      if (count <= 10) return primaryColors[500];
      if (count <= 20) return primaryColors[600];
      return primaryColors[700];
    }
    
    // Use dynamic thresholds for coloring
    const colorKeys = [200, 300, 400, 500, 600, 700] as const;
    
    // Find the appropriate threshold index
    for (let i = 0; i < colorScaleThresholds.length; i++) {
      if (count <= colorScaleThresholds[i]) {
        // Use corresponding color from the palette
        const colorKey = colorKeys[Math.min(i, colorKeys.length - 1)];
        return primaryColors[colorKey];
      }
    }
    
    // Default to darkest color if above all thresholds
    return primaryColors[700];
  };

  // Style function for GeoJSON
  const countryStyle = (feature: Feature | undefined) => {
    if (!feature || !feature.properties) return {};
    
    const countryName = feature.properties.name as string;
    const isSelected = selectedCountry === countryName;
    
    // Only apply hover effects when no country is selected
    // This prevents the map from rerendering on hover when a country is selected
    const isHovered = selectedCountry ? false : hoveredCountry === countryName;
    
    return {
      fillColor: getCountryColor(countryName),
      weight: isSelected ? 2 : isHovered ? 1.5 : 1,
      opacity: 1,
      color: isSelected ? '#333' : isHovered ? '#666' : '#ccc',
      dashArray: '', // Solid lines for all countries
      fillOpacity: isSelected ? 0.7 : isHovered ? 0.6 : 0.5
    };
  };

  // Event handlers for GeoJSON features
  const onEachCountry = (feature: Feature, layer: L.Layer) => {
    // Get country name from properties
    const countryName = feature.properties?.name as string;
    
    // Special handling for United States
    let projectCount = 0;
    
    if (countryName === 'United States of America' || countryName === 'United States') {
      // Check for US projects using various possible names
      projectCount = countryProjectCounts['United States'] || 
                    countryProjectCounts['USA'] || 
                    countryProjectCounts['United States of America'] || 0;
    } else {
      // For other countries, use the standard lookup
      projectCount = countryProjectCounts[countryName] || 0;
    }
    
    // Add tooltip
    layer.bindTooltip(`${countryName}: ${projectCount} project${projectCount !== 1 ? 's' : ''}`);
    
    // Add event handlers
    layer.on({
      mouseover: () => {
        // Only set hover state if no country is selected
        if (!selectedCountry) {
          setHoveredCountry(countryName);
        }
      },
      mouseout: () => {
        // Only clear hover state if no country is selected
        if (!selectedCountry) {
          setHoveredCountry(null);
        }
      },
      click: () => {
        console.log(`Clicked on country: ${countryName}`);
        
        // Toggle selection - if already selected, deselect it
        if (selectedCountry === countryName) {
          console.log(`Deselecting country: ${countryName}`);
          setSelectedCountry(null);
          // Reset hover state
          setHoveredCountry(null);
          
          // Remove active class from all countries
          document.querySelectorAll('.leaflet-interactive').forEach(el => {
            el.classList.remove('country-active');
          });
        } else {
          console.log(`Selecting country: ${countryName}`);
          // Clear hover state when selecting a country
          setHoveredCountry(null);
          
          // Add active class to the selected country first, before changing state
          // For Path layers in Leaflet, we need to find the SVG element
          if (layer instanceof L.Path) {
            // Remove active class from all countries first
            document.querySelectorAll('.leaflet-interactive').forEach(el => {
              el.classList.remove('country-active');
            });
            
            const pathElement = layer.getElement();
            if (pathElement) {
              pathElement.classList.add('country-active');
            }
          }
          
          // Use a small timeout to ensure the DOM updates before changing state
          // This helps prevent the flash zoom issue on first click
          setTimeout(() => {
            setSelectedCountry(countryName);
            
            // Special handling for United States
            if (countryName === 'United States of America' || countryName === 'United States') {
              // Force fetch for US regardless of displayed count
              console.log(`Special handling for US click, forcing fetch`);
              fetchProjectsForCountry(countryName);
            } else if (projectCount > 0) {
              // Only fetch projects if there are any for this country
              console.log(`Country ${countryName} has ${projectCount} projects, fetching...`);
              // Fetch projects for this country when selected
              fetchProjectsForCountry(countryName);
            } else {
              console.log(`Country ${countryName} has no projects, skipping fetch`);
            }
          }, 50);
        }
      }
    });
    
    // If this country is already selected, add the active class
    if (selectedCountry === countryName) {
      // For Path layers in Leaflet, we need to find the SVG element
      if (layer instanceof L.Path) {
        const pathElement = layer.getElement();
        if (pathElement) {
          pathElement.classList.add('country-active');
        }
      }
    }
  };

  return (
    <GeoJSON 
      key={`world-geojson-${JSON.stringify(countryProjectCounts)}-${selectedCountry || 'none'}`}
      data={geoJsonData} 
      style={countryStyle} 
      onEachFeature={onEachCountry}
    />
  );
};

export default GeoJsonLayer; 