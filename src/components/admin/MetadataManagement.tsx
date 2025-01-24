import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  Input,
  List,
  ListItem,
  Select,
  Text,
  VStack,
  useToast,
  IconButton,
  HStack,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';

const VALUE_TYPES = [
  'text',
  'natural number',
  'fractional number',
  'boolean',
  'date',
  'timestamp',
  'user',
  'ticket'
] as const;

type ValueType = typeof VALUE_TYPES[number];

interface MetadataFieldType {
  id: string;
  name: string;
  value_type: ValueType;
}

export const MetadataManagement = () => {
  const [fieldTypes, setFieldTypes] = useState<MetadataFieldType[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newValueType, setNewValueType] = useState<ValueType>('text');
  const toast = useToast();

  const fetchFieldTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_metadata_field_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setFieldTypes(data || []);
    } catch (error) {
      console.error('Error fetching metadata field types:', error);
      toast({
        title: 'Error fetching metadata fields',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchFieldTypes();
  }, []);

  const handleCreateField = async () => {
    if (!newFieldName.trim()) return;

    try {
      const { error } = await supabase
        .from('ticket_metadata_field_types')
        .insert([{
          name: newFieldName.trim(),
          value_type: newValueType
        }]);

      if (error) throw error;

      toast({
        title: 'Metadata field created',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setNewFieldName('');
      setNewValueType('text');
      fetchFieldTypes();
    } catch (error) {
      toast({
        title: 'Error creating metadata field',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    try {
      const { error } = await supabase
        .from('ticket_metadata_field_types')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;

      toast({
        title: 'Metadata field deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchFieldTypes();
    } catch (error) {
      toast({
        title: 'Error deleting metadata field',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <VStack align="stretch" spacing={6}>
        <Box>
          <Heading size="md" mb={4}>Create New Metadata Field</Heading>
          <Grid templateColumns="1fr 1fr auto" gap={4} alignItems="end">
            <FormControl>
              <FormLabel>Field Name</FormLabel>
              <Input
                placeholder="Enter field name"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Value Type</FormLabel>
              <Select
                value={newValueType}
                onChange={(e) => setNewValueType(e.target.value as ValueType)}
              >
                {VALUE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </Select>
            </FormControl>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              onClick={handleCreateField}
            >
              Create
            </Button>
          </Grid>
        </Box>

        <Box>
          <Heading size="md" mb={4}>Existing Metadata Fields</Heading>
          <List spacing={2}>
            {fieldTypes.map((field) => (
              <ListItem
                key={field.id}
                p={3}
                borderWidth={1}
                borderRadius="md"
              >
                <HStack justify="space-between">
                  <Box>
                    <Text fontWeight="bold">{field.name}</Text>
                    <Text fontSize="sm" color="gray.600">
                      Type: {field.value_type}
                    </Text>
                  </Box>
                  <IconButton
                    aria-label="Delete field"
                    icon={<DeleteIcon />}
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => handleDeleteField(field.id)}
                  />
                </HStack>
              </ListItem>
            ))}
          </List>
        </Box>
      </VStack>
    </Box>
  );
}; 