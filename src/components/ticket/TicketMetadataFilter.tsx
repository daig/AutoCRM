import {
  Box,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverHeader,
  PopoverFooter,
  VStack,
  Text,
  useColorModeValue,
  HStack,
  Icon,
  Wrap,
  WrapItem,
  Switch,
  Tooltip,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  FormControl,
  FormLabel,
  Tag,
  TagLabel,
  TagCloseButton,
  TagLeftIcon,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { supabase } from '../../config/supabase';
import { FiFilter, FiEdit2 } from 'react-icons/fi';

interface MetadataFieldType {
  id: string;
  name: string;
  value_type: string;
  description: string | null;
}

export interface MetadataFilter {
  fieldType: MetadataFieldType;
  value: any;
}

interface TicketMetadataFilterProps {
  isFilterEnabled: boolean;
  onFilterChange: (filters: MetadataFilter[]) => void;
  onFilterEnabledChange: (enabled: boolean) => void;
}

// Remove the timezone adjustment functions and simplify date handling
const formatDateValue = (date: string | null) => {
  if (!date) return '';
  // Just return the date string as is - it's already in YYYY-MM-DD format
  return date;
};

export const TicketMetadataFilter = ({ 
  isFilterEnabled,
  onFilterChange,
  onFilterEnabledChange,
}: TicketMetadataFilterProps) => {
  const [fieldTypes, setFieldTypes] = useState<MetadataFieldType[]>([]);
  const [selectedFieldType, setSelectedFieldType] = useState<MetadataFieldType | null>(null);
  const [fieldValue, setFieldValue] = useState<any>(null);
  const [activeFilters, setActiveFilters] = useState<MetadataFilter[]>([]);
  const [users, setUsers] = useState<{ id: string; full_name: string }[]>([]);
  const [tickets, setTickets] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgColor = useColorModeValue('white', 'gray.800');

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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddFilter = () => {
    if (!selectedFieldType || fieldValue === null) return;

    const existingFilterIndex = activeFilters.findIndex(
      filter => filter.fieldType.id === selectedFieldType.id
    );

    let newFilters;
    if (existingFilterIndex !== -1) {
      // Update existing filter
      newFilters = activeFilters.map((filter, index) => 
        index === existingFilterIndex 
          ? { ...filter, value: fieldValue }
          : filter
      );
    } else {
      // Add new filter
      newFilters = [...activeFilters, {
        fieldType: selectedFieldType,
        value: fieldValue,
      }];
    }

    setActiveFilters(newFilters);
    onFilterChange(newFilters);

    // Reset selection and close popover
    setSelectedFieldType(null);
    setFieldValue(null);
    setIsPopoverOpen(false);
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = activeFilters.filter((_, i) => i !== index);
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleFilterButtonClick = () => {
    if (!isFilterEnabled) {
      onFilterEnabledChange(true);
    }
    setIsPopoverOpen(true);
  };

  const handlePopoverClose = () => {
    setIsPopoverOpen(false);
    setSelectedFieldType(null);
    setFieldValue(null);
  };

  const handleFieldTypeChange = (fieldTypeId: string) => {
    const type = fieldTypes.find(t => t.id === fieldTypeId);
    if (!type) return;

    setSelectedFieldType(type);
    
    // Check if there's an existing filter for this field type
    const existingFilter = activeFilters.find(filter => filter.fieldType.id === fieldTypeId);
    if (existingFilter) {
      setFieldValue(existingFilter.value);
    } else {
      setFieldValue(null);
    }
  };

  const handleTagClick = (filter: MetadataFilter) => {
    setSelectedFieldType(filter.fieldType);
    setFieldValue(filter.value);
    setIsPopoverOpen(true);
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
            isDisabled={!isFilterEnabled}
          />
        );
      case 'natural number':
        return (
          <NumberInput 
            min={0} 
            value={fieldValue || ''} 
            onChange={(value) => setFieldValue(value)}
            isDisabled={!isFilterEnabled}
          >
            <NumberInputField placeholder="Enter number" />
          </NumberInput>
        );
      case 'fractional number':
        return (
          <NumberInput 
            value={fieldValue || ''} 
            onChange={(value) => setFieldValue(value)}
            isDisabled={!isFilterEnabled}
          >
            <NumberInputField placeholder="Enter number" />
          </NumberInput>
        );
      case 'boolean':
        return (
          <Switch
            isChecked={fieldValue || false}
            onChange={(e) => setFieldValue(e.target.checked)}
            isDisabled={!isFilterEnabled}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={formatDateValue(fieldValue)}
            onChange={(e) => setFieldValue(e.target.value)}
            isDisabled={!isFilterEnabled}
          />
        );
      case 'timestamp':
        return (
          <Input
            type="datetime-local"
            value={fieldValue || ''}
            onChange={(e) => {
              // For timestamp fields, we do want to handle timezone
              const date = new Date(e.target.value);
              setFieldValue(date.toISOString());
            }}
            isDisabled={!isFilterEnabled}
          />
        );
      case 'user':
        return (
          <Select
            placeholder="Select user"
            value={fieldValue || ''}
            onChange={(e) => setFieldValue(e.target.value)}
            isDisabled={!isFilterEnabled}
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
            isDisabled={!isFilterEnabled}
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

  const getFilterDisplayValue = (filter: MetadataFilter) => {
    switch (filter.fieldType.value_type) {
      case 'boolean':
        return filter.value ? 'Yes' : 'No';
      case 'user':
        const user = users.find(u => u.id === filter.value);
        return user?.full_name || filter.value;
      case 'ticket':
        const ticket = tickets.find(t => t.id === filter.value);
        return ticket?.title || filter.value;
      default:
        return String(filter.value);
    }
  };

  if (loading) {
    return <Text p={4}>Loading filters...</Text>;
  }

  return (
    <Box>
      <VStack align="stretch" spacing={2}>
        <HStack>
          <Popover 
            placement="right-start" 
            strategy="fixed"
            isOpen={isPopoverOpen}
            onClose={handlePopoverClose}
          >
            <PopoverTrigger>
              <Button
                leftIcon={<Icon as={FiFilter} />}
                size="sm"
                variant="outline"
                onClick={handleFilterButtonClick}
              >
                Filter by Metadata
              </Button>
            </PopoverTrigger>
            <PopoverContent width="300px" bg={bgColor}>
              <PopoverHeader fontWeight="semibold" borderBottom="1px" borderColor={borderColor}>
                Filter by Metadata
              </PopoverHeader>
              <PopoverBody>
                <VStack align="stretch" spacing={4}>
                  <FormControl>
                    <FormLabel>Field Type</FormLabel>
                    <Select
                      placeholder="Select field type"
                      value={selectedFieldType?.id || ''}
                      onChange={(e) => handleFieldTypeChange(e.target.value)}
                      isDisabled={!isFilterEnabled}
                    >
                      {fieldTypes.map((type) => (
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
                    onClick={handleAddFilter}
                    isDisabled={!selectedFieldType || fieldValue === null || !isFilterEnabled}
                  >
                    Add Filter
                  </Button>
                </VStack>
              </PopoverBody>
              <PopoverFooter borderTop="1px" borderColor={borderColor}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setActiveFilters([]);
                    onFilterChange([]);
                  }}
                  isDisabled={activeFilters.length === 0 || !isFilterEnabled}
                >
                  Clear All Filters
                </Button>
              </PopoverFooter>
            </PopoverContent>
          </Popover>
        </HStack>

        {/* Show active filters */}
        {isFilterEnabled && activeFilters.length > 0 && (
          <Box>
            <Wrap spacing={2}>
              {activeFilters.map((filter, index) => (
                <WrapItem key={index}>
                  <Tag 
                    size="md" 
                    borderRadius="full" 
                    variant="subtle"
                    whiteSpace="normal"
                    wordBreak="break-word"
                    maxW="none"
                    cursor="pointer"
                    onClick={() => handleTagClick(filter)}
                    _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                  >
                    <TagLeftIcon as={FiEdit2} boxSize="12px" />
                    <TagLabel>
                      <Text as="span" fontWeight="medium">{filter.fieldType.name}:</Text>
                      {' '}
                      <Text as="span">{getFilterDisplayValue(filter)}</Text>
                    </TagLabel>
                    <TagCloseButton 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFilter(index);
                      }} 
                    />
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          </Box>
        )}
      </VStack>
    </Box>
  );
}; 