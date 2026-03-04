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

import MuiTooltip from '@mui/material/Tooltip';

export const ErrorTooltip = ({
  title,
  tooltipPosition,
}: {
  title: string | undefined;
  tooltipPosition: { x: number; y: number } | undefined;
}) => {
  if (!title || !tooltipPosition) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: tooltipPosition?.x,
        top: tooltipPosition?.y,
      }}
    >
      <MuiTooltip open title={title} placement="bottom" arrow>
        {/* Anchor for tooltip so it appears under the pie chart */}
        <div style={{ visibility: 'hidden' }}>Tooltip</div>
      </MuiTooltip>
    </div>
  );
};
