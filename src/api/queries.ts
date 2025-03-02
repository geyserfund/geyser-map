import { gql } from '@apollo/client';

export const GET_PROJECTS = gql`
  query ProjectsGet($input: ProjectsGetQueryInput!) {
    projectsGet(input: $input) {
      projects {
        id
        title
        name
        shortDescription
        balance
        balanceUsdCent
        thumbnailImage
        category
        subCategory
        status
        location {
          country {
            code
            name
          }
          region
        }
      }
    }
  }
`;

export const GET_PROJECT_COUNTRIES = gql`
  query ProjectCountriesGet($input: ProjectCountriesGetInput) {
    projectCountriesGet(input: $input) {
      country {
        code
        name
      }
      count
    }
  }
`;

export const GET_PROJECTS_BY_COUNTRY = gql`
  query ProjectsGetByCountry($input: ProjectsGetQueryInput!) {
    projectsGet(input: $input) {
      projects {
        id
        title
        name
        description
        shortDescription
        balance
        balanceUsdCent
        thumbnailImage
        category
        subCategory
        status
        location {
          country {
            code
            name
          }
          region
        }
      }
      summary {
        projectsCount
        fundersCount
        fundedTotal
      }
    }
  }
`;

export const GET_PROJECT_REGIONS = gql`
  query ProjectRegionsGet {
    projectRegionsGet {
      region
      count
    }
  }
`; 