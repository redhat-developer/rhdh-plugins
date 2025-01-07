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
import useDebounce from 'react-use/lib/useDebounce';

import {
  FormControl,
  IconButton,
  Input,
  InputAdornment,
  makeStyles,
  Toolbar,
} from '@material-ui/core';
import Clear from '@material-ui/icons/Clear';
import Search from '@material-ui/icons/Search';

import { ImageStreamMetadata } from '../../types';

const useStyles = makeStyles(_theme => ({
  searchToolbar: {
    paddingLeft: 0,
    paddingRight: 0,
  },
  input: {},
}));

type OcirImageSearchBarProps = {
  imageStreams: ImageStreamMetadata[];
  setImageStreams: React.Dispatch<
    React.SetStateAction<ImageStreamMetadata[] | undefined>
  >;
};

export const OcirImageSearchBar = ({
  imageStreams,
  setImageStreams,
}: OcirImageSearchBarProps) => {
  const classes = useStyles();

  const [search, setSearch] = React.useState<string>('');

  const searchByName = () => {
    const filteredImageStreams = imageStreams
      ? imageStreams.filter((imgSt: ImageStreamMetadata) => {
          const s = search.toLocaleUpperCase('en-US');
          const { name, description = '', tags } = imgSt;
          const n = name.toLocaleUpperCase('en-US');
          const d = description.toLocaleUpperCase('en-US');
          return (
            n.includes(s) ||
            d.includes(s) ||
            !!tags.find(t => t.toLocaleUpperCase('en-US').includes(s))
          );
        })
      : undefined;
    setImageStreams(filteredImageStreams);
  };

  useDebounce(
    () => {
      searchByName();
    },
    100,
    [search],
  );

  return (
    <Toolbar className={classes.searchToolbar}>
      <FormControl>
        <Input
          aria-label="search"
          className={classes.input}
          placeholder="Search"
          autoComplete="off"
          onChange={event => setSearch(event.target.value)}
          value={search}
          startAdornment={
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          }
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                aria-label="clear search"
                onClick={() => setSearch('')}
                edge="end"
                disabled={search.length === 0}
              >
                <Clear />
              </IconButton>
            </InputAdornment>
          }
        />
      </FormControl>
    </Toolbar>
  );
};
