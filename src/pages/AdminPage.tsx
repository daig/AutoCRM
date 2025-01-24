import {
  Box,
  Container,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react';
import { TagManagement } from '../components/admin/TagManagement';
import { MetadataManagement } from '../components/admin/MetadataManagement';
import { TeamManagement } from '../components/admin/TeamManagement';
import { UserManagement } from '../components/admin/UserManagement';

export const AdminPage = () => {
  return (
    <Box>
      <Container maxW="container.xl">
        <Heading mb={6}>Administration</Heading>
        <Tabs>
          <TabList>
            <Tab>Tags</Tab>
            <Tab>Metadata Fields</Tab>
            <Tab>Teams</Tab>
            <Tab>Users</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <TagManagement />
            </TabPanel>
            <TabPanel>
              <MetadataManagement />
            </TabPanel>
            <TabPanel>
              <TeamManagement />
            </TabPanel>
            <TabPanel>
              <UserManagement />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Box>
  );
}; 