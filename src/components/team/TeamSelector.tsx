import React, { useEffect, useState } from 'react';
import {
  Select,
  useToast,
  Spinner,
  Box,
} from '@chakra-ui/react';
import { supabase } from '../../config/supabase';

interface Team {
  id: string;
  name: string;
}

interface TeamSelectorProps {
  currentTeamId: string | null;
  onTeamSelected: (teamId: string) => void;
  isDisabled?: boolean;
}

export const TeamSelector = ({ currentTeamId, onTeamSelected, isDisabled = false }: TeamSelectorProps) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('id, name')
          .order('name');

        if (error) throw error;
        setTeams(data || []);
      } catch (err) {
        console.error('Error fetching teams:', err);
        toast({
          title: 'Error fetching teams',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, [toast]);

  if (isLoading) {
    return <Spinner size="sm" />;
  }

  return (
    <Box>
      <Select
        placeholder="Select team"
        value={currentTeamId || ''}
        onChange={(e) => onTeamSelected(e.target.value)}
        isDisabled={isDisabled}
      >
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </Select>
    </Box>
  );
}; 