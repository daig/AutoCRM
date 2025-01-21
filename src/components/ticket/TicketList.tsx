import { VStack, Box, Text, Badge, useColorModeValue } from '@chakra-ui/react';
import type { TicketData } from '../../types/ticket';

interface TicketListProps {
  tickets: TicketData[];
  onSelectTicket: (ticketId: string) => void;
  selectedTicketId: string | null;
}

export const TicketList = ({ tickets, onSelectTicket, selectedTicketId }: TicketListProps) => {
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');

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