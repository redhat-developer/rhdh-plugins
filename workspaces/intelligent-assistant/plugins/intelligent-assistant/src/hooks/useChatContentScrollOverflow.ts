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

import { DependencyList, RefObject, useEffect, useState } from 'react';

/**
 * Tracks whether the chat message scroll region overflows (for PF jump buttons).
 * Observes the outer scroll container and inner `.pf-chatbot__messagebox` when it owns scroll.
 */
export const useChatContentScrollOverflow = (
  scrollContainerRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  deps: DependencyList,
): boolean => {
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setHasOverflow(false);
      return undefined;
    }

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      setHasOverflow(false);
      return undefined;
    }

    const getMessageBox = () =>
      scrollContainer.querySelector(
        '.pf-chatbot__messagebox',
      ) as HTMLElement | null;

    const messageBoxOwnsScroll = (messageBox: HTMLElement | null) => {
      if (!messageBox || typeof window === 'undefined') {
        return false;
      }
      const overflowY = window.getComputedStyle(messageBox).overflowY;
      return (
        overflowY === 'auto' ||
        overflowY === 'scroll' ||
        overflowY === 'overlay'
      );
    };

    const getScrollTarget = () => {
      const messageBox = getMessageBox();
      return messageBoxOwnsScroll(messageBox) ? messageBox! : scrollContainer;
    };

    let observedScrollTarget: HTMLElement | null = getScrollTarget();
    let rafId: number | null = null;
    let updateScheduled = false;

    const updateOverflow = () => {
      const scrollTarget = observedScrollTarget ?? scrollContainer;
      setHasOverflow(scrollTarget.scrollHeight > scrollTarget.clientHeight + 1);
    };

    const scheduleOverflowUpdate = () => {
      if (updateScheduled) {
        return;
      }
      updateScheduled = true;
      if (typeof requestAnimationFrame !== 'undefined') {
        rafId = requestAnimationFrame(() => {
          updateScheduled = false;
          updateOverflow();
        });
      } else {
        updateScheduled = false;
        updateOverflow();
      }
    };

    scheduleOverflowUpdate();

    scrollContainer.addEventListener('scroll', scheduleOverflowUpdate, {
      passive: true,
      capture: true,
    });

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => scheduleOverflowUpdate())
        : undefined;
    resizeObserver?.observe(scrollContainer);
    if (observedScrollTarget !== scrollContainer) {
      resizeObserver?.observe(observedScrollTarget);
    }

    const syncObservedScrollTarget = () => {
      const nextScrollTarget = getScrollTarget();
      if (nextScrollTarget === observedScrollTarget) {
        return;
      }
      if (observedScrollTarget && observedScrollTarget !== scrollContainer) {
        resizeObserver?.unobserve(observedScrollTarget);
      }
      if (nextScrollTarget !== scrollContainer) {
        resizeObserver?.observe(nextScrollTarget);
      }
      observedScrollTarget = nextScrollTarget;
    };

    const mutationObserver =
      typeof MutationObserver !== 'undefined'
        ? new MutationObserver(() => {
            syncObservedScrollTarget();
            scheduleOverflowUpdate();
          })
        : undefined;
    mutationObserver?.observe(scrollContainer, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateOverflow);
    }

    return () => {
      if (rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(rafId);
      }
      scrollContainer.removeEventListener(
        'scroll',
        scheduleOverflowUpdate,
        true,
      );
      if (observedScrollTarget && observedScrollTarget !== scrollContainer) {
        resizeObserver?.unobserve(observedScrollTarget);
      }
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateOverflow);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies content deps
  }, [enabled, scrollContainerRef, ...deps]);

  return hasOverflow;
};
