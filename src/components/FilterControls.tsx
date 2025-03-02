import React, { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { ProjectCategory, ProjectSubCategory } from '@/types/project';
import { secondaryColors, neutralColors } from '@/styles/colors';

interface FilterControlsProps {
  selectedCategory: ProjectCategory | null;
  setSelectedCategory: (category: ProjectCategory | null) => void;
  selectedSubCategory: ProjectSubCategory | null;
  setSelectedSubCategory: (subCategory: ProjectSubCategory | null) => void;
  showInactive: boolean;
  setShowInactive: (showInactive: boolean) => void;
}

// Define a type for select options
interface SelectOption<T> {
  value: T;
  label: string;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  selectedCategory,
  setSelectedCategory,
  selectedSubCategory,
  setSelectedSubCategory,
}) => {
  // State for mobile filter visibility
  const [filtersVisible, setFiltersVisible] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // On desktop, always show filters
      if (!mobile) {
        setFiltersVisible(true);
      }
    };
    
    // Check on initial load
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Toggle filters visibility
  const toggleFilters = () => {
    setFiltersVisible(prev => !prev);
  };

  // For debugging - log all enum values
  console.log('All ProjectCategory values:', Object.values(ProjectCategory));
  console.log('All ProjectSubCategory values:', Object.values(ProjectSubCategory));

  // Create a map of categories to their subcategories
  const SUBCATEGORY_MAP: Record<ProjectCategory, ProjectSubCategory[]> = useMemo(() => ({
    [ProjectCategory.EDUCATION]: [
      ProjectSubCategory.COURSE,
      ProjectSubCategory.CONTENT_CREATOR,
      ProjectSubCategory.JOURNALISM,
      ProjectSubCategory.BOOK,
      ProjectSubCategory.PODCAST,
    ],
    [ProjectCategory.COMMUNITY]: [
      ProjectSubCategory.EVENT,
      ProjectSubCategory.CIRCULAR_ECONOMY,
      ProjectSubCategory.MEETUP,
      ProjectSubCategory.HACKER_SPACE,
    ],
    [ProjectCategory.CULTURE]: [
      ProjectSubCategory.FILM,
      ProjectSubCategory.ART,
      ProjectSubCategory.GAME,
      ProjectSubCategory.MUSIC,
      ProjectSubCategory.COLLECTIBLE,
    ],
    [ProjectCategory.ADVOCACY]: [
      ProjectSubCategory.LEGAL_FUND,
      ProjectSubCategory.LOBBY,
      ProjectSubCategory.PROMOTION,
    ],
    [ProjectCategory.TOOL]: [
      ProjectSubCategory.OS_SOFTWARE,
      ProjectSubCategory.HARDWARE,
      ProjectSubCategory.APP,
    ],
    [ProjectCategory.CAUSE]: [
      ProjectSubCategory.HUMANITARIAN,
      ProjectSubCategory.FUNDRAISER,
      ProjectSubCategory.TRAVEL,
      ProjectSubCategory.MEDICAL,
    ],
    [ProjectCategory.OTHER]: [
      ProjectSubCategory.OTHER,
    ],
  }), []);

  // Debug the subcategory map
  console.log('SUBCATEGORY_MAP:', SUBCATEGORY_MAP);

  // State for subcategory options
  const [subcategoryOptions, setSubcategoryOptions] = useState<SelectOption<ProjectSubCategory>[]>([]);

  // Format enum value to readable label
  const formatEnumLabel = (value: string): string => {
    // Convert to title case (e.g., "COURSE" -> "Course")
    return value
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Create category options
  const categoryOptions: SelectOption<ProjectCategory>[] = Object.values(ProjectCategory).map(category => ({
    value: category,
    label: formatEnumLabel(category),
  }));

  // Debug category options
  console.log('Category options:', categoryOptions);

  // Update subcategory options when category changes
  useEffect(() => {
    console.log('Selected category changed:', selectedCategory);
    
    if (selectedCategory) {
      // Reset subcategory when category changes
      setSelectedSubCategory(null);
      
      // Get subcategories for the selected category
      const subcategories = SUBCATEGORY_MAP[selectedCategory] || [];
      console.log('Subcategories for selected category:', subcategories);
      
      // Create options for the subcategories
      const options = subcategories.map(subCategory => ({
        value: subCategory,
        label: formatEnumLabel(subCategory),
      }));
      
      console.log('Setting subcategory options:', options);
      setSubcategoryOptions(options);
    } else {
      setSubcategoryOptions([]);
    }
  }, [selectedCategory, setSelectedSubCategory, SUBCATEGORY_MAP]);

  // For debugging
  console.log('Current subcategory options:', subcategoryOptions);
  console.log('Selected subcategory:', selectedSubCategory);

  // Handle category change
  const handleCategoryChange = (option: SelectOption<ProjectCategory> | null) => {
    console.log('Category changed to:', option);
    const categoryValue = option ? option.value : null;
    console.log('Setting selected category to:', categoryValue);
    setSelectedCategory(categoryValue);
    
    // Manually update subcategory options if needed
    if (categoryValue) {
      const subcategories = SUBCATEGORY_MAP[categoryValue] || [];
      const options = subcategories.map((subCategory: ProjectSubCategory) => ({
        value: subCategory,
        label: formatEnumLabel(subCategory),
      }));
      console.log('Manually setting subcategory options:', options);
      setSubcategoryOptions(options);
    } else {
      // Clear subcategory options when no category is selected
      setSubcategoryOptions([]);
      setSelectedSubCategory(null);
    }
  };

  // Handle subcategory change
  const handleSubcategoryChange = (option: SelectOption<ProjectSubCategory> | null) => {
    console.log('Subcategory changed to:', option);
    setSelectedSubCategory(option ? option.value : null);
  };

  // Filter icon SVG
  const FilterIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px' }}>
      <path d="M4 6H20M7 12H17M9 18H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <>
      {/* Mobile filter toggle button */}
      {isMobile && (
        <button 
          className="filters-toggle-button" 
          onClick={toggleFilters}
          aria-label={filtersVisible ? "Hide filters" : "Show filters"}
        >
          <FilterIcon />
          {filtersVisible ? "Hide Filters" : "Show Filters"}
        </button>
      )}
      
      <div className={`controls-container ${isMobile && !filtersVisible ? 'hidden' : ''}`}>
        <div className="filter-section">
          <h3>Project Filters</h3>
          
          {isMobile && (
            <button 
              className="close-filters-button" 
              onClick={() => setFiltersVisible(false)}
              aria-label="Close filters"
            >
              ×
            </button>
          )}
          
          <div className="select-container">
            <label>Category</label>
            <Select
              value={selectedCategory ? { value: selectedCategory, label: formatEnumLabel(selectedCategory) } : null}
              onChange={handleCategoryChange}
              options={categoryOptions}
              isClearable
              placeholder="Select a category"
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: secondaryColors.blue,
                  '&:hover': {
                    borderColor: secondaryColors.blue,
                  },
                }),
                option: (base, { isSelected }) => ({
                  ...base,
                  backgroundColor: isSelected ? secondaryColors.blue : base.backgroundColor,
                  '&:hover': {
                    backgroundColor: isSelected ? secondaryColors.blue : neutralColors[50],
                  },
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                menu: (base) => ({ ...base, position: 'absolute' }),
              }}
              menuPosition="fixed"
            />
          </div>
          
          <div className="select-container">
            <label>Subcategory {subcategoryOptions.length > 0 ? `(${subcategoryOptions.length} options)` : ''}</label>
            <Select
              value={selectedSubCategory ? { value: selectedSubCategory, label: formatEnumLabel(selectedSubCategory) } : null}
              onChange={handleSubcategoryChange}
              options={subcategoryOptions}
              isClearable
              isDisabled={!selectedCategory}
              placeholder={!selectedCategory 
                ? "Select a category first" 
                : subcategoryOptions.length > 0 
                  ? "Select a subcategory" 
                  : "No subcategories available"
              }
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: secondaryColors.blue,
                  '&:hover': {
                    borderColor: secondaryColors.blue,
                  },
                  backgroundColor: !selectedCategory ? neutralColors[50] : base.backgroundColor,
                }),
                option: (base, { isSelected }) => ({
                  ...base,
                  backgroundColor: isSelected ? secondaryColors.blue : base.backgroundColor,
                  '&:hover': {
                    backgroundColor: isSelected ? secondaryColors.blue : neutralColors[50],
                  },
                }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                menu: (base) => ({ ...base, position: 'absolute' }),
              }}
              menuPosition="fixed"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterControls; 