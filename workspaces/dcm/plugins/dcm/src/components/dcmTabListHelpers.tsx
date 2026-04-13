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

import type { Dispatch, SetStateAction } from 'react';
import type { TableColumn } from '@backstage/core-components';
import { Box, IconButton, InputAdornment, TextField } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import CloseIcon from '@material-ui/icons/Close';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import SearchIcon from '@material-ui/icons/Search';

const useStyles = makeStyles({
  filterInput: { minWidth: 200 },
  flexRowTight: { display: 'flex', alignItems: 'center', gap: 4 },
});

type SearchActionClasses = Record<'cardHeaderAction' | 'searchInput', string>;

export function DcmSearchCardAction(
  props: Readonly<{
    value: string;
    setValue: Dispatch<SetStateAction<string>>;
    classes: SearchActionClasses;
  }>,
) {
  const { value, setValue, classes } = props;
  const localClasses = useStyles();
  return (
    <Box className={classes.cardHeaderAction}>
      <TextField
        placeholder="Search"
        variant="standard"
        value={value}
        onChange={e => setValue(e.target.value)}
        className={`${classes.searchInput} ${localClasses.filterInput}`}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                aria-label="Clear search"
                onClick={() => setValue('')}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />
    </Box>
  );
}

type ActionsCellProps = Readonly<{
  onEdit: () => void;
  onDelete: () => void;
}>;

function ActionsCell({ onEdit, onDelete }: ActionsCellProps) {
  const classes = useStyles();
  return (
    <Box className={classes.flexRowTight}>
      <IconButton size="small" aria-label="Edit" onClick={onEdit}>
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" aria-label="Delete" onClick={onDelete}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

export function createEditDeleteColumn<T extends object>(props: {
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
}): TableColumn<T> {
  const { onEdit, onDelete } = props;
  return {
    title: 'Actions',
    field: 'actions',
    sorting: false,
    width: '120px',
    render: data => (
      <ActionsCell
        onEdit={() => onEdit(data)}
        onDelete={() => onDelete(data)}
      />
    ),
  };
}
