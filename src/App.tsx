import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from './theme';
import { Layout } from './components/Layout';
import { TagList } from './components/TagList';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<TagList />} />
            {/* Add more routes as needed */}
          </Routes>
        </Layout>
      </Router>
    </ChakraProvider>
  );
}

export default App;
