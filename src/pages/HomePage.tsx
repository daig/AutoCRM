import { Box, Heading, VStack, Button, Text, useColorModeValue } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export function HomePage() {
  const navigate = useNavigate();
  const { userRole, userId } = useUser();
  const bgColor = useColorModeValue('gray.100', 'gray.700');
  const [isTeamLead, setIsTeamLead] = useState(false);

  useEffect(() => {
    const checkTeamLeadStatus = async () => {
      if (!userId) return;

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
      }
    };

    checkTeamLeadStatus();
  }, [userId]);

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

          {isTeamLead && (
            <Button 
              colorScheme="teal" 
              size="lg" 
              width="100%" 
              maxW="400px"
              onClick={() => navigate('/manager')}
            >
              Team Management
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