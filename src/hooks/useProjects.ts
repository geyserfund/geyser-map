import { useState } from 'react';
import { useQuery, ApolloError } from '@apollo/client';
import { GET_PROJECTS } from '@/api/queries';
import { Project, ProjectCategory, ProjectStatus, ProjectSubCategory } from '@/types/project';

interface UseProjectsProps {
    initialStatus?: ProjectStatus;
    initialCategory?: ProjectCategory | null;
    initialSubCategory?: ProjectSubCategory | null;
    initialShowInactive?: boolean;
}

interface UseProjectsReturn {
    projects: Project[];
    loading: boolean;
    error: ApolloError | undefined;
    filteredProjects: Project[];
    selectedCategory: ProjectCategory | null;
    setSelectedCategory: (category: ProjectCategory | null) => void;
    selectedSubCategory: ProjectSubCategory | null;
    setSelectedSubCategory: (subCategory: ProjectSubCategory | null) => void;
    showInactive: boolean;
    setShowInactive: (show: boolean) => void;
}

export const useProjects = ({
    initialStatus = ProjectStatus.ACTIVE,
    initialCategory = null as ProjectCategory | null,
    initialSubCategory = null as ProjectSubCategory | null,
    initialShowInactive = false,
}: UseProjectsProps = {}): UseProjectsReturn => {
    const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | null>(initialCategory);
    const [selectedSubCategory, setSelectedSubCategory] = useState<ProjectSubCategory | null>(initialSubCategory);
    const [showInactive, setShowInactive] = useState<boolean>(initialShowInactive);

    // Construct the query input
    const queryInput = {
        where: {
            status: initialShowInactive ? undefined : initialStatus,
        },
    };

    // Fetch projects
    const { data, loading, error } = useQuery(GET_PROJECTS, {
        variables: { input: queryInput },
        fetchPolicy: 'cache-and-network',
    });

    // Filter projects based on selected filters
    const filteredProjects = data?.projectsGet?.projects?.filter((project: Project) => {
        // Filter by status if showInactive is false
        if (!showInactive && project.status !== ProjectStatus.ACTIVE) {
            return false;
        }

        // Filter by category if selected
        if (selectedCategory && project.category !== selectedCategory) {
            return false;
        }

        // Filter by subcategory if selected
        if (selectedSubCategory && project.subCategory !== selectedSubCategory) {
            return false;
        }

        return true;
    }) || [];

    return {
        projects: data?.projectsGet?.projects || [],
        loading,
        error,
        filteredProjects,
        selectedCategory,
        setSelectedCategory,
        selectedSubCategory,
        setSelectedSubCategory,
        showInactive,
        setShowInactive,
    };
}; 