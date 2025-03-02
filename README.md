# Geyser Map

An interactive world map dashboard for exploring Geyser projects by location.

## Features

- Interactive world map showing all projects based on their country location
- Filter projects by category and sub-category
- Responsive design that works on desktop and mobile devices
- Uses Geyser's GraphQL API for data

## Technology Stack

- React
- TypeScript
- Apollo Client for GraphQL
- Leaflet for interactive maps
- React-Select for dropdown filters
- Styled with CSS and Geyser's brand colors

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Yarn or npm
- Docker and Docker Compose (for containerized setup)

### Installation

#### Local Development

1. Clone the repository
2. Navigate to the project directory:
   ```
   cd geyser-map
   ```
3. Install dependencies:
   ```
   yarn install
   ```
   or
   ```
   npm install
   ```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_GRAPHQL_API_URL=http://localhost:4000/graphql
```

Replace the URL with your GraphQL API endpoint.

### Development

#### Local Development

Start the development server:

```
yarn dev
```

or

```
npm run dev
```

The application will be available at `http://localhost:3001`.

#### Docker Development

The application is configured to run in Docker as part of the Geyser platform:

1. Make sure Docker and Docker Compose are installed
2. From the root of the Geyser project, run:
   ```
   docker-compose up geyser-map
   ```
   or to run all services:
   ```
   docker-compose up
   ```

When running in Docker, the application will be available at `http://localhost:3002`.

### Building for Production

Build the application:

```
yarn build
```

or

```
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

- `src/components/` - React components
- `src/api/` - GraphQL queries
- `src/hooks/` - Custom React hooks
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions
- `src/styles/` - CSS and style-related files

## License

This project is part of the Geyser platform and is subject to its licensing terms. 