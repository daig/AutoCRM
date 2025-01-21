import { Box, Text, HStack, VStack } from '@chakra-ui/react';

interface MessageProps {
  message: {
    id: string;
    content: string;
    created_at: string;
    sender: {
      full_name: string;
    };
  };
}

export const Message = ({ message }: MessageProps) => {
  return (
    <Box
      p={3}
      bg="gray.50"
      borderRadius="md"
      borderWidth="1px"
      borderColor="gray.200"
    >
      <VStack align="stretch" spacing={1}>
        <HStack justify="space-between" fontSize="sm" color="gray.600">
          <Text fontWeight="medium">{message.sender.full_name}</Text>
          <Text>{new Date(message.created_at).toLocaleString()}</Text>
        </HStack>
        <Text>{message.content}</Text>
      </VStack>
    </Box>
  );
}; 