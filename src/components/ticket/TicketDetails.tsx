import React, { useRef, useState } from 'react';
import { 
  VStack, 
  Box, 
  Text, 
  Heading, 
  Divider, 
  Flex, 
  Tag, 
  TagLabel, 
  TagCloseButton, 
  useToast,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  useDisclosure,
  Grid,
  GridItem,
  Spinner,
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import type { TicketData } from '../../types/ticket';
import { TagSelector } from '../tag/TagSelector';
import { MetadataSelector } from '../metadata/MetadataSelector';
import { supabase } from '../../config/supabase';
import { useNavigate } from 'react-router-dom';

interface TicketDetailsProps {
  ticket: TicketData | null;
  onRefresh: () => void;
}

// Add utility function for formatting dates
const formatDate = (dateStr: string) => {
  // For a date field (YYYY-MM-DD), we want to display it without timezone conversion
  // Split by T or space to handle both ISO format and plain dates
  return dateStr.split(/[T\s]/)[0];
};

// Add utility function for formatting timestamps with timezone
const formatTimestamp = (timestamp: string) => {
  // Create a date object from the UTC timestamp and format it in local time
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
};

export const TicketDetails = ({ ticket, onRefresh }: TicketDetailsProps) => {
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [loadingTags, setLoadingTags] = useState<{ [key: string]: boolean }>({});

  const handleRemoveTag = async (tagId: string) => {
    try {
      setLoadingTags(prev => ({ ...prev, [tagId]: true }));
      
      // Delete the tag
      const { error } = await supabase
        .from('ticket_tags')
        .delete()
        .eq('ticket', ticket?.id)
        .eq('tag', tagId);

      if (error) throw error;

      // Wait a small delay after the delete before refreshing to ensure the database has updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Refresh the UI
      await onRefresh();
      
      // Wait a small delay after the refresh to ensure React has updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Finally clear the loading state
      setLoadingTags(prev => ({ ...prev, [tagId]: false }));
    } catch (err) {
      console.error('Error removing tag:', err);
      toast({
        title: 'Error removing tag',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setLoadingTags(prev => ({ ...prev, [tagId]: false }));
    }
  };

  const handleDeleteTicket = async () => {
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticket?.id);

      if (error) throw error;
      
      toast({
        title: 'Ticket deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onRefresh();
      onClose();
      navigate('/crm', { state: { clearSelection: true } });
    } catch (err) {
      console.error('Error deleting ticket:', err);
      toast({
        title: 'Error deleting ticket',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    }
  };

  if (!ticket) {
    return (
      <Box p={4}>
        <Text color="gray.500">Select a ticket to view details</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Flex justify="space-between" align="center">
        <Box>
          <Heading size="md">{ticket.title}</Heading>
          <Text color="gray.500" fontSize="sm" mt={1}>
            Created: {new Date(ticket.created_at).toLocaleDateString()}
          </Text>
          <Text color="gray.500" fontSize="sm">
            Created by: {ticket.creator.full_name}
          </Text>
        </Box>
        <IconButton
          aria-label="Delete ticket"
          icon={<DeleteIcon />}
          colorScheme="red"
          variant="ghost"
          onClick={onOpen}
        />
      </Flex>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Ticket
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this ticket? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteTicket} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

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
            <Tag
              key={tag.id}
              mr={2}
              mb={2}
              colorScheme={tag.tag_type.name === 'status' ? 'green' : 'blue'}
              size="md"
            >
              <TagLabel>{tag.name}</TagLabel>
              {loadingTags[tag.id] ? (
                <Box ml={1} mr={1}>
                  <Spinner size="xs" />
                </Box>
              ) : (
                <TagCloseButton onClick={() => handleRemoveTag(tag.id)} />
              )}
            </Tag>
          ))}
        </Box>
      </Box>

      <Box>
        <Flex align="center" mb={2}>
          <Text fontWeight="medium">Metadata</Text>
          <MetadataSelector
            ticketId={ticket.id}
            existingMetadata={ticket.metadata}
            onMetadataAdded={onRefresh}
          />
        </Flex>
        <Grid templateColumns="auto 1fr" gap={2} alignItems="center">
          {ticket.metadata.map((field) => (
            <React.Fragment key={field.field_type.id}>
              <GridItem>
                <Text fontSize="sm" color="gray.500">
                  {field.field_type.name}:
                </Text>
              </GridItem>
              <GridItem>
                <Text>
                  {field.field_value_text ||
                    field.field_value_int?.toString() ||
                    field.field_value_float?.toString() ||
                    (field.field_value_bool !== null ? (field.field_value_bool ? 'Yes' : 'No') : '') ||
                    (field.field_value_date ? formatDate(field.field_value_date) : '') ||
                    (field.field_value_timestamp ? formatTimestamp(field.field_value_timestamp) : '') ||
                    field.field_value_user?.full_name ||
                    field.field_value_ticket?.title ||
                    'N/A'}
                </Text>
              </GridItem>
            </React.Fragment>
          ))}
        </Grid>
      </Box>
    </VStack>
  );
}; 