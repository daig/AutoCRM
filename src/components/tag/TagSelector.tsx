import { useState, useEffect } from 'react';
import {
  Box,
  Input,
  VStack,
  Text,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  IconButton,
  HStack,
  Button,
  useColorModeValue,
  Spinner,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { supabase } from '../../config/supabase';

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

interface TagSelectorProps {
  ticketId: string;
  existingTags: {
    tag: {
      id: string;
      name: string;
      type_id: string;
    }
  }[];
  onTagAdded?: () => void;
}

export const TagSelector = ({ ticketId, existingTags, onTagAdded }: TagSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [tagTypes, setTagTypes] = useState<TagType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loadingTagId, setLoadingTagId] = useState<string | null>(null);

  const existingTagIds = new Set(existingTags.map(t => t.tag.id));
  const bgColor = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const { data: typeData, error: typeError } = await supabase
          .from('tag_types')
          .select('*')
          .returns<TagType[]>();

        if (typeError) throw typeError;
        setTagTypes(typeData || []);

        const { data: tagData, error: tagError } = await supabase
          .from('tags')
          .select('*')
          .returns<Tag[]>();

        if (tagError) throw tagError;
        setAvailableTags(tagData || []);
      } catch (err) {
        console.error('Error fetching tags:', err);
      }
    };

    fetchTags();
  }, []);

  const handleAddTag = async (tagId: string) => {
    try {
      setLoadingTagId(tagId);
      // Find the type of the tag being added
      const newTag = availableTags.find(t => t.id === tagId);
      if (!newTag) return;

      // Find and delete any existing tags of the same type
      const existingTagsOfSameType = existingTags.filter(
        t => t.tag.type_id === newTag.type_id
      );

      if (existingTagsOfSameType.length > 0) {
        const { error: deleteError } = await supabase
          .from('ticket_tags')
          .delete()
          .eq('ticket', ticketId)
          .in('tag', existingTagsOfSameType.map(t => t.tag.id));

        if (deleteError) throw deleteError;
      }

      // Add the new tag
      const { error } = await supabase
        .from('ticket_tags')
        .insert([
          {
            ticket: ticketId,
            tag: tagId,
          },
        ]);

      if (error) throw error;
      onTagAdded?.();
      setIsOpen(false);
    } catch (err) {
      console.error('Error adding tag:', err);
    } finally {
      setLoadingTagId(null);
    }
  };

  const filteredTags = availableTags
    .filter(tag => !existingTagIds.has(tag.id))
    .filter(tag => 
      (selectedType ? tag.type_id === selectedType : true) &&
      (searchQuery
        ? tag.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true)
    );

  return (
    <Box display="inline-block">
      <Popover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        placement="bottom-start"
      >
        <PopoverTrigger>
          <IconButton
            icon={<AddIcon />}
            aria-label="Add tag"
            size="sm"
            variant="ghost"
            onClick={() => setIsOpen(true)}
          />
        </PopoverTrigger>
        <PopoverContent width="300px" bg={bgColor}>
          <PopoverBody>
            <VStack align="stretch" spacing={3}>
              <Input
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="sm"
              />
              
              <HStack spacing={2} wrap="wrap">
                <Button
                  size="xs"
                  variant={selectedType === null ? 'solid' : 'ghost'}
                  onClick={() => setSelectedType(null)}
                >
                  All
                </Button>
                {tagTypes.map((type) => (
                  <Button
                    key={type.id}
                    size="xs"
                    variant={selectedType === type.id ? 'solid' : 'ghost'}
                    onClick={() => setSelectedType(type.id)}
                  >
                    {type.name}
                  </Button>
                ))}
              </HStack>

              <Box maxH="200px" overflowY="auto">
                <Wrap spacing={2}>
                  {filteredTags.map((tag) => {
                    const tagType = tagTypes.find(t => t.id === tag.type_id);
                    const isLoading = loadingTagId === tag.id;
                    return (
                      <WrapItem key={tag.id}>
                        <Tag
                          size="md"
                          variant="outline"
                          cursor={isLoading ? "default" : "pointer"}
                          onClick={isLoading ? undefined : () => handleAddTag(tag.id)}
                          title={tag.description || undefined}
                          colorScheme={tagType?.name === 'status' ? 'green' : 'blue'}
                          opacity={isLoading ? 0.5 : 1}
                        >
                          <TagLabel>
                            {tag.name}
                            {isLoading && <Spinner size="xs" ml={2} />}
                          </TagLabel>
                        </Tag>
                      </WrapItem>
                    );
                  })}
                  {filteredTags.length === 0 && (
                    <Text color="gray.500" fontSize="sm">
                      No matching tags found
                    </Text>
                  )}
                </Wrap>
              </Box>
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Box>
  );
}; 