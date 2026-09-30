import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.jsx'

// StrictMode is left off on purpose: its double-invoked effects would push
// duplicate history entries during development.
createRoot(document.getElementById('root')).render(<App />)
