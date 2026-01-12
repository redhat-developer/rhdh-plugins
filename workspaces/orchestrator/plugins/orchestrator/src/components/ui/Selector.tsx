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

import { useCallback, useMemo } from 'react';

import { Select, SelectedItems } from '@backstage/core-components';

import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'baseline',
    '& label + div': {
      marginTop: '0px',
    },
  },
  select: {
    width: '10rem',
  },
  label: {
    color: theme.palette.text.primary,
    fontSize: theme.typography.fontSize,
    paddingRight: '0.5rem',
    fontWeight: 'bold',
  },
}));

const ALL_ITEMS = '___all___';

type BackstageSelectProps = Parameters<typeof Select>[0];
export type SelectorProps = Omit<BackstageSelectProps, 'onChange'> & {
  includeAll?: boolean;
  onChange: (item: string) => void;
};

export const Selector = ({
  includeAll = true,
  ...otherProps
}: SelectorProps) => {
  const { classes } = useStyles();

  const selectItems = useMemo(
    () =>
      includeAll
        ? [{ label: 'All', value: ALL_ITEMS }, ...otherProps.items]
        : otherProps.items,
    [includeAll, otherProps.items],
  );

  const handleChange = useCallback(
    (item: SelectedItems) => otherProps.onChange(item as string),
    [otherProps],
  );

  return (
    <div className={classes.root}>
      <Typography className={classes.label}>{otherProps.label}</Typography>
      <div className={classes.select}>
        <Select
          onChange={handleChange}
          items={selectItems}
          selected={otherProps.selected}
          margin="dense"
          label={otherProps.label}
        />
      </div>
    </div>
  );
};
Selector.displayName = 'Selector';
Selector.AllItems = ALL_ITEMS;
