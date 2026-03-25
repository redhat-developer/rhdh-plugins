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

import { sanitizeResponseText, stripWrappingCodeFences } from './sanitize';

describe('sanitizeResponseText', () => {
  it('should return empty string for empty input', () => {
    expect(sanitizeResponseText('')).toBe('');
  });

  it('should return empty string for undefined/null inputs', () => {
    // @ts-ignore testing runtime behavior with invalid input
    expect(sanitizeResponseText(undefined)).toBe('');
    // @ts-ignore testing runtime behavior with invalid input
    expect(sanitizeResponseText(null)).toBe('');
  });

  it('should remove file reference tokens', () => {
    const input =
      'Some text <|file-3bf6634762184a15900d7d568264430a|> more text';
    const expected = 'Some text  more text';
    expect(sanitizeResponseText(input)).toBe(expected);
  });

  it('should remove multiple file reference tokens', () => {
    const input =
      '<|file-abc123|> start <|file-def456789|> middle <|file-000|> end';
    const expected = 'start  middle  end';
    expect(sanitizeResponseText(input)).toBe(expected);
  });

  it('should handle uppercase hex in file tokens', () => {
    const input = 'Text <|file-ABCDEF123456|> here';
    const expected = 'Text  here';
    expect(sanitizeResponseText(input)).toBe(expected);
  });

  it('should handle mixed case hex in file tokens', () => {
    const input = 'Text <|file-AbCdEf123456|> here';
    const expected = 'Text  here';
    expect(sanitizeResponseText(input)).toBe(expected);
  });

  it('should preserve text without file tokens', () => {
    const input = 'This is normal text without any tokens.';
    expect(sanitizeResponseText(input)).toBe(input);
  });

  it('should preserve markdown content', () => {
    const input = '# Header\n\n**Bold** and *italic* text\n\n- List item';
    expect(sanitizeResponseText(input)).toBe(input);
  });

  it('should preserve code blocks', () => {
    const input = '```typescript\nconst x = 1;\n```';
    expect(sanitizeResponseText(input)).toBe(input);
  });

  it('should not remove similar but invalid tokens', () => {
    // These should NOT be removed as they don't match the pattern
    const inputs = [
      '<|file-|>', // empty hex
      '<|file-xyz|>', // non-hex characters (contains xyz which are not hex)
      '<file-abc123>', // missing pipe
      '|file-abc123|', // missing angle brackets
    ];

    inputs.forEach(input => {
      expect(sanitizeResponseText(input)).toBe(input);
    });
  });

  it('should match case-insensitively (uppercase FILE is also matched)', () => {
    // The regex is case-insensitive, so uppercase variants are removed
    const input = 'Text <|FILE-ABC123|> here';
    const expected = 'Text  here';
    expect(sanitizeResponseText(input)).toBe(expected);
  });

  it('should handle file tokens at start of text', () => {
    const input = '<|file-abc123|>Starting text';
    expect(sanitizeResponseText(input)).toBe('Starting text');
  });

  it('should handle file tokens at end of text', () => {
    const input = 'Ending text<|file-abc123|>';
    expect(sanitizeResponseText(input)).toBe('Ending text');
  });

  it('should handle consecutive file tokens', () => {
    const input = '<|file-aaa|><|file-bbb|><|file-ccc|>';
    expect(sanitizeResponseText(input)).toBe('');
  });

  it('should strip [Execute ... tool with ...] patterns', () => {
    const input =
      '[Execute rag_search tool with query "what is a dog"]\nA dog is a domesticated mammal.';
    expect(sanitizeResponseText(input)).toBe('A dog is a domesticated mammal.');
  });

  it('should strip short [Execute tool_name] patterns', () => {
    const input = '[Execute meadow_tool]\nMeadow is an operator.';
    expect(sanitizeResponseText(input)).toBe('Meadow is an operator.');
  });

  it('should strip [tool_name(args)] patterns', () => {
    const input =
      '[rag_search(query="what is a dog")]\nA dog is a domesticated mammal.';
    expect(sanitizeResponseText(input)).toBe('A dog is a domesticated mammal.');
  });

  it('should strip standalone [tool_name] patterns (snake_case)', () => {
    const input = '[knowledge_base_search]\nSome answer here.';
    expect(sanitizeResponseText(input)).toBe('Some answer here.');
  });

  it('should NOT strip single-word brackets (could be markdown)', () => {
    const input = 'See [reference] for more info.';
    expect(sanitizeResponseText(input)).toBe('See [reference] for more info.');
  });

  it('should NOT strip markdown links', () => {
    const input = 'Click [here](https://example.com) for details.';
    expect(sanitizeResponseText(input)).toBe(
      'Click [here](https://example.com) for details.',
    );
  });

  it('should strip tool call text case-insensitively', () => {
    const input =
      '[EXECUTE knowledge_search tool with query "test"]\nResult here.';
    expect(sanitizeResponseText(input)).toBe('Result here.');
  });

  it('should handle tool text mixed with file tokens', () => {
    const input =
      '[Execute rag_search tool with query "test"]\n<|file-abc123|>Some answer';
    expect(sanitizeResponseText(input)).toBe('Some answer');
  });

  it('should strip wrapping code fences when body contains markdown', () => {
    const input = '```\nHello **world**\n- item 1\n```';
    expect(sanitizeResponseText(input)).toBe('Hello **world**\n- item 1');
  });

  it('should strip wrapping code fences with markdown language tag', () => {
    const input = '```markdown\n# Title\nSome text\n```';
    expect(sanitizeResponseText(input)).toBe('# Title\nSome text');
  });

  it('should preserve code blocks with programming language tag', () => {
    const input = '```typescript\nconst x = 1;\n```';
    expect(sanitizeResponseText(input)).toBe(input);
  });
});

describe('stripWrappingCodeFences', () => {
  it('should return empty/falsy values as-is', () => {
    expect(stripWrappingCodeFences('')).toBe('');
    // @ts-ignore testing runtime behavior
    expect(stripWrappingCodeFences(null)).toBe(null);
    // @ts-ignore testing runtime behavior
    expect(stripWrappingCodeFences(undefined)).toBe(undefined);
  });

  it('should strip backticks wrapping the entire response', () => {
    const input = '```\nHello world\n```';
    expect(stripWrappingCodeFences(input)).toBe('Hello world');
  });

  it('should strip backticks with markdown language tag', () => {
    const input = '```markdown\n# Title\nSome text\n```';
    expect(stripWrappingCodeFences(input)).toBe('# Title\nSome text');
  });

  it('should strip backticks with leading/trailing whitespace and markdown inside', () => {
    const input = '  ```\n**Hello** world\n```  ';
    expect(stripWrappingCodeFences(input)).toBe('**Hello** world');
  });

  it('should NOT strip when content contains its own code blocks', () => {
    const input =
      '```\nHere is some code:\n```python\nprint("hello")\n```\n```';
    expect(stripWrappingCodeFences(input)).toBe(input);
  });

  it('should NOT strip partial code fences', () => {
    const input = '```\nHello world\nNo closing fence';
    expect(stripWrappingCodeFences(input)).toBe(input);
  });

  it('should preserve text without code fences', () => {
    const input = 'Just plain text without any fences.';
    expect(stripWrappingCodeFences(input)).toBe(input);
  });

  it('should preserve legitimate code blocks (not wrapping entire response)', () => {
    const input =
      'Here is some code:\n\n```python\nprint("hello")\n```\n\nMore text.';
    expect(stripWrappingCodeFences(input)).toBe(input);
  });

  it('should preserve actual code wrapped with a programming language tag', () => {
    const input = '```typescript\nconst x = 1;\n```';
    expect(stripWrappingCodeFences(input)).toBe(input);
  });

  it('should strip code-language fences if body contains markdown prose', () => {
    const input =
      '```typescript\n**SecureSSO & Certificates**\n- Gather info\n- Submit order\n```';
    expect(stripWrappingCodeFences(input)).toBe(
      '**SecureSSO & Certificates**\n- Gather info\n- Submit order',
    );
  });

  it('should handle multi-line markdown content inside fences', () => {
    const input =
      '```\nLine 1\nLine 2\nLine 3\n**Bold** and *italic*\n- List\n```';
    expect(stripWrappingCodeFences(input)).toBe(
      'Line 1\nLine 2\nLine 3\n**Bold** and *italic*\n- List',
    );
  });
});
