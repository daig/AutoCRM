import { Box, Heading, Checkbox, VStack, Text, useColorModeValue } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { supabase } from '../../config/supabase';

interface Tag {
  id: string;
  name: string;
  type_id: string;
  tag_type: {
    name: string;
  };
}

interface TagType {
  id: string;
  name: string;
  description: string | null;
  tags: Tag[];
}

interface TicketTagFilterProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export const TicketTagFilter = ({ selectedTags, onTagsChange }: TicketTagFilterProps) => {
  const [tagTypes, setTagTypes] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(true);
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const { data, error } = await supabase
          .from('tag_types')
          .select(`
            *,
            tags (
              id,
              name,
              type_id,
              tag_type:tag_types!inner (
                name
              )
            )
          `);

        if (error) throw error;
        setTagTypes(data || []);
      } catch (err) {
        console.error('Error fetching tags:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  const handleTagToggle = (tagId: string) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    onTagsChange(newSelectedTags);
  };

  if (loading) {
    return <Text p={4}>Loading filters...</Text>;
  }

  return (
    <Box p={4} borderBottom="1px" borderColor={borderColor}>
      <Heading size="sm" mb={4}>Filter by Tags</Heading>
      <VStack align="stretch" spacing={4}>
        {tagTypes.map((type) => (
          <Box key={type.id}>
            <Text fontWeight="medium" mb={2}>{type.name}</Text>
            <VStack align="stretch" pl={2}>
              {type.tags.map((tag) => (
                <Checkbox
                  key={tag.id}
                  isChecked={selectedTags.includes(tag.id)}
                  onChange={() => handleTagToggle(tag.id)}
                >
                  {tag.name}
                </Checkbox>
              ))}
            </VStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}; 