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

import { render, screen } from '@testing-library/react';
import CustomCursor from '../CustomCursor';

describe('CustomCursor Component', () => {
  it('should render without errors when given valid points', () => {
    const mockPoints = [{ x: 150, y: 50 }];
    render(
      <svg>
        <CustomCursor points={mockPoints} />
      </svg>,
    );

    const lineElement = screen.getByTestId('custom-cursor-line');
    expect(lineElement).toBeInTheDocument();
  });

  it('should set correct x1 and x2 values from points[0].x', () => {
    const mockPoints = [{ x: 200, y: 50 }];
    render(
      <svg>
        <CustomCursor points={mockPoints} />
      </svg>,
    );

    const lineElement = screen.getByTestId('custom-cursor-line');
    expect(lineElement).toHaveAttribute('x1', '200');
    expect(lineElement).toHaveAttribute('x2', '200');
  });

  it('should use correct stroke and strokeWidth properties', () => {
    const mockPoints = [{ x: 100, y: 50 }];
    render(
      <svg>
        <CustomCursor points={mockPoints} />
      </svg>,
    );

    const lineElement = screen.getByTestId('custom-cursor-line');
    expect(lineElement).toHaveAttribute('stroke', 'gray');
    expect(lineElement).toHaveAttribute('stroke-width', '1');
  });

  it('should handle missing points prop safely', () => {
    render(
      <svg>
        <CustomCursor points={[]} />
      </svg>,
    );
    expect(screen.queryByTestId('custom-cursor-line')).not.toBeInTheDocument();
  });
});
