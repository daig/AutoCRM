import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ChakraProvider, Center, Spinner } from '@chakra-ui/react';
import { theme } from './theme';
import { Layout } from './components/Layout';
import { CRMPage } from './pages/CRMPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { CreateTicketPage } from './pages/CreateTicketPage';
import AdminPage from './pages/AdminPage';
import ManagerPage from './pages/ManagerPage';
import { HomePage } from './pages/HomePage';
import { UserProvider, useUser } from './context/UserContext';
import { useState, useEffect } from 'react';
import { supabase } from './config/supabase';

// Protected Route wrapper component
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading, userId, userRole } = useUser();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isTeamLead, setIsTeamLead] = useState(false);

  useEffect(() => {
    const checkTeamLeadStatus = async () => {
      if (!userId) {
        setIsChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('is_team_lead')
          .eq('id', userId)
          .single();

        if (error) throw error;
        setIsTeamLead(data.is_team_lead);
      } catch (error) {
        console.error('Error checking team lead status:', error);
        setIsTeamLead(false);
      } finally {
        setIsChecking(false);
      }
    };

    if (userId) {
      checkTeamLeadStatus();
    }
  }, [userId]);

  if (isLoading || (isAuthenticated && isChecking)) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If we're at the root path, redirect based on role
  if (location.pathname === '/') {
    if (userRole === 'administrator') {
      return <Navigate to="/admin" replace />;
    } else if (userRole === 'agent') {
      return <Navigate to={isTeamLead ? '/manager' : '/crm'} replace />;
    } else {
      return <Navigate to="/crm/create-ticket" replace />;
    }
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
    // If authenticated but wrong role, redirect to home
    return <Navigate to="/" replace />;
  }

  return children;
}

// Manager Route wrapper component
function ManagerRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading: authLoading, userId } = useUser();
  const location = useLocation();
  const [isTeamLead, setIsTeamLead] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkTeamLeadStatus = async () => {
      if (!userId) {
        setIsChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('is_team_lead')
          .eq('id', userId)
          .single();

        if (error) throw error;
        setIsTeamLead(data.is_team_lead);
      } catch (error) {
        console.error('Error checking team lead status:', error);
        setIsTeamLead(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkTeamLeadStatus();
  }, [userId]);

  // Show loading spinner while checking authentication or team lead status
  if (authLoading || isChecking) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Only redirect if we've finished checking and user is not a team lead
  if (!isChecking && !isTeamLead) {
    // If authenticated but not a team lead, redirect to home
    return <Navigate to="/" replace />;
  }

  return children;
}

// Auth Route wrapper component
function AuthRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, isLoading, userId } = useUser();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  
  useEffect(() => {
    const checkUserRole = async () => {
      if (!userId) {
        setIsChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('role, is_team_lead')
          .eq('id', userId)
          .single();

        if (error) throw error;

        // Determine redirect path based on role
        let path = '/crm/create-ticket'; // default path for customers
        if (data.role === 'administrator') {
          path = '/admin';
        } else if (data.role === 'agent') {
          path = data.is_team_lead ? '/manager' : '/crm';
        }
        
        setRedirectPath(path);
      } catch (error) {
        console.error('Error checking user role:', error);
        setRedirectPath('/crm/create-ticket'); // fallback to customer view
      } finally {
        setIsChecking(false);
      }
    };

    if (userId) {
      checkUserRole();
    }
  }, [userId]);

  if (isLoading || (isAuthenticated && isChecking)) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (isAuthenticated && redirectPath) {
    // If we have a saved location, go there
    if (location.state?.from) {
      return <Navigate to={location.state.from.pathname} replace />;
    }
    // Otherwise use role-based redirect
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/login" element={
              <AuthRoute>
                <LoginPage />
              </AuthRoute>
            } />
            <Route path="/signup" element={
              <AuthRoute>
                <SignupPage />
              </AuthRoute>
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
            <Route path="/admin" element={
              <AdminRoute>
                <Layout>
                  <AdminPage />
                </Layout>
              </AdminRoute>
            } />
            <Route path="/manager" element={
              <ManagerRoute>
                <Layout>
                  <ManagerPage />
                </Layout>
              </ManagerRoute>
            } />
            <Route path="*" element={
              <ProtectedRoute>
                <Navigate to="/" replace />
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </UserProvider>
    </ChakraProvider>
  );
}

export default App;
