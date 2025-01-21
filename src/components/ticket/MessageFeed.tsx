import { useEffect, useState } from 'react';
import { VStack, Box, Text, Avatar, Flex, useColorModeValue } from '@chakra-ui/react';
import { supabase } from '../../config/supabase';

type Message = {
  id: string;
  content: string;
  created_at: string;
  sender: {
    id: string;
    full_name: string | null;
  } | null;
};

interface MessageFeedProps {
  ticketId: string | null;
}

export const MessageFeed = ({ ticketId }: MessageFeedProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const messageBg = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    const fetchMessages = async () => {
      if (!ticketId) {
        setMessages([]);
        return;
      }

      const { data, error } = await supabase
        .from('ticket_messages')
        .select(`
          id,
          content,
          created_at,
          sender:users (
            id,
            full_name
          )
        `)
        .eq('ticket', ticketId)
        .order('created_at', { ascending: true })
        .returns<Message[]>();

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    };

    fetchMessages();

    // Set up real-time subscription for new messages
    const subscription = supabase
      .channel(`ticket-messages-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket=eq.${ticketId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [ticketId]);

  if (!ticketId) {
    return (
      <Box p={4}>
        <Text color="gray.500">Select a ticket to view messages</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {messages.map((message) => (
        <Box
          key={message.id}
          p={4}
          bg={messageBg}
          borderRadius="md"
        >
          <Flex gap={3}>
            <Avatar
              size="sm"
              name={message.sender?.full_name || 'Unknown User'}
            />
            <Box>
              <Flex gap={2} align="center" mb={1}>
                <Text fontWeight="medium">
                  {message.sender?.full_name || 'Unknown User'}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {new Date(message.created_at).toLocaleString()}
                </Text>
              </Flex>
              <Text>{message.content}</Text>
            </Box>
          </Flex>
        </Box>
      ))}
      {messages.length === 0 && (
        <Box p={4}>
          <Text color="gray.500">No messages yet</Text>
        </Box>
      )}
    </VStack>
  );
}; 