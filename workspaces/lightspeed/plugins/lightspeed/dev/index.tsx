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
import Typography from '@mui/material/Typography';

import {
  LightspeedChatContainer,
  LightspeedDrawerProvider,
  LightspeedFAB,
  LightspeedPage,
  lightspeedPlugin,
} from '../src/plugin';
import { DrawerComponent } from './DrawerComponent';

const TestPage = () => {
  return (
    <Box
      sx={{
        padding: 4,
        // Adjust content when drawer is open
        'body.docked-drawer-open &': {
          marginRight: 'calc(var(--docked-drawer-width, 500px) + 1.5em)',
          transition: 'margin-right 0.3s ease',
        },
      }}
    >
      <Typography variant="h4" gutterBottom>
        Lightspeed Display Modes Test
      </Typography>
      <Typography variant="body1" paragraph>
        Click the Lightspeed FAB button (bottom right) to open the chatbot.
      </Typography>
      <Typography variant="body2" paragraph>
        <strong>Display Modes:</strong>
      </Typography>
      <ul>
        <li>
          <strong>Overlay (default):</strong> Opens as a modal overlay
        </li>
        <li>
          <strong>Docked:</strong> Opens as a drawer on the right
        </li>
        <li>
          <strong>Fullscreen:</strong> Navigate to /lightspeed route
        </li>
      </ul>
      <Typography variant="body2" color="text.secondary">
        Use the settings dropdown in the chatbot header to switch between
        display modes.
      </Typography>
    </Box>
  );
};

createDevApp()
  .registerPlugin(lightspeedPlugin)
  .addPage({
    element: (
      <LightspeedDrawerProvider>
        <LightspeedFAB />
        <TestPage />
        <DrawerComponent>
          <LightspeedChatContainer />
        </DrawerComponent>
      </LightspeedDrawerProvider>
    ),
    title: 'Test Page',
    path: '/',
  })
  .addPage({
    element: (
      <LightspeedDrawerProvider>
        <LightspeedPage />
      </LightspeedDrawerProvider>
    ),
    title: 'Lightspeed Page',
    path: '/lightspeed',
  })
  .render();
