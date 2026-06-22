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

import type { SxProps, Theme } from '@mui/material/styles';

/** Legacy section card shell used outside NFS CardExtension. */
export const sectionCardSx: SxProps<Theme> = {
  padding: '24px',
  border: theme => `1px solid ${theme.palette.grey[300]}`,
  containerType: 'inline-size',
  display: 'flex',
  flexDirection: 'column',
};

export const sectionTitleSx = {
  display: 'flex',
  alignItems: 'center',
  fontWeight: '500',
  fontSize: '1.5rem',
  flexShrink: 0,
};

/** Scrollable body region inside legacy section cards. */
export const sectionScrollSx = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  mt: 1,
};

/** Enables @container breakpoints for section grids inside NFS CardExtension. */
export const sectionContentContainerSx: SxProps<Theme> = {
  containerType: 'inline-size',
};
