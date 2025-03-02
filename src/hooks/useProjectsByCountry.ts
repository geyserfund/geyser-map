import { useState } from 'react';
import { useLazyQuery, ApolloQueryResult } from '@apollo/client';
import { GET_PROJECTS_BY_COUNTRY } from '@/api/queries';
import { Project, ProjectCategory, ProjectStatus, ProjectSubCategory } from '@/types/project';

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

interface UseProjectsByCountryResult {
    countryProjects: Project[];
    isLoadingProjects: boolean;
    hasMoreProjects: boolean;
    currentPage: number;
    fetchProjectsForCountry: (countryName: string) => void;
    loadMoreProjects: () => void;
}

export const useProjectsByCountry = (
    selectedCountry: string | null,
    countryCodeMap: Record<string, string>,
    selectedCategory: ProjectCategory | null,
    selectedSubCategory: ProjectSubCategory | null,
    showInactive: boolean,
    countryData: any
): UseProjectsByCountryResult => {
    const [countryProjects, setCountryProjects] = useState<Project[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(false);
    const [hasMoreProjects, setHasMoreProjects] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const PAGE_SIZE = 4;

    // Lazy query for fetching projects by country
    const [projectsByCountryQuery] = useLazyQuery(GET_PROJECTS_BY_COUNTRY);

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
                (item: any) =>
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
                (item: any) => item.country.name === countryName
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
                    (item: any) =>
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
                    (item: any) => item.country.name === selectedCountry
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

    return {
        countryProjects,
        isLoadingProjects,
        hasMoreProjects,
        currentPage,
        fetchProjectsForCountry,
        loadMoreProjects
    };
}; 