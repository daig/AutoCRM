import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  useToast,
  Card,
  CardBody,
  Heading,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';

export const CreateTicketPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert([
          {
            title: formData.title,
            description: formData.description,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Ticket created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Navigate back to the CRM page
      navigate('/crm');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred while creating the ticket',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box maxW="3xl" mx="auto">
      <Card>
        <CardBody>
          <VStack spacing={6} align="stretch">
            <Heading size="lg">Create New Ticket</Heading>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Title</FormLabel>
                  <Input
                    name="title"
                    placeholder="Enter ticket title"
                    value={formData.title}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    name="description"
                    placeholder="Enter ticket description"
                    value={formData.description}
                    onChange={handleChange}
                    minH="200px"
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  width="full"
                  isLoading={isLoading}
                  loadingText="Creating..."
                >
                  Create Ticket
                </Button>
              </VStack>
            </form>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
}; 