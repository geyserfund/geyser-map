import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Project, ProjectCategory, ProjectStatus, ProjectSubCategory } from '@/types/project';
import { getCountryCoordinates } from '@/utils/countryCoordinates';
import { fetchWorldCountriesGeoJSON, WorldCountriesGeoJSON } from '@/utils/worldCountries';
import { Feature, GeoJsonObject } from 'geojson';
import { useQuery, useLazyQuery } from '@apollo/client';
import { GET_PROJECT_COUNTRIES, GET_PROJECTS_BY_COUNTRY } from '@/api/queries';

interface ProjectMapProps {
  projects?: Project[];
  selectedCategory: ProjectCategory | null;
  selectedSubCategory?: ProjectSubCategory | null;
  showInactive: boolean;
}

// Component to set the map view
const SetMapView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  
  // Use a ref to track if we've already set the view for this center
  const hasSetViewRef = React.useRef(false);
  
  useEffect(() => {
    // Reset the ref when center changes
    hasSetViewRef.current = false;
  }, [center]);
  
  useEffect(() => {
    // Only set the view once per center change
    if (!hasSetViewRef.current) {
      map.setView(center, zoom);
      hasSetViewRef.current = true;
    }
  }, [center, zoom, map]);
  
  return null;
};

// Project Sidebar Component

interface CountryData {
  country: {
    code: string;
    name: string;
  };
  count: number;
}

// Helper function to format enum values to readable text
const formatEnumValue = (value: string): string => {
  if (!value) return '';
  
  return value
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper function to get project URL
const getProjectUrl = (project: Project): string => {
  // Use the project name or id for the URL
  const projectIdentifier = project.name || project.id;
  
  // Check if we're in development or production
  const baseUrl = window.location.hostname.includes('dev') 
    ? 'https://dev.geyser.fund' 
    : 'https://geyser.fund';
    
  return `${baseUrl}/project/${projectIdentifier}`;
};

const ProjectMap: React.FC<ProjectMapProps> = ({ 
  selectedCategory, 
  selectedSubCategory,
  showInactive 
}) => {
  // Default center position (world view)
  const defaultPosition: [number, number] = [20, 0];
  
  const [worldGeoJSON, setWorldGeoJSON] = useState<WorldCountriesGeoJSON | null>(null);
  const [countryProjectCounts, setCountryProjectCounts] = useState<Record<string, number>>({});
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [countryCodeMap, setCountryCodeMap] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMoreProjects, setHasMoreProjects] = useState<boolean>(false);
  const PAGE_SIZE = 4;
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(false);
  const [countryProjects, setCountryProjects] = useState<Project[]>([]);

  // Fetch country project counts with filters
  const { data: countryData, loading: countryDataLoading, refetch: refetchCountryData } = useQuery(GET_PROJECT_COUNTRIES, {
    variables: {
      input: {
        category: selectedCategory || undefined,
        subCategory: selectedSubCategory || undefined
      }
    }
  });

  // Lazy query for fetching projects by country
  const [projectsByCountryQuery] = useLazyQuery(GET_PROJECTS_BY_COUNTRY);

  // Refetch country data when filters change
  useEffect(() => {
    console.log('Filters changed, refetching country data:', {
      category: selectedCategory,
      subCategory: selectedSubCategory
    });
    
    refetchCountryData({
      input: {
        category: selectedCategory || undefined,
        subCategory: selectedSubCategory || undefined
      }
    });
  }, [selectedCategory, selectedSubCategory, refetchCountryData]);

  // Fetch the world GeoJSON data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchWorldCountriesGeoJSON();
        setWorldGeoJSON(data);
        
        // Create a mapping between country names and ISO codes
        const codeMap: Record<string, string> = {};
        
        // Debug: Check what name is used for United States in the GeoJSON
        const usFeature = data.features.find(feature => 
          feature.properties?.iso_a2 === 'US' || 
          feature.properties?.iso_a3 === 'USA'
        );
        
        if (usFeature) {
          console.log('United States in GeoJSON:', {
            name: usFeature.properties?.name,
            iso_a2: usFeature.properties?.iso_a2,
            iso_a3: usFeature.properties?.iso_a3
          });
        } else {
          console.log('United States not found in GeoJSON by ISO code');
          
          // Try to find by name
          const usByName = data.features.find(feature => 
            feature.properties?.name === 'United States' || 
            feature.properties?.name === 'United States of America' || 
            feature.properties?.name === 'USA'
          );
          
          if (usByName) {
            console.log('United States found in GeoJSON by name:', {
              name: usByName.properties?.name,
              iso_a2: usByName.properties?.iso_a2,
              iso_a3: usByName.properties?.iso_a3
            });
          } else {
            console.log('United States not found in GeoJSON at all');
          }
        }
        
        data.features.forEach(feature => {
          if (feature.properties?.name) {
            // Map country codes to country names
            if (feature.properties.iso_a2) {
              codeMap[feature.properties.iso_a2] = feature.properties.name;
            }
            if (feature.properties.iso_a3) {
              codeMap[feature.properties.iso_a3] = feature.properties.name;
            }
          }
        });
        
        // Ensure Brazil is correctly mapped
        codeMap['BR'] = 'Brazil';
        codeMap['BRA'] = 'Brazil';
        
        // Ensure US is correctly mapped
        codeMap['US'] = usFeature?.properties?.name || 'United States';
        codeMap['USA'] = usFeature?.properties?.name || 'United States';
        
        setCountryCodeMap(codeMap);
      } catch (error) {
        console.error('Error fetching world GeoJSON:', error);
      }
    };
    
    fetchData();
  }, []);

  // Update country project counts when country data is loaded
  useEffect(() => {
    if (countryData?.projectCountriesGet) {
      const counts: Record<string, number> = {};
      const codeToNameMap: Record<string, string> = {};
      
      // Log all country data for debugging
      console.log('Country data from API:', countryData.projectCountriesGet);
      
      // Check specifically for United States
      const usCountry = countryData.projectCountriesGet.find(
        (item: CountryData) => item.country.name === 'United States' || 
                              item.country.name === 'USA' || 
                              item.country.code === 'US' || 
                              item.country.code === 'USA'
      );
      console.log('United States data from API:', usCountry);
      
      countryData.projectCountriesGet.forEach((item: CountryData) => {
        const countryName = item.country.name;
        const countryCode = item.country.code;
        counts[countryName] = item.count;
        
        // Create a reverse mapping from code to name
        codeToNameMap[countryCode] = countryName;
      });
      
      // Ensure US is correctly mapped
      if (usCountry) {
        codeToNameMap['US'] = usCountry.country.name;
        codeToNameMap['USA'] = usCountry.country.name;
        
        // Special handling for United States in the counts
        // The GeoJSON might use "United States" or "United States of America"
        counts['United States of America'] = usCountry.count;
        counts['United States'] = usCountry.count;
        counts['USA'] = usCountry.count;
        
        console.log(`Added special mapping for US with count ${usCountry.count}`);
      }
      
      // Update the country code map with the API data
      setCountryCodeMap(prevMap => ({
        ...prevMap,
        ...codeToNameMap
      }));
      
      console.log('Country project counts:', counts);
      console.log('Country code to name mapping:', codeToNameMap);
      
      setCountryProjectCounts(counts);
    }
  }, [countryData]);

  // Function to fetch projects for a country
  const fetchProjectsForCountry = (countryName: string) => {
    console.log(`Fetching projects for country: ${countryName} with filters:`, {
      category: selectedCategory,
      subCategory: selectedSubCategory
    });
    
    // Special handling for United States
    let countryCode = '';
    
    if (countryName === 'United States of America' || countryName === 'United States') {
      console.log('Special handling for United States fetch');
      // Try to find US in the API data
      const usCountry = countryData?.projectCountriesGet?.find(
        (item: CountryData) => 
          item.country.name === 'United States' || 
          item.country.name === 'USA' || 
          item.country.code === 'US' || 
          item.country.code === 'USA'
      );
      
      if (usCountry) {
        countryCode = usCountry.country.code;
        console.log(`Found US country code: ${countryCode}`);
      } else {
        // Fallback to hardcoded US code
        countryCode = 'US';
        console.log(`Using fallback US country code: ${countryCode}`);
      }
    } else {
      // Find the matching country from the API data to get the country code
      const apiCountry = countryData?.projectCountriesGet?.find(
        (item: CountryData) => item.country.name === countryName
      );
      
      if (apiCountry) {
        countryCode = apiCountry.country.code;
      }
    }
    
    if (!countryCode) {
      console.error(`Could not find country code for ${countryName}`);
      return;
    }
    
    console.log(`Using country code: ${countryCode} for ${countryName}`);
    
    // Reset pagination
    setCurrentPage(1);
    setCountryProjects([]);
    
    // Set loading state
    setIsLoadingProjects(true);
    
    // Fetch projects for the selected country
    projectsByCountryQuery({
      variables: {
        input: {
          where: {
            countryCode: countryCode,
            status: showInactive ? undefined : ProjectStatus.ACTIVE,
            category: selectedCategory || undefined,
            subCategory: selectedSubCategory || undefined,
          },
          pagination: {
            take: PAGE_SIZE
          }
        }
      }
    })
    .then((response: any) => {
      console.log(`Projects fetched for ${countryName}:`, response.data?.projectsGet);
      const fetchedProjects = response.data?.projectsGet?.projects || [];
      
      // More detailed debugging for project data
      if (fetchedProjects.length > 0) {
        console.log('Sample project data (full object):', JSON.stringify(fetchedProjects[0], null, 2));
        console.log('Category type:', typeof fetchedProjects[0].category);
        console.log('Category value:', fetchedProjects[0].category);
        console.log('SubCategory type:', typeof fetchedProjects[0].subCategory);
        console.log('SubCategory value:', fetchedProjects[0].subCategory);
        
        // Check if the category and subcategory are in the expected format
        const validCategory = Object.values(ProjectCategory).includes(fetchedProjects[0].category);
        const validSubCategory = Object.values(ProjectSubCategory).includes(fetchedProjects[0].subCategory);
        
        console.log('Is category valid enum value?', validCategory);
        console.log('Is subcategory valid enum value?', validSubCategory);
        
        // Check if formatEnumValue works correctly
        if (fetchedProjects[0].category) {
          console.log('Formatted category:', formatEnumValue(fetchedProjects[0].category));
        }
        if (fetchedProjects[0].subCategory) {
          console.log('Formatted subcategory:', formatEnumValue(fetchedProjects[0].subCategory));
        }
      }
      
      setCountryProjects(fetchedProjects);
      
      // If we got exactly PAGE_SIZE projects, assume there might be more
      setHasMoreProjects(fetchedProjects.length === PAGE_SIZE);
      setIsLoadingProjects(false);
    })
    .catch((error: any) => {
      console.error(`Error fetching projects for ${countryName}:`, error);
      setIsLoadingProjects(false);
    });
  };

  // Function to load more projects
  const loadMoreProjects = () => {
    if (selectedCountry && !isLoadingProjects && countryProjects.length > 0) {
      console.log(`Loading more projects for ${selectedCountry}, page ${currentPage + 1} with filters:`, {
        category: selectedCategory,
        subCategory: selectedSubCategory
      });
      
      // Find the matching country from the API data to get the country code
      let countryCode = '';
      
      if (selectedCountry === 'United States of America' || selectedCountry === 'United States') {
        // Special handling for United States
        const usCountry = countryData?.projectCountriesGet?.find(
          (item: CountryData) => 
            item.country.name === 'United States' || 
            item.country.name === 'USA' || 
            item.country.code === 'US' || 
            item.country.code === 'USA'
        );
        
        if (usCountry) {
          countryCode = usCountry.country.code;
        } else {
          countryCode = 'US'; // Fallback
        }
      } else {
        const apiCountry = countryData?.projectCountriesGet?.find(
          (item: CountryData) => item.country.name === selectedCountry
        );
        
        if (apiCountry) {
          countryCode = apiCountry.country.code;
        }
      }
      
      if (!countryCode) {
        console.error(`Could not find country code for ${selectedCountry}`);
        return;
      }
      
      // Get the last project's ID to use as cursor
      const lastProject = countryProjects[countryProjects.length - 1];
      
      setIsLoadingProjects(true);
      
      // Fetch the next page of projects using cursor-based pagination
      projectsByCountryQuery({
        variables: {
          input: {
            where: {
              countryCode: countryCode,
              status: showInactive ? undefined : ProjectStatus.ACTIVE,
              category: selectedCategory || undefined,
              subCategory: selectedSubCategory || undefined,
            },
            pagination: {
              cursor: {
                id: lastProject.id
              },
              take: PAGE_SIZE
            }
          }
        }
      })
      .then((response: any) => {
        const newProjects = response.data?.projectsGet?.projects || [];
        console.log(`Loaded ${newProjects.length} more projects for ${selectedCountry}`);
        
        // Add new projects to existing ones
        setCountryProjects(prev => [...prev, ...newProjects]);
        setCurrentPage(prev => prev + 1);
        
        // If we got exactly PAGE_SIZE projects, assume there might be more
        setHasMoreProjects(newProjects.length === PAGE_SIZE);
        setIsLoadingProjects(false);
      })
      .catch((error: any) => {
        console.error(`Error loading more projects:`, error);
        setIsLoadingProjects(false);
      });
    }
  };

  // Get color based on project count
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
    
    if (count === 0) return '#F5F5F5';
    if (count === 1) return '#BBDEFB';
    if (count <= 3) return '#90CAF9';
    if (count <= 5) return '#64B5F6';
    if (count <= 10) return '#42A5F5';
    if (count <= 20) return '#2196F3';
    return '#1976D2';
  };

  // Style function for GeoJSON
  const countryStyle = {
    style: function(feature: any) {
      const countryName = feature?.properties?.name as string;
      const isHovered = hoveredCountry === countryName;
      const isSelected = selectedCountry === countryName;
      
      return {
        fillColor: getCountryColor(countryName),
        weight: isHovered || isSelected ? 2 : 1,
        opacity: 1,
        color: isHovered || isSelected ? '#333' : '#888',
        dashArray: isHovered || isSelected ? '' : '3',
        fillOpacity: isHovered || isSelected ? 0.7 : 0.5
      };
    }
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
      
      console.log(`US tooltip count check: ${countryName} has ${projectCount} projects`);
      console.log('Available counts:', countryProjectCounts);
    } else {
      // For other countries, use the standard lookup
      projectCount = countryProjectCounts[countryName] || 0;
    }
    
    // Add tooltip
    layer.bindTooltip(`${countryName}: ${projectCount} project${projectCount !== 1 ? 's' : ''}`);
    
    // Add event handlers
    layer.on({
      mouseover: () => setHoveredCountry(countryName),
      mouseout: () => setHoveredCountry(null),
      click: () => {
        console.log(`Clicked on country: ${countryName}`);
        
        // Toggle selection - if already selected, deselect it
        if (selectedCountry === countryName) {
          console.log(`Deselecting country: ${countryName}`);
          setSelectedCountry(null);
        } else {
          console.log(`Selecting country: ${countryName}`);
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
        }
      }
    });
  };

  // Get coordinates for selected country as [number, number]
  const getSelectedCountryCoordinates = (): [number, number] => {
    if (!selectedCountry) return defaultPosition;
    
    // Special handling for United States
    if (selectedCountry === 'United States' || selectedCountry === 'USA') {
      console.log('Using hardcoded coordinates for United States');
      return [37.0902, -95.7129]; // Hardcoded US coordinates
    }
    
    // Find the country code for the selected country name
    const countryCode = Object.keys(countryCodeMap).find(code => countryCodeMap[code] === selectedCountry);
    console.log(`Looking up coordinates for ${selectedCountry} with code ${countryCode}`);
    
    if (countryCode) {
      const coords = getCountryCoordinates(countryCode);
      console.log(`Found coordinates for ${selectedCountry}: ${coords.lat}, ${coords.lng}`);
      return [coords.lat, coords.lng];
    }
    
    console.warn(`Could not find coordinates for ${selectedCountry}, using default position`);
    return defaultPosition;
  };

  return (
    <div className="map-container">
      <MapContainer
        center={defaultPosition}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        minZoom={2}
        maxBounds={[[-90, -180], [90, 180]]}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Render world countries */}
        {worldGeoJSON && (
          <GeoJSON 
            key={`world-geojson-${JSON.stringify(countryProjectCounts)}`}
            data={worldGeoJSON as GeoJsonObject} 
            style={countryStyle.style} 
            onEachFeature={onEachCountry}
          />
        )}
        
        {/* Update map view when selected country changes, but only once */}
        {selectedCountry && (
          <SetMapView 
            center={getSelectedCountryCoordinates()} 
            zoom={4} 
          />
        )}
      </MapContainer>
      
      {/* Legend */}
      <div className="map-legend">
        <h4>Projects per Country</h4>
        {countryDataLoading && (
          <div className="legend-loading">Updating map data...</div>
        )}
        {selectedCategory && (
          <div className="legend-filter">
            <span>Filtered by: {formatEnumValue(selectedCategory)}</span>
            {selectedSubCategory && (
              <span> / {formatEnumValue(selectedSubCategory)}</span>
            )}
          </div>
        )}
        <div className="legend-item">
          <span className="color-box" style={{ backgroundColor: '#F5F5F5' }}></span>
          <span>0 projects</span>
        </div>
        <div className="legend-item">
          <span className="color-box" style={{ backgroundColor: '#BBDEFB' }}></span>
          <span>1 project</span>
        </div>
        <div className="legend-item">
          <span className="color-box" style={{ backgroundColor: '#90CAF9' }}></span>
          <span>2-3 projects</span>
        </div>
        <div className="legend-item">
          <span className="color-box" style={{ backgroundColor: '#64B5F6' }}></span>
          <span>4-5 projects</span>
        </div>
        <div className="legend-item">
          <span className="color-box" style={{ backgroundColor: '#42A5F5' }}></span>
          <span>6-10 projects</span>
        </div>
        <div className="legend-item">
          <span className="color-box" style={{ backgroundColor: '#2196F3' }}></span>
          <span>11-20 projects</span>
        </div>
        <div className="legend-item">
          <span className="color-box" style={{ backgroundColor: '#1976D2' }}></span>
          <span>20+ projects</span>
        </div>
      </div>
      
      {selectedCountry && (
        <div className="project-sidebar">
          <div className="sidebar-header">
            <h2>{selectedCountry}</h2>
            <button className="close-button" onClick={() => setSelectedCountry(null)}>×</button>
          </div>
          
          {isLoadingProjects && countryProjects.length === 0 ? (
            <div className="loading-indicator">Loading projects...</div>
          ) : countryProjects.length > 0 ? (
            <>
              <div className="sidebar-content">
                <h3>{countryProjects.length} Project{countryProjects.length !== 1 ? 's' : ''}</h3>
                <div className="project-list">
                  {countryProjects.map(project => {
                    // More detailed debugging for each project
                    console.log(`Project ${project.id}:`);
                    console.log(`- Category: ${project.category} (${typeof project.category})`);
                    console.log(`- SubCategory: ${project.subCategory} (${typeof project.subCategory})`);
                    console.log(`- Has category: ${Boolean(project.category)}`);
                    console.log(`- Has subcategory: ${Boolean(project.subCategory)}`);
                    
                    return (
                    <a 
                      key={project.id} 
                      className="project-card" 
                      href={getProjectUrl(project)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {project.thumbnailImage && (
                        <div className="project-thumbnail">
                          <img 
                            src={project.thumbnailImage} 
                            alt={project.title || project.name} 
                          />
                        </div>
                      )}
                      <div className="project-info">
                        <h3>{project.title || project.name}</h3>
                        {project.shortDescription && (
                          <p className="project-description">{project.shortDescription}</p>
                        )}
                        <div className="project-meta">
                          {/* Force display of category and subcategory for debugging */}
                          
                          {project.category && (
                            <span className="project-category pill">
                              {formatEnumValue(project.category)}
                            </span>
                          )}
                          {project.subCategory && (
                            <span className="project-subcategory pill">
                              {formatEnumValue(project.subCategory)}
                            </span>
                          )}
                        </div>
                      </div>
                    </a>
                  )})}
                </div>
                
                {hasMoreProjects && (
                  <button 
                    className="load-more-button" 
                    onClick={loadMoreProjects}
                    disabled={isLoadingProjects}
                  >
                    {isLoadingProjects ? 'Loading...' : 'Load More'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="no-projects-message">
              No projects found for {selectedCountry}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectMap;
