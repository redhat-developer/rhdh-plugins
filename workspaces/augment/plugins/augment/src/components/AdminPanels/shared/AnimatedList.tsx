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

import { Children, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import { animations, staggerDelay, reducedMotion } from '../../../theme/tokens';

interface AnimatedListProps {
  children: ReactNode;
  /** Base delay between items in ms (default 50) */
  baseDelay?: number;
  /** Animation variant (default fadeSlideIn) */
  variant?: 'fadeSlideIn' | 'fadeInUp' | 'scaleIn';
}

/**
 * Wraps each child with a staggered entrance animation.
 * Respects `prefers-reduced-motion`.
 */
export function AnimatedList({
  children,
  baseDelay = 50,
  variant = 'fadeSlideIn',
}: AnimatedListProps) {
  const keyframes =
    variant === 'fadeInUp'
      ? animations.fadeInUp
      : variant === 'scaleIn'
        ? { '@keyframes augmentScaleIn': { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } }, animation: 'augmentScaleIn 0.25s ease-out' }
        : animations.fadeSlideIn;

  return (
    <>
      {Children.map(children, (child, index) => {
        if (!child) return null;
        return (
          <Box
            key={index}
            sx={{
              ...keyframes,
              animationDelay: staggerDelay(index, baseDelay),
              animationFillMode: 'both',
              '@media (prefers-reduced-motion: reduce)': reducedMotion,
            }}
          >
            {child}
          </Box>
        );
      })}
    </>
  );
}
