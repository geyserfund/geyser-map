import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_PROJECT_COUNTRIES } from '@/api/queries';
import { ProjectCategory, ProjectSubCategory } from '@/types/project';
import { calculateColorThresholds } from '@/components/map/MapLegend';

interface CountryData {
    country: {
        code: string;
        name: string;
    };
    count: number;
}

interface UseCountryDataResult {
    countryProjectCounts: Record<string, number>;
    countryCodeMap: Record<string, string>;
    maxProjectCount: number;
    colorScaleThresholds: number[];
    countryDataLoading: boolean;
    refetchCountryData: () => void;
}

export const useCountryData = (
    selectedCategory: ProjectCategory | null,
    selectedSubCategory: ProjectSubCategory | null
): UseCountryDataResult => {
    const [countryProjectCounts, setCountryProjectCounts] = useState<Record<string, number>>({});
    const [countryCodeMap, setCountryCodeMap] = useState<Record<string, string>>({});
    const [maxProjectCount, setMaxProjectCount] = useState<number>(0);
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

    return {
        countryProjectCounts,
        countryCodeMap,
        maxProjectCount,
        colorScaleThresholds,
        countryDataLoading,
        refetchCountryData
    };
}; 