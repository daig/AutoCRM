import { Box, Grid, GridItem, Input, IconButton, Flex, useColorModeValue } from '@chakra-ui/react';
import { TicketList } from '../components/ticket/TicketList';
import { TicketDetails } from '../components/ticket/TicketDetails';
import { MessageFeed } from '../components/ticket/MessageFeed';
import { useState, useEffect, useCallback } from 'react';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import { supabase } from '../config/supabase';
import { useUser } from '../context/UserContext';
import type { TicketData } from '../types/ticket';
import type { Database } from '../types/supabase';

type TicketMessage = Database['public']['Tables']['ticket_messages']['Insert'];

export const CRMPage = () => {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const { userId } = useUser();

  const fetchTickets = useCallback(async () => {
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tickets:', error);
      return;
    }

    setTickets(data || []);
  }, []);

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
      const { error } = await supabase
        .from('ticket_messages')
        .insert<TicketMessage>([
          {
            ticket: selectedTicketId,
            sender: userId,
            content: messageInput.trim(),
          },
        ]);

      if (error) throw error;
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
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
                <MessageFeed ticketId={selectedTicket.id} />
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

      {/* Right Sidebar - Ticket Selection */}
      <GridItem borderLeft="1px" borderColor={borderColor} overflowY="auto">
        <TicketList 
          tickets={tickets}
          onSelectTicket={setSelectedTicketId} 
          selectedTicketId={selectedTicketId} 
        />
      </GridItem>
    </Grid>
  );
}; 