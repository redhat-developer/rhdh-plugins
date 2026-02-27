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
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  Legend,
  Tooltip,
  PieLabelRenderProps,
} from 'recharts';
import { PieData } from '../../utils/utils';

interface PieTooltipPayload {
  name?: string;
  value?: number;
  payload?: {
    name: string;
    value: number;
    color?: string;
  };
}

export interface PieLegendItem {
  value?: string;
  color?: string;
}

export interface PieLegendContentProps {
  payload?: readonly PieLegendItem[];
}

interface PieTooltipContentProps {
  active?: boolean;
  coordinate?: { x: number; y: number };
  payload?: readonly PieTooltipPayload[];
  label?: string | number;
}
interface ResponsivePieChartProps {
  pieData: PieData[];
  LabelContent?: (props: PieLabelRenderProps) => React.ReactNode;
  legendContent: (props: PieLegendContentProps) => React.ReactNode;
  tooltipContent: (props: PieTooltipContentProps) => React.ReactNode;
  isErrorState?: boolean;
  setIsInsidePieCircle?: (isInside: boolean) => void;
}

export const ResponsivePieChart = ({
  pieData,
  LabelContent,
  legendContent,
  tooltipContent,
  isErrorState,
  setIsInsidePieCircle,
}: ResponsivePieChartProps) => {
  return (
    <ResponsiveContainer style={{ outline: 'none' }}>
      <PieChart responsive>
        {/* This is the circle that is used to trigger the tooltip */}
        {isErrorState && (
          <g>
            <circle
              cx="30%"
              cy="50%"
              r={90}
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={e => {
                setIsInsidePieCircle?.(true);
                e.stopPropagation?.();
              }}
              onMouseLeave={e => {
                setIsInsidePieCircle?.(false);
                e.stopPropagation();
              }}
            />
          </g>
        )}

        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="30%"
          cy="50%"
          innerRadius="78%"
          outerRadius="90%"
          startAngle={90}
          endAngle={-270}
          stroke="none"
          cursor="pointer"
          isAnimationActive={false}
          labelLine={false}
          label={LabelContent}
          style={{ outline: 'none' }}
          onMouseEnter={() => {
            setIsInsidePieCircle?.(true);
          }}
          onMouseLeave={() => {
            setIsInsidePieCircle?.(false);
          }}
        >
          {pieData.map(category => (
            <Cell key={category.name} fill={category.color} />
          ))}
        </Pie>

        <Legend
          layout="vertical"
          verticalAlign="middle"
          wrapperStyle={{
            position: 'absolute',
            left: '60%',
          }}
          content={legendContent}
        />

        <Tooltip content={tooltipContent} />
      </PieChart>
    </ResponsiveContainer>
  );
};
