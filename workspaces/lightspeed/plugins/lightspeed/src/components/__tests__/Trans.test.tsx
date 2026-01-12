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

import { render, screen } from '@testing-library/react';

import { Trans } from '../Trans';

// Mock the useTranslation hook
jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      // Mock translation function that handles basic interpolation
      let message = key;
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          message = message.replace(`{{${paramKey}}}`, String(paramValue));
        });
      }
      return message;
    },
  }),
}));

describe('Trans Component', () => {
  describe('Basic Text Rendering', () => {
    it('should render simple text without components', () => {
      render(<Trans message="simple.message" />);
      expect(screen.getByText('simple.message')).toBeInTheDocument();
    });

    it('should render text with parameters', () => {
      render(<Trans message="welcome.message" params={{ userName: 'John' }} />);
      expect(screen.getByText('welcome.message')).toBeInTheDocument();
    });
  });

  describe('Component Replacement', () => {
    it('should replace HTML placeholders with React components', () => {
      render(
        <Trans
          message="Click <b>here</b> to continue"
          components={{
            '<b>here</b>': <b>here</b>,
          }}
        />,
      );

      // Should render the bold text
      const boldElement = screen.getByText('here');
      expect(boldElement).toBeInTheDocument();
      expect(boldElement.tagName).toBe('B');
    });

    it('should handle multiple component replacements', () => {
      render(
        <Trans
          message="Welcome <b>John</b>! You have <span>5</span> messages."
          components={{
            '<b>John</b>': <b>John</b>,
            '<span>5</span>': <span>5</span>,
          }}
        />,
      );

      // Should render both components
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('John').tagName).toBe('B');
      expect(screen.getByText('5').tagName).toBe('SPAN');
    });

    it('should handle complex HTML tags', () => {
      render(
        <Trans
          message="<strong>Important</strong>: <em>Please read</em> this notice."
          components={{
            '<strong>Important</strong>': <strong>Important</strong>,
            '<em>Please read</em>': <em>Please read</em>,
          }}
        />,
      );

      expect(screen.getByText('Important')).toBeInTheDocument();
      expect(screen.getByText('Please read')).toBeInTheDocument();
      expect(screen.getByText('Important').tagName).toBe('STRONG');
      expect(screen.getByText('Please read').tagName).toBe('EM');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty components object', () => {
      render(<Trans message="Simple message" components={{}} />);
      expect(screen.getByText('Simple message')).toBeInTheDocument();
    });

    it('should handle undefined components', () => {
      render(<Trans message="Simple message" components={undefined} />);
      expect(screen.getByText('Simple message')).toBeInTheDocument();
    });

    it('should handle empty message', () => {
      const { container } = render(<Trans message="" />);
      // Empty message should render nothing (empty fragment)
      expect(container.innerHTML).toBe('');
    });

    it('should handle message with no placeholders', () => {
      render(
        <Trans
          message="No placeholders here"
          components={{
            '<b>test</b>': <b>test</b>,
          }}
        />,
      );
      expect(screen.getByText('No placeholders here')).toBeInTheDocument();
    });
  });

  describe('Lightspeed Usage Example', () => {
    it('should handle permission description formatting', () => {
      render(
        <Trans
          message="To view lightspeed plugin, contact your administrator to give the <b>lightspeed.chat.read</b> and <b>lightspeed.chat.create</b> permissions."
          components={{
            '<b>lightspeed.chat.read</b>': <b>lightspeed.chat.read</b>,
            '<b>lightspeed.chat.create</b>': <b>lightspeed.chat.create</b>,
          }}
        />,
      );

      // Should render the full message with bold permission names
      expect(screen.getByText(/To view lightspeed plugin/)).toBeInTheDocument();
      expect(screen.getByText('lightspeed.chat.read')).toBeInTheDocument();
      expect(screen.getByText('lightspeed.chat.create')).toBeInTheDocument();

      // Check that permission names are bold
      expect(screen.getByText('lightspeed.chat.read').tagName).toBe('B');
      expect(screen.getByText('lightspeed.chat.create').tagName).toBe('B');
    });
  });

  describe('Parameter Interpolation', () => {
    it('should handle parameters with component replacement', () => {
      render(
        <Trans
          message="Hello {{userName}}, click <b>here</b> to continue"
          params={{ userName: 'Alice' }}
          components={{
            '<b>here</b>': <b>here</b>,
          }}
        />,
      );

      // Should render the interpolated text
      expect(screen.getByText(/Hello Alice/)).toBeInTheDocument();
      expect(screen.getByText('here').tagName).toBe('B');
    });
  });
});
