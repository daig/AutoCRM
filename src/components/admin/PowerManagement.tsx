import React, { useState, KeyboardEvent } from 'react';
import {
  Box,
  Button,
  FormControl,
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
  IconButton,
  useColorModeValue,
  Tooltip,
  SlideFade,
  Collapse,
  Code,
} from '@chakra-ui/react';
import { 
  CloseIcon,
  ArrowRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@chakra-ui/icons';
import { FiZap } from 'react-icons/fi';
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
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const { isOpen: isChatOpen, onToggle: onChatToggle } = useDisclosure();
  const { isOpen: isActionModalOpen, onOpen: onActionModalOpen, onClose: onActionModalClose } = useDisclosure();
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);
  const [isTraceVisible, setIsTraceVisible] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

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
      onModalOpen(); // Open the modal with results
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
      onModalClose();

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
      onModalClose();

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
    onActionModalClose();
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
      
      // Update selected people for modal
      if (isDeleteOperation || isReassignOperation) {
        setTimeout(() => {
          setSelectedPeople(people);
          onActionModalOpen();
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
              isOpen={isActionModalOpen} 
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
              isOpen={isActionModalOpen} 
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

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Box
        position="fixed"
        bottom="4"
        right="4"
        zIndex={999}
      >
        <VStack spacing={4} align="flex-end">
          {/* Chat Box */}
          <SlideFade in={isChatOpen} offsetY="20px">
            <Box
              display={isChatOpen ? 'block' : 'none'}
              width="350px"
              bg={bgColor}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="lg"
              boxShadow="lg"
              mb={4}
            >
              {/* Chat Header */}
              <Box
                p={4}
                borderBottomWidth="1px"
                borderColor={borderColor}
                bg={useColorModeValue('blue.500', 'blue.400')}
                color="white"
                borderTopRadius="lg"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text fontWeight="bold">AI Power Tools</Text>
                <IconButton
                  aria-label="Close chat"
                  icon={<CloseIcon />}
                  size="sm"
                  variant="ghost"
                  color="white"
                  _hover={{ bg: 'blue.600' }}
                  onClick={onChatToggle}
                />
              </Box>

              {/* Chat Body */}
              <Box p={4}>
                <VStack spacing={4}>
                  <FormControl>
                    <Textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter text for AI analysis... (Press Enter to submit)"
                      minHeight="100px"
                      resize="none"
                    />
                  </FormControl>

                  <IconButton
                    aria-label="Analyze text"
                    icon={<ArrowRightIcon />}
                    onClick={handleSubmit}
                    isLoading={isLoading}
                    colorScheme="blue"
                    width="full"
                    size="lg"
                  />
                </VStack>
              </Box>
            </Box>
          </SlideFade>

          {/* Toggle Button */}
          <Tooltip label={isChatOpen ? 'Close AI Tools' : 'Open AI Tools'} placement="left">
            <IconButton
              aria-label="Toggle AI Tools"
              icon={<FiZap />}
              onClick={onChatToggle}
              colorScheme="yellow"
              size="lg"
              borderRadius="full"
              boxShadow="lg"
            />
          </Tooltip>
        </VStack>
      </Box>

      {/* Results Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={onModalClose}
        size="xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>AI Analysis Results</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {response && (
              <Box>
                <Text fontSize="lg" fontWeight="bold" mb={4}>{response.description}</Text>
                {renderResponse(response.output)}
                
                <Box mt={4} fontSize="sm" color="gray.600">
                  <Text>Processed at: {new Date(response.metadata.processedAt).toLocaleString()}</Text>
                  <Text>Processing time: {response.metadata.processingTimeMs}ms</Text>
                  
                  {/* Trace Section */}
                  <Box mt={4}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsTraceVisible(!isTraceVisible)}
                      rightIcon={isTraceVisible ? <ChevronUpIcon /> : <ChevronDownIcon />}
                      mb={2}
                    >
                      {isTraceVisible ? 'Hide Trace' : 'Show Trace'}
                    </Button>
                    
                    <Collapse in={isTraceVisible}>
                      <Box
                        p={4}
                        bg={useColorModeValue('gray.50', 'gray.700')}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor={useColorModeValue('gray.200', 'gray.600')}
                        overflowX="auto"
                      >
                        {response.trace.map((item, index) => (
                          <Box key={index} mb={4}>
                            <Text fontWeight="bold" color={useColorModeValue('gray.700', 'gray.300')}>
                              {item.type} {item.name ? `(${item.name})` : ''}
                            </Text>
                            {item.arguments && (
                              <Box mt={2}>
                                <Text fontWeight="medium" color={useColorModeValue('gray.600', 'gray.400')}>Arguments:</Text>
                                <Code p={2} display="block" whiteSpace="pre" borderRadius="md" mt={1}>
                                  {JSON.stringify(item.arguments, null, 2)}
                                </Code>
                              </Box>
                            )}
                            {item.result && (
                              <Box mt={2}>
                                <Text fontWeight="medium" color={useColorModeValue('gray.600', 'gray.400')}>Result:</Text>
                                <Code p={2} display="block" whiteSpace="pre" borderRadius="md" mt={1}>
                                  {typeof item.result === 'string' ? item.result : JSON.stringify(item.result, null, 2)}
                                </Code>
                              </Box>
                            )}
                          </Box>
                        ))}
                      </Box>
                    </Collapse>
                  </Box>
                </Box>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}; 