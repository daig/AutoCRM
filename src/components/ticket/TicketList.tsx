import { 
  VStack, 
  Box, 
  Text, 
  Badge, 
  useColorModeValue,
  Divider,
  Fade,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import type { TicketData } from '../../types/ticket';
import { TicketTagFilter } from './TicketTagFilter';
import { TicketMetadataFilter } from './TicketMetadataFilter';
import type { MetadataFilter } from './TicketMetadataFilter';

interface TicketListProps {
  tickets: TicketData[];
  onSelectTicket: (ticketId: string) => void;
  selectedTicketId: string | null;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  isFilterEnabled: boolean;
  onFilterEnabledChange: (enabled: boolean) => void;
  onMetadataFiltersChange: (filters: MetadataFilter[]) => void;
}

export const TicketList = ({ 
  tickets, 
  onSelectTicket, 
  selectedTicketId,
  selectedTags,
  onTagsChange,
  isFilterEnabled,
  onFilterEnabledChange,
  onMetadataFiltersChange
}: TicketListProps) => {
  const [displayedTickets, setDisplayedTickets] = useState(tickets);
  const [showContent, setShowContent] = useState(true);
  
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Update displayed tickets when tickets prop changes or filters change
  useEffect(() => {
    if (tickets !== displayedTickets) {
      setShowContent(false);
      const timer = setTimeout(() => {
        setDisplayedTickets(tickets);
        setTimeout(() => setShowContent(true), 50);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [tickets, displayedTickets]);

  return (
    <Box>
      <Box p={4} borderBottom="1px" borderColor={borderColor}>
        <VStack align="stretch" spacing={4}>
          <TicketTagFilter
            selectedTags={selectedTags}
            onTagsChange={onTagsChange}
            isFilterEnabled={isFilterEnabled}
            onFilterEnabledChange={onFilterEnabledChange}
          />
          <Divider />
          <TicketMetadataFilter
            isFilterEnabled={isFilterEnabled}
            onFilterChange={onMetadataFiltersChange}
            onFilterEnabledChange={onFilterEnabledChange}
          />
        </VStack>
      </Box>
      <VStack spacing={0} align="stretch" w="100%">
        <Fade in={showContent} transition={{ enter: { duration: 0.2 }, exit: { duration: 0.15 } }}>
          {displayedTickets.map((ticket) => (
            <Box
              key={ticket.id}
              p={4}
              cursor="pointer"
              onClick={() => onSelectTicket(ticket.id)}
              bg={selectedTicketId === ticket.id ? selectedBg : 'transparent'}
              _hover={{ bg: selectedTicketId === ticket.id ? selectedBg : hoverBg }}
              borderBottom="1px"
              borderColor={borderColor}
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
        </Fade>
      </VStack>
    </Box>
  );
}; 