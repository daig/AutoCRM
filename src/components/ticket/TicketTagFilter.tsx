import {
  Box,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverHeader,
  PopoverFooter,
  Checkbox,
  VStack,
  Text,
  useColorModeValue,
  HStack,
  Divider,
  Icon,
  Tag,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { supabase } from '../../config/supabase';
import { FiFilter } from 'react-icons/fi';

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

  const getTagById = (tagId: string) => {
    for (const type of tagTypes) {
      const tag = type.tags.find(t => t.id === tagId);
      if (tag) return tag;
    }
    return null;
  };

  if (loading) {
    return <Text p={4}>Loading filters...</Text>;
  }

  return (
    <Box>
      <HStack spacing={2} mb={4}>
        <Popover placement="bottom-start">
          <PopoverTrigger>
            <Button
              leftIcon={<Icon as={FiFilter} />}
              size="sm"
              variant="outline"
            >
              Filter
            </Button>
          </PopoverTrigger>
          <PopoverContent maxW="300px">
            <PopoverHeader fontWeight="semibold" borderBottom="1px" borderColor={borderColor}>
              Filter by Tags
            </PopoverHeader>
            <PopoverBody maxH="400px" overflowY="auto">
              <VStack align="stretch" spacing={4} divider={<Divider />}>
                {tagTypes.map((type) => (
                  <Box key={type.id}>
                    <Text fontWeight="medium" mb={2} color="gray.600">
                      {type.name}
                    </Text>
                    <VStack align="stretch" pl={2}>
                      {type.tags.map((tag) => (
                        <Checkbox
                          key={tag.id}
                          isChecked={selectedTags.includes(tag.id)}
                          onChange={() => handleTagToggle(tag.id)}
                          size="sm"
                        >
                          {tag.name}
                        </Checkbox>
                      ))}
                    </VStack>
                  </Box>
                ))}
              </VStack>
            </PopoverBody>
            <PopoverFooter borderTop="1px" borderColor={borderColor}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onTagsChange([])}
                isDisabled={selectedTags.length === 0}
              >
                Clear Filters
              </Button>
            </PopoverFooter>
          </PopoverContent>
        </Popover>

        {/* Show selected tags */}
        <Wrap spacing={2}>
          {selectedTags.map((tagId) => {
            const tag = getTagById(tagId);
            if (!tag) return null;
            return (
              <WrapItem key={tagId}>
                <Tag
                  size="sm"
                  variant="subtle"
                  colorScheme={tag.tag_type.name === 'status' ? 'green' : 'blue'}
                  cursor="pointer"
                  onClick={() => handleTagToggle(tagId)}
                >
                  {tag.name}
                </Tag>
              </WrapItem>
            );
          })}
        </Wrap>
      </HStack>
    </Box>
  );
}; 