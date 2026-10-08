import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router'
import { ClerkProvider } from '@clerk/react-router'
import { Toaster } from 'sonner'
import { RequireAuth, RequireCreator, SignInPage, SignUpPage } from './components/auth'
import { DashboardLayout } from './layouts/DashboardLayout'
import { PublicLayout } from './layouts/PublicLayout'
import { CLERK_PUBLISHABLE_KEY, clerkAppearance } from './lib/auth'
import { BatchAdmin } from './pages/dashboard/BatchAdmin'
import { Dashboard } from './pages/dashboard/Dashboard'
import { NewBatch } from './pages/dashboard/NewBatch'
import { Onboarding } from './pages/dashboard/Onboarding'
import { Outbox } from './pages/dashboard/Outbox'
import { Settings } from './pages/dashboard/Settings'
import { MyOrders } from './pages/MyOrders'
import { NotFound } from './pages/NotFound'
import { PublicBatch } from './pages/PublicBatch'
import { Storefront } from './pages/Storefront'
import { StudioPage } from './pages/StudioPage'
import { TrackLookup } from './pages/TrackLookup'
import { TrackOrder } from './pages/TrackOrder'

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY — add it to .env.local and restart the dev server.')
}

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        appearance={clerkAppearance}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        afterSignOutUrl="/"
      >
        <ScrollToTop />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<Storefront />} />
            <Route path="b/:batchId" element={<PublicBatch />} />
            <Route path="s/:slug" element={<StudioPage />} />
            <Route path="track" element={<TrackLookup />} />
            <Route path="track/:token" element={<TrackOrder />} />
            <Route path="sign-in/*" element={<SignInPage />} />
            <Route path="sign-up/*" element={<SignUpPage />} />
            <Route
              path="my-orders"
              element={
                <RequireAuth>
                  <MyOrders />
                </RequireAuth>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="dashboard" element={<RequireCreator />}>
            <Route path="onboarding" element={<Onboarding />} />
            <Route element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="batches/new" element={<NewBatch />} />
              <Route path="batches/:batchId" element={<BatchAdmin />} />
              <Route path="outbox" element={<Outbox />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
        <Toaster position="top-center" richColors closeButton toastOptions={{ className: 'font-sans' }} />
      </ClerkProvider>
    </BrowserRouter>
  )
}
