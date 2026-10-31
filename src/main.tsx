import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './ErrorBoundary'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<div className="loading-screen" role="status">Caricamento…</div>}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
)
