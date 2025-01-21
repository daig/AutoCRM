import { useState, useEffect } from 'react';
import {
  Box,
  Input,
  VStack,
  Text,
  Wrap,
  WrapItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  IconButton,
  Button,
  useColorModeValue,
  FormControl,
  FormLabel,
  Select,
  NumberInput,
  NumberInputField,
  Switch,
  useToast,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { supabase } from '../../config/supabase';

interface MetadataFieldType {
  id: string;
  name: string;
  value_type: string;
  description: string | null;
}

interface ExistingMetadata {
  field_type: {
    id: string;
    name: string;
    value_type: string;
  };
  field_value_text: string | null;
  field_value_int: number | null;
  field_value_float: number | null;
  field_value_bool: boolean | null;
  field_value_date: string | null;
  field_value_timestamp: string | null;
  field_value_user: { id: string; full_name: string } | null;
  field_value_ticket: { id: string; title: string } | null;
}

interface MetadataSelectorProps {
  ticketId: string;
  existingMetadata: ExistingMetadata[];
  onMetadataAdded?: () => void;
}

export const MetadataSelector = ({ ticketId, existingMetadata, onMetadataAdded }: MetadataSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fieldTypes, setFieldTypes] = useState<MetadataFieldType[]>([]);
  const [selectedFieldType, setSelectedFieldType] = useState<MetadataFieldType | null>(null);
  const [fieldValue, setFieldValue] = useState<any>(null);
  const [users, setUsers] = useState<{ id: string; full_name: string }[]>([]);
  const [tickets, setTickets] = useState<{ id: string; title: string }[]>([]);
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');

  // Get existing field type IDs
  const existingFieldTypeIds = new Set(existingMetadata.map(m => m.field_type.id));

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch metadata field types
        const { data: typeData, error: typeError } = await supabase
          .from('ticket_metadata_field_types')
          .select('*')
          .returns<MetadataFieldType[]>();

        if (typeError) throw typeError;
        setFieldTypes(typeData || []);

        // Fetch users for user type fields
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, full_name');

        if (userError) throw userError;
        setUsers(userData || []);

        // Fetch tickets for ticket reference fields
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .select('id, title');

        if (ticketError) throw ticketError;
        setTickets(ticketData || []);
      } catch (err) {
        console.error('Error fetching metadata data:', err);
      }
    };

    fetchData();
  }, []);

  const handleAddMetadata = async () => {
    if (!selectedFieldType || fieldValue === null) return;

    try {
      // Prepare the metadata object based on the field type
      const metadata: any = {
        ticket: ticketId,
        field_type: selectedFieldType.id,
      };

      // Set the appropriate field value based on the type
      switch (selectedFieldType.value_type) {
        case 'text':
          metadata.field_value_text = fieldValue;
          break;
        case 'natural number':
          metadata.field_value_int = parseInt(fieldValue);
          break;
        case 'fractional number':
          metadata.field_value_float = parseFloat(fieldValue);
          break;
        case 'boolean':
          metadata.field_value_bool = fieldValue;
          break;
        case 'date':
          metadata.field_value_date = fieldValue;
          break;
        case 'timestamp':
          metadata.field_value_timestamp = fieldValue;
          break;
        case 'user':
          metadata.field_value_user = fieldValue;
          break;
        case 'ticket':
          metadata.field_value_ticket = fieldValue;
          break;
      }

      const { error } = await supabase
        .from('ticket_metadata')
        .insert([metadata]);

      if (error) throw error;

      setIsOpen(false);
      setSelectedFieldType(null);
      setFieldValue(null);
      onMetadataAdded?.();

      toast({
        title: 'Metadata added',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error adding metadata:', err);
      toast({
        title: 'Error adding metadata',
        description: err instanceof Error ? err.message : 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const renderValueInput = () => {
    if (!selectedFieldType) return null;

    switch (selectedFieldType.value_type) {
      case 'text':
        return (
          <Input
            placeholder="Enter text value"
            value={fieldValue || ''}
            onChange={(e) => setFieldValue(e.target.value)}
          />
        );
      case 'natural number':
        return (
          <NumberInput min={0} value={fieldValue || ''} onChange={(value) => setFieldValue(value)}>
            <NumberInputField placeholder="Enter number" />
          </NumberInput>
        );
      case 'fractional number':
        return (
          <NumberInput value={fieldValue || ''} onChange={(value) => setFieldValue(value)}>
            <NumberInputField placeholder="Enter number" />
          </NumberInput>
        );
      case 'boolean':
        return (
          <Switch
            isChecked={fieldValue || false}
            onChange={(e) => setFieldValue(e.target.checked)}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={fieldValue || ''}
            onChange={(e) => setFieldValue(e.target.value)}
          />
        );
      case 'timestamp':
        return (
          <Input
            type="datetime-local"
            value={fieldValue || ''}
            onChange={(e) => setFieldValue(e.target.value)}
          />
        );
      case 'user':
        return (
          <Select
            placeholder="Select user"
            value={fieldValue || ''}
            onChange={(e) => setFieldValue(e.target.value)}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name}
              </option>
            ))}
          </Select>
        );
      case 'ticket':
        return (
          <Select
            placeholder="Select ticket"
            value={fieldValue || ''}
            onChange={(e) => setFieldValue(e.target.value)}
          >
            {tickets.map((ticket) => (
              <option key={ticket.id} value={ticket.id}>
                {ticket.title}
              </option>
            ))}
          </Select>
        );
      default:
        return null;
    }
  };

  const availableFieldTypes = fieldTypes.filter(type => !existingFieldTypeIds.has(type.id));

  return (
    <Box display="inline-block">
      <Popover
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setSelectedFieldType(null);
          setFieldValue(null);
        }}
        placement="bottom-start"
      >
        <PopoverTrigger>
          <IconButton
            icon={<AddIcon />}
            aria-label="Add metadata"
            size="sm"
            variant="ghost"
            onClick={() => setIsOpen(true)}
          />
        </PopoverTrigger>
        <PopoverContent width="300px" bg={bgColor}>
          <PopoverBody>
            <VStack align="stretch" spacing={4}>
              <FormControl>
                <FormLabel>Field Type</FormLabel>
                <Select
                  placeholder="Select field type"
                  value={selectedFieldType?.id || ''}
                  onChange={(e) => {
                    const type = fieldTypes.find(t => t.id === e.target.value);
                    setSelectedFieldType(type || null);
                    setFieldValue(null);
                  }}
                >
                  {availableFieldTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {selectedFieldType && (
                <FormControl>
                  <FormLabel>Value</FormLabel>
                  {renderValueInput()}
                </FormControl>
              )}

              <Button
                colorScheme="blue"
                onClick={handleAddMetadata}
                isDisabled={!selectedFieldType || fieldValue === null}
              >
                Add Metadata
              </Button>
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Box>
  );
}; 