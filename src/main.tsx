import React from 'react'
import ReactDOM from 'react-dom/client'
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import App from './App'
import './styles/global.css'
import { ThemeProvider } from './context/ThemeContext'

// Add type declaration for import.meta.env
declare global {
  interface ImportMeta {
    env: {
      VITE_APP_API_ENDPOINT: string;
      [key: string]: string;
    }
  }
}

// Create Apollo Client
const client = new ApolloClient({
  uri: `${import.meta.env.VITE_APP_API_ENDPOINT}/graphql`,
  cache: new InMemoryCache(),
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ApolloProvider client={client}>
        <App />
      </ApolloProvider>
    </ThemeProvider>
  </React.StrictMode>,
) 