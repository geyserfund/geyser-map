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
  setSelectedCountry
}) => {
  if (!selectedCountry) return null;
  
  return (
    <div className="project-sidebar">
      <div className="sidebar-header">
        <h2>{selectedCountry}</h2>
        <button 
          className="close-button" 
          onClick={() => setSelectedCountry(null)}
          aria-label="Close sidebar"
        >
          ×
        </button>
      </div>
      
      {isLoadingProjects && countryProjects.length === 0 ? (
        <div className="loading-indicator">Loading projects...</div>
      ) : countryProjects.length > 0 ? (
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
  );
};

export default ProjectSidebar; 