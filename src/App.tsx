import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from './theme';
import { Layout } from './components/Layout';
import { CRMPage } from './pages/CRMPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { CreateTicketPage } from './pages/CreateTicketPage';
import { UserProvider, useUser } from './context/UserContext';

// Protected Route wrapper component
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useUser();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </UserProvider>
    </ChakraProvider>
  );
}

export default App;
