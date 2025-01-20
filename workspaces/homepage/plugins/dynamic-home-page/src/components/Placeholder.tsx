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

import { makeStyles } from 'tss-react/mui';

/**
 * @public
 */
export interface PlaceholderProps {
  showBorder?: boolean;
  debugContent?: string;
}

const useStyles = makeStyles()({
  centerDebugContent: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Make card content scrollable (so that cards don't overlap)
  showBorder: {
    border: '1px solid gray',
    width: '100%',
    height: '100%',
  },
});

/**
 * @public
 */
export const Placeholder = (props: PlaceholderProps) => {
  const { classes } = useStyles();
  const className = [
    props.debugContent ? classes.centerDebugContent : undefined,
    props.showBorder ? classes.showBorder : undefined,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div data-testid="placeholder" className={className}>
      {props.debugContent}
    </div>
  );
};
