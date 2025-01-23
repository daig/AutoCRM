import { Box, Grid, GridItem, Input, IconButton, Flex, useColorModeValue } from '@chakra-ui/react';
import { TicketList } from '../components/ticket/TicketList';
import { TicketDetails } from '../components/ticket/TicketDetails';
import { MessageFeed, MessageFeedHandle, Message } from '../components/ticket/MessageFeed';
import { TicketTagFilter } from '../components/ticket/TicketTagFilter';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import { supabase } from '../config/supabase';
import { useUser } from '../context/UserContext';
import type { TicketData } from '../types/ticket';
import type { Database } from '../types/supabase';
import { useLocation } from 'react-router-dom';

type TicketMessage = Database['public']['Tables']['ticket_messages']['Insert'];

export const CRMPage = () => {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFilterEnabled, setIsFilterEnabled] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const { userId } = useUser();
  const location = useLocation();
  const messageFeedRef = useRef<MessageFeedHandle>(null);

  // Clear selection if navigating from a delete action
  useEffect(() => {
    if (location.state?.clearSelection) {
      setSelectedTicketId(null);
      setSelectedTicket(null);
      // Clean up the state to prevent clearing on future navigations
      history.replaceState({}, '');
    }
  }, [location]);

  // Handle ticket selection from navigation state
  useEffect(() => {
    if (location.state?.selectTicketId) {
      setSelectedTicketId(location.state.selectTicketId);
      // Clean up the state to prevent reselection on future navigations
      history.replaceState({}, '');
    }
  }, [location]);

  const fetchTickets = useCallback(async (shouldApplyFilters = isFilterEnabled) => {
    try {
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

      // Apply tag filters only if filtering is enabled
      if (selectedTags.length > 0 && shouldApplyFilters) {
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

      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  }, [selectedTags]);

  const fetchTicketDetails = useCallback(async () => {
    if (!selectedTicketId) {
      setSelectedTicket(null);
      return;
    }

    const { data, error } = await supabase
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
          full_name: string;
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
            full_name
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
            full_name: data.sender.full_name
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
        <TicketList
          tickets={tickets}
          onSelectTicket={setSelectedTicketId}
          selectedTicketId={selectedTicketId}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          isFilterEnabled={isFilterEnabled}
          onFilterEnabledChange={handleFilterEnabledChange}
        />
      </GridItem>
    </Grid>
  );
}; 