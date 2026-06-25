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
import { useState } from 'react';

import { CodeSnippet, Link, WarningPanel } from '@backstage/core-components';

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { useQuickAccessLinks } from '../hooks/useQuickAccessLinks';
import { useTranslation } from '../hooks/useTranslation';
import { QuickAccessIcon } from './QuickAccessIcon';

import type { Tool } from '@backstage/plugin-home';

/** @public */
export interface QuickAccessCardProps {
  title?: string;
  titleKey?: string;
  path?: string;
}

/**
 * Accessible toolkit grid that renders tools inside a proper `<ul>/<li>`
 * structure. Replaces the upstream `HomePageToolkit` which places `<a>`
 * elements directly inside `<ul>`, violating the axe `list` rule.
 */
const QuickAccessToolkit = ({
  title,
  tools,
  expanded = false,
}: {
  title: string;
  tools: Tool[];
  expanded?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);

  return (
    <Accordion
      expanded={isExpanded}
      onChange={(_e, expandedValue) => setIsExpanded(expandedValue)}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <List
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            textAlign: 'center',
            padding: 0,
          }}
        >
          {tools.map(tool => (
            <ListItem
              key={tool.url}
              sx={{ width: 'auto', padding: 0, margin: 0.5 }}
            >
              <Link
                to={tool.url}
                style={{ textDecoration: 'none' }}
                aria-label={tool.label}
              >
                <ListItemIcon
                  sx={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50px',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: 1,
                    bgcolor: 'background.default',
                  }}
                >
                  {tool.icon}
                </ListItemIcon>
                <ListItemText
                  secondaryTypographyProps={{
                    sx: {
                      mt: 1,
                      width: '72px',
                      fontSize: '0.9em',
                      lineHeight: '1.25',
                      overflowWrap: 'break-word',
                      color: 'text.secondary',
                    },
                  }}
                  secondary={tool.label}
                />
              </Link>
            </ListItem>
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );
};

/** @public */
export const QuickAccessCardContent = ({
  path,
}: Pick<QuickAccessCardProps, 'path'>) => {
  const { t } = useTranslation();
  const { data, error, isLoading } = useQuickAccessLinks(path);

  let content: ReactNode;

  if (isLoading) {
    content = (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  } else if (!data) {
    content = (
      <WarningPanel severity="error" title={t('quickAccess.fetchError')}>
        <CodeSnippet
          language="text"
          text={error?.toString() ?? t('quickAccess.error')}
        />
      </WarningPanel>
    );
  } else {
    content = (
      <>
        {data.map(item => (
          <QuickAccessToolkit
            key={item.title}
            title={item.title}
            expanded={item.isExpanded}
            tools={item.links.map(link => ({
              ...link,
              icon: <QuickAccessIcon icon={link.iconUrl} alt={link.label} />,
            }))}
          />
        ))}
      </>
    );
  }

  return content;
};

export { QuickAccessCard } from './legacy/QuickAccessCardLegacy';
