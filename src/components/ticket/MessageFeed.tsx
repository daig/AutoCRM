import { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { VStack, Box, Text, Avatar, Flex, useColorModeValue, SlideFade, Fade, Badge } from '@chakra-ui/react';
import { supabase } from '../../config/supabase';

export type Message = {
  id: string;
  content: string;
  created_at: string;
  sender: {
    id: string;
    full_name: string | null;
    role: 'administrator' | 'agent' | 'customer' | null;
  } | null;
};

interface MessageFeedProps {
  ticketId: string | null;
}

export interface MessageFeedHandle {
  addMessage: (message: Message) => void;
}

export const MessageFeed = forwardRef<MessageFeedHandle, MessageFeedProps>(({ ticketId }, ref) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const customerBg = useColorModeValue('blue.50', 'blue.900');
  const agentBg = useColorModeValue('green.50', 'green.900');

  const fetchMessages = useCallback(async () => {
    if (!ticketId) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select(`
          id,
          content,
          created_at,
          sender:users (
            id,
            full_name,
            role
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
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  useImperativeHandle(ref, () => ({
    addMessage: (message: Message) => {
      setMessages(prev => [...prev, message]);
    }
  }), []);

  useEffect(() => {
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
        fetchMessages
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [ticketId, fetchMessages]);

  if (!ticketId) {
    return (
      <Box p={4}>
        <Text color="gray.500">Select a ticket to view messages</Text>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Fade in={true}>
        <Flex justify="center" align="center" h="100px">
          <Text color="gray.500" fontSize="lg">...</Text>
        </Flex>
      </Fade>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {messages.map((message) => {
        const isCustomer = message.sender?.role === 'customer';
        const bgColor = isCustomer ? customerBg : agentBg;
        const roleColor = isCustomer ? 'blue' : 'green';
        const roleText = message.sender?.role === 'administrator' ? 'Admin' : 
                        message.sender?.role === 'agent' ? 'Agent' : 'Customer';

        return (
          <SlideFade key={message.id} in={true} offsetY="20px">
            <Box
              p={4}
              bg={bgColor}
              borderRadius="md"
            >
              <Flex gap={3}>
                <Avatar
                  size="sm"
                  name={message.sender?.full_name || 'Unknown User'}
                />
                <Box flex="1">
                  <Flex gap={2} align="center" mb={1} wrap="wrap">
                    <Text fontWeight="medium">
                      {message.sender?.full_name || 'Unknown User'}
                    </Text>
                    <Badge colorScheme={roleColor} fontSize="xs">
                      {roleText}
                    </Badge>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(message.created_at).toLocaleString()}
                    </Text>
                  </Flex>
                  <Text>{message.content}</Text>
                </Box>
              </Flex>
            </Box>
          </SlideFade>
        );
      })}
      {messages.length === 0 && (
        <Box p={4}>
          <Text color="gray.500">No messages yet</Text>
        </Box>
      )}
    </VStack>
  );
}); 