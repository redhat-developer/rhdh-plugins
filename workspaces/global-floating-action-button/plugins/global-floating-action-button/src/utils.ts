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
  FloatingActionButton,
  FloatingActionButtonWithPositions,
  Slot,
} from './types';

export const evaluateFloatingButtonsWithPositions = (
  floatingButtons: FloatingActionButton[],
): FloatingActionButtonWithPositions =>
  floatingButtons.reduce(
    (acc: FloatingActionButtonWithPositions, fb: FloatingActionButton) => {
      const slot =
        fb.slot && Object.values(Slot).includes(fb.slot)
          ? fb.slot
          : Slot.PAGE_END;
      const slotWithActions = acc.find(a => a.slot === slot);
      if (slotWithActions) {
        slotWithActions.actions.push({ ...fb, slot });
      } else {
        acc.push({
          slot,
          actions: [{ ...fb, slot }],
        });
      }
      return acc;
    },
    [],
  );

export const sortButtonsWithPriority = (
  floatingButtons: FloatingActionButton[],
) => {
  const buttons = [...floatingButtons];
  return buttons.sort((fb1, fb2) => {
    if ((fb2.priority || 0) > (fb1.priority || 0)) {
      return 1;
    }
    if ((fb2.priority || 0) < (fb1.priority || 0)) {
      return -1;
    }
    return 0;
  });
};

export const filterAndSortButtons = (
  floatingButtons: FloatingActionButton[],
  pathname: string,
) => {
  const filteredButtons = floatingButtons.filter(fb => {
    if (fb.excludeOnPaths?.includes(pathname)) {
      return false;
    }
    if (fb.visibleOnPaths && fb.visibleOnPaths.length > 0) {
      if (fb.visibleOnPaths?.includes(pathname)) {
        return true;
      }
      return false;
    }
    return true;
  });
  const sortedButtons = sortButtonsWithPriority(filteredButtons);
  return sortedButtons;
};

type SlotOption = {
  tooltipDirection: 'left' | 'right';
  textAlign: 'left' | 'right';
  margin: { ml?: number; mr?: number };
};

const slotOptions: Record<Slot, SlotOption> = {
  [Slot.BOTTOM_LEFT]: {
    tooltipDirection: 'right',
    textAlign: 'left',
    margin: { ml: 1 },
  },
  [Slot.PAGE_END]: {
    tooltipDirection: 'left',
    textAlign: 'right',
    margin: { mr: 1 },
  },
};

/** Get some layout options for a slot. Automatically fallbacks to PAGE_END */
export const getSlotOptions = (slot: Slot | undefined) =>
  slotOptions[slot ?? Slot.PAGE_END] ?? slotOptions[Slot.PAGE_END];
