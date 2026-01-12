/*
 * Copyright The Backstage Authors
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

import { lazy, Suspense } from 'react';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { Progress } from '@backstage/core-components';

// Lazy load CodeEditor to avoid loading Monaco Editor until needed
const CodeEditor = lazy(() =>
  import('./CodeEditor').then(module => ({ default: module.CodeEditor })),
);

export const CodeEditorCard = ({ onLoad }: { onLoad: () => void }) => {
  return (
    <Grid
      item
      xs={12}
      md={6.5}
      sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <Card
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 0,
        }}
      >
        <CardContent
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            scrollbarWidth: 'thin',
          }}
        >
          <Suspense
            fallback={
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'start',
                  justifyContent: 'center',
                }}
              >
                <div style={{ width: '100%', height: '100px' }}>
                  <Progress />
                </div>
              </div>
            }
          >
            <CodeEditor defaultLanguage="yaml" onLoaded={onLoad} />
          </Suspense>
        </CardContent>
      </Card>
    </Grid>
  );
};
