import { useEffect, useState } from 'react';
import { VStack } from '@chakra-ui/react';
import { supabase } from '../../config/supabase';
import { Message } from './Message';

interface MessageData {
  id: string;
  content: string;
  created_at: string;
  user: {
    full_name: string;
  };
}

interface MessageFeedProps {
  ticketId: string;
}

export const MessageFeed = ({ ticketId }: MessageFeedProps) => {
  const [messages, setMessages] = useState<MessageData[]>([]);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select(`
          id,
          content,
          created_at,
          user:user_id (
            full_name
          )
        `)
        .eq('ticket', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data || []);
    };

    fetchMessages();

    // Subscribe to new messages
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

  return (
    <VStack spacing={2} align="stretch">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
    </VStack>
  );
}; 