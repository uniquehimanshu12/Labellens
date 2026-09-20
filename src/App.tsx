import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import { ToastProvider } from './components/common/Toast';
import { authService } from './services/authService';
import { storageService } from './services/storageService';
import { AppShell } from './components/layout/AppShell';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NewInspection } from './pages/NewInspection';
import { ReviewQueue } from './pages/ReviewQueue';
import { History } from './pages/History';
import { InspectionDetails } from './pages/InspectionDetails';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { RulesAndReferences } from './pages/RulesAndReferences';
import { PrintableReport } from './components/reports/PrintableReport';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(authService.isAuthenticated());
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');
  const [routeParams, setRouteParams] = useState<{ inspectionId?: string }>({});

  // Sync with URL hash if present
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const [route, param] = hash.split('/');
        if (route) {
          setCurrentRoute(route);
          if (param) {
            setRouteParams({ inspectionId: param });
          }
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route: string, params?: { inspectionId?: string }) => {
    setCurrentRoute(route);
    setRouteParams(params || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (params?.inspectionId) {
      window.location.hash = `${route}/${params.inspectionId}`;
    } else {
      window.location.hash = route;
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    navigateTo('dashboard');
  };

  if (!isAuthenticated) {
    return (
      <LanguageProvider>
        <Login onLoginSuccess={handleLoginSuccess} />
      </LanguageProvider>
    );
  }

  // Standalone Printable Route without AppShell
  if (currentRoute === 'print-report') {
    const targetId = routeParams.inspectionId || storageService.getInspections()[0]?.id || '';
    const inspection = storageService.getInspectionById(targetId) || storageService.getInspections()[0];

    if (!inspection) {
      return (
        <div className="p-8 text-center text-slate-800">
          <p>Inspection record not found.</p>
          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg text-xs"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    return (
      <ToastProvider>
        <PrintableReport
          inspection={inspection}
          onBack={() => navigateTo('inspection-detail', { inspectionId: inspection.id })}
          autoPrint={true}
        />
      </ToastProvider>
    );
  }

  const renderContent = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <Dashboard onNavigate={navigateTo} />;

      case 'new-inspection':
        return <NewInspection onNavigate={navigateTo} isResumingDraft={false} />;

      case 'active-inspection':
        return <NewInspection onNavigate={navigateTo} isResumingDraft={true} />;

      case 'review-queue':
        return <ReviewQueue onNavigate={navigateTo} />;

      case 'history':
        return <History onNavigate={navigateTo} />;

      case 'rules-references':
        return <RulesAndReferences onNavigate={navigateTo} />;

      case 'inspection-detail':
        return (
          <InspectionDetails
            inspectionId={routeParams.inspectionId || storageService.getInspections()[0]?.id || ''}
            onNavigate={navigateTo}
          />
        );

      case 'reports':
        return <Reports onNavigate={navigateTo} selectedInspectionId={routeParams.inspectionId} />;

      case 'settings':
        return <Settings onNavigate={navigateTo} />;

      default:
        return <Dashboard onNavigate={navigateTo} />;
    }
  };

  return (
    <LanguageProvider>
      <ToastProvider>
        <AppShell
          currentRoute={currentRoute}
          onNavigate={navigateTo}
          onLogout={handleLogout}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentRoute + (routeParams.inspectionId || '')}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </AppShell>
      </ToastProvider>
    </LanguageProvider>
  );
}
