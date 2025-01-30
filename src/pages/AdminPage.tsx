import React, { useRef } from 'react';
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
import { TicketManagement } from '../components/admin/TicketManagement';
import { PowerManagement } from '../components/admin/PowerManagement';

const AdminPage: React.FC = () => {
  const userManagementRef = useRef<{ refreshUsers: () => void } | null>(null);
  const ticketManagementRef = useRef<{ handleTeamsChange: () => void } | null>(null);

  const handleTeamMembershipChange = () => {
    userManagementRef.current?.refreshUsers();
  };

  const handleTeamsChange = () => {
    ticketManagementRef.current?.handleTeamsChange();
  };

  return (
    <Box p={6}>
      <Tabs>
        <TabList>
          <Tab>Users</Tab>
          <Tab>Teams</Tab>
          <Tab>Tickets</Tab>
          <Tab>Tags</Tab>
          <Tab>Metadata Fields</Tab>
          <Tab>AI Power Tools</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <UserManagement ref={userManagementRef} />
          </TabPanel>
          <TabPanel>
            <TeamManagement 
              onTeamMembershipChange={handleTeamMembershipChange}
              onTeamsChange={handleTeamsChange}
            />
          </TabPanel>
          <TabPanel>
            <TicketManagement ref={ticketManagementRef} />
          </TabPanel>
          <TabPanel>
            <TagManagement />
          </TabPanel>
          <TabPanel>
            <MetadataFieldManagement />
          </TabPanel>
          <TabPanel>
            <PowerManagement />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default AdminPage; 