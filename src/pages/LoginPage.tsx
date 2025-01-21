import { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, VStack, Heading, Text, Link, useToast } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useUser } from '../context/UserContext';

export const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { setUserId } = useUser();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: userId, error } = await supabase.rpc('verify_user_login', {
        login_email: formData.email,
        login_password: formData.password
      });

      if (error) throw error;
      
      if (!userId) {
        throw new Error('Invalid email or password');
      }

      // Store the userId in context
      setUserId(userId);

      toast({
        title: 'Login successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Navigate to the protected route the user tried to visit or default to /crm
      const from = (location.state as any)?.from?.pathname || '/crm';
      navigate(from, { replace: true });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred during login',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg">
      <VStack spacing={4} align="stretch">
        <Heading textAlign="center">Login</Heading>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </FormControl>
            <Button
              type="submit"
              colorScheme="blue"
              width="full"
              isLoading={isLoading}
              loadingText="Logging in..."
            >
              Login
            </Button>
          </VStack>
        </form>
        <Text textAlign="center">
          Don't have an account?{' '}
          <Link as={RouterLink} to="/signup" color="blue.500">
            Sign up
          </Link>
        </Text>
      </VStack>
    </Box>
  );
}; 