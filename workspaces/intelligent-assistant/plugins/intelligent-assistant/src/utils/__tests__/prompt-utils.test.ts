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
import {
  getPriorityBasedPrompts,
  getRandomSamplePrompts,
} from '../prompt-utils';

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

describe('getPriorityBasedPrompts', () => {
  const appConfig: SamplePrompts = [{ title: 'App 1', message: 'App msg 1' }];
  const saved: SamplePrompts = [
    { title: 'Saved 1', message: 'Saved msg 1' },
    { title: 'Saved 2', message: 'Saved msg 2' },
  ];
  const hardcoded: SamplePrompts = [
    { title: 'Default 1', message: 'Default msg 1' },
    { title: 'Default 2', message: 'Default msg 2' },
    { title: 'Default 3', message: 'Default msg 3' },
  ];

  it('should fill all slots from app-config if enough prompts', () => {
    const manyAppConfig: SamplePrompts = [
      { title: 'A1', message: 'M1' },
      { title: 'A2', message: 'M2' },
      { title: 'A3', message: 'M3' },
      { title: 'A4', message: 'M4' },
    ];
    const result = getPriorityBasedPrompts(manyAppConfig, saved, hardcoded, 3);
    expect(result.length).toBe(3);
    expect(result.map(p => getPromptTitle(p))).toEqual(['A1', 'A2', 'A3']);
  });

  it('should fill remaining from saved prompts after app-config', () => {
    const result = getPriorityBasedPrompts(appConfig, saved, hardcoded, 3);
    expect(result.length).toBe(3);
    expect(getPromptTitle(result[0])).toBe('App 1');
    expect(getPromptTitle(result[1])).toBe('Saved 1');
    expect(getPromptTitle(result[2])).toBe('Saved 2');
  });

  it('should fill remaining from hardcoded when not enough app + saved', () => {
    const result = getPriorityBasedPrompts(
      [],
      [{ title: 'S1', message: 'M' }],
      hardcoded,
      3,
    );
    expect(result.length).toBe(3);
    expect(getPromptTitle(result[0])).toBe('S1');
    // Remaining 2 come from hardcoded (random, but length is guaranteed)
    expect(result.length).toBe(3);
  });

  it('should return empty array when all sources are empty', () => {
    const result = getPriorityBasedPrompts([], [], [], 3);
    expect(result.length).toBe(0);
  });

  it('should respect numberOfPrompts parameter', () => {
    const result = getPriorityBasedPrompts(appConfig, saved, hardcoded, 1);
    expect(result.length).toBe(1);
    expect(getPromptTitle(result[0])).toBe('App 1');
  });
});
