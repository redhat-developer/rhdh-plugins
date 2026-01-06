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

import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { CodeEditor } from './CodeEditor';

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
          <CodeEditor defaultLanguage="yaml" onLoaded={onLoad} />
        </CardContent>
      </Card>
    </Grid>
  );
};
