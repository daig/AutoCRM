import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Textarea,
  Checkbox,
  HStack,
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { supabase } from '../../config/supabase';

interface Team {
  id: string;
  name: string;
  description: string | null;
}

interface TeamMember {
  id: string;
  full_name: string | null;
  is_team_lead: boolean;
}

interface TeamManagementProps {
  onTeamMembershipChange?: () => void;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ onTeamMembershipChange }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>({});
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; full_name: string | null }>>([]);
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [isTeamLead, setIsTeamLead] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchTeams = async () => {
    const { data, error } = await supabase.from('teams').select('*');
    if (error) {
      toast({ title: 'Error fetching teams', status: 'error', duration: 3000 });
      return;
    }
    setTeams(data);
  };

  const fetchTeamMembers = async (teamId: string) => {
    console.log('Fetching team members for team:', teamId);
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, is_team_lead')
      .eq('team_id', teamId);

    if (error) {
      console.error('Error fetching team members:', error);
      toast({ title: 'Error fetching team members', status: 'error', duration: 3000 });
      return;
    }

    console.log('Fetched team members:', data);
    // Create a new object reference to ensure React detects the state change
    setTeamMembers(prev => {
      const newState = { ...prev };
      newState[teamId] = data as TeamMember[];
      return newState;
    });
  };

  const fetchAvailableUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name')
      .is('team_id', null)
      .order('full_name');

    if (error) {
      toast({ title: 'Error fetching users', status: 'error', duration: 3000 });
      return;
    }
    setAvailableUsers(data);
  };

  useEffect(() => {
    fetchTeams();
    fetchAvailableUsers();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers(selectedTeam);
    }
  }, [selectedTeam]);

  const handleCreateTeam = async () => {
    if (!newTeam.name.trim()) {
      toast({ title: 'Team name is required', status: 'error', duration: 3000 });
      return;
    }

    const { error } = await supabase.from('teams').insert([{
      name: newTeam.name,
      description: newTeam.description || null,
    }]);

    if (error) {
      let errorMessage = 'Error creating team';
      if (error.code === '23505') {
        errorMessage = 'A team with this name already exists';
      }
      toast({ title: errorMessage, status: 'error', duration: 3000 });
      return;
    }

    toast({ title: 'Team created', status: 'success', duration: 3000 });
    setNewTeam({ name: '', description: '' });
    fetchTeams();
  };

  const handleDeleteTeam = async (id: string) => {
    // First check if team has members
    const { data: members, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('team_id', id);

    if (checkError) {
      toast({ title: 'Error checking team members', status: 'error', duration: 3000 });
      return;
    }

    if (members && members.length > 0) {
      toast({
        title: 'Cannot delete team',
        description: 'Please remove all team members before deleting the team',
        status: 'error',
        duration: 3000
      });
      return;
    }

    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting team', status: 'error', duration: 3000 });
      return;
    }

    toast({ title: 'Team deleted', status: 'success', duration: 3000 });
    fetchTeams();
    if (selectedTeam === id) {
      setSelectedTeam(null);
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !selectedUser) {
      toast({ title: 'Please select a team and user', status: 'error', duration: 3000 });
      return;
    }

    // If making someone a team lead, check if there's already one
    if (isTeamLead) {
      const { data: existingLeads, error: leadCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('team_id', selectedTeam)
        .eq('is_team_lead', true);

      if (leadCheckError) {
        toast({ title: 'Error checking team lead status', status: 'error', duration: 3000 });
        return;
      }

      if (existingLeads && existingLeads.length > 0) {
        toast({
          title: 'Team lead already exists',
          description: 'Please remove the current team lead before assigning a new one',
          status: 'error',
          duration: 3000
        });
        return;
      }
    }

    const { error } = await supabase
      .from('users')
      .update({ 
        team_id: selectedTeam,
        is_team_lead: isTeamLead 
      })
      .eq('id', selectedUser);

    if (error) {
      toast({ title: 'Error adding team member', status: 'error', duration: 3000 });
      return;
    }

    toast({ title: 'Team member added', status: 'success', duration: 3000 });
    fetchTeamMembers(selectedTeam);
    fetchAvailableUsers();
    onTeamMembershipChange?.();
    onClose();
    setSelectedUser('');
    setIsTeamLead(false);
  };

  const handleRemoveMember = async (userId: string, teamId: string) => {
    const { error } = await supabase
      .from('users')
      .update({ 
        team_id: null,
        is_team_lead: false 
      })
      .eq('id', userId);

    if (error) {
      toast({ title: 'Error removing team member', status: 'error', duration: 3000 });
      return;
    }

    toast({ title: 'Team member removed', status: 'success', duration: 3000 });
    fetchTeamMembers(teamId);
    fetchAvailableUsers();
    onTeamMembershipChange?.();
  };

  const handleToggleTeamLead = async (userId: string, teamId: string, currentStatus: boolean) => {
    // If making someone a team lead, check if there's already one
    if (!currentStatus) {
      const { data: existingLeads, error: leadCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('team_id', teamId)
        .eq('is_team_lead', true);

      if (leadCheckError) {
        toast({ title: 'Error checking team lead status', status: 'error', duration: 3000 });
        return;
      }

      if (existingLeads && existingLeads.length > 0) {
        toast({
          title: 'Team lead already exists',
          description: 'Please remove the current team lead before assigning a new one',
          status: 'error',
          duration: 3000
        });
        return;
      }
    }

    const { error } = await supabase
      .from('users')
      .update({ is_team_lead: !currentStatus })
      .eq('id', userId);

    if (error) {
      toast({ title: 'Error updating team lead status', status: 'error', duration: 3000 });
      return;
    }

    toast({ title: 'Team lead status updated', status: 'success', duration: 3000 });
    fetchTeamMembers(teamId);
    onTeamMembershipChange?.();
  };

  return (
    <Box>
      <Text fontSize="xl" fontWeight="bold" mb={4}>Team Management</Text>
      
      {/* Create Team Section */}
      <VStack spacing={4} align="stretch" mb={6}>
        <FormControl isRequired>
          <FormLabel>Team Name</FormLabel>
          <Input
            value={newTeam.name}
            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
            placeholder="Enter team name"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Description</FormLabel>
          <Textarea
            value={newTeam.description}
            onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
            placeholder="Enter team description"
          />
        </FormControl>

        <Button leftIcon={<AddIcon />} onClick={handleCreateTeam} alignSelf="flex-start">
          Create Team
        </Button>
      </VStack>

      {/* Teams List */}
      <Box mb={6}>
        <Text fontSize="lg" fontWeight="semibold" mb={2}>Teams</Text>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Description</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {teams.map((team) => (
              <Tr key={team.id}>
                <Td>
                  <Button variant="link" onClick={() => setSelectedTeam(team.id)}>
                    {team.name}
                  </Button>
                </Td>
                <Td>{team.description}</Td>
                <Td>
                  <IconButton
                    aria-label="Delete team"
                    icon={<DeleteIcon />}
                    colorScheme="red"
                    onClick={() => handleDeleteTeam(team.id)}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Team Members Section */}
      {selectedTeam && (
        <Box>
          <HStack justify="space-between" mb={4}>
            <Text fontSize="lg" fontWeight="semibold">
              Team Members - {teams.find(t => t.id === selectedTeam)?.name}
            </Text>
            <Button leftIcon={<AddIcon />} onClick={onOpen}>
              Add Member
            </Button>
          </HStack>

          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Role</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {teamMembers[selectedTeam]?.map((member) => (
                <Tr key={member.id}>
                  <Td>{member.full_name}</Td>
                  <Td>
                    <Checkbox
                      isChecked={member.is_team_lead}
                      onChange={() => handleToggleTeamLead(member.id, selectedTeam, member.is_team_lead)}
                    >
                      Team Lead
                    </Checkbox>
                  </Td>
                  <Td>
                    <IconButton
                      aria-label="Remove member"
                      icon={<DeleteIcon />}
                      colorScheme="red"
                      onClick={() => handleRemoveMember(member.id, selectedTeam)}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* Add Member Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Team Member</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Select User</FormLabel>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px' }}
                >
                  <option value="">Select a user</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormControl>
                <Checkbox
                  isChecked={isTeamLead}
                  onChange={(e) => setIsTeamLead(e.target.checked)}
                >
                  Assign as Team Lead
                </Checkbox>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleAddMember}>
              Add Member
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}; 