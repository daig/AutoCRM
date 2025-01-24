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
import { DeleteIcon, AddIcon, EditIcon } from '@chakra-ui/icons';
import { supabase } from '../../config/supabase';

interface Team {
  id: string;
  name: string;
  description: string | null;
}

interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  is_team_lead: boolean;
  user: {
    full_name: string | null;
  };
}

export const TeamManagement = () => {
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
    const { data, error } = await supabase
      .from('user_teams')
      .select('*, user:users(full_name)')
      .eq('team_id', teamId);

    if (error) {
      toast({ title: 'Error fetching team members', status: 'error', duration: 3000 });
      return;
    }

    setTeamMembers(prev => ({
      ...prev,
      [teamId]: data as TeamMember[],
    }));
  };

  const fetchAvailableUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name')
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
    const { error } = await supabase.from('teams').insert([{
      name: newTeam.name,
      description: newTeam.description || null,
    }]);

    if (error) {
      toast({ title: 'Error creating team', status: 'error', duration: 3000 });
      return;
    }

    toast({ title: 'Team created', status: 'success', duration: 3000 });
    setNewTeam({ name: '', description: '' });
    fetchTeams();
  };

  const handleDeleteTeam = async (id: string) => {
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

    const { error } = await supabase.from('user_teams').insert([{
      team_id: selectedTeam,
      user_id: selectedUser,
      is_team_lead: isTeamLead,
    }]);

    if (error) {
      toast({ title: 'Error adding team member', status: 'error', duration: 3000 });
      return;
    }

    toast({ title: 'Team member added', status: 'success', duration: 3000 });
    fetchTeamMembers(selectedTeam);
    onClose();
    setSelectedUser('');
    setIsTeamLead(false);
  };

  const handleRemoveMember = async (userId: string, teamId: string) => {
    const { error } = await supabase
      .from('user_teams')
      .delete()
      .eq('user_id', userId)
      .eq('team_id', teamId);

    if (error) {
      toast({ title: 'Error removing team member', status: 'error', duration: 3000 });
      return;
    }

    toast({ title: 'Team member removed', status: 'success', duration: 3000 });
    fetchTeamMembers(teamId);
  };

  const handleToggleTeamLead = async (userId: string, teamId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('user_teams')
      .update({ is_team_lead: !currentStatus })
      .eq('user_id', userId)
      .eq('team_id', teamId);

    if (error) {
      toast({ title: 'Error updating team lead status', status: 'error', duration: 3000 });
      return;
    }

    toast({ title: 'Team lead status updated', status: 'success', duration: 3000 });
    fetchTeamMembers(teamId);
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
                  <Td>{member.user.full_name}</Td>
                  <Td>
                    <Checkbox
                      isChecked={member.is_team_lead}
                      onChange={() => handleToggleTeamLead(member.user_id, selectedTeam, member.is_team_lead)}
                    >
                      Team Lead
                    </Checkbox>
                  </Td>
                  <Td>
                    <IconButton
                      aria-label="Remove member"
                      icon={<DeleteIcon />}
                      colorScheme="red"
                      onClick={() => handleRemoveMember(member.user_id, selectedTeam)}
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