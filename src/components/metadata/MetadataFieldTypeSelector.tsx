import {
  SimpleGrid,
  Card,
  CardBody,
  HStack,
  Text,
  Icon,
  useColorModeValue,
  IconButton,
  Tooltip,
  Box,
} from '@chakra-ui/react';
import { FiFilter, FiUser, FiTag, FiCalendar, FiClock, FiToggleLeft, FiHash, FiType, FiPercent, FiSlash } from 'react-icons/fi';

export interface MetadataFieldType {
  id: string;
  name: string;
  value_type: string;
  description: string | null;
}

interface MetadataFieldTypeSelectorProps {
  fieldTypes: MetadataFieldType[];
  selectedFieldType: MetadataFieldType | null;
  onFieldTypeSelect: (fieldTypeId: string) => void;
  onAddMissingFilter?: (fieldType: MetadataFieldType) => void;
  isDisabled?: boolean;
}

const getFieldTypeIcon = (valueType: string) => {
  switch (valueType) {
    case 'text':
      return FiType;
    case 'natural number':
      return FiHash;
    case 'fractional number':
      return FiPercent;
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

export const MetadataFieldTypeSelector = ({
  fieldTypes,
  selectedFieldType,
  onFieldTypeSelect,
  onAddMissingFilter,
  isDisabled = false,
}: MetadataFieldTypeSelectorProps) => {
  return (
    <SimpleGrid columns={2} spacing={2} width="full">
      {fieldTypes.map((type) => {
        const IconComponent = getFieldTypeIcon(type.value_type);
        const isSelected = selectedFieldType?.id === type.id;
        return (
          <Box
            key={type.id}
            position="relative"
            sx={{
              '&:hover .missing-icon': {
                opacity: 1
              }
            }}
          >
            <Card
              size="sm"
              variant={isSelected ? "filled" : "outline"}
              cursor={isDisabled ? "not-allowed" : "pointer"}
              onClick={() => !isDisabled && onFieldTypeSelect(type.id)}
              _hover={!isDisabled ? { bg: useColorModeValue('gray.50', 'gray.700') } : undefined}
              bg={isSelected ? useColorModeValue('blue.50', 'blue.900') : undefined}
              borderColor={isSelected ? 'blue.500' : undefined}
              opacity={isDisabled ? 0.6 : 1}
            >
              <CardBody p={2}>
                <HStack spacing={2}>
                  <Icon as={IconComponent} color={isSelected ? 'blue.500' : 'gray.500'} flexShrink={0} />
                  <Text 
                    fontSize="sm" 
                    fontWeight="medium" 
                    noOfLines={1}
                  >
                    {type.name}
                  </Text>
                </HStack>
              </CardBody>
            </Card>
            {onAddMissingFilter && (
              <Box 
                className="missing-icon"
                position="absolute" 
                right={1} 
                top={1}
                opacity={0}
                bg={useColorModeValue('white', 'gray.800')}
                borderRadius="md"
                transition="opacity 0.2s"
                shadow="sm"
                zIndex={1}
              >
                <Tooltip label="Find tickets missing this field" placement="right">
                  <IconButton
                    aria-label="Find missing"
                    icon={<Icon as={FiSlash} boxSize="14px" />}
                    size="xs"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddMissingFilter(type);
                    }}
                    isDisabled={isDisabled}
                    _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                  />
                </Tooltip>
              </Box>
            )}
          </Box>
        );
      })}
    </SimpleGrid>
  );
}; 