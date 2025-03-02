import { primaryColors } from '@/styles/colors';

/**
 * Generates a color from the primary color palette based on the count of projects
 * Uses a logarithmic scale to better distribute colors across countries with varying project counts
 * 
 * @param count The number of projects in a country
 * @param maxCount The maximum number of projects in any country
 * @returns A color hex code from the primary color palette
 */
export const getColorByCount = (count: number, maxCount: number): string => {
    // Use a logarithmic scale to better distribute colors
    // This gives more visual distinction to countries with fewer projects
    const logScale = Math.log(count + 1) / Math.log(maxCount + 1);

    // Map the log scale to our color palette indices (50-900)
    // We reverse the scale so higher counts get darker colors
    const colorKeys = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
    const index = Math.min(Math.floor(logScale * colorKeys.length), colorKeys.length - 1);
    const colorKey = colorKeys[index];

    return primaryColors[colorKey as keyof typeof primaryColors];
};

/**
 * Generates a color legend for the map
 * 
 * @param maxCount The maximum number of projects in any country
 * @returns An array of legend items with count ranges and colors
 */
export const generateColorLegend = (maxCount: number) => {
    // Create logarithmically distributed ranges
    const ranges: { min: number; max: number; color: string }[] = [];

    if (maxCount <= 1) {
        return [{ min: 0, max: 1, color: primaryColors[500] }];
    }

    // Create logarithmically distributed ranges
    const logMax = Math.log(maxCount + 1);
    const steps = 5; // Number of legend steps

    for (let i = 0; i < steps; i++) {
        const logMin = (i / steps) * logMax;
        const logMax2 = ((i + 1) / steps) * logMax;

        const min = Math.floor(Math.exp(logMin) - 1);
        const max = Math.floor(Math.exp(logMax2) - 1);

        // Skip duplicate ranges
        if (i > 0 && min === ranges[i - 1].max) {
            continue;
        }

        // Use the midpoint of the range to get the color
        const midCount = Math.floor((min + max) / 2);
        const color = getColorByCount(midCount, maxCount);

        ranges.push({ min, max, color });
    }

    return ranges;
}; 