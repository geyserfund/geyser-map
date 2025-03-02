export enum ProjectStatus {
    INACTIVE = 'inactive',
    ACTIVE = 'active',
    DRAFT = 'draft',
    DELETED = 'deleted',
    IN_REVIEW = 'in_review',
    CLOSED = 'closed',
}

export enum ProjectCategory {
    EDUCATION = 'EDUCATION',
    COMMUNITY = 'COMMUNITY',
    CULTURE = 'CULTURE',
    ADVOCACY = 'ADVOCACY',
    TOOL = 'TOOL',
    CAUSE = 'CAUSE',
    OTHER = 'OTHER',
}

export enum ProjectSubCategory {
    // EDUCATION
    COURSE = 'COURSE',
    CONTENT_CREATOR = 'CONTENT_CREATOR',
    JOURNALISM = 'JOURNALISM',
    BOOK = 'BOOK',
    PODCAST = 'PODCAST',

    // COMMUNITY
    EVENT = 'EVENT',
    CIRCULAR_ECONOMY = 'CIRCULAR_ECONOMY',
    MEETUP = 'MEETUP',
    HACKER_SPACE = 'HACKER_SPACE',

    // CULTURE
    FILM = 'FILM',
    ART = 'ART',
    GAME = 'GAME',
    MUSIC = 'MUSIC',
    COLLECTIBLE = 'COLLECTIBLE',

    // ADVOCACY
    LEGAL_FUND = 'LEGAL_FUND',
    LOBBY = 'LOBBY',
    PROMOTION = 'PROMOTION',

    // TOOL
    OS_SOFTWARE = 'OS_SOFTWARE',
    HARDWARE = 'HARDWARE',
    APP = 'APP',

    // CAUSE
    HUMANITARIAN = 'HUMANITARIAN',
    FUNDRAISER = 'FUNDRAISER',
    TRAVEL = 'TRAVEL',
    MEDICAL = 'MEDICAL',

    OTHER = 'OTHER',
}

export interface Country {
    code: string;
    name: string;
}

export interface Location {
    country: Country;
    region: string;
}

export interface Project {
    id: string;
    title: string;
    name: string;
    description: string;
    shortDescription: string;
    balance: number;
    balanceUsdCent: number;
    createdAt: string;
    updatedAt: string;
    launchedAt: string;
    thumbnailImage: string;
    category: ProjectCategory;
    subCategory: ProjectSubCategory;
    images: string[];
    status: ProjectStatus;
    location: Location;
}

export interface ProjectsResponse {
    projects: Project[];
}

export interface ProjectsGetQueryInput {
    where: ProjectsGetWhereInput;
    orderBy?: ProjectsOrderByInput[];
    pagination?: PaginationInput;
}

export interface ProjectsGetWhereInput {
    status?: ProjectStatus;
    category?: ProjectCategory;
    subCategory?: ProjectSubCategory;
    countryCode?: string;
    region?: string;
}

export interface ProjectsOrderByInput {
    field: string;
    direction: 'ASC' | 'DESC';
}

export interface PaginationInput {
    limit: number;
    offset: number;
} 