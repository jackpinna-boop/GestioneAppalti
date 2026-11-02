import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './ErrorBoundary'
import Notifications from './Notifications'
import './styles.css'
import { installPageTitle } from './lib/pageTitle'

installPageTitle()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<div className="loading-screen" role="status">Caricamento…</div>}>
        <App />
      </Suspense>
      <Notifications />
    </ErrorBoundary>
  </React.StrictMode>
)
