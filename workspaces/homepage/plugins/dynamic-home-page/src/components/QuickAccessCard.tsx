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

import React from 'react';

import {
  CodeSnippet,
  InfoCard,
  WarningPanel,
} from '@backstage/core-components';
import { ComponentAccordion, HomePageToolkit } from '@backstage/plugin-home';

import CircularProgress from '@mui/material/CircularProgress';
import { makeStyles } from 'tss-react/mui';

import { useQuickAccessLinks } from '../hooks/useQuickAccessLinks';

const useStyles = makeStyles()({
  center: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: {
    height: '40px',
    width: 'auto',
  },
  title: {
    '& div > div > div > div > p': {
      textTransform: 'uppercase',
    },
  },
});

/**
 * @public
 */
export interface QuickAccessCardProps {
  title?: string;
  path?: string;
}

/**
 * @public
 */
export const QuickAccessCard = (props: QuickAccessCardProps) => {
  const { classes } = useStyles();
  const { data, error, isLoading } = useQuickAccessLinks(props.path);

  let content: React.ReactNode;

  if (isLoading) {
    content = (
      <div className={classes.center}>
        <CircularProgress />
      </div>
    );
  } else if (!data) {
    content = (
      <WarningPanel severity="error" title="Could not fetch data.">
        <CodeSnippet
          language="text"
          text={error?.toString() ?? 'Unknown error'}
        />
      </WarningPanel>
    );
  } else {
    content = (
      <>
        {data.map(item => (
          <HomePageToolkit
            key={item.title}
            title={item.title}
            tools={item.links.map(link => ({
              ...link,
              icon: (
                <img
                  className={classes.img}
                  src={link.iconUrl}
                  alt={link.label}
                />
              ),
            }))}
            // Component creation is allowed inside component props only
            // if prop name starts with `render`.
            // We accept it here since the upstream package use `Renderer` instead.
            Renderer={(
              renderProps, // NOSONAR
            ) => (
              <ComponentAccordion expanded={item.isExpanded} {...renderProps} />
            )}
          />
        ))}
      </>
    );
  }

  return (
    <InfoCard
      title={props.title ?? 'Quick Access'}
      noPadding
      className={classes.title}
    >
      {content}
    </InfoCard>
  );
};
