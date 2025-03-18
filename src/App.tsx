import React, { useState } from 'react';
import ProjectMap from '@/components/ProjectMap';
import FilterControls from '@/components/FilterControls';
import NavBar from '@/components/NavBar';
import { ProjectCategory, ProjectSubCategory } from '@/types/project';

const App: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<ProjectSubCategory | null>(null);
  const [showInactive, setShowInactive] = useState<boolean>(false);

  console.log('App - Selected Category:', selectedCategory);
  console.log('App - Selected SubCategory:', selectedSubCategory);

  return (
    <div className="app">
      <NavBar/>
      <ProjectMap
        selectedCategory={selectedCategory}
        selectedSubCategory={selectedSubCategory}
        showInactive={showInactive} 
      />
      <FilterControls
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedSubCategory={selectedSubCategory}
        setSelectedSubCategory={setSelectedSubCategory}
        showInactive={showInactive}
        setShowInactive={setShowInactive}
      />
    </div>
  );
};

export default App; 