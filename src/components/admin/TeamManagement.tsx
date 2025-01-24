import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  List,
  ListItem,
  Select,
  Text,
  VStack,
  useToast,
  IconButton,
  HStack,
  Collapse,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';

interface Team {
  id: string;
  name: string;
  team_lead?: string;
  team_lead_user?: {
    id: string;
    full_name: string;
  };
}

interface User {
  id: string;
  full_name: string;
  role: string;
}

export const TeamManagement = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const toast = useToast();

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_lead_user:users!teams_team_lead_fkey (
            id,
            full_name
          )
        `)
        .order('name');

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: 'Error fetching teams',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, role')
        .eq('role', 'agent')
        .order('full_name');

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: 'Error fetching agents',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchAgents();
  }, []);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;

    try {
      const { error } = await supabase
        .from('teams')
        .insert([{ name: newTeamName.trim() }]);

      if (error) throw error;

      toast({
        title: 'Team created',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setNewTeamName('');
      fetchTeams();
    } catch (error) {
      toast({
        title: 'Error creating team',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      toast({
        title: 'Team deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchTeams();
    } catch (error) {
      toast({
        title: 'Error deleting team',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAssignTeamLead = async (teamId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update({ team_lead: userId })
        .eq('id', teamId);

      if (error) throw error;

      toast({
        title: 'Team lead assigned',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchTeams();
    } catch (error) {
      toast({
        title: 'Error assigning team lead',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <VStack align="stretch" spacing={6}>
        <Box>
          <Heading size="md" mb={4}>Create New Team</Heading>
          <HStack>
            <FormControl>
              <Input
                placeholder="Enter team name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
            </FormControl>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              onClick={handleCreateTeam}
            >
              Create
            </Button>
          </HStack>
        </Box>

        <Box>
          <Heading size="md" mb={4}>Teams</Heading>
          <List spacing={2}>
            {teams.map((team) => (
              <ListItem
                key={team.id}
                p={3}
                borderWidth={1}
                borderRadius="md"
              >
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between">
                    <Box>
                      <Text fontWeight="bold">{team.name}</Text>
                      {team.team_lead_user && (
                        <Text fontSize="sm" color="gray.600">
                          Lead: {team.team_lead_user.full_name}
                        </Text>
                      )}
                    </Box>
                    <HStack>
                      <IconButton
                        aria-label={expandedTeam === team.id ? "Collapse" : "Expand"}
                        icon={expandedTeam === team.id ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        variant="ghost"
                        onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
                      />
                      <IconButton
                        aria-label="Delete team"
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDeleteTeam(team.id)}
                      />
                    </HStack>
                  </HStack>

                  <Collapse in={expandedTeam === team.id}>
                    <Box pt={2}>
                      <FormControl>
                        <FormLabel>Team Lead</FormLabel>
                        <Select
                          value={team.team_lead || ''}
                          onChange={(e) => handleAssignTeamLead(team.id, e.target.value)}
                        >
                          <option value="">Select a team lead</option>
                          {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.full_name}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Collapse>
                </VStack>
              </ListItem>
            ))}
          </List>
        </Box>
      </VStack>
    </Box>
  );
}; 