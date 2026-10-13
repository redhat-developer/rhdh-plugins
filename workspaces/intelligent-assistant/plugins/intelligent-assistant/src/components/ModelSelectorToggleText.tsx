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

import { styled } from '@mui/material/styles';
import { Tooltip } from '@patternfly/react-core';

type ModelSelectorToggleTextProps = {
  label: string;
  /**
   * When the model menu is open, suppress the full-name tooltip. PF Tooltip's
   * default focus trigger leaves the tip visible after the toggle is clicked,
   * and the tip content can sit over the dropdown and block option clicks
   * (Playwright: "subtree intercepts pointer events").
   */
  hideTooltip?: boolean;
};

/**
 * Tooltip needs a single element that can take a ref; keep ellipsis styles on
 * that same node so PF Tooltip cloneElement does not drop the shrink chain.
 */
const ToggleLabel = styled('span')({
  display: 'block',
  flex: '1 1 auto',
  minWidth: 0,
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

/** Full label in the DOM; CSS ellipsis when the parent row is constrained. */
export const ModelSelectorToggleText = ({
  label,
  hideTooltip = false,
}: ModelSelectorToggleTextProps) => {
  const trimmed = label.trim();

  if (hideTooltip) {
    return <ToggleLabel title={trimmed}>{trimmed}</ToggleLabel>;
  }

  return (
    // mouseenter only — focus would re-show the tip when the toggle is
    // activated by keyboard/click even briefly before hideTooltip flips.
    <Tooltip
      content={trimmed}
      position="top"
      trigger="mouseenter"
      exitDelay={0}
    >
      <ToggleLabel>{trimmed}</ToggleLabel>
    </Tooltip>
  );
};
