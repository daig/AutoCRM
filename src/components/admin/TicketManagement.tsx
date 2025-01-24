import React, { useEffect, useState } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Select,
  useToast,
  Spinner,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  Checkbox,
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { SearchIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { supabase } from '../../config/supabase';

interface Team {
  id: string;
  name: string;
}

interface Ticket {
  id: string;
  title: string;
  team: Team;
  creator: {
    full_name: string;
  };
  created_at: string;
}

const TicketList: React.FC<{
  searchQuery: string;
}> = ({ searchQuery }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const toast = useToast();

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: 'Error fetching teams',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const query = supabase
        .from('tickets')
        .select(`
          id,
          title,
          created_at,
          team:teams (
            id,
            name
          ),
          creator:users!tickets_creator_fkey (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const responseData = data as unknown as Array<{
        id: string;
        title: string;
        created_at: string;
        team: { id: string; name: string };
        creator: { full_name: string };
      }>;

      const transformedTickets: Ticket[] = responseData.map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        created_at: ticket.created_at,
        team: {
          id: ticket.team.id,
          name: ticket.team.name
        },
        creator: {
          full_name: ticket.creator.full_name
        }
      }));

      setTickets(transformedTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: 'Error fetching tickets',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [searchQuery]);

  const handleTeamChange = async (ticketId: string, newTeamId: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ team: newTeamId })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: 'Team updated successfully',
        status: 'success',
        duration: 2000,
      });

      setTickets(prev =>
        prev.map(ticket =>
          ticket.id === ticketId
            ? {
                ...ticket,
                team: teams.find(t => t.id === newTeamId) || ticket.team,
              }
            : ticket
        )
      );
    } catch (error) {
      console.error('Error updating ticket team:', error);
      toast({
        title: 'Error updating team',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleSelectAll = (isChecked: boolean) => {
    setSelectedTickets(isChecked ? tickets.map(t => t.id) : []);
  };

  const handleSelectTicket = (ticketId: string, isChecked: boolean) => {
    setSelectedTickets(prev =>
      isChecked
        ? [...prev, ticketId]
        : prev.filter(id => id !== ticketId)
    );
  };

  const handleBulkTeamAssignment = async (newTeamId: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ team: newTeamId })
        .in('id', selectedTickets);

      if (error) throw error;

      toast({
        title: 'Teams updated successfully',
        status: 'success',
        duration: 2000,
      });

      setTickets(prev =>
        prev.map(ticket =>
          selectedTickets.includes(ticket.id)
            ? {
                ...ticket,
                team: teams.find(t => t.id === newTeamId) || ticket.team,
              }
            : ticket
        )
      );
      
      // Clear selection after successful update
      setSelectedTickets([]);
    } catch (error) {
      console.error('Error updating ticket teams:', error);
      toast({
        title: 'Error updating teams',
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
    <VStack spacing={4} align="stretch">
      {selectedTickets.length > 0 && (
        <HStack spacing={4}>
          <Text>{selectedTickets.length} tickets selected</Text>
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
              Assign to Team
            </MenuButton>
            <MenuList>
              {teams.map((team) => (
                <MenuItem
                  key={team.id}
                  onClick={() => handleBulkTeamAssignment(team.id)}
                >
                  {team.name}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </HStack>
      )}
      
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>
              <Checkbox
                isChecked={selectedTickets.length === tickets.length}
                isIndeterminate={selectedTickets.length > 0 && selectedTickets.length < tickets.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </Th>
            <Th>Title</Th>
            <Th>Created By</Th>
            <Th>Created At</Th>
            <Th>Team</Th>
          </Tr>
        </Thead>
        <Tbody>
          {tickets.map((ticket) => (
            <Tr key={ticket.id}>
              <Td>
                <Checkbox
                  isChecked={selectedTickets.includes(ticket.id)}
                  onChange={(e) => handleSelectTicket(ticket.id, e.target.checked)}
                />
              </Td>
              <Td>{ticket.title}</Td>
              <Td>{ticket.creator.full_name}</Td>
              <Td>{new Date(ticket.created_at).toLocaleString()}</Td>
              <Td>
                <Select
                  value={ticket.team.id}
                  onChange={(e) => handleTeamChange(ticket.id, e.target.value)}
                  width="200px"
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </Select>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </VStack>
  );
};

export const TicketManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xl" fontWeight="bold">Ticket Management</Text>
      
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="gray.300" />
        </InputLeftElement>
        <Input
          placeholder="Search tickets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </InputGroup>

      <TicketList searchQuery={searchQuery} />
    </VStack>
  );
}; 