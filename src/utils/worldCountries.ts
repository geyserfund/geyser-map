// This file contains a simplified GeoJSON for world countries
// The data is sourced from Natural Earth and is in the public domain
// For a more detailed or up-to-date version, you can download from:
// https://geojson-maps.kyd.au/ or https://github.com/topojson/world-atlas

import { Feature, FeatureCollection } from 'geojson';

// We'll declare the type but import the actual data from a CDN to keep the bundle size small
export interface CountryFeature extends Feature {
    properties: {
        name: string;
        iso_a2: string;
        iso_a3: string;
    };
}

export interface WorldCountriesGeoJSON extends FeatureCollection {
    features: CountryFeature[];
}

// Function to fetch the GeoJSON data from a CDN
export const fetchWorldCountriesGeoJSON = async (): Promise<WorldCountriesGeoJSON> => {
    // Using a CDN that hosts the Natural Earth data in GeoJSON format
    // This is the low-resolution version (110m) which is suitable for country-level visualization
    const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');

    if (!response.ok) {
        throw new Error('Failed to fetch world countries GeoJSON');
    }

    // The data from world-atlas is in TopoJSON format, so we'll need to convert it
    // For simplicity, we'll use a pre-converted GeoJSON version
    const alternativeResponse = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');

    if (!alternativeResponse.ok) {
        throw new Error('Failed to fetch alternative world countries GeoJSON');
    }

    const data = await alternativeResponse.json();

    // Debug: Check if Brazil exists in the data
    const brazilFeature = data.features.find((f: CountryFeature) =>
        f.properties?.iso_a2 === 'BR' || f.properties?.iso_a3 === 'BRA'
    );
    console.log('Brazil feature in GeoJSON:', brazilFeature);

    // Debug: Log all country codes to check format
    const countryCodes = data.features.map((f: CountryFeature) => ({
        name: f.properties?.name,
        iso_a2: f.properties?.iso_a2,
        iso_a3: f.properties?.iso_a3
    }));
    console.log('Sample of country codes in GeoJSON:', countryCodes.slice(0, 10));

    return data;
}; 