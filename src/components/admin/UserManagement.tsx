import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Spinner,
  Select,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Checkbox,
  VStack,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  Tag,
  TagLabel,
  TagCloseButton,
  Portal,
  IconButton,
  Input,
  Wrap,
  WrapItem,
  useColorModeValue,
} from '@chakra-ui/react';
import { supabase } from '../../config/supabase';
import { ChevronDownIcon, CloseIcon } from '@chakra-ui/icons';
import { AddIcon } from '@chakra-ui/icons';

interface Team {
  id: string;
  name: string;
}

interface Skill {
  id: string;
  name: string;
  proficiencies: {
    id: string;
    name: string;
  }[];
}

interface AgentSkill {
  proficiency: {
    id: string;
    name: string;
    skill: {
      id: string;
      name: string;
    };
  };
}

interface User {
  id: string;
  full_name: string | null;
  role: 'administrator' | 'agent' | 'customer';
  created_tickets: {
    id: string;
    title: string;
    description: string | null;
  }[];
  team: {
    id: string;
    name: string;
  } | null;
  is_team_lead: boolean;
  agent_skills?: AgentSkill[];
}

interface ProficiencyResponse {
  id: string;
  name: string;
  skill: {
    id: string;
    name: string;
  };
}

interface SkillResponse {
  id: string;
  name: string;
}

interface SkillWithProficiencies {
  id: string;
  name: string;
  proficiencies: ProficiencyResponse[];
}

interface ProficiencySelectorProps {
  userId: string;
  existingSkills: AgentSkill[];
  onProficiencyAdded: () => void;
}

const ProficiencySelector = ({ userId, existingSkills, onProficiencyAdded }: ProficiencySelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [skillsWithProficiencies, setSkillsWithProficiencies] = useState<SkillWithProficiencies[]>([]);
  const [loadingProficiencyId, setLoadingProficiencyId] = useState<string | null>(null);
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');

  const existingProficiencyIds = new Set(existingSkills.map(s => s.proficiency.id));

  useEffect(() => {
    const fetchSkillsAndProficiencies = async () => {
      try {
        const { data: skillsData, error: skillsError } = await supabase
          .from('skills')
          .select('id, name')
          .order('name')
          .returns<SkillResponse[]>();

        if (skillsError) throw skillsError;

        const { data: proficienciesData, error: proficienciesError } = await supabase
          .from('proficiencies')
          .select('id, name, skill:skills!inner(id, name)')
          .order('name')
          .returns<(Omit<ProficiencyResponse, 'skill'> & { skill: SkillResponse })[]>();

        if (proficienciesError) throw proficienciesError;

        // Group proficiencies by skill
        const skillMap = new Map<string, SkillWithProficiencies>();
        
        skillsData?.forEach(skill => {
          skillMap.set(skill.id, {
            id: skill.id,
            name: skill.name,
            proficiencies: []
          });
        });

        proficienciesData?.forEach(prof => {
          const skill = skillMap.get(prof.skill.id);
          if (skill) {
            skill.proficiencies.push({
              id: prof.id,
              name: prof.name,
              skill: prof.skill
            });
          }
        });

        setSkillsWithProficiencies(Array.from(skillMap.values()));
      } catch (err) {
        console.error('Error fetching skills and proficiencies:', err);
        toast({
          title: 'Error fetching skills',
          status: 'error',
          duration: 3000,
        });
      }
    };

    fetchSkillsAndProficiencies();
  }, [toast]);

  const handleAddProficiency = async (proficiencyId: string) => {
    try {
      setLoadingProficiencyId(proficiencyId);
      
      const { error } = await supabase
        .from('agent_skills')
        .insert([
          {
            agent: userId,
            proficiency: proficiencyId,
          },
        ]);

      if (error) throw error;
      
      onProficiencyAdded();
      setIsOpen(false);
    } catch (err) {
      console.error('Error adding proficiency:', err);
      toast({
        title: 'Error adding proficiency',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoadingProficiencyId(null);
    }
  };

  const filteredSkills = skillsWithProficiencies
    .map(skill => ({
      ...skill,
      proficiencies: skill.proficiencies
        .filter(prof => !existingProficiencyIds.has(prof.id))
        .filter(prof => 
          searchQuery
            ? prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              skill.name.toLowerCase().includes(searchQuery.toLowerCase())
            : true
        )
    }))
    .filter(skill => skill.proficiencies.length > 0);

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
            aria-label="Add proficiency"
            size="sm"
            variant="ghost"
            onClick={() => setIsOpen(true)}
          />
        </PopoverTrigger>
        <PopoverContent width="300px" bg={bgColor}>
          <PopoverBody>
            <VStack align="stretch" spacing={3}>
              <Input
                placeholder="Search proficiencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="sm"
              />
              
              <Box maxH="300px" overflowY="auto">
                {filteredSkills.map((skill) => (
                  <Box key={skill.id} mb={4}>
                    <Text fontWeight="bold" mb={2} fontSize="sm">
                      {skill.name}
                    </Text>
                    <Wrap spacing={2}>
                      {skill.proficiencies.map((prof) => {
                        const isLoading = loadingProficiencyId === prof.id;
                        return (
                          <WrapItem key={prof.id}>
                            <Tag
                              size="md"
                              variant="outline"
                              cursor={isLoading ? "default" : "pointer"}
                              onClick={isLoading ? undefined : () => handleAddProficiency(prof.id)}
                              colorScheme="purple"
                              opacity={isLoading ? 0.5 : 1}
                            >
                              <TagLabel>
                                {prof.name}
                                {isLoading && <Spinner size="xs" ml={2} />}
                              </TagLabel>
                            </Tag>
                          </WrapItem>
                        );
                      })}
                    </Wrap>
                  </Box>
                ))}
                {filteredSkills.length === 0 && (
                  <Text color="gray.500" fontSize="sm">
                    No matching proficiencies found
                  </Text>
                )}
              </Box>
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Box>
  );
};

interface ProficiencyFilterProps {
  onProficiencySelected: (proficiencyId: string | null) => void;
  selectedProficiencyId: string | null;
}

const ProficiencyFilter = ({ onProficiencySelected, selectedProficiencyId }: ProficiencyFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [skillsWithProficiencies, setSkillsWithProficiencies] = useState<SkillWithProficiencies[]>([]);
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    const fetchSkillsAndProficiencies = async () => {
      try {
        const { data: skillsData, error: skillsError } = await supabase
          .from('skills')
          .select('id, name')
          .order('name')
          .returns<SkillResponse[]>();

        if (skillsError) throw skillsError;

        const { data: proficienciesData, error: proficienciesError } = await supabase
          .from('proficiencies')
          .select('id, name, skill:skills!inner(id, name)')
          .order('name')
          .returns<(Omit<ProficiencyResponse, 'skill'> & { skill: SkillResponse })[]>();

        if (proficienciesError) throw proficienciesError;

        // Group proficiencies by skill
        const skillMap = new Map<string, SkillWithProficiencies>();
        
        skillsData?.forEach(skill => {
          skillMap.set(skill.id, {
            id: skill.id,
            name: skill.name,
            proficiencies: []
          });
        });

        proficienciesData?.forEach(prof => {
          const skill = skillMap.get(prof.skill.id);
          if (skill) {
            skill.proficiencies.push({
              id: prof.id,
              name: prof.name,
              skill: prof.skill
            });
          }
        });

        setSkillsWithProficiencies(Array.from(skillMap.values()));
      } catch (err) {
        console.error('Error fetching skills and proficiencies:', err);
        toast({
          title: 'Error fetching skills',
          status: 'error',
          duration: 3000,
        });
      }
    };

    fetchSkillsAndProficiencies();
  }, [toast]);

  const filteredSkills = skillsWithProficiencies
    .map(skill => ({
      ...skill,
      proficiencies: skill.proficiencies.filter(prof => 
        searchQuery
          ? prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            skill.name.toLowerCase().includes(searchQuery.toLowerCase())
          : true
      )
    }))
    .filter(skill => skill.proficiencies.length > 0);

  const selectedProficiency = skillsWithProficiencies
    .flatMap(s => s.proficiencies)
    .find(p => p.id === selectedProficiencyId);

  return (
    <Box>
      <Popover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        placement="bottom-start"
      >
        <PopoverTrigger>
          <Button
            size="sm"
            rightIcon={<ChevronDownIcon />}
            variant={selectedProficiencyId ? "solid" : "outline"}
            colorScheme={selectedProficiencyId ? "purple" : "gray"}
            onClick={() => setIsOpen(true)}
          >
            {selectedProficiencyId 
              ? `${selectedProficiency?.skill.name}: ${selectedProficiency?.name}`
              : "Filter by Proficiency"}
            {selectedProficiencyId && (
              <IconButton
                aria-label="Clear filter"
                icon={<CloseIcon />}
                size="xs"
                ml={2}
                onClick={(e) => {
                  e.stopPropagation();
                  onProficiencySelected(null);
                }}
                variant="ghost"
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent width="300px" bg={bgColor}>
          <PopoverBody>
            <VStack align="stretch" spacing={3}>
              <Input
                placeholder="Search proficiencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="sm"
              />
              
              <Box maxH="300px" overflowY="auto">
                {filteredSkills.map((skill) => (
                  <Box key={skill.id} mb={4}>
                    <Text fontWeight="bold" mb={2} fontSize="sm">
                      {skill.name}
                    </Text>
                    <Wrap spacing={2}>
                      {skill.proficiencies.map((prof) => (
                        <WrapItem key={prof.id}>
                          <Tag
                            size="md"
                            variant={selectedProficiencyId === prof.id ? "solid" : "outline"}
                            cursor="pointer"
                            onClick={() => {
                              onProficiencySelected(prof.id);
                              setIsOpen(false);
                            }}
                            colorScheme="purple"
                          >
                            <TagLabel>{prof.name}</TagLabel>
                          </Tag>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </Box>
                ))}
                {filteredSkills.length === 0 && (
                  <Text color="gray.500" fontSize="sm">
                    No matching proficiencies found
                  </Text>
                )}
              </Box>
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Box>
  );
};

export interface UserManagementRef {
  refreshUsers: () => void;
}

export const UserManagement = forwardRef<UserManagementRef>((_, ref) => {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [isTeamLead, setIsTeamLead] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'all' | 'administrator' | 'agent' | 'customer'>('all');
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkTeam, setBulkTeam] = useState<string>('');
  const [deletingProficiencies, setDeletingProficiencies] = useState<Set<string>>(new Set());
  const [selectedProficiencyId, setSelectedProficiencyId] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setTeams(data);
    } catch (error) {
      toast({
        title: 'Error fetching teams',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          created_tickets:tickets(id, title, description),
          team:teams(id, name),
          agent_skills!left(
            proficiency:proficiencies!inner(
              id,
              name,
              skill:skills!inner(
                id,
                name
              )
            )
          )
        `);

      if (error) throw error;

      // Transform the data to ensure agent_skills is always an array
      const transformedData = data?.map(user => ({
        ...user,
        agent_skills: user.agent_skills || []
      }));

      setUsers(transformedData as User[]);
    } catch (error) {
      toast({
        title: 'Error fetching users',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refreshUsers: fetchUsers
  }));

  useEffect(() => {
    fetchUsers();
    fetchTeams();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'administrator' | 'agent' | 'customer') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Role updated successfully',
        status: 'success',
        duration: 2000,
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error updating role',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const showUserDetails = (user: User) => {
    setSelectedUser(user);
    setSelectedTeam(user.team?.id || '');
    setIsTeamLead(user.is_team_lead);
    onOpen();
  };

  const handleTeamAssignment = async (userId: string, teamId: string | null, makeTeamLead: boolean = false) => {
    try {
      // If making someone a team lead, check if there's already one
      if (teamId && makeTeamLead) {
        const { data: existingLeads, error: leadCheckError } = await supabase
          .from('users')
          .select('id')
          .eq('team_id', teamId)
          .eq('is_team_lead', true);

        if (leadCheckError) {
          toast({ title: 'Error checking team lead status', status: 'error', duration: 3000 });
          return;
        }

        if (existingLeads && existingLeads.length > 0 && existingLeads[0].id !== userId) {
          toast({
            title: 'Team lead already exists',
            description: 'Please remove the current team lead before assigning a new one',
            status: 'error',
            duration: 3000
          });
          return;
        }
      }

      const { error } = await supabase
        .from('users')
        .update({ 
          team_id: teamId,
          is_team_lead: teamId ? makeTeamLead : false
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Team assignment updated',
        status: 'success',
        duration: 2000,
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error updating team assignment',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleRemoveProficiency = async (userId: string, proficiencyId: string) => {
    try {
      setDeletingProficiencies(prev => new Set([...prev, proficiencyId]));
      
      const { error } = await supabase
        .from('agent_skills')
        .delete()
        .eq('agent', userId)
        .eq('proficiency', proficiencyId);

      if (error) throw error;

      // Refresh the users data
      await fetchUsers();

      toast({
        title: 'Proficiency removed',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error removing proficiency:', error);
      toast({
        title: 'Error removing proficiency',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setDeletingProficiencies(prev => {
        const next = new Set(prev);
        next.delete(proficiencyId);
        return next;
      });
    }
  };

  const handleBulkTeamAssignment = async () => {
    if (!bulkTeam || selectedUserIds.size === 0) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          team_id: bulkTeam,
          is_team_lead: false // Reset team lead status for bulk assignments
        })
        .in('id', Array.from(selectedUserIds))
        .eq('role', 'agent'); // Only assign teams to agents

      if (error) throw error;

      toast({
        title: 'Team assignments updated',
        status: 'success',
        duration: 2000,
      });

      setSelectedUserIds(new Set());
      setBulkTeam('');
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error updating team assignments',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size > 0) {
      setSelectedUserIds(new Set());
    } else {
      const agentIds = filteredUsers
        .filter(user => user.role === 'agent')
        .map(user => user.id);
      setSelectedUserIds(new Set(agentIds));
    }
  };

  const toggleUserSelection = (userId: string, isAgent: boolean) => {
    if (!isAgent) return; // Only allow selecting agents
    
    const newSelection = new Set(selectedUserIds);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUserIds(newSelection);
  };

  const filteredUsers = users.filter(user => {
    // First apply role filter
    if (roleFilter !== 'all' && user.role !== roleFilter) {
      return false;
    }

    // Then apply proficiency filter if selected
    if (selectedProficiencyId && user.agent_skills) {
      return user.agent_skills.some(skill => skill.proficiency.id === selectedProficiencyId);
    }

    return true;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Text fontSize="2xl" fontWeight="bold">User Management</Text>
        
        {selectedUserIds.size > 0 && (
          <HStack spacing={3}>
            <Select
              maxW="200px"
              size="sm"
              value={bulkTeam}
              onChange={(e) => setBulkTeam(e.target.value)}
              placeholder="Select team to assign"
            >
              <option value="">No Team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </Select>
            <Button 
              size="sm"
              colorScheme="blue"
              onClick={handleBulkTeamAssignment}
              isDisabled={!bulkTeam}
              leftIcon={<AddIcon />}
            >
              Assign {selectedUserIds.size} User{selectedUserIds.size > 1 ? 's' : ''}
            </Button>
          </HStack>
        )}
      </HStack>

      {/* Filters Row */}
      <HStack mb={6} spacing={4}>
        <Select
          maxW="150px"
          size="sm"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
        >
          <option value="all">All Roles</option>
          <option value="administrator">Administrator</option>
          <option value="agent">Agent</option>
          <option value="customer">Customer</option>
        </Select>

        <ProficiencyFilter
          selectedProficiencyId={selectedProficiencyId}
          onProficiencySelected={setSelectedProficiencyId}
        />
      </HStack>

      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th px={4} py={3}>
              <Checkbox
                isChecked={selectedUserIds.size > 0 && selectedUserIds.size === filteredUsers.filter(u => u.role === 'agent').length}
                isIndeterminate={selectedUserIds.size > 0 && selectedUserIds.size < filteredUsers.filter(u => u.role === 'agent').length}
                onChange={toggleSelectAll}
              />
            </Th>
            <Th py={3}>Name</Th>
            <Th py={3}>Role</Th>
            <Th py={3}>Team</Th>
            <Th py={3} isNumeric>Tickets</Th>
            <Th py={3}>Skills & Proficiencies</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredUsers.map((user) => (
            <Tr key={user.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.900') }}>
              <Td px={4} py={2}>
                <Checkbox
                  isChecked={selectedUserIds.has(user.id)}
                  onChange={() => toggleUserSelection(user.id, user.role === 'agent')}
                  isDisabled={user.role !== 'agent'}
                />
              </Td>
              <Td py={2}>{user.full_name}</Td>
              <Td py={2}>
                <Menu>
                  <MenuButton
                    as={Button}
                    size="sm"
                    variant="ghost"
                    rightIcon={<ChevronDownIcon />}
                    textAlign="left"
                    width="120px"
                  >
                    {user.role}
                  </MenuButton>
                  <MenuList>
                    <MenuItem onClick={() => handleRoleChange(user.id, 'administrator')}>
                      Administrator
                    </MenuItem>
                    <MenuItem onClick={() => handleRoleChange(user.id, 'agent')}>
                      Agent
                    </MenuItem>
                    <MenuItem onClick={() => handleRoleChange(user.id, 'customer')}>
                      Customer
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Td>
              <Td py={2}>
                <Popover>
                  <PopoverTrigger>
                    <Button
                      size="sm"
                      variant="ghost"
                      rightIcon={<ChevronDownIcon />}
                      textAlign="left"
                      width="180px"
                    >
                      <HStack>
                        <Badge
                          colorScheme={user.is_team_lead ? 'green' : 'blue'}
                          variant="subtle"
                        >
                          {user.team?.name || 'No Team'} {user.is_team_lead && '(Lead)'}
                        </Badge>
                      </HStack>
                    </Button>
                  </PopoverTrigger>
                  <Portal>
                    <PopoverContent width="250px">
                      <PopoverArrow />
                      <PopoverBody py={4}>
                        <VStack spacing={3} align="stretch">
                          <Select
                            size="sm"
                            value={user.team?.id || ''}
                            onChange={(e) => handleTeamAssignment(user.id, e.target.value || null)}
                          >
                            <option value="">No Team</option>
                            {teams.map((team) => (
                              <option key={team.id} value={team.id}>
                                {team.name}
                              </option>
                            ))}
                          </Select>
                          {user.team && (
                            <Checkbox
                              size="sm"
                              isChecked={user.is_team_lead}
                              onChange={(e) => handleTeamAssignment(user.id, user.team!.id, e.target.checked)}
                            >
                              Team Lead
                            </Checkbox>
                          )}
                        </VStack>
                      </PopoverBody>
                    </PopoverContent>
                  </Portal>
                </Popover>
              </Td>
              <Td py={2} isNumeric>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => showUserDetails(user)}
                >
                  {user.created_tickets.length}
                </Button>
              </Td>
              <Td py={2}>
                {user.role === 'agent' && user.agent_skills && (
                  <HStack spacing={2} wrap="wrap">
                    {user.agent_skills.map((skill) => (
                      <Tag
                        key={skill.proficiency.id}
                        size="sm"
                        borderRadius="full"
                        variant="subtle"
                        colorScheme="purple"
                      >
                        <TagLabel>
                          {skill.proficiency.skill.name}: {skill.proficiency.name}
                        </TagLabel>
                        {deletingProficiencies.has(skill.proficiency.id) ? (
                          <Box w="16px" h="16px" display="flex" alignItems="center" justifyContent="center" mr={1}>
                            <Spinner size="xs" />
                          </Box>
                        ) : (
                          <TagCloseButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveProficiency(user.id, skill.proficiency.id);
                            }}
                          />
                        )}
                      </Tag>
                    ))}
                    <ProficiencySelector
                      userId={user.id}
                      existingSkills={user.agent_skills}
                      onProficiencyAdded={fetchUsers}
                    />
                  </HStack>
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {/* User Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>User Details - {selectedUser?.full_name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedUser && (
              <VStack spacing={6} align="stretch">
                {/* Team Assignment Section */}
                <Box>
                  <Text fontWeight="bold" mb={4}>Team Assignment</Text>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Team</FormLabel>
                      <Select
                        value={selectedTeam}
                        onChange={(e) => {
                          setSelectedTeam(e.target.value);
                          if (!e.target.value) {
                            setIsTeamLead(false);
                          }
                        }}
                        placeholder="Select team"
                      >
                        <option value="">No Team</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    {selectedTeam && (
                      <FormControl>
                        <Checkbox
                          isChecked={isTeamLead}
                          onChange={(e) => setIsTeamLead(e.target.checked)}
                        >
                          Assign as Team Lead
                        </Checkbox>
                      </FormControl>
                    )}
                    <Button colorScheme="blue" onClick={() => handleTeamAssignment(selectedUser.id, selectedTeam, isTeamLead)}>
                      Update Team Assignment
                    </Button>
                  </VStack>
                </Box>

                {/* Agent Skills Section */}
                {selectedUser.role === 'agent' && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Skills & Proficiencies:</Text>
                    {selectedUser.agent_skills && selectedUser.agent_skills.length > 0 ? (
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Skill</Th>
                            <Th>Proficiency</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {selectedUser.agent_skills.map((agentSkill) => (
                            <Tr key={agentSkill.proficiency.id}>
                              <Td>{agentSkill.proficiency.skill.name}</Td>
                              <Td>
                                <Badge colorScheme="blue">
                                  {agentSkill.proficiency.name}
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    ) : (
                      <Text color="gray.500">No skills assigned</Text>
                    )}
                  </Box>
                )}

                {/* Created Tickets Section */}
                <Box>
                  <Text fontWeight="bold" mb={2}>Created Tickets:</Text>
                  {selectedUser.created_tickets.length > 0 ? (
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Title</Th>
                          <Th>Description</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {selectedUser.created_tickets.map((ticket) => (
                          <Tr key={ticket.id}>
                            <Td>{ticket.title}</Td>
                            <Td>{ticket.description || '-'}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  ) : (
                    <Text color="gray.500">No tickets created</Text>
                  )}
                </Box>

                {/* Current Team Info Section */}
                <Box>
                  <Text fontWeight="bold" mb={2}>Current Team:</Text>
                  {selectedUser.team ? (
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Team</Th>
                          <Th>Role</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        <Tr>
                          <Td>{selectedUser.team.name}</Td>
                          <Td>{selectedUser.is_team_lead ? 'Team Lead' : 'Member'}</Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  ) : (
                    <Text color="gray.500">No team membership</Text>
                  )}
                </Box>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}); 