import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Textarea,
  VStack,
  Text,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { supabase } from '../../config/supabase';

interface Person {
  name?: string;
  role?: string;
  is_team_lead?: boolean;
  team?: string;
  targetTeam?: string;
  skills?: Array<{
    skill: string;
    proficiency: string;
  }>;
  delete?: boolean;
  reassign?: boolean;
}

interface AIResponse {
  input: string;
  output: string;
  description: string;
  metadata: {
    processedAt: string;
    processingTimeMs: number;
    targetTeam?: string;
  };
  trace: {
    type: string;
    name?: string;
    arguments?: any;
    result?: any;
  }[];
}

// Custom styles for the response table
const tableStyles = {
  '.response-table': {
    width: '100%',
    'th': {
      fontWeight: 'bold',
      textAlign: 'left',
      padding: '8px',
      borderBottom: '2px solid',
      borderColor: 'gray.200',
    },
    'td': {
      padding: '8px',
      borderBottom: '1px solid',
      borderColor: 'gray.100',
      verticalAlign: 'top',
    },
  },
};

interface PowerManagementProps {
  onUsersChange?: () => void;
}

export const PowerManagement: React.FC<PowerManagementProps> = ({ onUsersChange }) => {
  const [inputText, setInputText] = useState('');
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState<Person[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);

  const handleSubmit = async () => {
    if (!inputText.trim()) {
      toast({
        title: 'Please enter some text',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('llm-test', {
        body: { text: inputText },
      });

      if (functionError) throw functionError;

      setResponse(functionData);
      toast({
        title: 'Response received',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error processing request',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedPeople.length) return;

    setIsDeleting(true);
    try {
      // Get all user names to delete
      const userNames = selectedPeople.map(person => person.name);

      // Delete the users
      const { error } = await supabase
        .from('users')
        .delete()
        .in('full_name', userNames);

      if (error) throw error;

      toast({
        title: 'Users deleted successfully',
        description: `Deleted ${selectedPeople.length} users`,
        status: 'success',
        duration: 5000,
      });

      // Clear the response and input after successful deletion
      setResponse(null);
      setInputText('');
      setSelectedPeople([]);
      onClose();

      // Trigger refresh of UserManagement component
      onUsersChange?.();
    } catch (error) {
      console.error('Error deleting users:', error);
      toast({
        title: 'Error deleting users',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmReassign = async () => {
    if (!selectedPeople.length || !response?.metadata.targetTeam) return;

    setIsReassigning(true);
    try {
      // Get all user names to reassign
      const userNames = selectedPeople.map(person => person.name);

      // First, get the team ID for the target team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('name', response.metadata.targetTeam)
        .single();

      if (teamError) {
        throw new Error(`Failed to find target team: ${teamError.message}`);
      }

      // Update the users' team
      const { error: updateError } = await supabase
        .from('users')
        .update({ team_id: teamData.id })
        .in('full_name', userNames);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: 'Users reassigned successfully',
        description: `Reassigned ${selectedPeople.length} users to ${response.metadata.targetTeam}`,
        status: 'success',
        duration: 5000,
      });

      // Clear the response and input after successful reassignment
      setResponse(null);
      setInputText('');
      setSelectedPeople([]);
      onClose();

      // Trigger refresh of UserManagement component if provided
      onUsersChange?.();
    } catch (error) {
      console.error('Error reassigning users:', error);
      toast({
        title: 'Error reassigning users',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsReassigning(false);
    }
  };

  const handleCancel = () => {
    // Clear all relevant state
    setSelectedPeople([]);
    setResponse(null);
    setInputText('');
    onClose();
  };

  const renderSkills = (skills?: Person['skills']) => {
    if (!skills?.length) return null;
    return skills.map((skill, index) => (
      <Badge 
        key={index} 
        colorScheme="blue" 
        mr={1} 
        mb={1}
        display="inline-block"
      >
        {skill.skill} ({skill.proficiency})
      </Badge>
    ));
  };

  const renderResponse = (output: string) => {
    try {
      const people: Person[] = JSON.parse(output);
      
      // Check if this is a delete or reassign operation
      const isDeleteOperation = people.some(p => p.delete);
      const isReassignOperation = people.some(p => p.reassign);
      
      // Update selected people for modal, but don't immediately open it
      // This ensures we don't trigger a re-render during the current render
      if (isDeleteOperation || isReassignOperation) {
        setTimeout(() => {
          setSelectedPeople(people);
          onOpen();
        }, 0);
      }
      
      // Get all available fields from the response
      const hasName = people.some(p => 'name' in p);
      const hasRole = people.some(p => 'role' in p);
      const hasTeamLead = people.some(p => 'is_team_lead' in p);
      const hasTeam = people.some(p => 'team' in p);
      const hasSkills = people.some(p => 'skills' in p);

      return (
        <>
          <Box position="relative">
            {isDeleteOperation && (
              <Box 
                position="absolute" 
                top={0} 
                right={0} 
                mb={4}
              >
                <Badge colorScheme="red" fontSize="md" p={2}>
                  Delete Operation Pending
                </Badge>
              </Box>
            )}
            {isReassignOperation && (
              <Box 
                position="absolute" 
                top={0} 
                right={0} 
                mb={4}
              >
                <Badge colorScheme="blue" fontSize="md" p={2}>
                  Team Reassignment Pending
                </Badge>
              </Box>
            )}
            
            <Table className="response-table" sx={tableStyles['.response-table']}>
              <Thead>
                <Tr>
                  {hasName && <Th>Name</Th>}
                  {hasRole && <Th>Role</Th>}
                  {hasTeamLead && <Th>Team Lead</Th>}
                  {hasTeam && <Th>Team</Th>}
                  {hasSkills && <Th>Skills</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {people.map((person, index) => (
                  <Tr 
                    key={index}
                    bg={isDeleteOperation ? 'red.50' : isReassignOperation ? 'blue.50' : undefined}
                  >
                    {hasName && <Td fontWeight="medium">{person.name}</Td>}
                    {hasRole && <Td>{person.role}</Td>}
                    {hasTeamLead && (
                      <Td>
                        {person.is_team_lead ? (
                          <Badge colorScheme="green">Yes</Badge>
                        ) : (
                          <Badge colorScheme="gray">No</Badge>
                        )}
                      </Td>
                    )}
                    {hasTeam && <Td>{person.team}</Td>}
                    {hasSkills && <Td>{renderSkills(person.skills)}</Td>}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>

          {/* Reassignment Confirmation Modal */}
          {isReassignOperation && (
            <Modal 
              isOpen={isOpen} 
              onClose={handleCancel}
              closeOnOverlayClick={!isReassigning}
              closeOnEsc={!isReassigning}
              size="xl"
            >
              <ModalOverlay />
              <ModalContent>
                <ModalHeader color="blue.500">Confirm Team Reassignment</ModalHeader>
                <ModalCloseButton isDisabled={isReassigning} />
                <ModalBody>
                  <VStack align="stretch" spacing={4}>
                    <Text fontSize="lg" fontWeight="medium">
                      Are you sure you want to reassign the following {selectedPeople.length} users to {selectedPeople[0]?.targetTeam}?
                    </Text>
                    <Box 
                      p={4} 
                      bg="blue.50" 
                      borderRadius="md" 
                      borderLeft="4px" 
                      borderColor="blue.500"
                    >
                      <Text color="blue.700" fontWeight="medium" mb={2}>
                        This will:
                      </Text>
                      <VStack align="stretch" spacing={1} pl={4} color="blue.700">
                        <Text>• Move users to the new team</Text>
                        <Text>• Update all team associations</Text>
                        <Text>• Maintain user roles and skills</Text>
                      </VStack>
                    </Box>
                    <Box 
                      maxH="300px" 
                      overflowY="auto" 
                      borderWidth={1} 
                      borderRadius="md" 
                      p={4}
                    >
                      {selectedPeople.map((person, index) => (
                        <Text key={index} py={1}>
                          • <Text as="span" fontWeight="medium">{person.name}</Text>
                          {person.team && (
                            <Text as="span" color="gray.600">
                              {' '}(Current: {person.team})
                            </Text>
                          )}
                          {person.targetTeam && (
                            <Text as="span" color="blue.600">
                              {' '}→ {person.targetTeam}
                            </Text>
                          )}
                          {person.role && (
                            <Text as="span" color="gray.600">
                              {' '}- {person.role}
                            </Text>
                          )}
                        </Text>
                      ))}
                    </Box>
                  </VStack>
                </ModalBody>
                <ModalFooter>
                  <Button 
                    colorScheme="gray" 
                    mr={3} 
                    onClick={handleCancel}
                    isDisabled={isReassigning}
                  >
                    Cancel
                  </Button>
                  <Button 
                    colorScheme="blue" 
                    onClick={handleConfirmReassign}
                    isLoading={isReassigning}
                    loadingText="Reassigning..."
                  >
                    Confirm Reassignment
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          )}

          {/* Delete Confirmation Modal */}
          {isDeleteOperation && (
            <Modal 
              isOpen={isOpen} 
              onClose={handleCancel}
              closeOnOverlayClick={!isDeleting}
              closeOnEsc={!isDeleting}
              size="xl"
            >
              <ModalOverlay />
              <ModalContent>
                <ModalHeader color="red.500">Confirm Delete Operation</ModalHeader>
                <ModalCloseButton isDisabled={isDeleting} />
                <ModalBody>
                  <VStack align="stretch" spacing={4}>
                    <Text fontSize="lg" fontWeight="medium">
                      Are you sure you want to delete the following {selectedPeople.length} users?
                    </Text>
                    <Box 
                      p={4} 
                      bg="red.50" 
                      borderRadius="md" 
                      borderLeft="4px" 
                      borderColor="red.500"
                    >
                      <Text color="red.700" fontWeight="medium" mb={2}>
                        Warning: This is a destructive operation that will also delete:
                      </Text>
                      <VStack align="stretch" spacing={1} pl={4} color="red.700">
                        <Text>• All tickets created by these users</Text>
                        <Text>• All messages sent by these users in any ticket</Text>
                        <Text>• All ticket metadata referencing these users</Text>
                        <Text>• All user skills and team associations</Text>
                      </VStack>
                      <Text color="red.700" mt={2} fontWeight="medium">
                        This action cannot be undone.
                      </Text>
                    </Box>
                    <Box 
                      maxH="300px" 
                      overflowY="auto" 
                      borderWidth={1} 
                      borderRadius="md" 
                      p={4}
                    >
                      {selectedPeople.map((person, index) => (
                        <Text key={index} py={1}>
                          • <Text as="span" fontWeight="medium">{person.name}</Text>
                          {person.team && (
                            <Text as="span" color="gray.600">
                              {' '}({person.team})
                            </Text>
                          )}
                          {person.role && (
                            <Text as="span" color="gray.600">
                              {' '}- {person.role}
                            </Text>
                          )}
                        </Text>
                      ))}
                    </Box>
                  </VStack>
                </ModalBody>
                <ModalFooter>
                  <Button 
                    colorScheme="gray" 
                    mr={3} 
                    onClick={handleCancel}
                    isDisabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    colorScheme="red" 
                    onClick={handleConfirmDelete}
                    isLoading={isDeleting}
                    loadingText="Deleting..."
                  >
                    I understand, delete these users
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          )}
        </>
      );
    } catch (error) {
      // If parsing fails or output is not valid JSON, display raw output
      return <Text whiteSpace="pre-wrap">{output}</Text>;
    }
  };

  return (
    <Box>
      <Text fontSize="xl" fontWeight="bold" mb={4}>AI Power Tools</Text>
      
      <VStack spacing={6} align="stretch">
        <FormControl>
          <FormLabel>Enter your text</FormLabel>
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter text for AI analysis..."
            minHeight="150px"
          />
        </FormControl>

        <Button
          colorScheme="blue"
          onClick={handleSubmit}
          isLoading={isLoading}
          loadingText="Processing"
        >
          Analyze Text
        </Button>

        {response && (
          <Box mt={4} p={4} borderWidth={1} borderRadius="md">
            <Text fontSize="lg" fontWeight="bold" mb={2}>{response.description}</Text>
            {renderResponse(response.output)}
            
            <Box mt={4} fontSize="sm" color="gray.600">
              <Text>Processed at: {new Date(response.metadata.processedAt).toLocaleString()}</Text>
              <Text>Processing time: {response.metadata.processingTimeMs}ms</Text>
            </Box>

            <Box mt={4}>
              <Text fontWeight="bold" mb={2}>Execution Trace:</Text>
              {response.trace.map((entry, index) => (
                <Box 
                  key={index} 
                  mt={2} 
                  p={3} 
                  borderWidth={1} 
                  borderRadius="md" 
                  backgroundColor="gray.50"
                >
                  <Text fontWeight="semibold" color="blue.600">
                    {entry.type} {entry.name ? `(${entry.name})` : ''}
                  </Text>
                  {entry.arguments && (
                    <Box mt={1}>
                      <Text fontWeight="medium">Arguments:</Text>
                      <VStack align="stretch" spacing={1} mt={2}>
                        {entry.name === 'listOperators' && (
                          <>
                            {entry.arguments.fields && (
                              <Text fontSize="sm">
                                <Text as="span" fontWeight="medium">Fields requested: </Text>
                                {entry.arguments.fields.join(', ')}
                              </Text>
                            )}
                            {entry.arguments.skillFilter && (
                              <Text fontSize="sm">
                                <Text as="span" fontWeight="medium">Skill filter: </Text>
                                {entry.arguments.skillFilter}
                              </Text>
                            )}
                            {entry.arguments.proficiencyFilter && (
                              <Text fontSize="sm">
                                <Text as="span" fontWeight="medium">Proficiency filter: </Text>
                                {entry.arguments.proficiencyFilter}
                              </Text>
                            )}
                            {entry.arguments.teamName && (
                              <Text fontSize="sm">
                                <Text as="span" fontWeight="medium">Team filter: </Text>
                                {entry.arguments.teamName}
                              </Text>
                            )}
                            {entry.arguments.isTeamLead !== undefined && (
                              <Text fontSize="sm">
                                <Text as="span" fontWeight="medium">Team lead filter: </Text>
                                {entry.arguments.isTeamLead ? 'Yes' : 'No'}
                              </Text>
                            )}
                          </>
                        )}
                        {entry.name !== 'listOperators' && (
                          <Text as="pre" fontSize="sm" whiteSpace="pre-wrap">
                            {JSON.stringify(entry.arguments, null, 2)}
                          </Text>
                        )}
                      </VStack>
                    </Box>
                  )}
                  {entry.result && (
                    <Box mt={1}>
                      <Text fontWeight="medium">Result:</Text>
                      <Text as="pre" fontSize="sm" whiteSpace="pre-wrap">
                        {typeof entry.result === 'string' 
                          ? entry.result 
                          : JSON.stringify(entry.result, null, 2)}
                      </Text>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </VStack>
    </Box>
  );
}; 