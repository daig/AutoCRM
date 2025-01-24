import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Spinner,
  Select,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Checkbox,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { supabase } from '../../config/supabase';

interface Team {
  id: string;
  name: string;
}

interface User {
  id: string;
  full_name: string | null;
  role: 'administrator' | 'agent' | 'customer';
  created_tickets: {
    id: string;
    title: string;
    description: string | null;
  }[];
  team: {
    id: string;
    name: string;
  } | null;
  is_team_lead: boolean;
}

export interface UserManagementRef {
  refreshUsers: () => void;
}

export const UserManagement = forwardRef<UserManagementRef>((_, ref) => {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [isTeamLead, setIsTeamLead] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setTeams(data);
    } catch (error) {
      toast({
        title: 'Error fetching teams',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          created_tickets:tickets(id, title, description),
          team:teams(id, name)
        `);

      if (error) throw error;
      setUsers(data as User[]);
    } catch (error) {
      toast({
        title: 'Error fetching users',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refreshUsers: fetchUsers
  }));

  useEffect(() => {
    fetchUsers();
    fetchTeams();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'administrator' | 'agent' | 'customer') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Role updated successfully',
        status: 'success',
        duration: 2000,
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error updating role',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const showUserDetails = (user: User) => {
    setSelectedUser(user);
    setSelectedTeam(user.team?.id || '');
    setIsTeamLead(user.is_team_lead);
    onOpen();
  };

  const handleTeamAssignment = async () => {
    if (!selectedUser) return;

    // If making someone a team lead, check if there's already one
    if (selectedTeam && isTeamLead) {
      const { data: existingLeads, error: leadCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('team_id', selectedTeam)
        .eq('is_team_lead', true);

      if (leadCheckError) {
        toast({ title: 'Error checking team lead status', status: 'error', duration: 3000 });
        return;
      }

      if (existingLeads && existingLeads.length > 0 && existingLeads[0].id !== selectedUser.id) {
        toast({
          title: 'Team lead already exists',
          description: 'Please remove the current team lead before assigning a new one',
          status: 'error',
          duration: 3000
        });
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          team_id: selectedTeam || null,
          is_team_lead: selectedTeam ? isTeamLead : false
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({
        title: 'Team assignment updated',
        status: 'success',
        duration: 2000,
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error updating team assignment',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box>
      <Text fontSize="xl" fontWeight="bold" mb={4}>User Management</Text>

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Role</Th>
            <Th>Team</Th>
            <Th>Created Tickets</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {users.map((user) => (
            <Tr key={user.id}>
              <Td>{user.full_name}</Td>
              <Td>
                <Select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value as 'administrator' | 'agent' | 'customer')}
                  size="sm"
                  width="150px"
                >
                  <option value="administrator">Administrator</option>
                  <option value="agent">Agent</option>
                  <option value="customer">Customer</option>
                </Select>
              </Td>
              <Td>
                {user.team && (
                  <Badge
                    colorScheme={user.is_team_lead ? 'green' : 'blue'}
                    mr={2}
                    mb={1}
                  >
                    {user.team.name} {user.is_team_lead && '(Lead)'}
                  </Badge>
                )}
              </Td>
              <Td>{user.created_tickets.length}</Td>
              <Td>
                <Button size="sm" onClick={() => showUserDetails(user)}>
                  View Details
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {/* User Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>User Details - {selectedUser?.full_name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedUser && (
              <VStack spacing={6} align="stretch">
                {/* Team Assignment Section */}
                <Box>
                  <Text fontWeight="bold" mb={4}>Team Assignment</Text>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Team</FormLabel>
                      <Select
                        value={selectedTeam}
                        onChange={(e) => {
                          setSelectedTeam(e.target.value);
                          if (!e.target.value) {
                            setIsTeamLead(false);
                          }
                        }}
                        placeholder="Select team"
                      >
                        <option value="">No Team</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    {selectedTeam && (
                      <FormControl>
                        <Checkbox
                          isChecked={isTeamLead}
                          onChange={(e) => setIsTeamLead(e.target.checked)}
                        >
                          Assign as Team Lead
                        </Checkbox>
                      </FormControl>
                    )}
                    <Button colorScheme="blue" onClick={handleTeamAssignment}>
                      Update Team Assignment
                    </Button>
                  </VStack>
                </Box>

                {/* Created Tickets Section */}
                <Box>
                  <Text fontWeight="bold" mb={2}>Created Tickets:</Text>
                  {selectedUser.created_tickets.length > 0 ? (
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Title</Th>
                          <Th>Description</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {selectedUser.created_tickets.map((ticket) => (
                          <Tr key={ticket.id}>
                            <Td>{ticket.title}</Td>
                            <Td>{ticket.description || '-'}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  ) : (
                    <Text color="gray.500">No tickets created</Text>
                  )}
                </Box>

                {/* Current Team Info Section */}
                <Box>
                  <Text fontWeight="bold" mb={2}>Current Team:</Text>
                  {selectedUser.team ? (
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Team</Th>
                          <Th>Role</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        <Tr>
                          <Td>{selectedUser.team.name}</Td>
                          <Td>{selectedUser.is_team_lead ? 'Team Lead' : 'Member'}</Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  ) : (
                    <Text color="gray.500">No team membership</Text>
                  )}
                </Box>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}); 