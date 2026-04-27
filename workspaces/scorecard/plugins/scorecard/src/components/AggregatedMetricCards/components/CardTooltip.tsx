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

import {
  CustomTooltip,
  type CustomTooltipPayload,
} from '../../ScorecardHomepageSection/CustomTooltip';
import Box from '@mui/material/Box';
import Portal from '@mui/material/Portal';
import type { PieData } from '../../types';
import { TooltipPosition } from '../AverageCard/types';

type CardTooltipProps = {
  tooltipPosition: TooltipPosition;
  pieData: PieData[];
  payload: CustomTooltipPayload[];
  customContent?: string | React.ReactNode;
};

export const CardTooltip = ({
  tooltipPosition,
  pieData,
  payload,
  customContent,
}: CardTooltipProps) => {
  return (
    <Portal>
      <Box
        sx={{
          position: 'fixed',
          left: `${tooltipPosition.left}px`,
          top: `${tooltipPosition.top}px`,
          transform: 'translate(-50%, -100%)',
          zIndex: theme => theme.zIndex.tooltip,
          pointerEvents: 'none',
        }}
      >
        <CustomTooltip
          payload={payload}
          pieData={pieData}
          customContent={customContent}
        />
      </Box>
    </Portal>
  );
};
