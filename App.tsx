import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import WatchPage from './pages/WatchPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

// Layout للصفحات بعد تسجيل الدخول
const ProtectedLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-grow">
      <Outlet />
    </main>
  </div>
);

// شاشة البداية (Splash)
const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, 4000); // 3 ثواني
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="splash-screen">
      <h1 className="typing-text">Plan x</h1>
    </div>
  );
};

const App: React.FC = () => {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => event.preventDefault();
    const handleDragStart = (event: DragEvent) => {
      if (
        event.target instanceof HTMLImageElement ||
        event.target instanceof HTMLAnchorElement ||
        event.target instanceof HTMLVideoElement
      ) {
        event.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  return (
    <AuthProvider>
      <HashRouter>
        {/* نرندر كل الصفحات في الخلفية */}
        <div style={{ visibility: splashDone ? 'visible' : 'hidden' }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <ProtectedLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HomePage />} />
              <Route path="watch/:resourceId" element={<WatchPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route
                path="admin"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </div>

        {/* الـ Splash فوق الكل */}
        {!splashDone && <SplashScreen onFinish={() => setSplashDone(true)} />}
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
