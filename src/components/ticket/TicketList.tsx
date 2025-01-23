import { 
  VStack, 
  Box, 
  Text, 
  Badge, 
  useColorModeValue,
  Skeleton,
  SkeletonText,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import type { TicketData } from '../../types/ticket';
import { TicketTagFilter } from './TicketTagFilter';

interface TicketListProps {
  tickets: TicketData[];
  onSelectTicket: (ticketId: string) => void;
  selectedTicketId: string | null;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  isFilterEnabled: boolean;
  onFilterEnabledChange: (enabled: boolean) => void;
}

export const TicketList = ({ 
  tickets, 
  onSelectTicket, 
  selectedTicketId,
  selectedTags,
  onTagsChange,
  isFilterEnabled,
  onFilterEnabledChange
}: TicketListProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [displayedTickets, setDisplayedTickets] = useState(tickets);
  
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Update displayed tickets when tickets prop changes
  useEffect(() => {
    setDisplayedTickets(tickets);
    setIsLoading(false);
  }, [tickets]);

  // Set loading state when filter changes
  useEffect(() => {
    if (selectedTags.length > 0 && isFilterEnabled) {
      setIsLoading(true);
    }
  }, [selectedTags, isFilterEnabled]);

  const TicketSkeleton = () => (
    <Box
      p={4}
      borderBottom="1px"
      borderColor={borderColor}
    >
      <Skeleton height="24px" width="60%" mb={2} />
      <SkeletonText noOfLines={2} spacing={2} />
      <Box mt={2}>
        <Skeleton height="20px" width="100px" />
      </Box>
    </Box>
  );

  return (
    <Box>
      <Box p={4} borderBottom="1px" borderColor={borderColor}>
        <TicketTagFilter
          selectedTags={selectedTags}
          onTagsChange={onTagsChange}
          isFilterEnabled={isFilterEnabled}
          onFilterEnabledChange={onFilterEnabledChange}
        />
      </Box>
      <VStack spacing={0} align="stretch" w="100%">
        {isLoading ? (
          <>
            <TicketSkeleton />
            <TicketSkeleton />
            <TicketSkeleton />
          </>
        ) : (
          displayedTickets.map((ticket) => (
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
          ))
        )}
      </VStack>
    </Box>
  );
}; 