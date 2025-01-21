import { ReactNode } from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const headerBg = useColorModeValue('brand.500', 'brand.400');
  const navigate = useNavigate();

  return (
    <Flex direction="column" minH="100vh">
      <Box as="header" bg={headerBg} color="white" py={4}>
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <Heading size="lg">AutoCRM</Heading>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="whiteAlpha"
              onClick={() => navigate('/crm/create-ticket')}
            >
              Create Ticket
            </Button>
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