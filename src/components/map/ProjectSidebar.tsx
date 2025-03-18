import React from 'react';
import { Project } from '@/types/project';
import { formatEnumValue } from './MapLegend';

interface ProjectSidebarProps {
  selectedCountry: string | null;
  countryProjects: Project[];
  isLoadingProjects: boolean;
  hasMoreProjects: boolean;
  loadMoreProjects: () => void;
  setSelectedCountry: (country: string | null) => void;
  onClose?: () => void; // Optional prop for handling close action
}

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

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  selectedCountry,
  countryProjects,
  isLoadingProjects,
  hasMoreProjects,
  loadMoreProjects,
  setSelectedCountry,
  onClose
}) => {
  if (!selectedCountry) return null;
  
  // Function to handle closing the sidebar
  const handleClose = () => {
    console.log('Closing sidebar and resetting map view');
    
    // Use the provided onClose handler if available, otherwise just deselect the country
    if (onClose) {
      onClose();
    } else {
      // Fallback to just deselecting the country
      setSelectedCountry(null);
    }
  };
  
  // Prevent clicks from propagating to the map
  const handleSidebarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  return (
    <div className="project-sidebar" onClick={handleSidebarClick}>
      <div className="sidebar-header">
        <h2>{selectedCountry}</h2>
        <button 
          className="close-button" 
          onClick={handleClose}
          aria-label="Close sidebar"
        >
          ×
        </button>
      </div>
      
      {isLoadingProjects && countryProjects.length === 0 ? (
        <div className="loading-indicator">Loading projects...</div>
      ) : countryProjects.length === 0 ? (
        <div className="no-projects-message">
          No projects found for {selectedCountry}
        </div>
      ) : (
        <>
          <div className="sidebar-content">
            <h3>{countryProjects.length} Project{countryProjects.length !== 1 ? 's' : ''}</h3>
            <div className="project-list">
              {countryProjects.map(project => (
                <a 
                  key={project.id} 
                  className="project-card" 
                  href={getProjectUrl(project)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
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
              ))}
            </div>
            
            {hasMoreProjects && (
              <button 
                className="load-more-button" 
                onClick={(e) => {
                  e.stopPropagation();
                  loadMoreProjects();
                }}
                disabled={isLoadingProjects}
              >
                {isLoadingProjects ? 'Loading...' : 'Load More'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectSidebar; 