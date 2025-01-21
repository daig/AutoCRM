import { useEffect, useState } from 'react';
import { VStack } from '@chakra-ui/react';
import { supabase } from '../../config/supabase';
import { Ticket } from './Ticket';

interface TicketData {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  tags: {
    tag: {
      id: string;
      name: string;
      type_id: string;
      tag_type: {
        name: string;
      }
    }
  }[];
  metadata: {
    field_type: {
      name: string;
      value_type: string;
    };
    field_value_text: string | null;
    field_value_int: number | null;
    field_value_float: number | null;
    field_value_bool: boolean | null;
    field_value_date: string | null;
    field_value_timestamp: string | null;
    field_value_user: { full_name: string } | null;
    field_value_ticket: { title: string } | null;
  }[];
}

export const TicketList = () => {
  const [tickets, setTickets] = useState<TicketData[]>([]);

  useEffect(() => {
    const fetchTickets = async () => {
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
    };

    fetchTickets();
  }, []);

  return (
    <VStack spacing={4} align="stretch">
      {tickets.map((ticket) => (
        <Ticket key={ticket.id} ticket={ticket} />
      ))}
    </VStack>
  );
}; 