import React, { useRef } from 'react';
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
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

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
    // Get the country name from the feature properties
    const countryName = feature.properties?.name;
    
    if (!countryName) return;
    
    // Get the project count for this country
    let projectCount = 0;
    
    // Special handling for United States (may appear with different names)
    if (
        countryName === 'United States of America' ||
        countryName === 'United States' ||
        countryName === 'USA'
    ) {
        // Check for US projects using various possible names
        projectCount = countryProjectCounts['United States'] || 
                      countryProjectCounts['USA'] || 
                      countryProjectCounts['United States of America'] || 0;
    } else {
        // For other countries, use the standard lookup
        projectCount = countryProjectCounts[countryName] || 0;
    }
    
    // Bind tooltip to show country name and project count
    layer.bindTooltip(
        `<div class="country-tooltip">
            <strong>${countryName}</strong>
            ${projectCount > 0 ? `<div>${projectCount} project${projectCount !== 1 ? 's' : ''}</div>` : ''}
        </div>`,
        { sticky: true }
    );
    
    // Add event handlers for mouse interactions
    layer.on({
        mouseover: (e) => {
            // Don't apply hover effect if a country is already selected
            if (!selectedCountry) {
                const layer = e.target;
                layer.setStyle({
                    weight: 2,
                    color: '#666',
                    dashArray: '',
                    fillOpacity: 0.7
                });
                
                if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                    layer.bringToFront();
                }
                
                // Update hovered country state
                setHoveredCountry(countryName);
            }
        },
        mouseout: (e) => {
            // Only reset style if this country is not selected
            if (!selectedCountry || selectedCountry !== countryName) {
                // Reset the style using GeoJSON's resetStyle method
                const geoJsonLayer = e.target._eventParent || e.target;
                if (geoJsonLayer && typeof geoJsonLayer.resetStyle === 'function') {
                    geoJsonLayer.resetStyle(e.target);
                }
                
                // Clear hovered state
                setHoveredCountry(null);
            }
        },
        click: (e) => {
            // Stop propagation to prevent map click from interfering
            e.originalEvent.stopPropagation();
            
            const layer = e.target;
            const isAlreadySelected = selectedCountry === countryName;
            
            // Clear any hover states first
            document.querySelectorAll('.leaflet-interactive').forEach(el => {
                el.classList.remove('hover');
            });
            
            if (isAlreadySelected) {
                // If already selected, deselect it
                console.log(`Deselecting country: ${countryName}`);
                
                // Deselect the country
                setSelectedCountry(null);
                
                // Remove active class from all countries
                document.querySelectorAll('.leaflet-interactive').forEach(el => {
                    el.classList.remove('active');
                    el.classList.remove('country-active');
                });
                
                // Reset the style
                const geoJsonLayer = layer._eventParent || layer;
                if (geoJsonLayer && typeof geoJsonLayer.resetStyle === 'function') {
                    geoJsonLayer.resetStyle(layer);
                }
                
                // Reset the map view to show all countries
                const map = layer._map;
                if (map) {
                    // First re-enable all map controls to ensure zoom works
                    map.touchZoom.enable();
                    map.doubleClickZoom.enable();
                    map.scrollWheelZoom.enable();
                    map.keyboard.enable();
                    map.dragging.enable();
                    
                    // Then reset the view with animation
                    console.log('Resetting map view to world view');
                    map.setView([20, 0], 2, {
                        animate: true,
                        duration: 1
                    });
                    
                    // Force a redraw after a short delay
                    setTimeout(() => {
                        map.invalidateSize();
                    }, 100);
                }
                
                // Remove country-selected class from the map container
                const mapContainer = document.querySelector('.map-container');
                if (mapContainer) {
                    mapContainer.classList.remove('country-selected');
                }
            } else {
                // If not selected, select it
                console.log(`Selecting country: ${countryName}`);
                
                // Remove active class from all countries first
                document.querySelectorAll('.leaflet-interactive').forEach(el => {
                    el.classList.remove('active');
                    el.classList.remove('country-active');
                });
                
                // Add active class to the selected country
                setTimeout(() => {
                    const path = layer.getElement();
                    if (path) {
                        path.classList.add('active');
                        path.classList.add('country-active');
                    }
                }, 0);
                
                // Set the selected country immediately to open the sidebar
                setSelectedCountry(countryName);
                
                // Fetch projects for this country if it has projects or is the US
                // (US always has projects even if count is 0 due to data inconsistencies)
                if (projectCount > 0 || countryName === 'United States of America' || countryName === 'United States' || countryName === 'USA') {
                    // Use a small timeout to ensure state is updated before fetching
                    setTimeout(() => {
                        fetchProjectsForCountry(countryName);
                    }, 50);
                }
                
                // Zoom to the country bounds
                const bounds = layer.getBounds();
                const map = layer._map;
                if (bounds && map) {
                    map.fitBounds(bounds, {
                        padding: [50, 50],
                        maxZoom: 6
                    });
                }
            }
            
            // Add country-selected class to the map container for mobile styling
            const mapContainer = document.querySelector('.map-container');
            if (mapContainer) {
                if (isAlreadySelected) {
                    mapContainer.classList.remove('country-selected');
                } else {
                    mapContainer.classList.add('country-selected');
                }
            }
        }
    });
  };

  return (
    <GeoJSON 
      key={`world-geojson-${JSON.stringify(countryProjectCounts)}-${selectedCountry || 'none'}`}
      data={geoJsonData} 
      style={countryStyle} 
      onEachFeature={onEachCountry}
      ref={(ref) => {
        geoJsonRef.current = ref;
      }}
    />
  );
};

export default GeoJsonLayer; 