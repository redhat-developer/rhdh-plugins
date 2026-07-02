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

import { CodeSnippet, WarningPanel } from '@backstage/core-components';
import { ComponentAccordion } from '@backstage/plugin-home';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { useQuickAccessLinks } from '../hooks/useQuickAccessLinks';
import { useTranslation } from '../hooks/useTranslation';
import { QuickAccessIcon } from './QuickAccessIcon';
import { QuickAccessToolkitList } from './QuickAccessToolkitList';

/** @public */
export interface QuickAccessCardProps {
  title?: string;
  titleKey?: string;
  path?: string;
}

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
        {data.map(item => {
          const tools = item.links.map(link => ({
            label: link.label,
            url: link.url,
            icon: <QuickAccessIcon icon={link.iconUrl} alt={link.label} />,
          }));

          return (
            <ComponentAccordion
              key={item.title}
              title={item.title}
              expanded={item.isExpanded}
              Content={() => <QuickAccessToolkitList tools={tools} />}
            />
          );
        })}
      </>
    );
  }

  return content;
};

export { QuickAccessCard } from './legacy/QuickAccessCardLegacy';
