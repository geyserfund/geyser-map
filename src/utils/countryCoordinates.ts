// This is a simplified mapping of country codes to coordinates
// In a real application, you might want to use a more comprehensive dataset
// or a geocoding API

interface CountryCoordinate {
    lat: number;
    lng: number;
}

export const countryCoordinates: Record<string, CountryCoordinate> = {
    // North America
    US: { lat: 37.0902, lng: -95.7129 }, // United States
    USA: { lat: 37.0902, lng: -95.7129 }, // United States (3-letter)
    CA: { lat: 56.1304, lng: -106.3468 }, // Canada
    CAN: { lat: 56.1304, lng: -106.3468 }, // Canada (3-letter)
    MX: { lat: 23.6345, lng: -102.5528 }, // Mexico
    MEX: { lat: 23.6345, lng: -102.5528 }, // Mexico (3-letter)

    // South America
    BR: { lat: -14.235, lng: -51.9253 }, // Brazil
    BRA: { lat: -14.235, lng: -51.9253 }, // Brazil (3-letter)
    AR: { lat: -38.4161, lng: -63.6167 }, // Argentina
    ARG: { lat: -38.4161, lng: -63.6167 }, // Argentina (3-letter)
    CO: { lat: 4.5709, lng: -74.2973 }, // Colombia
    COL: { lat: 4.5709, lng: -74.2973 }, // Colombia (3-letter)

    // Europe
    GB: { lat: 55.3781, lng: -3.4360 }, // United Kingdom
    GBR: { lat: 55.3781, lng: -3.4360 }, // United Kingdom (3-letter)
    DE: { lat: 51.1657, lng: 10.4515 }, // Germany
    DEU: { lat: 51.1657, lng: 10.4515 }, // Germany (3-letter)
    FR: { lat: 46.2276, lng: 2.2137 }, // France
    FRA: { lat: 46.2276, lng: 2.2137 }, // France (3-letter)
    ES: { lat: 40.4637, lng: -3.7492 }, // Spain
    ESP: { lat: 40.4637, lng: -3.7492 }, // Spain (3-letter)
    IT: { lat: 41.8719, lng: 12.5674 }, // Italy
    ITA: { lat: 41.8719, lng: 12.5674 }, // Italy (3-letter)
    NL: { lat: 52.1326, lng: 5.2913 }, // Netherlands
    NLD: { lat: 52.1326, lng: 5.2913 }, // Netherlands (3-letter)
    SE: { lat: 60.1282, lng: 18.6435 }, // Sweden
    SWE: { lat: 60.1282, lng: 18.6435 }, // Sweden (3-letter)
    NO: { lat: 60.4720, lng: 8.4689 }, // Norway
    NOR: { lat: 60.4720, lng: 8.4689 }, // Norway (3-letter)
    FI: { lat: 61.9241, lng: 25.7482 }, // Finland
    FIN: { lat: 61.9241, lng: 25.7482 }, // Finland (3-letter)
    DK: { lat: 56.2639, lng: 9.5018 }, // Denmark
    DNK: { lat: 56.2639, lng: 9.5018 }, // Denmark (3-letter)
    CH: { lat: 46.8182, lng: 8.2275 }, // Switzerland
    CHE: { lat: 46.8182, lng: 8.2275 }, // Switzerland (3-letter)
    AT: { lat: 47.5162, lng: 14.5501 }, // Austria
    AUT: { lat: 47.5162, lng: 14.5501 }, // Austria (3-letter)
    BE: { lat: 50.5039, lng: 4.4699 }, // Belgium
    BEL: { lat: 50.5039, lng: 4.4699 }, // Belgium (3-letter)
    IE: { lat: 53.1424, lng: -7.6921 }, // Ireland
    IRL: { lat: 53.1424, lng: -7.6921 }, // Ireland (3-letter)
    PT: { lat: 39.3999, lng: -8.2245 }, // Portugal
    PRT: { lat: 39.3999, lng: -8.2245 }, // Portugal (3-letter)
    GR: { lat: 39.0742, lng: 21.8243 }, // Greece
    GRC: { lat: 39.0742, lng: 21.8243 }, // Greece (3-letter)
    PL: { lat: 51.9194, lng: 19.1451 }, // Poland
    POL: { lat: 51.9194, lng: 19.1451 }, // Poland (3-letter)
    CZ: { lat: 49.8175, lng: 15.4730 }, // Czech Republic
    CZE: { lat: 49.8175, lng: 15.4730 }, // Czech Republic (3-letter)
    RO: { lat: 45.9432, lng: 24.9668 }, // Romania
    ROU: { lat: 45.9432, lng: 24.9668 }, // Romania (3-letter)
    HU: { lat: 47.1625, lng: 19.5033 }, // Hungary
    HUN: { lat: 47.1625, lng: 19.5033 }, // Hungary (3-letter)

    // Asia
    CN: { lat: 35.8617, lng: 104.1954 }, // China
    CHN: { lat: 35.8617, lng: 104.1954 }, // China (3-letter)
    JP: { lat: 36.2048, lng: 138.2529 }, // Japan
    JPN: { lat: 36.2048, lng: 138.2529 }, // Japan (3-letter)
    IN: { lat: 20.5937, lng: 78.9629 }, // India
    IND: { lat: 20.5937, lng: 78.9629 }, // India (3-letter)
    KR: { lat: 35.9078, lng: 127.7669 }, // South Korea
    KOR: { lat: 35.9078, lng: 127.7669 }, // South Korea (3-letter)
    SG: { lat: 1.3521, lng: 103.8198 }, // Singapore
    SGP: { lat: 1.3521, lng: 103.8198 }, // Singapore (3-letter)
    TH: { lat: 15.8700, lng: 100.9925 }, // Thailand
    THA: { lat: 15.8700, lng: 100.9925 }, // Thailand (3-letter)
    MY: { lat: 4.2105, lng: 101.9758 }, // Malaysia
    MYS: { lat: 4.2105, lng: 101.9758 }, // Malaysia (3-letter)
    ID: { lat: -0.7893, lng: 113.9213 }, // Indonesia
    IDN: { lat: -0.7893, lng: 113.9213 }, // Indonesia (3-letter)
    PH: { lat: 12.8797, lng: 121.7740 }, // Philippines
    PHL: { lat: 12.8797, lng: 121.7740 }, // Philippines (3-letter)
    VN: { lat: 14.0583, lng: 108.2772 }, // Vietnam
    VNM: { lat: 14.0583, lng: 108.2772 }, // Vietnam (3-letter)

    // Africa
    ZA: { lat: -30.5595, lng: 22.9375 }, // South Africa
    ZAF: { lat: -30.5595, lng: 22.9375 }, // South Africa (3-letter)
    NG: { lat: 9.0820, lng: 8.6753 }, // Nigeria
    NGA: { lat: 9.0820, lng: 8.6753 }, // Nigeria (3-letter)
    EG: { lat: 26.8206, lng: 30.8025 }, // Egypt
    EGY: { lat: 26.8206, lng: 30.8025 }, // Egypt (3-letter)
    KE: { lat: -0.0236, lng: 37.9062 }, // Kenya
    KEN: { lat: -0.0236, lng: 37.9062 }, // Kenya (3-letter)
    MA: { lat: 31.7917, lng: -7.0926 }, // Morocco
    MAR: { lat: 31.7917, lng: -7.0926 }, // Morocco (3-letter)
    GH: { lat: 7.9465, lng: -1.0232 }, // Ghana
    GHA: { lat: 7.9465, lng: -1.0232 }, // Ghana (3-letter)

    // Oceania
    AU: { lat: -25.2744, lng: 133.7751 }, // Australia
    AUS: { lat: -25.2744, lng: 133.7751 }, // Australia (3-letter)
    NZ: { lat: -40.9006, lng: 174.8860 }, // New Zealand
    NZL: { lat: -40.9006, lng: 174.8860 }, // New Zealand (3-letter)

    // Middle East
    IL: { lat: 31.0461, lng: 34.8516 }, // Israel
    ISR: { lat: 31.0461, lng: 34.8516 }, // Israel (3-letter)
    AE: { lat: 23.4241, lng: 53.8478 }, // UAE
    ARE: { lat: 23.4241, lng: 53.8478 }, // UAE (3-letter)
    SA: { lat: 23.8859, lng: 45.0792 }, // Saudi Arabia
    SAU: { lat: 23.8859, lng: 45.0792 }, // Saudi Arabia (3-letter)
    TR: { lat: 38.9637, lng: 35.2433 }, // Turkey
    TUR: { lat: 38.9637, lng: 35.2433 }, // Turkey (3-letter)

    // Additional countries from your data
    PSE: { lat: 31.9522, lng: 35.2332 }, // Palestine
};

export const getCountryCoordinates = (countryCode: string): CountryCoordinate => {
    // Normalize country code to uppercase
    const normalizedCode = countryCode.toUpperCase();
    return countryCoordinates[normalizedCode] || { lat: 0, lng: 0 };
}; 