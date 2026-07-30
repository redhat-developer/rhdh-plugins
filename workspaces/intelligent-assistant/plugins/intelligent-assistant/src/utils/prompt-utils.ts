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
import { SamplePrompts } from '../types';

const getRandomPrompts = (prompts: SamplePrompts, n: number) => {
  const shuffled = prompts.slice().sort(() => 0.5 - Math.random()); // NOSONAR
  return shuffled.slice(0, Math.min(n, prompts.length));
};

export const getRandomSamplePrompts = (
  userPrompts: SamplePrompts = [],
  defaultPrompts: SamplePrompts = [],
  numberOfPrompts: number = 3,
) => {
  const userCount = userPrompts.length;

  if (userCount >= numberOfPrompts) {
    return getRandomPrompts(userPrompts, numberOfPrompts);
  }
  const userSelected = getRandomPrompts(userPrompts, userCount);
  const remaining = numberOfPrompts - userSelected.length;
  const defaultSelected = getRandomPrompts(defaultPrompts, remaining);
  return [...userSelected, ...defaultSelected];
};
