import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Badge,
  useToast,
  Select,
  Heading,
  VStack,
  HStack,
  Input,
  IconButton,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';

interface User {
  id: string;
  full_name: string;
  role: 'administrator' | 'agent' | 'customer';
  created_at: string;
  assigned_tickets: {
    id: string;
    title: string;
  }[];
  created_tickets: {
    id: string;
    title: string;
  }[];
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const toast = useToast();

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          assigned_tickets:tickets!tickets_assignee_fkey (
            id,
            title
          ),
          created_tickets:tickets!tickets_creator_fkey (
            id,
            title
          )
        `)
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error fetching users',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Role updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error updating role',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <Box>
      <VStack align="stretch" spacing={6}>
        <Box>
          <Heading size="md" mb={4}>Users</Heading>
          
          <HStack mb={4} spacing={4}>
            <Box flex={1}>
              <HStack>
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <IconButton
                  aria-label="Search"
                  icon={<SearchIcon />}
                  variant="ghost"
                />
              </HStack>
            </Box>
            <Box>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="administrator">Administrators</option>
                <option value="agent">Agents</option>
                <option value="customer">Customers</option>
              </Select>
            </Box>
          </HStack>
        </Box>

        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Role</Th>
                <Th>Created At</Th>
                <Th>Assigned Tickets</Th>
                <Th>Created Tickets</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredUsers.map((user) => (
                <Tr key={user.id}>
                  <Td>
                    <Text fontWeight="medium">{user.full_name}</Text>
                  </Td>
                  <Td>
                    <Select
                      size="sm"
                      value={user.role}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                      width="150px"
                    >
                      <option value="administrator">Administrator</option>
                      <option value="agent">Agent</option>
                      <option value="customer">Customer</option>
                    </Select>
                  </Td>
                  <Td>
                    <Text fontSize="sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </Text>
                  </Td>
                  <Td>
                    <Badge colorScheme="blue">
                      {user.assigned_tickets?.length || 0}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge colorScheme="purple">
                      {user.created_tickets?.length || 0}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>
    </Box>
  );
}; 