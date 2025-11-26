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

import { createDevApp } from '@backstage/dev-utils';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import {
  TestDrawerContent,
  testDrawerPlugin,
  TestDrawerProvider,
  useTestDrawerContext,
} from '../src';
import { DrawerComponent } from '../src/components';

const TestPage = () => {
  const { toggleDrawer, isDrawerOpen, drawerWidth } = useTestDrawerContext();

  return (
    <Box
      component="main"
      sx={{
        p: 4,
        marginRight: isDrawerOpen ? `${drawerWidth}px` : 0,
        transition: 'margin-right 0.3s ease',
      }}
    >
      <Typography variant="h4" gutterBottom>
        Test Drawer Plugin
      </Typography>

      <Typography variant="body1" paragraph>
        This page demonstrates the Test Drawer plugin functionality.
      </Typography>

      <Box sx={{ gap: 2, mb: 3 }}>
        <Button variant="outlined" onClick={toggleDrawer}>
          Toggle Drawer
        </Button>
      </Box>

      <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="subtitle2">Drawer State:</Typography>
        <Typography variant="body2">
          Is Open: <strong>{isDrawerOpen ? 'Yes' : 'No'}</strong>
        </Typography>
        <Typography variant="body2">
          Width: <strong>{drawerWidth}px</strong>
        </Typography>
      </Box>
    </Box>
  );
};

const DevPage = () => (
  <TestDrawerProvider>
    <TestPage />
    <DrawerComponent>
      <TestDrawerContent />
    </DrawerComponent>
  </TestDrawerProvider>
);

createDevApp()
  .registerPlugin(testDrawerPlugin)
  .addPage({
    element: <DevPage />,
    title: 'Test Drawer',
    path: '/test-drawer',
  })
  .render();
