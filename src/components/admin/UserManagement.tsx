import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
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
} from '@chakra-ui/react';
import { supabase } from '../../config/supabase';

interface User {
  id: string;
  full_name: string | null;
  role: 'administrator' | 'agent' | 'customer';
  created_tickets: {
    id: string;
    title: string;
  }[];
  assigned_teams: {
    team: {
      id: string;
      name: string;
    };
    is_team_lead: boolean;
  }[];
}

export interface UserManagementRef {
  refreshUsers: () => void;
}

export const UserManagement = forwardRef<UserManagementRef>((props, ref) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          created_tickets:tickets(id, title),
          assigned_teams:user_teams(
            is_team_lead,
            team:teams(id, name)
          )
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
    onOpen();
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
            <Th>Teams</Th>
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
                {user.assigned_teams.map((team) => (
                  <Badge
                    key={team.team.id}
                    colorScheme={team.is_team_lead ? 'green' : 'blue'}
                    mr={2}
                    mb={1}
                  >
                    {team.team.name} {team.is_team_lead && '(Lead)'}
                  </Badge>
                ))}
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
              <Box>
                <Text fontWeight="bold" mb={2}>Created Tickets:</Text>
                {selectedUser.created_tickets.length > 0 ? (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>ID</Th>
                        <Th>Title</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {selectedUser.created_tickets.map((ticket) => (
                        <Tr key={ticket.id}>
                          <Td>{ticket.id}</Td>
                          <Td>{ticket.title}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                ) : (
                  <Text color="gray.500">No tickets created</Text>
                )}

                <Text fontWeight="bold" mt={4} mb={2}>Team Memberships:</Text>
                {selectedUser.assigned_teams.length > 0 ? (
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Team</Th>
                        <Th>Role</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {selectedUser.assigned_teams.map((team) => (
                        <Tr key={team.team.id}>
                          <Td>{team.team.name}</Td>
                          <Td>{team.is_team_lead ? 'Team Lead' : 'Member'}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                ) : (
                  <Text color="gray.500">No team memberships</Text>
                )}
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}); 