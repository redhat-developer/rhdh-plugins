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

import { useEffect, type RefObject } from 'react';

/**
 * Closes an open menu when the user presses outside of `rootRef` and outside
 * any portaled PatternFly menu. Uses capture-phase pointerdown so chat modal /
 * overflow containers cannot swallow the event the way a bubble-phase `click`
 * on `window` can.
 */
export function useCloseOnOutsidePointerDown(
  isOpen: boolean,
  onClose: () => void,
  rootRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (rootRef.current?.contains(target)) {
        return;
      }
      if (
        target instanceof Element &&
        target.closest('.pf-v6-c-menu, .pf-v5-c-menu')
      ) {
        return;
      }
      onClose();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [isOpen, onClose, rootRef]);
}
