import { useEffect, useState } from 'react';
import { VStack, Box, Text, Badge, useColorModeValue } from '@chakra-ui/react';
import { supabase } from '../../config/supabase';

export interface TicketData {
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

interface TicketListProps {
  onSelectTicket: (ticketId: string) => void;
  selectedTicketId: string | null;
}

export const TicketList = ({ onSelectTicket, selectedTicketId }: TicketListProps) => {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');

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
    <VStack spacing={0} align="stretch" w="100%">
      {tickets.map((ticket) => (
        <Box
          key={ticket.id}
          p={4}
          cursor="pointer"
          onClick={() => onSelectTicket(ticket.id)}
          bg={selectedTicketId === ticket.id ? selectedBg : 'transparent'}
          _hover={{ bg: selectedTicketId === ticket.id ? selectedBg : hoverBg }}
          borderBottom="1px"
          borderColor={useColorModeValue('gray.200', 'gray.700')}
        >
          <Text fontWeight="medium" mb={2}>{ticket.title}</Text>
          <Text fontSize="sm" color="gray.500" noOfLines={2}>
            {ticket.description}
          </Text>
          <Box mt={2}>
            {ticket.tags.map(({ tag }) => (
              <Badge
                key={tag.id}
                mr={2}
                colorScheme={tag.tag_type.name === 'status' ? 'green' : 'blue'}
              >
                {tag.name}
              </Badge>
            ))}
          </Box>
        </Box>
      ))}
    </VStack>
  );
}; 