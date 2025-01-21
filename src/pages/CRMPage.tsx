import { Box, Container, Heading, VStack } from '@chakra-ui/react';
import { TicketList } from '../components/ticket/TicketList';

export const CRMPage = () => {
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg">Tickets</Heading>
        <TicketList />
      </VStack>
    </Container>
  );
}; 