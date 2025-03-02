import React from 'react';
import { primaryColors } from '@/styles/colors';

// Define interface for legend items
interface LegendItem {
  color: string;
  label: string;
  borderColor?: string;
}

interface MapLegendProps {
  legendItems: LegendItem[];
  legendVisible: boolean;
  isMobile: boolean;
  toggleLegend: () => void;
  selectedCategory: string | null;
  selectedSubCategory: string | null;
  countryDataLoading: boolean;
}

// Helper function to format enum values to readable text
export const formatEnumValue = (value: string): string => {
  if (!value) return '';
  
  return value
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const MapLegend: React.FC<MapLegendProps> = ({
  legendItems,
  legendVisible,
  isMobile,
  toggleLegend,
  selectedCategory,
  selectedSubCategory,
  countryDataLoading
}) => {
  return (
    <>
      {/* Mobile legend toggle button */}
      {isMobile && (
        <button 
          className="legend-toggle-button" 
          onClick={toggleLegend}
          aria-label={legendVisible ? "Hide legend" : "Show legend"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px' }}>
            <path d="M9 3H4v6h5V3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 3h-5v6h5V3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 15h-5v6h5v-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 15H4v6h5v-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {legendVisible ? "Hide Legend" : "Show Legend"}
        </button>
      )}
      
      {/* Legend */}
      <div className={`map-legend ${!legendVisible ? 'hidden' : ''}`}>
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
    </>
  );
};

// Function to calculate color thresholds based on data distribution
export const calculateColorThresholds = (max: number): number[] => {
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

// Function to generate legend items based on thresholds
export const generateLegendItems = (
  colorScaleThresholds: number[], 
  maxProjectCount: number
): LegendItem[] => {
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
      { color: primaryColors[700], label: `20+ projects (max: ${maxProjectCount})` }
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
  if (colorScaleThresholds.length > 0 && maxProjectCount > colorScaleThresholds[colorScaleThresholds.length - 1]) {
    const lastThreshold = colorScaleThresholds[colorScaleThresholds.length - 1];
    items.push({
      color: primaryColors[700],
      label: `${lastThreshold + 1}+ projects (max: ${maxProjectCount})`
    });
  }
  
  return items;
};

export default MapLegend; 