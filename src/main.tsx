import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { InstallPromptProvider } from './context/InstallPromptContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <InstallPromptProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </InstallPromptProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
