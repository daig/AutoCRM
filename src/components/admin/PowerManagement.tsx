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
} from '@chakra-ui/react';
import { supabase } from '../../config/supabase';

interface Person {
  name?: string;
  role?: string;
  is_team_lead?: boolean;
  team?: string;
  skills?: Array<{
    skill: string;
    proficiency: string;
  }>;
}

interface AIResponse {
  input: string;
  output: string;
  metadata: {
    processedAt: string;
    processingTimeMs: number;
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

export const PowerManagement: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

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
      
      // Get all available fields from the response
      const hasName = people.some(p => 'name' in p);
      const hasRole = people.some(p => 'role' in p);
      const hasTeamLead = people.some(p => 'is_team_lead' in p);
      const hasTeam = people.some(p => 'team' in p);
      const hasSkills = people.some(p => 'skills' in p);

      return (
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
              <Tr key={index}>
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
      );
    } catch (error) {
      // Fallback to displaying raw output if it's not valid JSON
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
            <Text fontWeight="bold" mb={2}>Analysis Result:</Text>
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