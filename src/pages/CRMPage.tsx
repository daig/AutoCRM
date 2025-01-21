import { Box, Grid, GridItem, VStack, Input, IconButton, Flex, useColorModeValue } from '@chakra-ui/react';
import { TicketList } from '../components/ticket/TicketList';
import { TicketDetails } from '../components/ticket/TicketDetails';
import { MessageFeed } from '../components/ticket/MessageFeed';
import { useState, useEffect } from 'react';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import { supabase } from '../config/supabase';
import type { TicketData } from '../components/ticket/TicketList';
import type { Database } from '../types/supabase';

type TicketMessage = Database['public']['Tables']['ticket_messages']['Insert'];

export const CRMPage = () => {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchTicketDetails = async () => {
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
    };

    fetchTicketDetails();
  }, [selectedTicketId]);

  const handleSendMessage = async () => {
    if (!selectedTicketId || !messageInput.trim()) return;

    const message: TicketMessage = {
      ticket: selectedTicketId,
      content: messageInput.trim(),
    };

    const { error } = await supabase
      .from('ticket_messages')
      .insert([message]);

    if (error) {
      console.error('Error sending message:', error);
      return;
    }

    setMessageInput('');
  };

  return (
    <Grid
      templateColumns="300px 1fr 350px"
      h="calc(100vh - 64px)"
      gap={0}
    >
      {/* Left Sidebar - Ticket Details */}
      <GridItem borderRight="1px" borderColor={borderColor} p={4} overflowY="auto">
        <TicketDetails ticket={selectedTicket} />
      </GridItem>

      {/* Main Content - Message Feed */}
      <GridItem position="relative">
        <VStack h="100%" spacing={0}>
          {/* Messages Area */}
          <Box flex="1" w="100%" overflowY="auto" p={4}>
            <MessageFeed ticketId={selectedTicketId} />
          </Box>

          {/* Message Input Area */}
          <Box
            p={4}
            borderTop="1px"
            borderColor={borderColor}
            w="100%"
            bg={useColorModeValue('white', 'gray.800')}
          >
            <Flex>
              <Input
                placeholder="Type your message..."
                mr={2}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                isDisabled={!selectedTicketId}
              />
              <IconButton
                aria-label="Send message"
                icon={<ArrowForwardIcon />}
                colorScheme="blue"
                onClick={handleSendMessage}
                isDisabled={!selectedTicketId || !messageInput.trim()}
              />
            </Flex>
          </Box>
        </VStack>
      </GridItem>

      {/* Right Sidebar - Ticket Selection */}
      <GridItem borderLeft="1px" borderColor={borderColor} overflowY="auto">
        <TicketList onSelectTicket={setSelectedTicketId} selectedTicketId={selectedTicketId} />
      </GridItem>
    </Grid>
  );
}; 