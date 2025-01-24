import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  Text,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Textarea,
  Checkbox,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { supabase } from '../../config/supabase';
import type { Database } from '../../types/supabase';

type MetadataValueType = Database['public']['Enums']['metadata_value_type'];

export const MetadataFieldManagement = () => {
  const [fields, setFields] = useState<Array<{
    id: string;
    name: string;
    description: string | null;
    value_type: MetadataValueType;
  }>>([]);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [newField, setNewField] = useState({
    name: '',
    description: '',
    value_type: '' as MetadataValueType,
  });
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const valueTypes: MetadataValueType[] = [
    'text',
    'natural number',
    'fractional number',
    'boolean',
    'date',
    'timestamp',
    'user',
    'ticket',
  ];

  const fetchFields = async () => {
    const { data, error } = await supabase
      .from('ticket_metadata_field_types')
      .select('*');
    if (error) {
      toast({ title: 'Error fetching metadata fields', status: 'error', duration: 3000 });
      return;
    }
    setFields(data);
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const handleCreateField = async () => {
    if (!newField.name || !newField.value_type) {
      toast({ title: 'Name and type are required', status: 'error', duration: 3000 });
      return;
    }

    const { error } = await supabase.from('ticket_metadata_field_types').insert([{
      name: newField.name,
      description: newField.description || null,
      value_type: newField.value_type,
    }]);

    if (error) {
      toast({ title: 'Error creating metadata field', status: 'error', duration: 3000 });
      return;
    }

    toast({ title: 'Metadata field created', status: 'success', duration: 3000 });
    setNewField({ name: '', description: '', value_type: '' as MetadataValueType });
    fetchFields();
  };

  const handleDeleteField = async (id: string) => {
    const { error } = await supabase
      .from('ticket_metadata_field_types')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error deleting metadata field', status: 'error', duration: 3000 });
      return;
    }

    toast({ title: 'Metadata field deleted', status: 'success', duration: 3000 });
    fetchFields();
  };

  const handleSelectAllFields = (checked: boolean) => {
    if (checked) {
      setSelectedFields(new Set(fields.map(field => field.id)));
    } else {
      setSelectedFields(new Set());
    }
  };

  const handleSelectField = (fieldId: string, checked: boolean) => {
    const newSelected = new Set(selectedFields);
    if (checked) {
      newSelected.add(fieldId);
    } else {
      newSelected.delete(fieldId);
    }
    setSelectedFields(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedFields.size === 0) return;

    const { error } = await supabase
      .from('ticket_metadata_field_types')
      .delete()
      .in('id', Array.from(selectedFields));

    if (error) {
      toast({ title: 'Error deleting metadata fields', status: 'error', duration: 3000 });
      return;
    }

    toast({ title: 'Metadata fields deleted', status: 'success', duration: 3000 });
    setSelectedFields(new Set());
    fetchFields();
    onClose();
  };

  return (
    <Box>
      <Text fontSize="xl" fontWeight="bold" mb={4}>Metadata Fields</Text>
      
      <VStack spacing={4} align="stretch" mb={6}>
        <FormControl isRequired>
          <FormLabel>Field Name</FormLabel>
          <Input
            value={newField.name}
            onChange={(e) => setNewField({ ...newField, name: e.target.value })}
            placeholder="Enter field name"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Value Type</FormLabel>
          <Select
            value={newField.value_type}
            onChange={(e) => setNewField({ ...newField, value_type: e.target.value as MetadataValueType })}
            placeholder="Select value type"
          >
            {valueTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Description</FormLabel>
          <Textarea
            value={newField.description}
            onChange={(e) => setNewField({ ...newField, description: e.target.value })}
            placeholder="Enter field description"
          />
        </FormControl>

        <Button leftIcon={<AddIcon />} onClick={handleCreateField} alignSelf="flex-start">
          Create Field
        </Button>
      </VStack>

      {selectedFields.size > 0 && (
        <HStack spacing={4} mb={4}>
          <Button
            colorScheme="red"
            leftIcon={<DeleteIcon />}
            onClick={onOpen}
          >
            Delete Selected ({selectedFields.size})
          </Button>
        </HStack>
      )}

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>
              <Checkbox
                isChecked={fields.length > 0 && selectedFields.size === fields.length}
                isIndeterminate={selectedFields.size > 0 && selectedFields.size < fields.length}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSelectAllFields(e.target.checked)}
              />
            </Th>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th>Description</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {fields.map((field) => (
            <Tr key={field.id}>
              <Td>
                <Checkbox
                  isChecked={selectedFields.has(field.id)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSelectField(field.id, e.target.checked)}
                />
              </Td>
              <Td>{field.name}</Td>
              <Td>{field.value_type}</Td>
              <Td>{field.description}</Td>
              <Td>
                <IconButton
                  aria-label="Delete field"
                  icon={<DeleteIcon />}
                  colorScheme="red"
                  onClick={() => handleDeleteField(field.id)}
                />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {/* Bulk Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader color="red.500">⚠️ Delete Metadata Fields</ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold">
                Are you sure you want to delete {selectedFields.size} metadata field{selectedFields.size !== 1 ? 's' : ''}?
              </Text>
              <Text color="red.500">
                This action cannot be undone and will:
              </Text>
              <VStack align="stretch" pl={4}>
                <Text>• Delete all selected metadata field definitions</Text>
                <Text>• Remove these fields from all tickets</Text>
                <Text>• Delete all associated metadata values</Text>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleBulkDelete}>
              Delete Fields
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}; 