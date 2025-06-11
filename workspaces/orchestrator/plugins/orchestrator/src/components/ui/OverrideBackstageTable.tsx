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
  Table as BackstageTable,
  TableProps,
} from '@backstage/core-components';

import { makeStyles } from 'tss-react/mui';

// Workaround by issue created from overriding the tab theme in the backstage-showcase to add a gray background to disabled tabs.
// This is achieved by overriding the global Mui-disabled class, which results in the actions column header background turning gray.
// See https://github.com/janus-idp/backstage-showcase/blob/main/packages/app/src/themes/componentOverrides.ts#L59

const useStyles = makeStyles()(() => ({
  orchestratorTable: {
    '& .Mui-disabled': {
      backgroundColor: 'transparent',
    },
  },
  orchestratorTableWithOutline: {
    '& .Mui-disabled': {
      backgroundColor: 'transparent',
    },
    '& [class^=MuiPaper]': {
      outline: 'unset',
    },
  },
}));

const OverrideBackstageTable = <T extends object>(
  props: TableProps<T> & { removeOutline?: boolean },
) => {
  const removeOutline = props.removeOutline ?? false;
  const { classes } = useStyles();
  return (
    <div
      className={
        removeOutline
          ? classes.orchestratorTable
          : classes.orchestratorTableWithOutline
      }
    >
      <BackstageTable
        {...props}
        options={{ ...props.options, thirdSortClick: false }}
      />
    </div>
  );
};

export default OverrideBackstageTable;
