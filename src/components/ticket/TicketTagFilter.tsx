import {
  Box,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverHeader,
  PopoverFooter,
  VStack,
  Text,
  useColorModeValue,
  HStack,
  Icon,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
  Switch,
  Tooltip,
  Input,
  Divider,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { supabase } from '../../config/supabase';
import { FiFilter } from 'react-icons/fi';

interface Tag {
  id: string;
  name: string;
  type_id: string;
  description: string | null;
  tag_type: {
    name: string;
  };
}

interface TagType {
  id: string;
  name: string;
  description: string | null;
}

interface TicketTagFilterProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  isFilterEnabled: boolean;
  onFilterEnabledChange: (enabled: boolean) => void;
}

export const TicketTagFilter = ({ 
  selectedTags, 
  onTagsChange,
  isFilterEnabled,
  onFilterEnabledChange
}: TicketTagFilterProps) => {
  const [tagTypes, setTagTypes] = useState<TagType[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  const borderColor = useColorModeValue('gray.200', 'gray.700');
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
          .select(`
            *,
            tag_type:tag_types!inner (
              name
            )
          `)
          .returns<Tag[]>();

        if (tagError) throw tagError;
        setAvailableTags(tagData || []);
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
    setSearchQuery('');
  };

  const handleFilterButtonClick = () => {
    if (!isFilterEnabled) {
      onFilterEnabledChange(true);
    }
  };

  const getTagById = (tagId: string) => {
    return availableTags.find(t => t.id === tagId) || null;
  };

  const filteredTags = availableTags.filter(tag => 
    (selectedType ? tag.type_id === selectedType : true) &&
    (searchQuery
      ? tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true)
  );

  // Group selected tags by type
  const selectedTagsByType = selectedTags.reduce((acc, tagId) => {
    const tag = getTagById(tagId);
    if (!tag) return acc;
    
    if (!acc[tag.type_id]) {
      const tagType = tagTypes.find(t => t.id === tag.type_id);
      acc[tag.type_id] = {
        typeName: tagType?.name || 'Unknown',
        tags: []
      };
    }
    acc[tag.type_id].tags.push(tag);
    return acc;
  }, {} as Record<string, { typeName: string; tags: Tag[] }>);

  if (loading) {
    return <Text p={4}>Loading filters...</Text>;
  }

  return (
    <Box>
      <HStack spacing={2} mb={4} justify="space-between">
        <HStack>
          <Tooltip label={isFilterEnabled ? 'Disable filtering' : 'Enable filtering'}>
            <Switch
              size="sm"
              isChecked={isFilterEnabled}
              onChange={(e) => onFilterEnabledChange(e.target.checked)}
            />
          </Tooltip>
          <Popover placement="right-start" strategy="fixed">
            <PopoverTrigger>
              <Button
                leftIcon={<Icon as={FiFilter} />}
                size="sm"
                variant="outline"
                onClick={handleFilterButtonClick}
              >
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent width="300px" bg={bgColor}>
              <PopoverHeader fontWeight="semibold" borderBottom="1px" borderColor={borderColor}>
                Filter by Tags
              </PopoverHeader>
              <PopoverBody>
                <VStack align="stretch" spacing={3}>
                  <Input
                    placeholder="Search tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="sm"
                    isDisabled={!isFilterEnabled}
                  />
                  
                  <HStack spacing={2} wrap="wrap">
                    <Button
                      size="xs"
                      variant={selectedType === null ? 'solid' : 'ghost'}
                      onClick={() => setSelectedType(null)}
                      isDisabled={!isFilterEnabled}
                    >
                      All
                    </Button>
                    {tagTypes.map((type) => (
                      <Button
                        key={type.id}
                        size="xs"
                        variant={selectedType === type.id ? 'solid' : 'ghost'}
                        onClick={() => setSelectedType(type.id)}
                        isDisabled={!isFilterEnabled}
                      >
                        {type.name}
                      </Button>
                    ))}
                  </HStack>

                  <Box maxH="200px" overflowY="auto">
                    <Wrap spacing={2}>
                      {filteredTags.map((tag) => (
                        <WrapItem key={tag.id}>
                          <Tag
                            size="md"
                            variant={selectedTags.includes(tag.id) ? 'solid' : 'outline'}
                            cursor={isFilterEnabled ? "pointer" : "not-allowed"}
                            onClick={isFilterEnabled ? () => handleTagToggle(tag.id) : undefined}
                            title={tag.description || undefined}
                            colorScheme={tag.tag_type.name === 'status' ? 'green' : 'blue'}
                            opacity={isFilterEnabled ? 1 : 0.6}
                          >
                            <TagLabel>{tag.name}</TagLabel>
                          </Tag>
                        </WrapItem>
                      ))}
                      {filteredTags.length === 0 && (
                        <Text color="gray.500" fontSize="sm">
                          No matching tags found
                        </Text>
                      )}
                    </Wrap>
                  </Box>
                </VStack>
              </PopoverBody>
              <PopoverFooter borderTop="1px" borderColor={borderColor}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onTagsChange([])}
                  isDisabled={selectedTags.length === 0 || !isFilterEnabled}
                >
                  Clear Filters
                </Button>
              </PopoverFooter>
            </PopoverContent>
          </Popover>
        </HStack>

        {/* Show selected tags grouped by type */}
        <VStack align="stretch" flex={1} spacing={2}>
          {isFilterEnabled && Object.entries(selectedTagsByType).map(([typeId, { typeName, tags }]) => (
            <Box key={typeId}>
              <Text fontSize="xs" color="gray.500" mb={1}>{typeName}</Text>
              <Wrap spacing={2}>
                {tags.map((tag) => (
                  <WrapItem key={tag.id}>
                    <Tag
                      size="sm"
                      variant="subtle"
                      colorScheme={tag.tag_type.name === 'status' ? 'green' : 'blue'}
                      cursor="pointer"
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      <TagLabel>{tag.name}</TagLabel>
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            </Box>
          ))}
        </VStack>
      </HStack>
    </Box>
  );
}; 