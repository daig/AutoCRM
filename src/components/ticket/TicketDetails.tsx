import { VStack, Box, Text, Badge, Heading, Divider, Flex } from '@chakra-ui/react';
import type { TicketData } from '../../types/ticket';
import { TagSelector } from '../tag/TagSelector';

interface TicketDetailsProps {
  ticket: TicketData | null;
  onRefresh: () => void;
}

export const TicketDetails = ({ ticket, onRefresh }: TicketDetailsProps) => {
  if (!ticket) {
    return (
      <Box p={4}>
        <Text color="gray.500">Select a ticket to view details</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Box>
        <Heading size="md">{ticket.title}</Heading>
        <Text color="gray.500" fontSize="sm" mt={1}>
          Created: {new Date(ticket.created_at).toLocaleDateString()}
        </Text>
      </Box>

      <Divider />

      <Box>
        <Text fontWeight="medium" mb={2}>Description</Text>
        <Text>{ticket.description}</Text>
      </Box>

      <Box>
        <Flex align="center" mb={2}>
          <Text fontWeight="medium">Tags</Text>
          <TagSelector
            ticketId={ticket.id}
            existingTags={ticket.tags}
            onTagAdded={onRefresh}
          />
        </Flex>
        <Box>
          {ticket.tags.map(({ tag }) => (
            <Badge
              key={tag.id}
              mr={2}
              mb={2}
              colorScheme={tag.tag_type.name === 'status' ? 'green' : 'blue'}
            >
              {tag.name}
            </Badge>
          ))}
        </Box>
      </Box>

      <Box>
        <Text fontWeight="medium" mb={2}>Metadata</Text>
        {ticket.metadata.map((field) => (
          <Box key={field.field_type.name} mb={2}>
            <Text fontSize="sm" color="gray.500">
              {field.field_type.name}
            </Text>
            <Text>
              {field.field_value_text ||
                field.field_value_int?.toString() ||
                field.field_value_float?.toString() ||
                (field.field_value_bool !== null ? field.field_value_bool.toString() : '') ||
                field.field_value_date ||
                field.field_value_timestamp ||
                field.field_value_user?.full_name ||
                field.field_value_ticket?.title ||
                'N/A'}
            </Text>
          </Box>
        ))}
      </Box>
    </VStack>
  );
}; 