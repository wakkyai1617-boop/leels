import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/archivo/standard.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
// Variable JP font: one woff2 set covers the 400/500 weights in use (static
// per-weight packages shipped woff + woff2 for every weight, ~18MB of output).
import '@fontsource-variable/noto-sans-jp/wght.css'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
