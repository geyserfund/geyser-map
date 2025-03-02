import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Project, ProjectCategory, ProjectStatus, ProjectSubCategory } from '@/types/project';
import { getCountryCoordinates } from '@/utils/countryCoordinates';
import { fetchWorldCountriesGeoJSON, WorldCountriesGeoJSON } from '@/utils/worldCountries';
import { Feature, GeoJsonObject } from 'geojson';
import { useQuery, useLazyQuery, ApolloQueryResult } from '@apollo/client';
import { GET_PROJECT_COUNTRIES, GET_PROJECTS_BY_COUNTRY } from '@/api/queries';
import { primaryColors } from '@/styles/colors';

interface ProjectMapProps {
  projects?: Project[];
  selectedCategory: ProjectCategory | null;
  selectedSubCategory?: ProjectSubCategory | null;
  showInactive: boolean;
}

// Define interface for the project query response
interface ProjectsQueryResponse {
  projectsGet?: {
    projects: Project[];
    summary?: {
      projectsCount: number;
      fundersCount: number;
      fundedTotal: number;
    };
  };
}

// Component to set the map view
const SetMapView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  
  // Use a ref to track if we've already set the view for this center
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
const CenterMap = ({ center, zoom }: { center: [number, number], zoom: number }) => {
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
const BoundsController = () => {
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

// Define interface for legend items
interface LegendItem {
  color: string;
  label: string;
  borderColor?: string;
}

const ProjectMap: React.FC<ProjectMapProps> = ({ 
  selectedCategory, 
  selectedSubCategory,
  showInactive 
}) => {
  // Default center position (centered on the world)
  const defaultPosition: [number, number] = [25, 0];
  
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
  // Add state for max project count
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [maxProjectCount, setMaxProjectCount] = useState<number>(0);
  // Add state for color scale thresholds
  const [colorScaleThresholds, setColorScaleThresholds] = useState<number[]>([]);

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
        
        // Filter out Antarctica
        const filteredData = {
          ...data,
          features: data.features.filter(feature => 
            feature.properties?.name !== 'Antarctica' && 
            feature.properties?.name !== 'Antarctic'
          )
        };
        
        setWorldGeoJSON(filteredData);
        
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
      
      // Track min and max counts
      const nonZeroValues: number[] = [];
      
      countryData.projectCountriesGet.forEach((item: CountryData) => {
        const countryName = item.country.name;
        const countryCode = item.country.code;
        counts[countryName] = item.count;
        
        // Add to non-zero values array for calculating distribution
        if (item.count > 0) {
          nonZeroValues.push(item.count);
        }
        
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
      
      // Calculate min and max project counts (excluding zeros)
      if (nonZeroValues.length > 0) {
        const max = Math.max(...nonZeroValues);
        
        setMaxProjectCount(max);
        
        console.log(`Max project count: ${max}`);
        
        // Calculate color scale thresholds based on distribution
        // We'll create a logarithmic scale if the range is large, otherwise linear
        const thresholds = calculateColorThresholds(max);
        setColorScaleThresholds(thresholds);
        
        console.log('Color scale thresholds:', thresholds);
      } else {
        // Reset if no projects
        setMaxProjectCount(0);
        setColorScaleThresholds([]);
      }
      
      setCountryProjectCounts(counts);
    }
  }, [countryData]);

  // Calculate color thresholds based on data distribution
  const calculateColorThresholds = (max: number): number[] => {
    // If the range is small, use a linear scale
    if (max <= 10) {
      // For small ranges, create evenly spaced thresholds
      const step = Math.max(1, Math.ceil(max / 5));
      const thresholds = [1];
      
      let current = 1;
      while (current < max) {
        current += step;
        if (current <= max && !thresholds.includes(current)) {
          thresholds.push(current);
        }
      }
      
      // Ensure we have at least a few thresholds
      if (thresholds.length < 3 && max > 3) {
        return [1, Math.ceil(max / 3), Math.ceil(2 * max / 3), max];
      }
      
      return thresholds;
    } else {
      // For larger ranges, use a logarithmic or quantile-based scale
      // This ensures better distribution of colors
      
      // Logarithmic scale base calculation
      const logBase = Math.pow(max, 1/5);
      
      // Generate thresholds using logarithmic scale
      const thresholds = [1];
      
      for (let i = 1; i <= 5; i++) {
        const value = Math.round(Math.pow(logBase, i));
        if (value < max && value > thresholds[thresholds.length - 1]) {
          thresholds.push(value);
        }
      }
      
      // Always include the max value
      if (thresholds[thresholds.length - 1] < max) {
        thresholds.push(max);
      }
      
      return thresholds;
    }
  };

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
  const countryStyle = {
    style: function(feature: Feature | undefined) {
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
    .then((response: ApolloQueryResult<ProjectsQueryResponse>) => {
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
    .catch((error: Error) => {
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
      .then((response: ApolloQueryResult<ProjectsQueryResponse>) => {
        const newProjects = response.data?.projectsGet?.projects || [];
        console.log(`Loaded ${newProjects.length} more projects for ${selectedCountry}`);
        
        // Add new projects to existing ones
        setCountryProjects(prev => [...prev, ...newProjects]);
        setCurrentPage(prev => prev + 1);
        
        // If we got exactly PAGE_SIZE projects, assume there might be more
        setHasMoreProjects(newProjects.length === PAGE_SIZE);
        setIsLoadingProjects(false);
      })
      .catch((error: Error) => {
        console.error(`Error loading more projects:`, error);
        setIsLoadingProjects(false);
      });
    }
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

  // Generate legend items based on dynamic thresholds
  const legendItems = useMemo(() => {
    // Explicitly use maxProjectCount to help ESLint recognize the dependency
    const currentMaxCount = maxProjectCount;
    
    const items: LegendItem[] = [
      // Always include the "0 projects" item - now with light grey background
      {
        color: '#F5F5F5',
        label: '0 projects'
      }
    ];
    
    // If we have no thresholds, use default scale
    if (colorScaleThresholds.length === 0) {
      return [
        ...items,
        { color: primaryColors[200], label: '1 project' },
        { color: primaryColors[300], label: '2-3 projects' },
        { color: primaryColors[400], label: '4-5 projects' },
        { color: primaryColors[500], label: '6-10 projects' },
        { color: primaryColors[600], label: '11-20 projects' },
        { color: primaryColors[700], label: `20+ projects (max: ${currentMaxCount})` }
      ];
    }
    
    // Generate items based on thresholds
    const colorKeys = [200, 300, 400, 500, 600, 700] as const;
    
    for (let i = 0; i < colorScaleThresholds.length; i++) {
      const threshold = colorScaleThresholds[i];
      const prevThreshold = i > 0 ? colorScaleThresholds[i - 1] : 0;
      const colorKey = colorKeys[Math.min(i, colorKeys.length - 1)];
      
      let label = '';
      if (i === 0) {
        // First threshold is always 1
        label = '1 project';
      } else if (threshold === prevThreshold + 1) {
        // Single value
        label = `${threshold} projects`;
      } else {
        // Range of values
        label = `${prevThreshold + 1}-${threshold} projects`;
      }
      
      items.push({
        color: primaryColors[colorKey],
        label
      });
    }
    
    // Add a final item if needed for values above the last threshold
    if (colorScaleThresholds.length > 0 && currentMaxCount > colorScaleThresholds[colorScaleThresholds.length - 1]) {
      const lastThreshold = colorScaleThresholds[colorScaleThresholds.length - 1];
      items.push({
        color: primaryColors[700],
        label: `${lastThreshold + 1}+ projects (max: ${currentMaxCount})`
      });
    }
    
    return items;
  }, [colorScaleThresholds, maxProjectCount]);

  return (
    <div className="map-container">
      {/* Add title above the map */}
      <div className="map-title">
        <h1>The ₿itcoin Global Economy</h1>
      </div>
      
      <MapContainer
        center={defaultPosition}
        zoom={2.3}
        style={{ height: '100%', width: '100%', backgroundColor: '#f8f9fa' }}
        minZoom={2}
        maxBounds={[[-60, -180], [85, 180]]}
        maxBoundsViscosity={1.0}
        worldCopyJump={false}
        zoomControl={true}
        className={selectedCountry ? 'country-selected' : ''}
      >
        {/* Add bounds controller to enforce map boundaries */}
        <BoundsController />
        
        {/* Ensure map is centered on initial load */}
        <CenterMap center={defaultPosition} zoom={2.3} />
        
        {/* Render world countries */}
        {worldGeoJSON && (
          <GeoJSON 
            key={`world-geojson-${JSON.stringify(countryProjectCounts)}-${selectedCountry || 'none'}`}
            data={worldGeoJSON as GeoJsonObject} 
            style={countryStyle.style} 
            onEachFeature={onEachCountry}
          />
        )}
        
        {/* Update map view when selected country changes, but only once */}
        {selectedCountry && (
          <SetMapView 
            center={getSelectedCountryCoordinates()} 
            zoom={3.5}
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
        
        {/* Dynamic legend items */}
        {legendItems.map((item, index) => (
          <div className="legend-item" key={index}>
            <span 
              className="color-box" 
              style={{ 
                backgroundColor: item.color,
                border: item.borderColor ? `1px solid ${item.borderColor}` : 'none'
              }}
            ></span>
            <span>{item.label}</span>
          </div>
        ))}
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
