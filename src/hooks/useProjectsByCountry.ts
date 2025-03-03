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

// Define interface for country data
interface CountryItem {
    country: {
        code: string;
        name: string;
    };
    count: number;
}

interface CountryData {
    projectCountriesGet?: CountryItem[];
}

interface UseProjectsByCountryResult {
    countryProjects: Project[];
    isLoadingProjects: boolean;
    hasMoreProjects: boolean;
    currentPage: number;
    fetchProjectsForCountry: (countryName: string) => void;
    loadMoreProjects: () => void;
}

// Common country codes for fallback
const COUNTRY_CODE_FALLBACKS: Record<string, string> = {
    'United States': 'US',
    'United States of America': 'US',
    'USA': 'US',
    'Italy': 'IT',
    'France': 'FR',
    'Germany': 'DE',
    'United Kingdom': 'GB',
    'UK': 'GB',
    'Spain': 'ES',
    'Canada': 'CA',
    'Australia': 'AU',
    'Japan': 'JP',
    'China': 'CN',
    'Brazil': 'BR',
    'India': 'IN',
    'Russia': 'RU',
    'South Africa': 'ZA',
    'Mexico': 'MX',
    'Netherlands': 'NL',
    'Switzerland': 'CH',
    'Sweden': 'SE',
    'Norway': 'NO',
    'Denmark': 'DK',
    'Finland': 'FI',
    'Belgium': 'BE',
    'Austria': 'AT',
    'Portugal': 'PT',
    'Greece': 'GR',
    'Ireland': 'IE',
    'New Zealand': 'NZ',
    'Singapore': 'SG',
    'Israel': 'IL'
};

export const useProjectsByCountry = (
    selectedCountry: string | null,
    selectedCategory: ProjectCategory | null,
    selectedSubCategory: ProjectSubCategory | null,
    showInactive: boolean,
    countryData: CountryData
): UseProjectsByCountryResult => {
    const [countryProjects, setCountryProjects] = useState<Project[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(false);
    const [hasMoreProjects, setHasMoreProjects] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const PAGE_SIZE = 10;

    // Lazy query for fetching projects by country
    const [projectsByCountryQuery] = useLazyQuery(GET_PROJECTS_BY_COUNTRY);

    // Helper function to get country code - more robust lookup
    const getCountryCode = (countryName: string): string => {
        // Check if we have a fallback code for this country
        if (COUNTRY_CODE_FALLBACKS[countryName]) {
            console.log(`Using fallback country code for ${countryName}: ${COUNTRY_CODE_FALLBACKS[countryName]}`);
            return COUNTRY_CODE_FALLBACKS[countryName];
        }

        // Try to find an exact match in the API data
        const exactMatch = countryData?.projectCountriesGet?.find(
            (item: CountryItem) => item.country.name === countryName
        );

        if (exactMatch) {
            console.log(`Found exact match for ${countryName}: ${exactMatch.country.code}`);
            return exactMatch.country.code;
        }

        // Try to find a case-insensitive match
        const caseInsensitiveMatch = countryData?.projectCountriesGet?.find(
            (item: CountryItem) => item.country.name.toLowerCase() === countryName.toLowerCase()
        );

        if (caseInsensitiveMatch) {
            console.log(`Found case-insensitive match for ${countryName}: ${caseInsensitiveMatch.country.code}`);
            return caseInsensitiveMatch.country.code;
        }

        // Try to find a partial match (country name contains or is contained in the API country name)
        const partialMatch = countryData?.projectCountriesGet?.find(
            (item: CountryItem) =>
                item.country.name.toLowerCase().includes(countryName.toLowerCase()) ||
                countryName.toLowerCase().includes(item.country.name.toLowerCase())
        );

        if (partialMatch) {
            console.log(`Found partial match for ${countryName}: ${partialMatch.country.code}`);
            return partialMatch.country.code;
        }

        // If all else fails, try to guess the country code (first 2 letters of the country name)
        if (countryName.length >= 2) {
            const guessedCode = countryName.substring(0, 2).toUpperCase();
            console.log(`Guessing country code for ${countryName}: ${guessedCode}`);
            return guessedCode;
        }

        // No match found
        console.error(`Could not find country code for ${countryName}`);
        return '';
    };

    // Function to fetch projects for a country
    const fetchProjectsForCountry = (countryName: string) => {
        console.log(`Fetching projects for country: ${countryName} with filters:`, {
            category: selectedCategory,
            subCategory: selectedSubCategory
        });

        // Get the country code
        const countryCode = getCountryCode(countryName);

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
                    console.log('Sample project data (first project):', fetchedProjects[0].name);
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
        if (!selectedCountry) {
            console.error('Cannot load more projects: No country selected');
            return;
        }

        if (isLoadingProjects) {
            console.log('Already loading projects, skipping request');
            return;
        }

        if (countryProjects.length === 0) {
            console.error('Cannot load more projects: No existing projects to paginate from');
            return;
        }

        console.log(`Loading more projects for ${selectedCountry}, page ${currentPage + 1} with filters:`, {
            category: selectedCategory,
            subCategory: selectedSubCategory
        });

        // Get the country code
        const countryCode = getCountryCode(selectedCountry);

        if (!countryCode) {
            console.error(`Could not find country code for ${selectedCountry}`);
            return;
        }

        // Get the last project's ID to use as cursor
        const lastProject = countryProjects[countryProjects.length - 1];

        // Set loading state before making the query
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
            },
            fetchPolicy: 'network-only' // Force a network request instead of using cache
        })
            .then((response: ApolloQueryResult<ProjectsQueryResponse>) => {
                const newProjects = response.data?.projectsGet?.projects || [];
                console.log(`Loaded ${newProjects.length} more projects for ${selectedCountry}`);

                if (newProjects.length === 0) {
                    console.log('No more projects available');
                    setHasMoreProjects(false);
                } else {
                    // Add new projects to existing ones
                    setCountryProjects(prev => [...prev, ...newProjects]);
                    setCurrentPage(prev => prev + 1);

                    // If we got exactly PAGE_SIZE projects, assume there might be more
                    setHasMoreProjects(newProjects.length === PAGE_SIZE);
                }

                setIsLoadingProjects(false);
            })
            .catch((error: Error) => {
                console.error(`Error loading more projects:`, error);
                setIsLoadingProjects(false);
            });
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