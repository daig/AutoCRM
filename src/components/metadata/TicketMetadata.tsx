import React from 'react';
import { Grid, GridItem, Text } from '@chakra-ui/react';

interface TicketMetadataProps {
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
}

export const TicketMetadata = ({ metadata }: TicketMetadataProps) => {
  const formatValue = (field: TicketMetadataProps['metadata'][0]) => {
    const { value_type } = field.field_type;
    
    switch (value_type) {
      case 'text':
        return field.field_value_text || '-';
      case 'natural number':
        return field.field_value_int?.toString() || '-';
      case 'fractional number':
        return field.field_value_float?.toString() || '-';
      case 'boolean':
        return field.field_value_bool === null ? '-' : field.field_value_bool ? 'Yes' : 'No';
      case 'date':
        return field.field_value_date ? new Date(field.field_value_date).toLocaleDateString() : '-';
      case 'timestamp':
        return field.field_value_timestamp ? new Date(field.field_value_timestamp).toLocaleString() : '-';
      case 'user':
        return field.field_value_user?.full_name || '-';
      case 'ticket':
        return field.field_value_ticket?.title || '-';
      default:
        return '-';
    }
  };

  return (
    <Grid templateColumns="auto 1fr" gap={4} alignItems="center">
      {metadata.map((field, index) => (
        <React.Fragment key={index}>
          <GridItem>
            <Text fontWeight="medium" color="gray.600">
              {field.field_type.name}:
            </Text>
          </GridItem>
          <GridItem>
            <Text>{formatValue(field)}</Text>
          </GridItem>
        </React.Fragment>
      ))}
    </Grid>
  );
}; 