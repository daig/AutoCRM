import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Text,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Textarea,
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { supabase } from '../../config/supabase';

export const TagManagement = () => {
  const [tagTypes, setTagTypes] = useState<Array<{ id: string; name: string; description: string | null }>>([]);
  const [tags, setTags] = useState<Array<{ id: string; name: string; type_id: string; description: string | null }>>([]);
  const [newTagType, setNewTagType] = useState({ name: '', description: '' });
  const [newTag, setNewTag] = useState({ name: '', description: '', type_id: '' });
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchTagTypes = async () => {
    const { data, error } = await supabase.from('tag_types').select('*');
    if (error) {
      toast({ title: 'Error fetching tag types', status: 'error', duration: 3000 });
      return;
    }
    setTagTypes(data);
  };

  const fetchTags = async () => {
    const { data, error } = await supabase.from('tags').select('*');
    if (error) {
      toast({ title: 'Error fetching tags', status: 'error', duration: 3000 });
      return;
    }
    setTags(data);
  };

  useEffect(() => {
    fetchTagTypes();
    fetchTags();
  }, []);

  const handleCreateTagType = async () => {
    const { error } = await supabase.from('tag_types').insert([{
      name: newTagType.name,
      description: newTagType.description || null
    }]);

    if (error) {
      toast({ title: 'Error creating tag type', status: 'error', duration: 3000 });
      return;
    }

    toast({ title: 'Tag type created', status: 'success', duration: 3000 });
    setNewTagType({ name: '', description: '' });
    fetchTagTypes();
  };

  const handleCreateTag = async () => {
    const { error } = await supabase.from('tags').insert([{
      name: newTag.name,
      description: newTag.description || null,
      type_id: newTag.type_id
    }]);

    if (error) {
      toast({ title: 'Error creating tag', status: 'error', duration: 3000 });
      return;
    }

    toast({ title: 'Tag created', status: 'success', duration: 3000 });
    setNewTag({ name: '', description: '', type_id: '' });
    fetchTags();
    onClose();
  };

  const handleDeleteTagType = async (id: string) => {
    const { error } = await supabase.from('tag_types').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting tag type', status: 'error', duration: 3000 });
      return;
    }
    toast({ title: 'Tag type deleted', status: 'success', duration: 3000 });
    fetchTagTypes();
    fetchTags(); // Refresh tags as some might have been cascade deleted
  };

  const handleDeleteTag = async (id: string) => {
    const { error } = await supabase.from('tags').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting tag', status: 'error', duration: 3000 });
      return;
    }
    toast({ title: 'Tag deleted', status: 'success', duration: 3000 });
    fetchTags();
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Tag Types Section */}
        <Box>
          <Text fontSize="xl" fontWeight="bold" mb={4}>Tag Types</Text>
          <HStack mb={4}>
            <FormControl>
              <Input
                placeholder="Tag Type Name"
                value={newTagType.name}
                onChange={(e) => setNewTagType({ ...newTagType, name: e.target.value })}
              />
            </FormControl>
            <FormControl>
              <Input
                placeholder="Description (optional)"
                value={newTagType.description}
                onChange={(e) => setNewTagType({ ...newTagType, description: e.target.value })}
              />
            </FormControl>
            <Button leftIcon={<AddIcon />} onClick={handleCreateTagType}>
              Add Type
            </Button>
          </HStack>

          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Description</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {tagTypes.map((type) => (
                <Tr key={type.id}>
                  <Td>{type.name}</Td>
                  <Td>{type.description}</Td>
                  <Td>
                    <IconButton
                      aria-label="Delete tag type"
                      icon={<DeleteIcon />}
                      colorScheme="red"
                      onClick={() => handleDeleteTagType(type.id)}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        {/* Tags Section */}
        <Box>
          <Text fontSize="xl" fontWeight="bold" mb={4}>Tags</Text>
          <Button leftIcon={<AddIcon />} onClick={onOpen} mb={4}>
            Create New Tag
          </Button>

          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>Description</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {tags.map((tag) => (
                <Tr key={tag.id}>
                  <Td>{tag.name}</Td>
                  <Td>{tagTypes.find(t => t.id === tag.type_id)?.name}</Td>
                  <Td>{tag.description}</Td>
                  <Td>
                    <IconButton
                      aria-label="Delete tag"
                      icon={<DeleteIcon />}
                      colorScheme="red"
                      onClick={() => handleDeleteTag(tag.id)}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>

      {/* Create Tag Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Tag</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Tag Name</FormLabel>
                <Input
                  value={newTag.name}
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Tag Type</FormLabel>
                <select
                  value={newTag.type_id}
                  onChange={(e) => setNewTag({ ...newTag, type_id: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px' }}
                >
                  <option value="">Select a tag type</option>
                  {tagTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={newTag.description}
                  onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleCreateTag}>
              Create Tag
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}; 