import { Box, Grid, GridItem, Input, IconButton, Flex, useColorModeValue, HStack, Button } from '@chakra-ui/react';
import { TicketList } from '../components/ticket/TicketList';
import { TicketDetails } from '../components/ticket/TicketDetails';
import { MessageFeed, MessageFeedHandle, Message } from '../components/ticket/MessageFeed';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import { supabase } from '../config/supabase';
import { useUser } from '../context/UserContext';
import type { TicketData } from '../types/ticket';
import type { Database } from '../types/supabase';
import type { MetadataFilter } from '../components/ticket/TicketMetadataFilter';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiUser } from 'react-icons/fi';

type TicketMessage = Database['public']['Tables']['ticket_messages']['Insert'];

export const CRMPage = () => {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [metadataFilters, setMetadataFilters] = useState<MetadataFilter[]>([]);
  const [isFilterEnabled, setIsFilterEnabled] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const { userId, userRole } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const messageFeedRef = useRef<MessageFeedHandle>(null);

  // Add state for assignee filter
  const [isAssigneeFilterActive, setIsAssigneeFilterActive] = useState(false);

  // Clear selection if navigating from a delete action
  useEffect(() => {
    if (location.state?.clearSelection) {
      setSelectedTicketId(null);
      setSelectedTicket(null);
      // Instead of using replace, we'll use a regular navigation without state
      if (location.pathname === '/crm') {
        navigate('/crm');
      }
    }
  }, [location, navigate]);

  // Handle ticket selection from navigation state
  useEffect(() => {
    if (location.state?.selectTicketId) {
      setSelectedTicketId(location.state.selectTicketId);
      // Instead of using replace, we'll use a regular navigation without state
      if (location.pathname === '/crm') {
        navigate('/crm');
      }
    }
  }, [location, navigate]);

  const fetchTickets = useCallback(async (shouldApplyFilters = isFilterEnabled) => {
    try {
      // First get the user's team if they're not a customer
      let userTeamId = null;
      if (userRole !== 'customer') {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('team_id')
          .eq('id', userId)
          .single();

        if (userError) throw userError;
        userTeamId = userData?.team_id;
      }

      let query = supabase
        .from('tickets')
        .select(`
          *,
          tags:ticket_tags (
            tag (
              id,
              name,
              type_id,
              tag_type:tag_types (name)
            )
          ),
          metadata:ticket_metadata!ticket_metadata_ticket_fkey (
            field_type:ticket_metadata_field_types (name, value_type),
            field_value_text,
            field_value_int,
            field_value_float,
            field_value_bool,
            field_value_date,
            field_value_timestamp,
            field_value_user:users (full_name),
            field_value_ticket:tickets!ticket_metadata_field_value_ticket_fkey (title)
          )
        `);

      // For customers, only show tickets they created
      // For agents and admins, show tickets where they are either on the team or are the creator
      if (userRole === 'customer') {
        query = query.eq('creator', userId);
      } else {
        query = query.or(`team.eq.${userTeamId}${userTeamId ? ',' : ''}creator.eq.${userId}`);
      }

      if (shouldApplyFilters) {
        // Apply tag filters
        if (selectedTags.length > 0) {
          // First get all selected tags with their types
          const { data: selectedTagData, error: tagError } = await supabase
            .from('tags')
            .select(`
              id,
              type_id
            `)
            .in('id', selectedTags);

          if (tagError) throw tagError;

          if (selectedTagData) {
            // Group tags by type
            const tagsByType = selectedTagData.reduce((acc, tag) => {
              if (!acc[tag.type_id]) {
                acc[tag.type_id] = [];
              }
              acc[tag.type_id].push(tag.id);
              return acc;
            }, {} as Record<string, string[]>);

            // For each tag type, get tickets that have ANY of the tags of that type
            const typeQueries = Object.values(tagsByType).map(async (tagIds) => {
              const { data: ticketsWithTag } = await supabase
                .from('ticket_tags')
                .select('ticket')
                .in('tag', tagIds);
              
              return (ticketsWithTag || []).map(t => t.ticket);
            });

            // Wait for all type queries and find tickets that have ALL required tag types
            const ticketsByType = await Promise.all(typeQueries);
            const matchingTickets = ticketsByType.reduce((acc, tickets) => {
              if (acc === null) return tickets;
              return acc.filter(id => tickets.includes(id));
            }, null as string[] | null);

            if (matchingTickets) {
              query = query.in('id', matchingTickets);
            }
          }
        }

        // Apply metadata filters
        if (metadataFilters.length > 0) {
          // Get ticket IDs that match all metadata filters
          const metadataQueries = metadataFilters.map(async (filter) => {
            if (!filter.columnName) {
              console.error('Missing columnName in filter:', filter);
              return [];
            }

            if (filter.isMissingFilter) {
              // For missing field filters, we want tickets that don't have this metadata field type
              const { data } = await supabase
                .from('ticket_metadata')
                .select('ticket')
                .eq('field_type', filter.fieldType.id);
              
              // Get all ticket IDs that have this field type
              const ticketsWithField = (data || []).map(t => t.ticket);
              
              // Then get all ticket IDs and filter out the ones that have the field
              const { data: allTickets } = await supabase
                .from('tickets')
                .select('id');
              
              return (allTickets || [])
                .map(t => t.id)
                .filter(id => !ticketsWithField.includes(id));
            }

            let query = supabase
              .from('ticket_metadata')
              .select('ticket')
              .eq('field_type', filter.fieldType.id);

            // Handle text fields with trigram search
            if (filter.fieldType.value_type === 'text') {
              // Use ILIKE with the GIN trigram index for text search
              query = query.ilike(filter.columnName, `%${filter.value}%`);
            }
            // Handle numeric filters
            else if (filter.numericFilter) {
              const { mode, value, value2 } = filter.numericFilter;
              if (value === null) return [];

              switch (mode) {
                case 'eq':
                  query = query.eq(filter.columnName, value);
                  break;
                case 'gt':
                  query = query.gt(filter.columnName, value);
                  break;
                case 'lt':
                  query = query.lt(filter.columnName, value);
                  break;
                case 'between':
                  if (value2 !== null) {
                    const minValue = Math.min(value, value2);
                    const maxValue = Math.max(value, value2);
                    query = query
                      .gte(filter.columnName, minValue)
                      .lte(filter.columnName, maxValue);
                  }
                  break;
              }
            }
            // Handle date/timestamp filters
            else if (filter.dateFilter) {
              const { mode, value, value2 } = filter.dateFilter;
              if (value === null) return [];

              switch (mode) {
                case 'eq':
                  query = query.eq(filter.columnName, value);
                  break;
                case 'gt':
                  query = query.gt(filter.columnName, value);
                  break;
                case 'lt':
                  query = query.lt(filter.columnName, value);
                  break;
                case 'between':
                  if (value2 !== null) {
                    query = query
                      .gte(filter.columnName, value)
                      .lte(filter.columnName, value2);
                  }
                  break;
              }
            } else {
              // Handle non-numeric, non-date, non-text filters
              query = query.eq(filter.columnName, filter.value);
            }
            
            const { data } = await query;
            return (data || []).map(t => t.ticket);
          });

          const metadataResults = await Promise.all(metadataQueries);
          const matchingTickets = metadataResults.reduce((acc, tickets) => {
            if (acc === null) return tickets;
            return acc.filter(id => tickets.includes(id));
          }, null as string[] | null);

          if (matchingTickets) {
            query = query.in('id', matchingTickets);
          }
        }
      }

      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  }, [selectedTags, metadataFilters, isFilterEnabled, userId, userRole]);

  const fetchTicketDetails = useCallback(async () => {
    if (!selectedTicketId) {
      setSelectedTicket(null);
      return;
    }

    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        creator:users!tickets_creator_fkey (
          id,
          full_name
        ),
        team:teams (
          id,
          name
        ),
        tags:ticket_tags (
          tag (
            id,
            name,
            type_id,
            tag_type:tag_types (name)
          )
        ),
        metadata:ticket_metadata!ticket_metadata_ticket_fkey (
          id,
          field_type:ticket_metadata_field_types (name, value_type),
          field_value_text,
          field_value_int,
          field_value_float,
          field_value_bool,
          field_value_date,
          field_value_timestamp,
          field_value_user:users (full_name),
          field_value_ticket:tickets!ticket_metadata_field_value_ticket_fkey (title)
        )
      `)
      .eq('id', selectedTicketId)
      .single();

    if (error) {
      console.error('Error fetching ticket details:', error);
      return;
    }

    setSelectedTicket(data);
  }, [selectedTicketId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    fetchTicketDetails();
  }, [fetchTicketDetails]);

  const handleRefresh = useCallback(() => {
    fetchTickets();
    fetchTicketDetails();
  }, [fetchTickets, fetchTicketDetails]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedTicketId || !userId) return;

    try {
      type MessageResponse = {
        id: string;
        content: string;
        created_at: string;
        sender: {
          id: string;
          full_name: string | null;
          role: 'administrator' | 'agent' | 'customer' | null;
        };
      };

      const { data, error } = await supabase
        .from('ticket_messages')
        .insert<TicketMessage>([
          {
            ticket: selectedTicketId,
            sender: userId,
            content: messageInput.trim(),
          },
        ])
        .select<string, MessageResponse>(`
          id,
          content,
          created_at,
          sender:users!inner (
            id,
            full_name,
            role
          )
        `)
        .single();

      if (error) throw error;
      
      // Add the message immediately to the feed
      if (data) {
        const message: Message = {
          id: data.id,
          content: data.content,
          created_at: data.created_at,
          sender: {
            id: data.sender.id,
            full_name: data.sender.full_name,
            role: data.sender.role
          }
        };
        messageFeedRef.current?.addMessage(message);
      }
      
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle filter toggle separately
  const handleFilterEnabledChange = (enabled: boolean) => {
    setIsFilterEnabled(enabled);
    fetchTickets(enabled);
  };

  // Function to toggle assignee filter
  const handleAssigneeFilterToggle = async () => {
    try {
      // First, check if there's an existing assignee metadata field type
      const { data: fieldTypeData, error: fieldTypeError } = await supabase
        .from('ticket_metadata_field_types')
        .select('id')
        .eq('name', 'assigned')
        .single();

      if (fieldTypeError) {
        console.error('Error fetching assignee field type:', fieldTypeError);
        return;
      }

      const assigneeFieldType = {
        id: fieldTypeData.id,
        name: 'assigned',
        value_type: 'user' as const,
        description: 'The agent assigned to handle this ticket'
      };

      // Create the assignee filter with just the user ID
      const assigneeFilter: MetadataFilter = {
        fieldType: assigneeFieldType,
        value: userId,
        columnName: 'field_value_user',
      };

      // Toggle the filter
      if (isAssigneeFilterActive) {
        setMetadataFilters(prev => prev.filter(f => f.fieldType.id !== assigneeFieldType.id));
        setIsAssigneeFilterActive(false);
      } else {
        setMetadataFilters(prev => [...prev.filter(f => f.fieldType.id !== assigneeFieldType.id), assigneeFilter]);
        setIsAssigneeFilterActive(true);
        if (!isFilterEnabled) {
          setIsFilterEnabled(true);
        }
      }
    } catch (error) {
      console.error('Error toggling assignee filter:', error);
    }
  };

  return (
    <Grid
      templateColumns="300px 1fr 300px"
      gap={4}
      h="calc(100vh - 140px)"
    >
      {/* Left Sidebar - Ticket Details */}
      <GridItem borderRight="1px" borderColor={borderColor} overflowY="auto">
        <Box p={4}>
          <TicketDetails
            ticket={selectedTicket}
            onRefresh={handleRefresh}
          />
        </Box>
      </GridItem>

      {/* Main Content - Messages and Composer */}
      <GridItem position="relative">
        <Box 
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          flexDirection="column"
        >
          {selectedTicket && (
            <>
              {/* Scrollable Message Feed */}
              <Box flex="1" overflowY="auto" p={4}>
                <MessageFeed 
                  ref={messageFeedRef}
                  ticketId={selectedTicket.id} 
                />
              </Box>
              
              {/* Fixed Message Composer */}
              <Box p={4} borderTop="1px" borderColor={borderColor}>
                <Flex>
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <IconButton
                    aria-label="Send message"
                    icon={<ArrowForwardIcon />}
                    ml={2}
                    onClick={handleSendMessage}
                  />
                </Flex>
              </Box>
            </>
          )}
        </Box>
      </GridItem>

      {/* Right Sidebar - Ticket List */}
      <GridItem borderLeft="1px" borderColor={borderColor} overflowY="auto">
        <Box p={4} borderBottom="1px" borderColor={borderColor}>
          <HStack spacing={4} mb={4}>
            {userRole === 'agent' && (
              <Button
                size="sm"
                colorScheme={isAssigneeFilterActive ? "blue" : "gray"}
                variant={isAssigneeFilterActive ? "solid" : "outline"}
                onClick={handleAssigneeFilterToggle}
                leftIcon={<FiUser />}
              >
                My Tickets
              </Button>
            )}
          </HStack>
        </Box>
        <TicketList
          tickets={tickets}
          onSelectTicket={setSelectedTicketId}
          selectedTicketId={selectedTicketId}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          isFilterEnabled={isFilterEnabled}
          onFilterEnabledChange={handleFilterEnabledChange}
          onMetadataFiltersChange={setMetadataFilters}
        />
      </GridItem>
    </Grid>
  );
}; 