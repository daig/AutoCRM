import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from './theme';
import { Layout } from './components/Layout';
import { CRMPage } from './pages/CRMPage';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<CRMPage />} />
            {/* Add more routes as needed */}
          </Routes>
        </Layout>
      </Router>
    </ChakraProvider>
  );
}

export default App;
