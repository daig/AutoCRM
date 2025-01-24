import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
  useToast,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useDisclosure,
  VStack,
  HStack,
  Tag,
  TagLabel,
  IconButton,
  Wrap,
  WrapItem,
  useColorModeValue,
  Input,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Popover,
  Center,
} from '@chakra-ui/react';
import { supabase } from '../config/supabase';
import { DeleteIcon, ChevronDownIcon, CloseIcon, AddIcon } from '@chakra-ui/icons';
import { useUser } from '../context/UserContext';

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

interface TeamMemberResponse {
  id: string;
  full_name: string | null;
  role: 'agent';
  tickets: {
    id: string;
    title: string;
    description: string | null;
  }[];
  agent_skills?: AgentSkill[];
}

interface TeamMember {
  id: string;
  full_name: string | null;
  role: 'agent';
  created_tickets: {
    id: string;
    title: string;
    description: string | null;
  }[];
  agent_skills?: AgentSkill[];
}

interface ProficiencyFilterProps {
  onProficiencySelected: (proficiencyId: string | null) => void;
  selectedProficiencyId: string | null;
}

interface SkillWithProficiencies {
  id: string;
  name: string;
  proficiencies: {
    id: string;
    name: string;
    skill: {
      id: string;
      name: string;
    };
  }[];
}

interface SkillResponse {
  id: string;
  name: string;
}

interface ProficiencyResponse {
  id: string;
  name: string;
  skill: {
    id: string;
    name: string;
  };
}

interface UserWithTeam {
  team: {
    id: string;
    name: string;
  } | null;
}

interface Ticket {
  id: string;
  title: string;
  description: string | null;
  team: string;
  creator: string;
  created_at: string;
  updated_at: string;
}

interface AssignTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember;
  teamId: string;
  onAssign: () => void;
}

const ProficiencyFilter: React.FC<ProficiencyFilterProps> = ({ onProficiencySelected, selectedProficiencyId }) => {
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
          .returns<ProficiencyResponse[]>();

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

const AssignTicketModal: React.FC<AssignTicketModalProps> = ({ isOpen, onClose, member, teamId, onAssign }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();

  useEffect(() => {
    const fetchTeamTickets = async () => {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .eq('team', teamId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTickets(data);
      } catch (error) {
        console.error('Error fetching tickets:', error);
        toast({
          title: 'Error fetching tickets',
          status: 'error',
          duration: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchTeamTickets();
    }
  }, [isOpen, teamId]);

  const handleAssignTicket = async (ticketId: string) => {
    try {
      // First, check if there's an existing assignee metadata field type
      let assigneeFieldTypeId: string;
      const { data: fieldTypeData, error: fieldTypeError } = await supabase
        .from('ticket_metadata_field_types')
        .select('id')
        .eq('name', 'assigned')
        .single();

      if (fieldTypeError) {
        // Create the field type if it doesn't exist
        const { data: newFieldType, error: createError } = await supabase
          .from('ticket_metadata_field_types')
          .insert({
            name: 'assigned',
            value_type: 'user',
            description: 'The agent assigned to handle this ticket'
          })
          .select('id')
          .single();

        if (createError) throw createError;
        assigneeFieldTypeId = newFieldType.id;
      } else {
        assigneeFieldTypeId = fieldTypeData.id;
      }

      // Update or insert the assignee metadata
      const { error: metadataError } = await supabase
        .from('ticket_metadata')
        .upsert({
          ticket: ticketId,
          field_type: assigneeFieldTypeId,
          field_value_user: member.id
        }, {
          onConflict: 'ticket,field_type'
        });

      if (metadataError) throw metadataError;

      toast({
        title: 'Ticket assigned successfully',
        status: 'success',
        duration: 2000,
      });

      onAssign();
      onClose();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast({
        title: 'Error assigning ticket',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const filteredTickets = tickets.filter(ticket => 
    searchQuery
      ? ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ticket.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Assign Ticket to {member.full_name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {loading ? (
              <Center p={8}>
                <Spinner />
              </Center>
            ) : (
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Title</Th>
                    <Th>Created</Th>
                    <Th>Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredTickets.map((ticket) => (
                    <Tr key={ticket.id}>
                      <Td>
                        <Text noOfLines={1}>{ticket.title}</Text>
                      </Td>
                      <Td>{new Date(ticket.created_at).toLocaleDateString()}</Td>
                      <Td>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => handleAssignTicket(ticket.id)}
                        >
                          Assign
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const ManagerPage: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedProficiencyId, setSelectedProficiencyId] = useState<string | null>(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { userId } = useUser();
  const [userTeam, setUserTeam] = useState<{ id: string; name: string } | null>(null);
  const [selectedMemberForAssignment, setSelectedMemberForAssignment] = useState<TeamMember | null>(null);
  const { isOpen: isAssignModalOpen, onOpen: openAssignModal, onClose: closeAssignModal } = useDisclosure();

  // Fetch the user's team information
  useEffect(() => {
    const fetchUserTeam = async () => {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select(`
            team:teams (
              id,
              name
            )
          `)
          .eq('id', userId)
          .single();

        if (error) throw error;
        
        // Safely handle the response
        const userData = data as unknown as UserWithTeam;
        if (userData?.team) {
          setUserTeam({
            id: userData.team.id,
            name: userData.team.name
          });
        } else {
          setUserTeam(null);
        }
      } catch (error) {
        console.error('Error fetching user team:', error);
        toast({
          title: 'Error fetching team information',
          status: 'error',
          duration: 3000,
        });
      }
    };

    fetchUserTeam();
  }, [userId]);

  const fetchTeamMembers = async () => {
    if (!userTeam?.id) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          role,
          tickets!creator(id, title, description),
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
        `)
        .eq('team_id', userTeam.id)
        .eq('role', 'agent')
        .neq('id', userId) // Exclude the team lead themselves
        .returns<TeamMemberResponse[]>();

      if (error) throw error;

      // Transform the response data into the expected TeamMember format
      const transformedData: TeamMember[] = data?.map(member => ({
        ...member,
        agent_skills: member.agent_skills || [],
        created_tickets: member.tickets || []
      }));

      setTeamMembers(transformedData);
    } catch (error) {
      toast({
        title: 'Error fetching team members',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, [userTeam?.id]);

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          team_id: null,
          is_team_lead: false 
        })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Team member removed',
        status: 'success',
        duration: 2000,
      });
      
      fetchTeamMembers();
    } catch (error) {
      toast({
        title: 'Error removing team member',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const showMemberDetails = (member: TeamMember) => {
    setSelectedMember(member);
    onOpen();
  };

  const filteredMembers = teamMembers.filter(member => {
    if (selectedProficiencyId && member.agent_skills) {
      return member.agent_skills.some(skill => skill.proficiency.id === selectedProficiencyId);
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
    <Box p={6}>
      <Text fontSize="2xl" fontWeight="bold" mb={6}>Team Management</Text>

      {/* Filters Row */}
      <HStack mb={6} spacing={4}>
        <ProficiencyFilter
          selectedProficiencyId={selectedProficiencyId}
          onProficiencySelected={setSelectedProficiencyId}
        />
      </HStack>

      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th py={3}>Name</Th>
            <Th py={3} isNumeric>Tickets</Th>
            <Th py={3}>Skills & Proficiencies</Th>
            <Th py={3}>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredMembers.map((member) => (
            <Tr key={member.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.900') }}>
              <Td py={2}>{member.full_name}</Td>
              <Td py={2} isNumeric>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => showMemberDetails(member)}
                >
                  {member.created_tickets.length}
                </Button>
              </Td>
              <Td py={2}>
                <Wrap spacing={2}>
                  {member.agent_skills?.map((skill) => (
                    <WrapItem key={skill.proficiency.id}>
                      <Tag
                        size="sm"
                        borderRadius="full"
                        variant="subtle"
                        colorScheme="purple"
                      >
                        <TagLabel>
                          {skill.proficiency.skill.name}: {skill.proficiency.name}
                        </TagLabel>
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              </Td>
              <Td py={2}>
                <HStack spacing={2}>
                  <IconButton
                    aria-label="Remove member"
                    icon={<DeleteIcon />}
                    colorScheme="red"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id)}
                  />
                  <IconButton
                    aria-label="Assign ticket"
                    icon={<AddIcon />}
                    colorScheme="blue"
                    size="sm"
                    onClick={() => {
                      setSelectedMemberForAssignment(member);
                      openAssignModal();
                    }}
                  />
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {/* Member Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Member Details - {selectedMember?.full_name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedMember && (
              <VStack spacing={6} align="stretch">
                {/* Created Tickets Section */}
                <Box>
                  <Text fontWeight="bold" mb={2}>Created Tickets:</Text>
                  {selectedMember.created_tickets.length > 0 ? (
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Title</Th>
                          <Th>Description</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {selectedMember.created_tickets.map((ticket) => (
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

                {/* Skills Section */}
                <Box>
                  <Text fontWeight="bold" mb={2}>Skills & Proficiencies:</Text>
                  {selectedMember.agent_skills && selectedMember.agent_skills.length > 0 ? (
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Skill</Th>
                          <Th>Proficiency</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {selectedMember.agent_skills.map((agentSkill) => (
                          <Tr key={agentSkill.proficiency.id}>
                            <Td>{agentSkill.proficiency.skill.name}</Td>
                            <Td>{agentSkill.proficiency.name}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  ) : (
                    <Text color="gray.500">No skills assigned</Text>
                  )}
                </Box>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Ticket Assignment Modal */}
      {selectedMemberForAssignment && userTeam && (
        <AssignTicketModal
          isOpen={isAssignModalOpen}
          onClose={() => {
            closeAssignModal();
            setSelectedMemberForAssignment(null);
          }}
          member={selectedMemberForAssignment}
          teamId={userTeam.id}
          onAssign={fetchTeamMembers}
        />
      )}
    </Box>
  );
};

export default ManagerPage; 