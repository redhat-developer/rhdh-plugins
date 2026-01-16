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

import { isReasoningInProgress, parseReasoning } from '../reasoningParser';

describe('reasoningParser', () => {
  describe('isReasoningInProgress', () => {
    it('should return false for empty content', () => {
      expect(isReasoningInProgress('')).toBe(false);
    });

    it('should return false when no reasoning tags are present', () => {
      expect(isReasoningInProgress('This is regular content')).toBe(false);
    });

    it('should return false when both opening and closing tags are present', () => {
      expect(
        isReasoningInProgress('<think>Some reasoning</think>Main content'),
      ).toBe(false);
    });

    it('should return true when only opening tag is present', () => {
      expect(isReasoningInProgress('<think>Some reasoning in progress')).toBe(
        true,
      );
    });
  });

  describe('parseReasoning', () => {
    describe('empty or null content', () => {
      it('should return empty result for empty string', () => {
        const result = parseReasoning('');
        expect(result).toEqual({
          reasoning: null,
          mainContent: '',
          hasReasoning: false,
          isReasoningInProgress: false,
        });
      });

      it('should return empty result for null', () => {
        const result = parseReasoning(null as any);
        expect(result).toEqual({
          reasoning: null,
          mainContent: null,
          hasReasoning: false,
          isReasoningInProgress: false,
        });
      });
    });

    describe('content without reasoning tags', () => {
      it('should return content as-is when no reasoning tags present', () => {
        const content = 'This is regular content without any reasoning tags';
        const result = parseReasoning(content);
        expect(result).toEqual({
          reasoning: null,
          mainContent: content,
          hasReasoning: false,
          isReasoningInProgress: false,
        });
      });

      it('should handle content with newlines', () => {
        const content = 'Line 1\nLine 2\nLine 3';
        const result = parseReasoning(content);
        expect(result.mainContent).toBe(content);
        expect(result.hasReasoning).toBe(false);
      });
    });

    describe('complete reasoning blocks', () => {
      it('should extract single reasoning block and clean main content', () => {
        const content =
          '<think>This is the reasoning content</think>This is the main response';
        const result = parseReasoning(content);
        expect(result.reasoning).toBe('This is the reasoning content');
        expect(result.mainContent).toBe('This is the main response');
        expect(result.hasReasoning).toBe(true);
        expect(result.isReasoningInProgress).toBe(false);
      });

      it('should handle multiple reasoning blocks in sequence', () => {
        const content =
          '<think>First reasoning block</think>Some content <think>Second reasoning block</think>More content';
        const result = parseReasoning(content);
        // Should extract the first complete block
        expect(result.reasoning).toBe('First reasoning block');
        expect(result.mainContent).toContain('Some content');
        expect(result.hasReasoning).toBe(true);
      });

      it('should handle reasoning with newlines', () => {
        const content =
          '<think>Line 1\nLine 2\nLine 3</think>Main content here';
        const result = parseReasoning(content);
        expect(result.reasoning).toBe('Line 1\nLine 2\nLine 3');
        expect(result.mainContent).toBe('Main content here');
        expect(result.hasReasoning).toBe(true);
      });

      it('should trim whitespace from reasoning content', () => {
        const content = '<think>  Reasoning with spaces  </think>Main content';
        const result = parseReasoning(content);
        expect(result.reasoning).toBe('Reasoning with spaces');
        expect(result.mainContent).toBe('Main content');
      });

      it('should handle reasoning at the start of content', () => {
        const content = '<think>Reasoning</think>Main content follows';
        const result = parseReasoning(content);
        expect(result.reasoning).toBe('Reasoning');
        expect(result.mainContent).toBe('Main content follows');
      });

      it('should handle reasoning in the middle of content', () => {
        const content = 'Some prefix <think>Reasoning here</think>Some suffix';
        const result = parseReasoning(content);
        expect(result.reasoning).toBe('Reasoning here');
        expect(result.mainContent).toBe('Some prefix Some suffix');
      });

      it('should handle empty reasoning block', () => {
        const content = '<think></think>Main content';
        const result = parseReasoning(content);
        expect(result.reasoning).toBe('');
        expect(result.mainContent).toBe('Main content');
        expect(result.hasReasoning).toBe(true);
      });
    });

    describe('reasoning in progress (streaming)', () => {
      it('should detect reasoning in progress when only opening tag exists', () => {
        const content = '<think>Reasoning that is still streaming';
        const result = parseReasoning(content);
        expect(result.reasoning).toBe(null);
        expect(result.mainContent).toBe('');
        expect(result.hasReasoning).toBe(false);
        expect(result.isReasoningInProgress).toBe(true);
      });

      it('should handle reasoning in progress with content before tag', () => {
        const content = 'Some content <think>Reasoning in progress';
        const result = parseReasoning(content);
        expect(result.reasoning).toBe(null);
        expect(result.mainContent).toBe('');
        expect(result.isReasoningInProgress).toBe(true);
      });

      it('should handle multiline reasoning in progress', () => {
        const content = '<think>Line 1\nLine 2\nLine 3';
        const result = parseReasoning(content);
        expect(result.isReasoningInProgress).toBe(true);
        expect(result.mainContent).toBe('');
      });
    });

    describe('multiple reasoning blocks', () => {
      it('should handle multiple complete reasoning blocks', () => {
        const content =
          '<think>First reasoning</think>Main content <think>Second reasoning</think>More content';
        const result = parseReasoning(content);
        // Should extract the first complete block
        expect(result.reasoning).toBe('First reasoning');
        // Should remove the first block but may leave second if not handled
        expect(result.mainContent).toContain('Main content');
        expect(result.hasReasoning).toBe(true);
      });

      it('should handle reasoning block followed by in-progress reasoning', () => {
        const content =
          '<think>Complete reasoning</think>Main content <think>In progress';
        const result = parseReasoning(content);
        expect(result.reasoning).toBe('Complete reasoning');
        expect(result.mainContent).toContain('Main content');
        expect(result.hasReasoning).toBe(true);
        expect(result.isReasoningInProgress).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle content with similar but not matching tags', () => {
        const content = '<think>Not a tag</think>Regular content';
        const result = parseReasoning(content);
        // Should match since pattern uses </think> as closing tag
        expect(result.hasReasoning).toBe(true);
        expect(result.reasoning).toBe('Not a tag');
      });

      it('should handle reasoning with special characters', () => {
        const content =
          '<think>Reasoning with <tags> and "quotes"</think>Main content';
        const result = parseReasoning(content);
        expect(result.reasoning).toBe('Reasoning with <tags> and "quotes"');
        expect(result.mainContent).toBe('Main content');
      });

      it('should handle very long reasoning content', () => {
        const longReasoning = 'A'.repeat(10000);
        const content = `<think>${longReasoning}</think>Main content`;
        const result = parseReasoning(content);
        expect(result.reasoning).toBe(longReasoning);
        expect(result.mainContent).toBe('Main content');
        expect(result.hasReasoning).toBe(true);
      });

      it('should handle reasoning with markdown formatting', () => {
        const content =
          '<think>**Bold** reasoning with `code` and [links](url)</think>Main content';
        const result = parseReasoning(content);
        expect(result.reasoning).toContain('**Bold**');
        expect(result.reasoning).toContain('`code`');
        expect(result.mainContent).toBe('Main content');
      });
    });

    describe('integration with tool calling scenarios', () => {
      it('should extract reasoning when tool calling is present', () => {
        const content =
          '<think>Thinking about which tool to use</think>Here is the response with tool results';
        const result = parseReasoning(content);
        expect(result.reasoning).toBe('Thinking about which tool to use');
        expect(result.mainContent).toBe(
          'Here is the response with tool results',
        );
        expect(result.hasReasoning).toBe(true);
      });

      it('should handle reasoning during tool execution', () => {
        const content = '<think>Tool is executing, waiting for results';
        const result = parseReasoning(content);
        expect(result.isReasoningInProgress).toBe(true);
        expect(result.mainContent).toBe('');
      });

      it('should clean reasoning tags from main content when tool calling present', () => {
        const content =
          '<think>Reasoning</think>Tool response: Success\nMain content here';
        const result = parseReasoning(content);
        expect(result.reasoning).toBe('Reasoning');
        expect(result.mainContent).toBe(
          'Tool response: Success\nMain content here',
        );
        expect(result.mainContent).not.toContain('<think>');
        expect(result.mainContent).not.toContain('</think>');
      });
    });
  });
});
