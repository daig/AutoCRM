import { ReactNode } from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useUser } from '../context/UserContext';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('brand.500', 'brand.400');
  const navigate = useNavigate();
  const toast = useToast();
  const { setUserId } = useUser();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUserId(null);
      navigate('/login');
      
      toast({
        title: 'Logged out successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error logging out',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Flex direction="column" minH="100vh">
      <Box as="header" bg={headerBg} color="white" py={4}>
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <Heading size="lg">AutoCRM</Heading>
            <Flex gap={4}>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="whiteAlpha"
                onClick={() => navigate('/crm/create-ticket')}
              >
                Create Ticket
              </Button>
              <Button
                colorScheme="whiteAlpha"
                variant="outline"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Flex>
          </Flex>
        </Container>
      </Box>
      
      <Container as="main" maxW="container.xl" flex="1" py={8}>
        {children}
      </Container>

      <Box as="footer" bg={bgColor} py={6}>
        <Container maxW="container.sm">
          <Text textAlign="center" color="gray.500">
            © {new Date().getFullYear()} AutoCRM v1
          </Text>
        </Container>
      </Box>
    </Flex>
  );
}; 