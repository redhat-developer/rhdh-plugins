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

import type { SelectProps } from '@mui/material/Select';

/**
 * Shared MenuProps for all MUI `<Select>` components in the admin UI.
 *
 * Backstage host applications may ship global CSS that overrides `ul`/`li`
 * display properties inside MUI Popovers, causing menu items to render
 * horizontally instead of vertically. These styles provide CSS isolation
 * by explicitly setting flex layout on the menu list and its items.
 *
 * Apply via `<Select MenuProps={SELECT_MENU_PROPS} ...>`.
 */
export const SELECT_MENU_PROPS: SelectProps['MenuProps'] = {
  PaperProps: {
    sx: {
      '& .MuiList-root': {
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      },
      '& .MuiMenuItem-root': {
        display: 'flex',
        boxSizing: 'border-box',
      },
    },
  },
};
