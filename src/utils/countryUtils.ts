import { getCountryCoordinates as getCoordinatesFromCode } from '@/utils/countryCoordinates';

// Get coordinates for a country as [number, number]
export const getSelectedCountryCoordinates = (
    selectedCountry: string | null,
    countryCodeMap: Record<string, string>,
    defaultPosition: [number, number]
): [number, number] => {
    if (!selectedCountry) return defaultPosition;

    // Special handling for United States
    if (selectedCountry === 'United States' || selectedCountry === 'USA') {
        console.log('Using hardcoded coordinates for United States');
        return [37.0902, -95.7129]; // Hardcoded US coordinates
    }

    // Find the country code for the selected country name
    const countryCode = Object.keys(countryCodeMap).find(code => countryCodeMap[code] === selectedCountry);
    console.log(`Looking up coordinates for ${selectedCountry} with code ${countryCode}`);

    if (countryCode) {
        const coords = getCoordinatesFromCode(countryCode);
        console.log(`Found coordinates for ${selectedCountry}: ${coords.lat}, ${coords.lng}`);
        return [coords.lat, coords.lng];
    }

    console.warn(`Could not find coordinates for ${selectedCountry}, using default position`);
    return defaultPosition;
}; 