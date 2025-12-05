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

import { useTheme } from '@material-ui/core/styles';

/**
 * Hook that returns the appropriate background color based on the current theme mode.
 * @returns Object with backgroundColor and filterTableBackgroundColor strings
 */
export const useThemeBackgroundColor = (): {
  backgroundColor: string;
  filterTableBackgroundColor: string;
} => {
  const theme = useTheme();
  const isDarkMode = (theme.palette as any).mode === 'dark';

  return {
    backgroundColor: isDarkMode ? '#292929' : '#FFFFFF',
    filterTableBackgroundColor: isDarkMode ? '#262626' : '#F2F2F2',
  };
};
