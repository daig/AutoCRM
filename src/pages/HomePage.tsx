import { Box, Heading, VStack, Button, Text, useColorModeValue } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export function HomePage() {
  const navigate = useNavigate();
  const { userRole } = useUser();
  const bgColor = useColorModeValue('gray.100', 'gray.700');

  return (
    <Box p={8} maxW="container.xl" mx="auto">
      <VStack spacing={8} align="stretch">
        <Box bg={bgColor} p={8} borderRadius="lg" textAlign="center">
          <Heading mb={4}>Welcome to AutoCRM</Heading>
          <Text fontSize="lg" mb={6}>
            Your intelligent customer relationship management solution
          </Text>
        </Box>

        <VStack spacing={4}>
          <Button 
            colorScheme="blue" 
            size="lg" 
            width="100%" 
            maxW="400px"
            onClick={() => navigate('/crm/create-ticket')}
          >
            Create New Ticket
          </Button>

          {userRole === 'administrator' && (
            <Button 
              colorScheme="purple" 
              size="lg" 
              width="100%" 
              maxW="400px"
              onClick={() => navigate('/admin')}
            >
              Admin Dashboard
            </Button>
          )}

          {(userRole === 'administrator' || userRole === 'agent') && (
            <Button 
              colorScheme="teal" 
              size="lg" 
              width="100%" 
              maxW="400px"
              onClick={() => navigate('/crm')}
            >
              CRM Dashboard
            </Button>
          )}
        </VStack>
      </VStack>
    </Box>
  );
} 