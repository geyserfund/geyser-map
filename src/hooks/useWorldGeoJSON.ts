import { useState, useEffect } from 'react';
import { fetchWorldCountriesGeoJSON, WorldCountriesGeoJSON } from '@/utils/worldCountries';

interface UseWorldGeoJSONResult {
    worldGeoJSON: WorldCountriesGeoJSON | null;
    countryCodeMap: Record<string, string>;
}

export const useWorldGeoJSON = (): UseWorldGeoJSONResult => {
    const [worldGeoJSON, setWorldGeoJSON] = useState<WorldCountriesGeoJSON | null>(null);
    const [countryCodeMap, setCountryCodeMap] = useState<Record<string, string>>({});

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

    return {
        worldGeoJSON,
        countryCodeMap
    };
}; 