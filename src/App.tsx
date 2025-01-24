import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ChakraProvider, Center, Spinner } from '@chakra-ui/react';
import { theme } from './theme';
import { Layout } from './components/Layout';
import { CRMPage } from './pages/CRMPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { CreateTicketPage } from './pages/CreateTicketPage';
import AdminPage from './pages/AdminPage';
import { HomePage } from './pages/HomePage';
import { UserProvider, useUser } from './context/UserContext';

// Protected Route wrapper component
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading } = useUser();
  const location = useLocation();

  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Admin Route wrapper component
function AdminRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading, userRole } = useUser();
  const location = useLocation();

  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (userRole !== 'administrator') {
    return <Navigate to="/crm" replace />;
  }

  return children;
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/crm" element={
              <ProtectedRoute>
                <Layout>
                  <CRMPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/crm/create-ticket" element={
              <ProtectedRoute>
                <Layout>
                  <CreateTicketPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <Layout>
                  <AdminPage />
                </Layout>
              </AdminRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <HomePage />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </UserProvider>
    </ChakraProvider>
  );
}

export default App;
