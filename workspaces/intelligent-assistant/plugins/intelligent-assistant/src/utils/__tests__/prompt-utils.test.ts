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
import { SamplePrompts } from '../../types';
import { getRandomSamplePrompts } from '../prompt-utils';

const getPromptTitle = (prompt: any): string => {
  if ('title' in prompt) {
    return prompt.title;
  }
  if ('titleKey' in prompt) {
    return prompt.titleKey;
  }
  return 'Unknown';
};

describe('getRandomSamplePrompts', () => {
  it('should return empty array from default prompts and userPrompts is undefined', () => {
    const result = getRandomSamplePrompts(undefined, undefined);
    expect(result.length).toBe(0);
  });

  it('should return empty array from default prompts and userPrompts length is equal to 0', () => {
    const userPrompts: SamplePrompts = [];
    const defaultPrompts: SamplePrompts = [];

    const result = getRandomSamplePrompts(userPrompts, defaultPrompts);
    expect(result.length).toBe(0);
  });

  it('should return 3 random prompts from userPrompts if userPrompts length is greater than or equal to 3', () => {
    const userPrompts: SamplePrompts = [
      { title: 'Prompt 1', message: 'Message 1' },
      { title: 'Prompt 2', message: 'Message 2' },
      { title: 'Prompt 3', message: 'Message 3' },
      { title: 'Prompt 4', message: 'Message 4' },
    ];
    const defaultPrompts: SamplePrompts = [
      { title: 'Default Prompt 1', message: 'Default Message 1' },
      { title: 'Default Prompt 2', message: 'Default Message 2' },
    ];

    const result = getRandomSamplePrompts(userPrompts, defaultPrompts, 3);
    expect(result.length).toBe(3);
    const [prompt1, prompt2, prompt3] = result;
    const userPromptsTitles = userPrompts.map(prompt => getPromptTitle(prompt));
    expect(userPromptsTitles).toContain(getPromptTitle(prompt1));
    expect(userPromptsTitles).toContain(getPromptTitle(prompt2));
    expect(userPromptsTitles).toContain(getPromptTitle(prompt3));
  });

  it('should return 2 random prompts from default prompts if userPrompts length is equal to 0', () => {
    const userPrompts: SamplePrompts = [];
    const defaultPrompts: SamplePrompts = [
      { title: 'Default Prompt 1', message: 'Default Message 1' },
      { title: 'Default Prompt 2', message: 'Default Message 2' },
    ];

    const result = getRandomSamplePrompts(userPrompts, defaultPrompts);
    expect(result.length).toBe(2);
    const [prompt1, prompt2] = result;
    const defaultPromptsTitles = defaultPrompts.map(prompt =>
      getPromptTitle(prompt),
    );
    expect(defaultPromptsTitles).toContain(getPromptTitle(prompt1));
    expect(defaultPromptsTitles).toContain(getPromptTitle(prompt2));
  });
});
