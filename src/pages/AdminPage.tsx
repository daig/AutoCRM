import React from 'react';
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { TagManagement } from '../components/admin/TagManagement';
import { MetadataFieldManagement } from '../components/admin/MetadataFieldManagement';
import { TeamManagement } from '../components/admin/TeamManagement';
import { UserManagement } from '../components/admin/UserManagement';

const AdminPage: React.FC = () => {
  return (
    <Box p={6}>
      <Tabs>
        <TabList>
          <Tab>Users</Tab>
          <Tab>Teams</Tab>
          <Tab>Tags</Tab>
          <Tab>Metadata Fields</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <UserManagement />
          </TabPanel>
          <TabPanel>
            <TeamManagement />
          </TabPanel>
          <TabPanel>
            <TagManagement />
          </TabPanel>
          <TabPanel>
            <MetadataFieldManagement />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default AdminPage; 