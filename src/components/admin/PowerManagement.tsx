import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
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
  Tbody,
  Tr,
  Td,
} from '@chakra-ui/react';
import { supabase } from '../../config/supabase';

// Custom styles for the markdown output
const markdownStyles = {
  '.response-markdown': {
    fontFamily: 'monospace',
    whiteSpace: 'pre',
    overflowX: 'auto',
    '& p': {
      margin: 0,
      lineHeight: '1.5',
      whiteSpace: 'pre',
      display: 'block',
    },
    '& strong': {
      color: 'blue.600',
      minWidth: '30ch',
      display: 'inline-block',
    },
  },
};

// Custom styles for the response table
const tableStyles = {
  '.response-table': {
    fontFamily: 'monospace',
    width: '100%',
    'td:first-of-type': {
      color: 'blue.600',
      fontWeight: 'bold',
      width: '200px',
      whiteSpace: 'nowrap',
      paddingRight: '2rem',
    },
    'td:last-of-type': {
      whiteSpace: 'normal',
    },
  },
};

interface Person {
  name: string;
  skills: string[];
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

  const renderResponse = (output: string) => {
    try {
      const people: Person[] = JSON.parse(output);
      return (
        <Table className="response-table" sx={tableStyles['.response-table']}>
          <Tbody>
            {people.map((person, index) => (
              <Tr key={index}>
                <Td>{person.name}</Td>
                <Td>{person.skills.join(', ')}</Td>
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
                      <Text as="pre" fontSize="sm" whiteSpace="pre-wrap">
                        {JSON.stringify(entry.arguments, null, 2)}
                      </Text>
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