import { ProjectCategory } from '@/types/project';
import { categoryColors } from '@/styles/colors';

export const getCategoryColor = (category: ProjectCategory | null): string => {
    if (!category) return categoryColors.OTHER;
    return categoryColors[category] || categoryColors.OTHER;
}; 