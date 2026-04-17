import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

const PageSetPassword = lazy(
  () => import('./pages/PageSetPassword/PageSetPassword.tsx'),
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/homescreen">
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/set-password" element={<PageSetPassword />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)
