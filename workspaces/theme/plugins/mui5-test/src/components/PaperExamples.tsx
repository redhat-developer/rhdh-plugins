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

import Paper from '@mui/material/Paper';

export const PaperExamples = () => {
  // elevations from 0 to 24
  const elevations = Array.from({ length: 25 }, (_, i) => i);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      {elevations.map(elevation => (
        <div key={elevation} style={{ margin: '20px' }}>
          <Paper elevation={elevation}>
            <div
              style={{
                display: 'flex',
                width: '200px',
                height: '200px',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              e={elevation}
            </div>
          </Paper>
        </div>
      ))}
    </div>
  );
};
