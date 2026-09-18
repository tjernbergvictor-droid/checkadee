import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './i18n/LanguageContext'
import { ListsProvider } from './state/ListsContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <ListsProvider>
          <App />
        </ListsProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
