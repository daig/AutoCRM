import { Box, Card, CardBody, CardHeader, Heading, Text, HStack, VStack } from '@chakra-ui/react';
import { Tag } from '../tag/Tag';
import { TicketMetadata } from '../metadata/TicketMetadata';
import { MessageFeed } from '../message/MessageFeed';

interface TicketProps {
  ticket: {
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
  };
}

export const Ticket = ({ ticket }: TicketProps) => {
  return (
    <Card>
      <CardHeader>
        <VStack align="stretch" spacing={2}>
          <Heading size="md">{ticket.title}</Heading>
          <HStack spacing={2}>
            {ticket.tags.map(({ tag }) => (
              <Tag key={tag.id} tag={tag} />
            ))}
          </HStack>
          <HStack spacing={4} fontSize="sm" color="gray.500">
            <Text>Created: {new Date(ticket.created_at).toLocaleString()}</Text>
            <Text>Updated: {new Date(ticket.updated_at).toLocaleString()}</Text>
          </HStack>
        </VStack>
      </CardHeader>
      <CardBody>
        <VStack align="stretch" spacing={4}>
          <Text>{ticket.description}</Text>
          <Box>
            <Heading size="sm" mb={2}>Metadata</Heading>
            <TicketMetadata metadata={ticket.metadata} />
          </Box>
          <Box>
            <Heading size="sm" mb={2}>Messages</Heading>
            <MessageFeed ticketId={ticket.id} />
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
}; 