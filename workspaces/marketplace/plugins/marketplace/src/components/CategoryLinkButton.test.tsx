/*
 * Copyright The Backstage Authors
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

import type { MouseEvent } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import { CategoryLinkButton } from './CategoryLinkButton';

const renderCategoryLinkButton = (props: {
  categoryName: string;
  to: string;
  onClick?: (event: MouseEvent) => void;
  maxLength?: number;
}) => {
  return render(
    <BrowserRouter>
      <CategoryLinkButton {...props} />
    </BrowserRouter>,
  );
};

describe('CategoryLinkButton', () => {
  describe('Rendering', () => {
    it('should render category name when within default max length', () => {
      renderCategoryLinkButton({
        categoryName: 'Kubernetes',
        to: '/catalog?filter=spec.categories=Kubernetes',
      });

      expect(screen.getByRole('button')).toHaveTextContent('Kubernetes');
    });

    it('should truncate long category names', () => {
      renderCategoryLinkButton({
        categoryName: 'this-is-a-very-long-category-name-that-exceeds-limit',
        to: '/catalog?filter=spec.categories=this-is-a-very-long-category-name-that-exceeds-limit',
      });

      expect(screen.getByRole('button')).toHaveTextContent(
        'this-is-a-very-long-categ...',
      );
    });

    it('should respect custom max length', () => {
      renderCategoryLinkButton({
        categoryName: 'medium-length-category',
        to: '/catalog?filter=spec.categories=medium-length-category',
        maxLength: 10,
      });

      expect(screen.getByRole('button')).toHaveTextContent('medium-len...');
    });

    it('should show tooltip for truncated names', () => {
      renderCategoryLinkButton({
        categoryName: 'this-is-a-very-long-category-name-that-exceeds-limit',
        to: '/catalog?filter=spec.categories=this-is-a-very-long-category-name-that-exceeds-limit',
      });

      // The tooltip should contain the full category name as aria-label
      expect(
        screen.getByLabelText(
          'this-is-a-very-long-category-name-that-exceeds-limit',
        ),
      ).toBeInTheDocument();
    });

    it('should not show tooltip for non-truncated names', () => {
      renderCategoryLinkButton({
        categoryName: 'Kubernetes',
        to: '/catalog?filter=spec.categories=Kubernetes',
      });

      // The tooltip should be empty for non-truncated names (empty aria-label)
      expect(screen.getByLabelText('')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should have correct link target', () => {
      renderCategoryLinkButton({
        categoryName: 'Kubernetes',
        to: '/catalog?filter=spec.categories=Kubernetes',
      });

      const linkButton = screen.getByRole('button').closest('a');
      expect(linkButton).toHaveAttribute(
        'href',
        '/catalog?filter=spec.categories=Kubernetes',
      );
    });
  });

  describe('Click handling', () => {
    it('should call onClick handler when provided', () => {
      const handleClick = jest.fn();
      renderCategoryLinkButton({
        categoryName: 'Kubernetes',
        to: '/catalog?filter=spec.categories=Kubernetes',
        onClick: handleClick,
      });

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should work without onClick handler', () => {
      renderCategoryLinkButton({
        categoryName: 'Kubernetes',
        to: '/catalog?filter=spec.categories=Kubernetes',
      });

      // Should not throw error when clicking without onClick handler
      expect(() => {
        fireEvent.click(screen.getByRole('button'));
      }).not.toThrow();
    });
  });

  describe('Styling and accessibility', () => {
    it('should have proper button variant', () => {
      renderCategoryLinkButton({
        categoryName: 'Kubernetes',
        to: '/catalog?filter=spec.categories=Kubernetes',
      });

      const button = screen.getByRole('button');
      expect(button).toHaveClass('MuiButton-outlined');
    });

    it('should have minimum height container', () => {
      renderCategoryLinkButton({
        categoryName: 'Kubernetes',
        to: '/catalog?filter=spec.categories=Kubernetes',
      });

      const container = screen.getByRole('button').parentElement;
      expect(container).toHaveStyle('min-height: 28px');
    });
  });
});
