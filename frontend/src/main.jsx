import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import './index.css'
import '@fontsource-variable/source-sans-3'
import './styles/theme.css'
import './i18n'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
