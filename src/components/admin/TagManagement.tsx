import {
  Box,
  Button,
  FormControl,
  Grid,
  GridItem,
  Heading,
  Input,
  List,
  ListItem,
  Text,
  VStack,
  useToast,
  IconButton,
  HStack,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';

interface TagType {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
  type_id: string;
}

export const TagManagement = () => {
  const [tagTypes, setTagTypes] = useState<TagType[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagTypeName, setNewTagTypeName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [selectedTagType, setSelectedTagType] = useState<TagType | null>(null);
  const toast = useToast();

  // Fetch tag types and their tags
  const fetchTagData = async () => {
    try {
      // Fetch tag types
      const { data: typeData, error: typeError } = await supabase
        .from('tag_types')
        .select('*')
        .order('name');

      if (typeError) throw typeError;
      setTagTypes(typeData || []);

      // Fetch tags
      const { data: tagData, error: tagError } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (tagError) throw tagError;
      setTags(tagData || []);
    } catch (error) {
      console.error('Error fetching tag data:', error);
      toast({
        title: 'Error fetching tags',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchTagData();
  }, []);

  const handleCreateTagType = async () => {
    if (!newTagTypeName.trim()) return;

    try {
      const { error } = await supabase
        .from('tag_types')
        .insert([{ name: newTagTypeName.trim() }]);

      if (error) throw error;

      toast({
        title: 'Tag type created',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setNewTagTypeName('');
      fetchTagData();
    } catch (error) {
      toast({
        title: 'Error creating tag type',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteTagType = async (typeId: string) => {
    try {
      const { error } = await supabase
        .from('tag_types')
        .delete()
        .eq('id', typeId);

      if (error) throw error;

      toast({
        title: 'Tag type deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      if (selectedTagType?.id === typeId) {
        setSelectedTagType(null);
      }
      fetchTagData();
    } catch (error) {
      toast({
        title: 'Error deleting tag type',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim() || !selectedTagType) return;

    try {
      const { error } = await supabase
        .from('tags')
        .insert([{
          name: newTagName.trim(),
          type_id: selectedTagType.id
        }]);

      if (error) throw error;

      toast({
        title: 'Tag created',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setNewTagName('');
      fetchTagData();
    } catch (error) {
      toast({
        title: 'Error creating tag',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      toast({
        title: 'Tag deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchTagData();
    } catch (error) {
      toast({
        title: 'Error deleting tag',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Grid templateColumns="repeat(2, 1fr)" gap={8}>
      <GridItem>
        <VStack align="stretch" spacing={4}>
          <Heading size="md">Tag Types</Heading>
          
          <Box>
            <HStack>
              <FormControl>
                <Input
                  placeholder="New tag type name"
                  value={newTagTypeName}
                  onChange={(e) => setNewTagTypeName(e.target.value)}
                />
              </FormControl>
              <Button
                leftIcon={<AddIcon />}
                colorScheme="blue"
                onClick={handleCreateTagType}
              >
                Add
              </Button>
            </HStack>
          </Box>

          <List spacing={2}>
            {tagTypes.map((type) => (
              <ListItem
                key={type.id}
                p={2}
                bg={selectedTagType?.id === type.id ? 'blue.50' : 'transparent'}
                borderRadius="md"
                cursor="pointer"
                onClick={() => setSelectedTagType(type)}
              >
                <HStack justify="space-between">
                  <Text>{type.name}</Text>
                  <IconButton
                    aria-label="Delete tag type"
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTagType(type.id);
                    }}
                  />
                </HStack>
              </ListItem>
            ))}
          </List>
        </VStack>
      </GridItem>

      <GridItem>
        <VStack align="stretch" spacing={4}>
          <Heading size="md">Tags</Heading>
          
          {selectedTagType ? (
            <>
              <Box>
                <HStack>
                  <FormControl>
                    <Input
                      placeholder="New tag name"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                    />
                  </FormControl>
                  <Button
                    leftIcon={<AddIcon />}
                    colorScheme="blue"
                    onClick={handleCreateTag}
                  >
                    Add
                  </Button>
                </HStack>
              </Box>

              <List spacing={2}>
                {tags
                  .filter((tag) => tag.type_id === selectedTagType.id)
                  .map((tag) => (
                    <ListItem key={tag.id} p={2}>
                      <HStack justify="space-between">
                        <Text>{tag.name}</Text>
                        <IconButton
                          aria-label="Delete tag"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleDeleteTag(tag.id)}
                        />
                      </HStack>
                    </ListItem>
                  ))}
              </List>
            </>
          ) : (
            <Text color="gray.500">Select a tag type to manage its tags</Text>
          )}
        </VStack>
      </GridItem>
    </Grid>
  );
}; 