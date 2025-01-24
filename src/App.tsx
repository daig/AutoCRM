import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ChakraProvider, Center, Spinner } from '@chakra-ui/react';
import { theme } from './theme';
import { Layout } from './components/Layout';
import { CRMPage } from './pages/CRMPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { CreateTicketPage } from './pages/CreateTicketPage';
import { AdminPage } from './pages/AdminPage';
import { UserProvider, useUser } from './context/UserContext';
import { useEffect, useState } from 'react';
import { supabase } from './config/supabase';

// Protected Route wrapper component
function ProtectedRoute({ children, requiredRole }: { children: JSX.Element, requiredRole?: 'administrator' | 'agent' | 'customer' }) {
  const { isAuthenticated, isLoading, userId } = useUser();
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!userId) {
        setIsCheckingRole(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();

        if (error) throw error;
        setUserRole(data.role);
      } catch (error) {
        console.error('Error checking user role:', error);
      } finally {
        setIsCheckingRole(false);
      }
    };

    checkUserRole();
  }, [userId]);

  if (isLoading || isCheckingRole) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a required role is specified and the user doesn't have it
  if (requiredRole && userRole !== requiredRole) {
    // Redirect administrators to the admin page
    if (userRole === 'administrator') {
      return <Navigate to="/admin" replace />;
    }
    // Redirect others to the CRM page
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
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="administrator">
                <Layout>
                  <AdminPage />
                </Layout>
              </ProtectedRoute>
            } />
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
            <Route path="/" element={<Navigate to="/crm" replace />} />
          </Routes>
        </Router>
      </UserProvider>
    </ChakraProvider>
  );
}

export default App;
