import { Tag as ChakraTag } from '@chakra-ui/react';

interface TagProps {
  tag: {
    id: string;
    name: string;
    type_id: string;
    tag_type: {
      name: string;
    }
  };
}

export const Tag = ({ tag }: TagProps) => {
  // Define color schemes based on tag type
  const colorScheme = tag.tag_type.name === 'status' 
    ? {
        'open': 'blue',
        'pending': 'yellow',
        'resolved': 'green',
        'closed': 'gray'
      }[tag.name] || 'gray'
    : tag.tag_type.name === 'priority'
    ? {
        'low': 'green',
        'medium': 'yellow',
        'high': 'orange',
        'urgent': 'red'
      }[tag.name] || 'gray'
    : 'gray';

  return (
    <ChakraTag
      colorScheme={colorScheme}
      size="sm"
      borderRadius="full"
    >
      {tag.name}
    </ChakraTag>
  );
}; 