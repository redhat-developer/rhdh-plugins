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
import Box from '@mui/material/Box';
import SearchIcon from '@mui/icons-material/Search';
import InputBase from '@mui/material/InputBase';

export const SearchComponent = () => {
  return (
    <Box
      sx={{
        position: 'relative',
        paddingTop: '4px',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'start',
        direction: 'ltr',
      }}
    >
      <Box sx={{ pointerEvents: 'none', alignSelf: 'end' }}>
        <SearchIcon />
      </Box>
      <InputBase
        sx={{ padding: '0 0.5rem', color: 'inherit', width: '100%' }}
        placeholder="Search…"
        inputProps={{ 'aria-label': 'search' }}
      />
    </Box>
  );
};
