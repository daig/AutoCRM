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
  ButtonGroup,
  IconButton,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { supabase } from '../../config/supabase';
import { FiFilter, FiEdit2, FiUser, FiTag, FiCalendar, FiClock, FiToggleLeft, FiHash, FiType, FiDollarSign, FiTarget } from 'react-icons/fi';
import { TbEqual, TbMathGreater, TbMathLower, TbArrowsHorizontal } from 'react-icons/tb';
import { MetadataFieldTypeSelector } from '../metadata/MetadataFieldTypeSelector';
import type { MetadataFieldType } from '../metadata/MetadataFieldTypeSelector';

// Export the mapping for use in parent components
export const VALUE_TYPE_TO_COLUMN = {
  'text': 'field_value_text',
  'natural number': 'field_value_int',
  'fractional number': 'field_value_float',
  'boolean': 'field_value_bool',
  'date': 'field_value_date',
  'timestamp': 'field_value_timestamp',
  'user': 'field_value_user',
  'ticket': 'field_value_ticket'
} as const;

export type MetadataValueType = keyof typeof VALUE_TYPE_TO_COLUMN;

type NumericFilterMode = 'eq' | 'gt' | 'lt' | 'between';
type DateFilterMode = 'eq' | 'gt' | 'lt' | 'between';

interface NumericFilterValue {
  mode: NumericFilterMode;
  value: number | null;
  value2: number | null; // For 'between' mode
}

interface DateFilterValue {
  mode: DateFilterMode;
  value: string | null;
  value2: string | null; // For 'between' mode
}

export interface MetadataFilter {
  fieldType: MetadataFieldType;
  value: any;
  columnName?: string;
  numericFilter?: NumericFilterValue;
  dateFilter?: DateFilterValue;
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

const getFieldTypeIcon = (valueType: MetadataValueType) => {
  switch (valueType) {
    case 'text':
      return FiType;
    case 'natural number':
      return FiHash;
    case 'fractional number':
      return FiDollarSign;
    case 'boolean':
      return FiToggleLeft;
    case 'date':
      return FiCalendar;
    case 'timestamp':
      return FiClock;
    case 'user':
      return FiUser;
    case 'ticket':
      return FiTag;
    default:
      return FiFilter;
  }
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
  const [numericMode, setNumericMode] = useState<NumericFilterMode>('eq');
  const [secondValue, setSecondValue] = useState<number | null>(null);
  const [dateMode, setDateMode] = useState<DateFilterMode>('between');
  const [dateSecondValue, setDateSecondValue] = useState<string | null>(null);
  
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
    if (!selectedFieldType) return;

    // For date/timestamp fields, validate that at least one date is provided
    // and that the dates are in correct order if both are provided
    if (selectedFieldType.value_type === 'date' || selectedFieldType.value_type === 'timestamp') {
      if (!fieldValue && !dateSecondValue) return;
      if (fieldValue && dateSecondValue) {
        const start = new Date(fieldValue);
        const end = new Date(dateSecondValue);
        if (start > end) return;
      }
    } else if (fieldValue === null) {
      return;
    }

    const existingFilterIndex = activeFilters.findIndex(
      filter => filter.fieldType.id === selectedFieldType.id
    );

    let numericFilter: NumericFilterValue | undefined;
    let dateFilter: DateFilterValue | undefined;

    if (selectedFieldType.value_type === 'fractional number' || selectedFieldType.value_type === 'natural number') {
      numericFilter = {
        mode: numericMode,
        value: Number(fieldValue),
        value2: numericMode === 'between' ? Number(secondValue) : null
      };
    } else if (selectedFieldType.value_type === 'date' || selectedFieldType.value_type === 'timestamp') {
      if (dateMode === 'eq') {
        dateFilter = {
          mode: 'eq',
          value: fieldValue,
          value2: null
        };
      } else if (fieldValue && dateSecondValue) {
        dateFilter = {
          mode: 'between',
          value: fieldValue,
          value2: dateSecondValue
        };
      } else if (fieldValue) {
        dateFilter = {
          mode: 'gt',
          value: fieldValue,
          value2: null
        };
      } else if (dateSecondValue) {
        // When only "to" date is provided, treat it as "before"
        dateFilter = {
          mode: 'lt',
          value: dateSecondValue,
          value2: null
        };
      }
    }

    const newFilter = {
      fieldType: selectedFieldType,
      value: fieldValue || dateSecondValue, // Use either date for the base value
      columnName: VALUE_TYPE_TO_COLUMN[selectedFieldType.value_type as MetadataValueType],
      numericFilter,
      dateFilter
    };

    let newFilters;
    if (existingFilterIndex !== -1) {
      newFilters = activeFilters.map((filter, index) => 
        index === existingFilterIndex ? newFilter : filter
      );
    } else {
      newFilters = [...activeFilters, newFilter];
    }

    setActiveFilters(newFilters);
    onFilterChange(newFilters);

    // Reset all inputs
    setSelectedFieldType(null);
    setFieldValue(null);
    setSecondValue(null);
    setNumericMode('eq');
    setDateMode('between');
    setDateSecondValue(null);
    setIsPopoverOpen(false);
  };

  const isAddFilterDisabled = () => {
    if (!selectedFieldType || !isFilterEnabled) return true;

    if (selectedFieldType.value_type === 'date' || selectedFieldType.value_type === 'timestamp') {
      // Require at least one date
      if (!fieldValue && !dateSecondValue) return true;

      // If both dates are provided, ensure they're in correct order
      if (fieldValue && dateSecondValue) {
        const start = new Date(fieldValue);
        const end = new Date(dateSecondValue);
        return start > end;
      }

      return false;
    }

    return fieldValue === null;
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
    setSecondValue(null);
    setNumericMode('eq');
    setDateMode('between');
    setDateSecondValue(null);
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
    
    // Handle numeric filters
    if (filter.numericFilter) {
      const { mode, value, value2 } = filter.numericFilter;
      setNumericMode(mode);
      setFieldValue(value);
      setSecondValue(value2);
    } else {
      // Handle non-numeric filters as before
      setFieldValue(filter.value);
      // Reset numeric filter state
      setNumericMode('eq');
      setSecondValue(null);
    }
    
    // Handle date filters
    if (filter.dateFilter) {
      const { mode, value, value2 } = filter.dateFilter;
      setDateMode(mode);
      setFieldValue(value);
      setDateSecondValue(value2);
    } else {
      // Reset date filter state
      setDateMode('between');
      setDateSecondValue(null);
    }
    
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
      case 'fractional number':
        const isNatural = selectedFieldType.value_type === 'natural number';
        return (
          <VStack align="stretch" spacing={2}>
            <ButtonGroup size="sm" isAttached variant="outline" width="full" isDisabled={!isFilterEnabled}>
              <Tooltip label="Equal to">
                <IconButton
                  icon={<TbEqual />}
                  aria-label="Equal to"
                  flex={1}
                  colorScheme={numericMode === 'eq' ? 'blue' : undefined}
                  onClick={() => setNumericMode('eq')}
                />
              </Tooltip>
              <Tooltip label="Greater than">
                <IconButton
                  icon={<TbMathGreater />}
                  aria-label="Greater than"
                  flex={1}
                  colorScheme={numericMode === 'gt' ? 'blue' : undefined}
                  onClick={() => setNumericMode('gt')}
                />
              </Tooltip>
              <Tooltip label="Less than">
                <IconButton
                  icon={<TbMathLower />}
                  aria-label="Less than"
                  flex={1}
                  colorScheme={numericMode === 'lt' ? 'blue' : undefined}
                  onClick={() => setNumericMode('lt')}
                />
              </Tooltip>
              <Tooltip label="Between">
                <IconButton
                  icon={<TbArrowsHorizontal />}
                  aria-label="Between"
                  flex={1}
                  colorScheme={numericMode === 'between' ? 'blue' : undefined}
                  onClick={() => setNumericMode('between')}
                />
              </Tooltip>
            </ButtonGroup>
            {numericMode === 'between' ? (
              <HStack>
                <NumberInput
                  min={isNatural ? 0 : undefined}
                  value={fieldValue || ''}
                  onChange={(value) => setFieldValue(value)}
                  isDisabled={!isFilterEnabled}
                >
                  <NumberInputField placeholder="Min value" />
                </NumberInput>
                <NumberInput
                  min={isNatural ? 0 : undefined}
                  value={secondValue || ''}
                  onChange={(value) => setSecondValue(Number(value))}
                  isDisabled={!isFilterEnabled}
                >
                  <NumberInputField placeholder="Max value" />
                </NumberInput>
              </HStack>
            ) : (
              <NumberInput
                min={isNatural ? 0 : undefined}
                value={fieldValue || ''}
                onChange={(value) => setFieldValue(value)}
                isDisabled={!isFilterEnabled}
              >
                <NumberInputField placeholder="Enter number" />
              </NumberInput>
            )}
          </VStack>
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
        const formatDisplayDate = (date: string | null) => {
          if (!date) return '';
          return new Date(date).toLocaleDateString();
        };

        const getDateRangeText = () => {
          if (dateMode === 'eq' && fieldValue) {
            return `on ${formatDisplayDate(fieldValue)}`;
          } else if (fieldValue && dateSecondValue) {
            return `${formatDisplayDate(fieldValue)} to ${formatDisplayDate(dateSecondValue)}`;
          } else if (fieldValue) {
            return `after ${formatDisplayDate(fieldValue)}`;
          } else if (dateSecondValue) {
            return `before ${formatDisplayDate(dateSecondValue)}`;
          }
          return '';
        };

        return (
          <VStack align="stretch" spacing={2}>
            <HStack spacing={2} align="center">
              <HStack spacing={2}>
                <Box position="relative">
                  <Input
                    type="date"
                    size="sm"
                    value={formatDateValue(fieldValue)}
                    onChange={(e) => {
                      setFieldValue(e.target.value);
                      if (dateMode === 'eq') {
                        setDateMode('between');
                      }
                    }}
                    isDisabled={!isFilterEnabled}
                    opacity="0"
                    position="absolute"
                    top="0"
                    left="0"
                    width="full"
                    height="full"
                    cursor="pointer"
                    zIndex={1}
                  />
                  <IconButton
                    aria-label="From date"
                    icon={<Icon as={FiCalendar} />}
                    size="sm"
                    variant="outline"
                    isDisabled={!isFilterEnabled}
                  />
                </Box>
                <Box position="relative">
                  <Input
                    type="date"
                    size="sm"
                    value={formatDateValue(dateSecondValue)}
                    onChange={(e) => {
                      setDateSecondValue(e.target.value);
                      setDateMode('between');
                    }}
                    isDisabled={!isFilterEnabled || dateMode === 'eq'}
                    opacity="0"
                    position="absolute"
                    top="0"
                    left="0"
                    width="full"
                    height="full"
                    cursor="pointer"
                    zIndex={1}
                  />
                  <IconButton
                    aria-label="To date"
                    icon={<Icon as={FiCalendar} />}
                    size="sm"
                    variant="outline"
                    isDisabled={!isFilterEnabled || dateMode === 'eq'}
                  />
                </Box>
              </HStack>
              <Text fontSize="sm" color="gray.600" flex="1">
                {getDateRangeText() || 'Select dates'}
              </Text>
            </HStack>
            <HStack spacing={2} align="center">
              <Switch
                id="exact-date"
                size="sm"
                isChecked={dateMode === 'eq'}
                onChange={(e) => {
                  if (e.target.checked) {
                    setDateMode('eq');
                    setDateSecondValue(null);
                  } else {
                    setDateMode('between');
                  }
                }}
                isDisabled={!isFilterEnabled || !fieldValue}
              />
              <FormLabel htmlFor="exact-date" fontSize="sm" mb="0" cursor="pointer" flexShrink={0}>
                Exact Date
              </FormLabel>
            </HStack>
          </VStack>
        );
      case 'timestamp':
        const formatDisplayTime = (date: string | null) => {
          if (!date) return '';
          return new Date(date).toLocaleString();
        };

        const getTimeRangeText = () => {
          if (dateMode === 'eq' && fieldValue) {
            return `on ${formatDisplayTime(fieldValue)}`;
          } else if (fieldValue && dateSecondValue) {
            return `${formatDisplayTime(fieldValue)} to ${formatDisplayTime(dateSecondValue)}`;
          } else if (fieldValue) {
            return `after ${formatDisplayTime(fieldValue)}`;
          } else if (dateSecondValue) {
            return `before ${formatDisplayTime(dateSecondValue)}`;
          }
          return '';
        };

        return (
          <VStack align="stretch" spacing={2}>
            <HStack spacing={2} align="center">
              <HStack spacing={2}>
                <Box position="relative">
                  <Input
                    type="datetime-local"
                    size="sm"
                    value={fieldValue || ''}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      setFieldValue(date.toISOString());
                      if (dateMode === 'eq') {
                        setDateMode('between');
                      }
                    }}
                    isDisabled={!isFilterEnabled}
                    opacity="0"
                    position="absolute"
                    top="0"
                    left="0"
                    width="full"
                    height="full"
                    cursor="pointer"
                    zIndex={1}
                  />
                  <IconButton
                    aria-label="From time"
                    icon={<Icon as={FiClock} />}
                    size="sm"
                    variant="outline"
                    isDisabled={!isFilterEnabled}
                  />
                </Box>
                <Box position="relative">
                  <Input
                    type="datetime-local"
                    size="sm"
                    value={dateSecondValue || ''}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      setDateSecondValue(date.toISOString());
                      setDateMode('between');
                    }}
                    isDisabled={!isFilterEnabled || dateMode === 'eq'}
                    opacity="0"
                    position="absolute"
                    top="0"
                    left="0"
                    width="full"
                    height="full"
                    cursor="pointer"
                    zIndex={1}
                  />
                  <IconButton
                    aria-label="To time"
                    icon={<Icon as={FiClock} />}
                    size="sm"
                    variant="outline"
                    isDisabled={!isFilterEnabled || dateMode === 'eq'}
                  />
                </Box>
              </HStack>
              <Text fontSize="sm" color="gray.600" flex="1">
                {getTimeRangeText() || 'Select times'}
              </Text>
            </HStack>
            <HStack spacing={2} align="center">
              <Switch
                id="exact-time"
                size="sm"
                isChecked={dateMode === 'eq'}
                onChange={(e) => {
                  if (e.target.checked) {
                    setDateMode('eq');
                    setDateSecondValue(null);
                  } else {
                    setDateMode('between');
                  }
                }}
                isDisabled={!isFilterEnabled || !fieldValue}
              />
              <FormLabel htmlFor="exact-time" fontSize="sm" mb="0" cursor="pointer" flexShrink={0}>
                Exact Time
              </FormLabel>
            </HStack>
          </VStack>
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
    if (filter.numericFilter) {
      switch (filter.numericFilter.mode) {
        case 'eq':
          return `= ${filter.numericFilter.value}`;
        case 'gt':
          return `> ${filter.numericFilter.value}`;
        case 'lt':
          return `< ${filter.numericFilter.value}`;
        case 'between':
          return `${filter.numericFilter.value} - ${filter.numericFilter.value2}`;
      }
    }
    if (filter.dateFilter) {
      const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (filter.fieldType.value_type === 'date') {
          return date.toLocaleDateString();
        }
        return date.toLocaleString();
      };

      if (filter.dateFilter.mode === 'eq') {
        return `on ${formatDate(filter.dateFilter.value)}`;
      } else if (filter.dateFilter.mode === 'between' && filter.dateFilter.value2) {
        return `${formatDate(filter.dateFilter.value)} to ${formatDate(filter.dateFilter.value2)}`;
      } else if (filter.dateFilter.mode === 'gt') {
        return `after ${formatDate(filter.dateFilter.value)}`;
      } else if (filter.dateFilter.mode === 'lt') {
        return `before ${formatDate(filter.dateFilter.value)}`;
      }
    }
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
            <PopoverContent width="350px" bg={bgColor}>
              <PopoverHeader fontWeight="semibold" borderBottom="1px" borderColor={borderColor}>
                Filter by Metadata
              </PopoverHeader>
              <PopoverBody>
                <VStack align="stretch" spacing={4}>
                  <FormControl>
                    <FormLabel>Field Type</FormLabel>
                    <MetadataFieldTypeSelector
                      fieldTypes={fieldTypes}
                      selectedFieldType={selectedFieldType}
                      onFieldTypeSelect={handleFieldTypeChange}
                      isDisabled={!isFilterEnabled}
                    />
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
                    isDisabled={isAddFilterDisabled()}
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