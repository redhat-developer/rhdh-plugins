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

import { MarkdownContent } from '@backstage/core-components';

import { makeStyles } from 'tss-react/mui';

/**
 * @public
 */
export interface MarkdownProps {
  title?: string;
  content?: string;
}

const useStyles = makeStyles()({
  // Make card content scrollable (so that cards don't overlap)
  card: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
  },
  content: {
    overflow: 'auto',
  },
});

/**
 * @public
 */
export const Markdown = (props: MarkdownProps) => {
  const { classes } = useStyles();
  return (
    <div className={classes.card}>
      {props.title ? <h1>{props.title}</h1> : null}
      <MarkdownContent
        dialect="gfm"
        content={props.content ?? ''}
        className={classes.content}
      />
    </div>
  );
};
