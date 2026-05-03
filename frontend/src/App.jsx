import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ExplorePage from './pages/ExplorePage';
import MarketDetailPage from './pages/MarketDetailPage';
import PortfolioPage from './pages/PortfolioPage';
import NewsPage from './pages/NewsPage';
import SettingsPage from './pages/SettingsPage';

function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  // If not signed in, redirect to auth (but allow auth page)
  if (!session) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Navigate to="/" replace />} />
        <Route element={<Layout />}>
          <Route path="/"          element={<DashboardPage />} />
          <Route path="/explore"   element={<ExplorePage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/markets/:id" element={<MarketDetailPage />} />
          <Route path="/news"      element={<NewsPage />} />
          <Route path="/settings"  element={<SettingsPage />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
