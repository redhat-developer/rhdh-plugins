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

import { SetStateAction } from 'react';

import { Dispatch } from 'react';
import { PieLabelRenderProps } from 'recharts';
import { TooltipPosition } from './types';

type AverageCardPieCenterLabelProps = PieLabelRenderProps & {
  centerPercentLabel: string;
  arcResolvedColor: string;
  setActiveIndex: Dispatch<SetStateAction<number | null>>;
  setTooltipPosition: Dispatch<SetStateAction<TooltipPosition | null>>;
  updateCenterTooltipPosition: (e: React.MouseEvent<SVGCircleElement>) => void;
  setCenterTooltipPosition: Dispatch<SetStateAction<TooltipPosition | null>>;
};

export function AverageCardPieCenterLabel({
  cx,
  cy,
  index,
  centerPercentLabel,
  arcResolvedColor,
  setActiveIndex,
  setTooltipPosition,
  updateCenterTooltipPosition,
  setCenterTooltipPosition,
}: AverageCardPieCenterLabelProps) {
  if (
    cx === undefined ||
    cx === null ||
    cy === undefined ||
    cy === null ||
    index === undefined ||
    index !== 0
  ) {
    return null;
  }
  const cxNum = Number(cx);
  const cyNum = Number(cy);
  return (
    <g style={{ cursor: 'pointer' }}>
      <circle
        cx={cxNum}
        cy={cyNum}
        r={52}
        fill="transparent"
        stroke="none"
        pointerEvents="all"
        data-testid="average-card-center-percent-hit-area"
        onMouseEnter={e => {
          setActiveIndex(null);
          setTooltipPosition(null);
          updateCenterTooltipPosition(e);
        }}
        onMouseMove={updateCenterTooltipPosition}
        onMouseLeave={() => setCenterTooltipPosition(null)}
      />
      <text
        x={cxNum}
        y={cyNum}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={arcResolvedColor}
        fontSize={24}
        fontWeight={500}
        pointerEvents="none"
        data-testid="average-card-center-percent"
      >
        {centerPercentLabel}
      </text>
    </g>
  );
}
