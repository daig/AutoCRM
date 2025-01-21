import { useEffect, useState } from 'react';
import {
  Box,
  Text,
  Heading,
  Spinner,
  Flex,
  Tag,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { supabase } from '../config/supabase';

interface Tag {
  id: string;
  name: string;
  type_id: string;
  description: string | null;
}

interface TagType {
  id: string;
  name: string;
  description: string | null;
}

export const TagList = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagTypes, setTagTypes] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        console.log('Attempting to fetch tag types...');
        const { data: typeData, error: typeError } = await supabase
          .from('tag_types')
          .select('*')
          .returns<TagType[]>();

        if (typeError) {
          console.error('Tag types error details:', {
            message: typeError.message,
            details: typeError.details,
            hint: typeError.hint,
            code: typeError.code
          });
          throw typeError;
        }
        
        console.log('Tag types response:', typeData);
        setTagTypes(typeData || []);

        console.log('Attempting to fetch tags...');
        const { data: tagData, error: tagError } = await supabase
          .from('tags')
          .select('*')
          .returns<Tag[]>();

        if (tagError) {
          console.error('Tags error details:', {
            message: tagError.message,
            details: tagError.details,
            hint: tagError.hint,
            code: tagError.code
          });
          throw tagError;
        }

        console.log('Tags response:', tagData);
        setTags(tagData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  if (loading) {
    return (
      <Flex justify="center" p={4}>
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Text color="red.500" p={4}>
        Error: {error}
      </Text>
    );
  }

  if (tagTypes.length === 0) {
    return (
      <Text p={4}>
        No tag types found. Please create some tag types first.
      </Text>
    );
  }

  return (
    <Box>
      {tagTypes.map((type) => (
        <Box key={type.id} mb={6}>
          <Heading size="md" mb={3}>
            {type.name}
          </Heading>
          <Wrap spacing={2}>
            {tags
              .filter((tag) => tag.type_id === type.id)
              .map((tag) => (
                <WrapItem key={tag.id}>
                  <Tag
                    size="lg"
                    variant="outline"
                    title={tag.description || undefined}
                  >
                    {tag.name}
                  </Tag>
                </WrapItem>
              ))}
          </Wrap>
        </Box>
      ))}
    </Box>
  );
}; 