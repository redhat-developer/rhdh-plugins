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
import React from 'react';

interface useAutoScrollOptions {
  deltaUp?: number;
  deltaDown?: number;
  delay?: number;
}

export const useAutoScroll = (
  containerRef: React.RefObject<HTMLElement>,
  options: useAutoScrollOptions = {},
) => {
  const { deltaUp = 10, deltaDown = 60, delay = 200 } = options;

  const [autoScroll, setAutoScroll] = React.useState(true);
  const lastScrollTop = React.useRef(0);
  const manualScrollInterrupted = React.useRef(false);
  const debounceTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const onScroll = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const currentScrollTop = container.scrollTop;
    const isScrollingDown = currentScrollTop > lastScrollTop.current;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    const delta = isScrollingDown ? deltaDown : deltaUp;
    const isAtBottom = distanceFromBottom <= delta;

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (isAtBottom && manualScrollInterrupted.current && isScrollingDown) {
      debounceTimeout.current = setTimeout(() => {
        manualScrollInterrupted.current = false;
        setAutoScroll(true);
      }, delay);
    }

    if (!isAtBottom && !manualScrollInterrupted.current) {
      manualScrollInterrupted.current = true;
      setAutoScroll(false);
    }

    lastScrollTop.current = currentScrollTop;
  }, [containerRef, deltaUp, deltaDown, delay]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [onScroll, containerRef]);

  const resumeAutoScroll = React.useCallback(() => {
    manualScrollInterrupted.current = false;
    setAutoScroll(true);
  }, []);

  const stopAutoScroll = React.useCallback(() => {
    manualScrollInterrupted.current = true;
    setAutoScroll(false);
  }, []);

  const scrollToTop = React.useCallback(() => {
    stopAutoScroll();
    const container = containerRef.current;
    if (!container) return;

    container.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [stopAutoScroll, containerRef]);

  const scrollToBottom = React.useCallback(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    }
    resumeAutoScroll();
  }, [resumeAutoScroll, containerRef]);

  return {
    autoScroll,
    resumeAutoScroll,
    stopAutoScroll,
    scrollToBottom,
    scrollToTop,
  };
};
