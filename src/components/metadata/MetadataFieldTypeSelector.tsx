import {
  SimpleGrid,
  Card,
  CardBody,
  HStack,
  VStack,
  Text,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiFilter, FiUser, FiTag, FiCalendar, FiClock, FiToggleLeft, FiHash, FiType, FiPercent } from 'react-icons/fi';

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
  isDisabled = false,
}: MetadataFieldTypeSelectorProps) => {
  return (
    <SimpleGrid columns={2} spacing={2} width="full">
      {fieldTypes.map((type) => {
        const IconComponent = getFieldTypeIcon(type.value_type);
        const isSelected = selectedFieldType?.id === type.id;
        return (
          <Card
            key={type.id}
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
                <Icon as={IconComponent} color={isSelected ? 'blue.500' : 'gray.500'} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" fontWeight="medium">{type.name}</Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        );
      })}
    </SimpleGrid>
  );
}; 