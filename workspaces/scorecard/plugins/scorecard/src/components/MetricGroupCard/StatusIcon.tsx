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

import { useTheme } from '@mui/material/styles';

import { resolveStatusColor } from '../../utils';
import { ScorecardIcon } from '../ScorecardIcon/ScorecardIcon';

interface StatusIconProps {
  icon: string;
  color: string;
}

export const StatusIcon = ({ icon, color }: StatusIconProps) => {
  const theme = useTheme();
  const resolvedColor = resolveStatusColor(theme, color);

  if (!icon) return null;

  return (
    <ScorecardIcon
      icon={icon}
      size="small"
      sx={{ fontSize: 18, color: resolvedColor }}
    />
  );
};
