import { useEffect, useState } from 'react';
import { Chip, Box, Typography, CircularProgress } from '@mui/material';
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
        // Fetch tag types first
        const { data: typeData, error: typeError } = await supabase
          .from('tag_types')
          .select('*')
          .returns<TagType[]>();

        if (typeError) throw typeError;
        setTagTypes(typeData || []);

        // Then fetch tags
        const { data: tagData, error: tagError } = await supabase
          .from('tags')
          .select('*')
          .returns<Tag[]>();

        if (tagError) throw tagError;
        setTags(tagData || []);
      } catch (err) {
        console.error('Error fetching tags:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" p={2}>
        Error: {error}
      </Typography>
    );
  }

  if (tagTypes.length === 0) {
    return (
      <Typography p={2}>
        No tag types found. Please create some tag types first.
      </Typography>
    );
  }

  return (
    <Box>
      {tagTypes.map((type) => (
        <Box key={type.id} mb={2}>
          <Typography variant="h6" gutterBottom>
            {type.name}
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {tags
              .filter((tag) => tag.type_id === type.id)
              .map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  title={tag.description || undefined}
                  variant="outlined"
                />
              ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}; 