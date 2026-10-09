import { Routes, Route } from 'react-router-dom';
import { SiteConfigProvider, useSiteConfig } from './config/SiteConfigContext';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { BookDetailPage } from './pages/BookDetailPage';
import { SetupWizard } from './pages/SetupWizard';
import { NotFoundPage } from './pages/NotFoundPage';

function AppRoutes() {
  const { config, isLoading } = useSiteConfig();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!config?.setupComplete) {
    return <SetupWizard />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/books" element={<CatalogPage />} />
        <Route path="/books/:slug" element={<BookDetailPage />} />
        <Route path="/setup" element={<SetupWizard />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}

export function App() {
  return (
    <SiteConfigProvider>
      <AppRoutes />
    </SiteConfigProvider>
  );
}
