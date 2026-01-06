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
  TooltipProps,
} from 'recharts';
import { PieData } from '../../utils/utils';

interface ResponsivePieChartProps {
  pieData: PieData[];
  isMissingPermission?: boolean;
  LabelContent?: any;
  legendContent: (props: any) => React.ReactNode;
  tooltipContent: (props: TooltipProps<number, string>) => React.ReactNode;
}

export const ResponsivePieChart = ({
  pieData,
  isMissingPermission = false,
  LabelContent,
  legendContent,
  tooltipContent,
}: ResponsivePieChartProps) => {
  return (
    <ResponsiveContainer style={{ outline: 'none' }}>
      <PieChart responsive>
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
          style={{
            outline: 'none',
          }}
          labelLine={false}
          label={isMissingPermission ? <LabelContent /> : undefined}
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
