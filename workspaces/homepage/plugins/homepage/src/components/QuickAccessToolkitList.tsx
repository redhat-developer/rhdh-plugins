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

import type { ReactNode } from 'react';

import { Link } from '@backstage/core-components';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export interface QuickAccessToolkitTool {
  label: string;
  url: string;
  icon: ReactNode;
}

/**
 * Accessible toolkit link grid for Quick Access sections.
 * Replaces {@link @backstage/plugin-home#HomePageToolkit} content, which renders
 * invalid list markup (`<ul>` with direct `<a>` children).
 */
export const QuickAccessToolkitList = ({
  tools,
}: {
  tools: QuickAccessToolkitTool[];
}) => {
  return (
    <Box
      component="ul"
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        textAlign: 'center',
        listStyle: 'none',
        m: 0,
        p: 0,
      }}
    >
      {tools.map(tool => (
        <Box
          component="li"
          key={tool.url}
          sx={{
            m: theme => theme.spacing(0.5, 1),
          }}
        >
          <Link
            to={tool.url}
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: 1,
                bgcolor: 'background.default',
              }}
            >
              {tool.icon}
            </Box>
            <Typography
              component="span"
              variant="body2"
              sx={{
                mt: 1,
                width: 72,
                fontSize: '0.9em',
                lineHeight: 1.25,
                overflowWrap: 'break-word',
                color: 'text.secondary',
              }}
            >
              {tool.label}
            </Typography>
          </Link>
        </Box>
      ))}
    </Box>
  );
};
