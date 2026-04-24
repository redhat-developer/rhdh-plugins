/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useAppDrawer } from '@red-hat-developer-hub/backstage-plugin-app-react';
import { GlobalHeaderMenuItem } from '@red-hat-developer-hub/backstage-plugin-global-header/alpha';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import CloseIcon from '@material-ui/icons/Close';

export const ChatDrawerContent = () => {
  const { closeDrawer } = useAppDrawer();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
        }}
      >
        <Typography variant="h6">Chat</Typography>
        <IconButton size="small" onClick={() => closeDrawer('demo-chat')}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <List sx={{ flex: 1, overflow: 'auto' }}>
        <ListItem>
          <ListItemText
            primary="Assistant"
            secondary="Hi! How can I help you today?"
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="You"
            secondary="Can you show me how to create a new component?"
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Assistant"
            secondary="Sure! Navigate to the scaffolder and choose a template."
          />
        </ListItem>
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          This is a demo chat drawer.
        </Typography>
      </Box>
    </Box>
  );
};

export const HelpDrawerContent = () => {
  const { closeDrawer } = useAppDrawer();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
        }}
      >
        <Typography variant="h6">Help</Typography>
        <IconButton size="small" onClick={() => closeDrawer('demo-help')}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <List>
        <ListItem>
          <ListItemText
            primary="Getting Started"
            secondary="Learn the basics of the developer portal."
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Software Catalog"
            secondary="Browse and manage your software components."
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Scaffolder"
            secondary="Create new projects from templates."
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="TechDocs"
            secondary="Read technical documentation for your services."
          />
        </ListItem>
      </List>
    </Box>
  );
};

export const HelpDrawerMenuItem = ({
  handleClose,
}: {
  handleClose?: () => void;
}) => {
  const { toggleDrawer } = useAppDrawer();

  const handleClick = () => {
    toggleDrawer('demo-help');
    handleClose?.();
  };

  return (
    <GlobalHeaderMenuItem
      title="Help"
      icon="help_outline"
      onClick={handleClick}
    />
  );
};
