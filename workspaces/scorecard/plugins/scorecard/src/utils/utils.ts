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

import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DangerousOutlinedIcon from '@mui/icons-material/DangerousOutlined';

export type StatusConfig = {
  color: string;
  icon: React.ElementType;
};

/**
 * @param evaluation - The evaluation status of the metric.
 * colors are mapped to MUI palette strings (e.g., 'error.main', 'warning.main', 'success.main').
 * @returns StatusConfig
 */
export const getStatusConfig = (
  evaluation: string | undefined,
): StatusConfig => {
  switch (evaluation) {
    case 'error':
      return { color: 'error.main', icon: DangerousOutlinedIcon };
    case 'warning':
      return { color: 'warning.main', icon: WarningAmberIcon };
    default:
      return { color: 'success.main', icon: CheckCircleOutlineIcon };
  }
};
