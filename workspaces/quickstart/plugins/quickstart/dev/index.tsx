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
import { quickstartPlugin, QuickstartDrawerProvider } from '../src/plugin';
import { useQuickstartDrawerContext } from '../src/hooks/useQuickstartDrawerContext';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import { getAllThemes } from '@red-hat-developer-hub/backstage-plugin-theme';

const QuickstartTestPageContent = () => {
  const { openDrawer, closeDrawer, isDrawerOpen } =
    useQuickstartDrawerContext();

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h3" gutterBottom>
        Quickstart Plugin Test Page
      </Typography>

      <Typography variant="body1" paragraph>
        This is a test page for the Quickstart plugin. Use the buttons below to
        interact with the quickstart drawer.
      </Typography>

      <Card sx={{ maxWidth: 600, marginBottom: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Drawer Controls
          </Typography>

          <Typography variant="body2" color="text.secondary" paragraph>
            Current drawer state: {isDrawerOpen ? 'Open' : 'Closed'}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={openDrawer}
              disabled={isDrawerOpen}
            >
              Open Quickstart Guide
            </Button>

            <Button
              variant="outlined"
              onClick={closeDrawer}
              disabled={!isDrawerOpen}
            >
              Close Drawer
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ maxWidth: 600 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Instructions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            1. Click "Open Quickstart Guide" to open the drawer
            <br />
            2. Navigate through the quickstart steps
            <br />
            3. Test the progress tracking by completing steps
            <br />
            4. The drawer can be closed using the close button or the drawer's
            own controls
            <br />
            5. Progress is automatically saved to localStorage
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

const QuickstartTestPage = () => (
  <QuickstartDrawerProvider>
    <QuickstartTestPageContent />
  </QuickstartDrawerProvider>
);

createDevApp()
  .registerPlugin(quickstartPlugin)
  .addThemes(getAllThemes())
  .addPage({
    element: <QuickstartTestPage />,
    title: 'Quickstart Test',
    path: '/quickstart',
  })
  .render();
