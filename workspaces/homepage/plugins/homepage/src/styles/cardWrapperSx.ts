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

/** Top-level card in a grid item (not nested inside another card). */
const topLevelCard =
  '& [class*="MuiCard-root"]:not([class*="MuiCard-root"] [class*="MuiCard-root"])';

/**
 * Grid item styles that keep the card title fixed while only the card body scrolls.
 */
export const cardWrapperSx: SxProps<Theme> = {
  height: '100%',
  [topLevelCard]: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  [`${topLevelCard} > [class*="MuiCardHeader-root"]`]: {
    flexShrink: 0,
  },
  [`${topLevelCard} > [class*="MuiCardContent-root"]`]: {
    flex: '1 1 auto',
    minHeight: 0,
    overflow: 'auto',
  },
};
