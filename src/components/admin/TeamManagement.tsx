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
  onTeamsChange?: () => void;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ 
  onTeamMembershipChange,
  onTeamsChange
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>({});
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; full_name: string | null }>>([]);
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [isTeamLead, setIsTeamLead] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [targetTeamId, setTargetTeamId] = useState('');
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose
  } = useDisclosure();
  const {
    isOpen: isReassignOpen,
    onOpen: onReassignOpen,
    onClose: onReassignClose
  } = useDisclosure();

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
    onTeamsChange?.();
  };

  const handleDeleteTeam = async (team: Team) => {
    setTeamToDelete(team);
    onDeleteOpen();
  };

  const confirmDeleteTeam = async () => {
    if (!teamToDelete) return;

    // First, remove all members from the team
    const { error: memberError } = await supabase
      .from('users')
      .update({ 
        team_id: null,
        is_team_lead: false 
      })
      .eq('team_id', teamToDelete.id);

    if (memberError) {
      toast({ 
        title: 'Error removing team members',
        description: 'Failed to remove team members. Please try again.',
        status: 'error',
        duration: 3000
      });
      return;
    }

    // Then delete the team
    const { error: teamError } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamToDelete.id);

    if (teamError) {
      toast({ 
        title: 'Error deleting team',
        description: 'Failed to delete the team. Please try again.',
        status: 'error',
        duration: 3000
      });
      return;
    }

    toast({ title: 'Team deleted', status: 'success', duration: 3000 });
    fetchTeams();
    if (selectedTeam === teamToDelete.id) {
      setSelectedTeam(null);
    }
    setTeamToDelete(null);
    onDeleteClose();
    onTeamMembershipChange?.();
    onTeamsChange?.();
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

  const handleBulkRemoveMembers = async () => {
    if (!selectedTeam || selectedMembers.size === 0) return;

    // Check if any selected members are team leads
    const hasTeamLead = teamMembers[selectedTeam]?.some(
      member => member.is_team_lead && selectedMembers.has(member.id)
    );

    if (hasTeamLead) {
      toast({
        title: 'Cannot remove team lead',
        description: 'Please reassign team lead role before removing',
        status: 'error',
        duration: 3000
      });
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({ 
        team_id: null,
        is_team_lead: false 
      })
      .in('id', Array.from(selectedMembers));

    if (error) {
      toast({ title: 'Error removing team members', status: 'error', duration: 3000 });
      return;
    }

    toast({ title: 'Team members removed', status: 'success', duration: 3000 });
    fetchTeamMembers(selectedTeam);
    fetchAvailableUsers();
    setSelectedMembers(new Set());
    onTeamMembershipChange?.();
  };

  const handleSelectAllMembers = (checked: boolean) => {
    if (checked && selectedTeam && teamMembers[selectedTeam]) {
      setSelectedMembers(new Set(teamMembers[selectedTeam].map(member => member.id)));
    } else {
      setSelectedMembers(new Set());
    }
  };

  const handleSelectMember = (memberId: string, checked: boolean) => {
    const newSelected = new Set(selectedMembers);
    if (checked) {
      newSelected.add(memberId);
    } else {
      newSelected.delete(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const handleBulkReassign = async () => {
    if (!selectedTeam || !targetTeamId || selectedMembers.size === 0) {
      toast({ title: 'Please select a target team', status: 'error', duration: 3000 });
      return;
    }

    // Check if any selected members are team leads
    const hasTeamLead = teamMembers[selectedTeam]?.some(
      member => member.is_team_lead && selectedMembers.has(member.id)
    );

    if (hasTeamLead) {
      toast({
        title: 'Cannot reassign team lead',
        description: 'Please reassign team lead role before moving the member',
        status: 'error',
        duration: 3000
      });
      return;
    }

    // Check if target team already has a team lead if any selected member is marked to become one
    if (isTeamLead) {
      const { data: existingLeads, error: leadCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('team_id', targetTeamId)
        .eq('is_team_lead', true);

      if (leadCheckError) {
        toast({ title: 'Error checking team lead status', status: 'error', duration: 3000 });
        return;
      }

      if (existingLeads && existingLeads.length > 0) {
        toast({
          title: 'Target team already has a team lead',
          description: 'Please select a different team or remove the existing team lead first',
          status: 'error',
          duration: 3000
        });
        return;
      }
    }

    const { error } = await supabase
      .from('users')
      .update({ 
        team_id: targetTeamId,
        is_team_lead: false // Reset team lead status on reassignment
      })
      .in('id', Array.from(selectedMembers));

    if (error) {
      toast({ title: 'Error reassigning team members', status: 'error', duration: 3000 });
      return;
    }

    toast({ title: 'Team members reassigned', status: 'success', duration: 3000 });
    fetchTeamMembers(selectedTeam);
    fetchTeamMembers(targetTeamId);
    fetchAvailableUsers();
    setSelectedMembers(new Set());
    setTargetTeamId('');
    onReassignClose();
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
                    onClick={() => handleDeleteTeam(team)}
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
            <HStack>
              {selectedMembers.size > 0 && (
                <>
                  <Button
                    colorScheme="blue"
                    onClick={onReassignOpen}
                  >
                    Reassign Selected ({selectedMembers.size})
                  </Button>
                  <Button
                    colorScheme="red"
                    leftIcon={<DeleteIcon />}
                    onClick={handleBulkRemoveMembers}
                  >
                    Remove Selected ({selectedMembers.size})
                  </Button>
                </>
              )}
              <Button leftIcon={<AddIcon />} onClick={onOpen}>
                Add Member
              </Button>
            </HStack>
          </HStack>

          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>
                  <Checkbox
                    isChecked={Boolean(selectedTeam && teamMembers[selectedTeam]?.length > 0 && 
                      selectedMembers.size === teamMembers[selectedTeam].length)}
                    isIndeterminate={Boolean(selectedMembers.size > 0 && 
                      selectedTeam && 
                      teamMembers[selectedTeam]?.length > selectedMembers.size)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSelectAllMembers(e.target.checked)}
                  />
                </Th>
                <Th>Name</Th>
                <Th>Role</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {teamMembers[selectedTeam]?.map((member) => (
                <Tr key={member.id}>
                  <Td>
                    <Checkbox
                      isChecked={selectedMembers.has(member.id)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSelectMember(member.id, e.target.checked)}
                      isDisabled={member.is_team_lead}
                    />
                  </Td>
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
                      isDisabled={member.is_team_lead}
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

      {/* Delete Team Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader color="red.500">⚠️ Delete Team</ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold">
                Are you sure you want to delete the team "{teamToDelete?.name}"?
              </Text>
              <Text color="red.500">
                This action cannot be undone and will:
              </Text>
              <VStack align="stretch" pl={4}>
                <Text>• Remove all members from the team</Text>
                <Text>• Delete all team information</Text>
                <Text>• Remove team assignments from tickets</Text>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmDeleteTeam}>
              Delete Team
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Bulk Reassign Modal */}
      <Modal isOpen={isReassignOpen} onClose={onReassignClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reassign Team Members</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Select Target Team</FormLabel>
                <select
                  value={targetTeamId}
                  onChange={(e) => setTargetTeamId(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px' }}
                >
                  <option value="">Select a team</option>
                  {teams
                    .filter(team => team.id !== selectedTeam)
                    .map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                </select>
              </FormControl>
              <Text>
                {selectedMembers.size} member{selectedMembers.size !== 1 ? 's' : ''} will be reassigned
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onReassignClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleBulkReassign}>
              Reassign Members
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}; 