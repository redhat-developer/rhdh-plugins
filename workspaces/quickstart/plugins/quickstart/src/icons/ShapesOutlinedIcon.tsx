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

import SvgIcon from '@mui/material/SvgIcon';
import type { SvgIconProps } from '@mui/material/SvgIcon';

export const ShapesOutlinedIcon = (props: SvgIconProps) => (
  <SvgIcon data-testid="ShapesOutlinedIcon" {...props} viewBox="0 -960 960 960">
    <path d="M600-360Zm-280 98q10 2 19.5 2H360q5.5 0 10.25-.25T380-261v121h440v-440H699q.5-5 .75-9.75T700-600v-20.5q0-9.5-2-19.5h122q24.75 0 42.38 17.62Q880-604.75 880-580v440q0 24.75-17.62 42.37Q844.75-80 820-80H380q-24.75 0-42.37-17.63Q320-115.25 320-140v-122ZM161.5-401.5Q80-483 80-600t81.5-198.5Q243-880 360-880t198.5 81.5Q640-717 640-600t-81.5 198.5Q477-320 360-320t-198.5-81.5Zm354-42.79q64.5-64.29 64.5-155.5T515.71-755.5Q451.42-820 360.21-820T204.5-755.71Q140-691.42 140-600.21t64.29 155.71q64.29 64.5 155.5 64.5t155.71-64.29ZM360-600Z" />
  </SvgIcon>
);
