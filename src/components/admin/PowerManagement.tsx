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
  Spinner,
} from '@chakra-ui/react';
import { supabase } from '../../config/supabase';

interface AIResponse {
  input: string;
  output: string;
  metadata: {
    processedAt: string;
    processingTimeMs: number;
  };
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
            <Text whiteSpace="pre-wrap">{response.output}</Text>
            
            <Box mt={4} fontSize="sm" color="gray.600">
              <Text>Processed at: {new Date(response.metadata.processedAt).toLocaleString()}</Text>
              <Text>Processing time: {response.metadata.processingTimeMs}ms</Text>
            </Box>
          </Box>
        )}
      </VStack>
    </Box>
  );
}; 