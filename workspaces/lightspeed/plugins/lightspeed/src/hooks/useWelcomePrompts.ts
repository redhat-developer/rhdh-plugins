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

import { ConfigApi, configApiRef, useApi } from '@backstage/core-plugin-api';

import { DEFAULT_SAMPLE_PROMPTS, RHDH_SAMPLE_PROMPTS } from '../const';
import { SamplePrompt, SamplePrompts } from '../types';
import { getRandomSamplePrompts } from '../utils/prompt-utils';
import { useTopicRestrictionStatus } from './useQuestionValidation';
import { useTranslation } from './useTranslation';

export const useWelcomePrompts = (): SamplePrompts => {
  const configApi: ConfigApi = useApi(configApiRef);
  const { t } = useTranslation();
  const { data: questionValidationEnabled } = useTopicRestrictionStatus();

  return React.useMemo(() => {
    // Transform translation keys to actual prompts
    const translatePrompts = (prompts: SamplePrompts): SamplePrompts => {
      return prompts.map((prompt: SamplePrompt) => {
        if ('titleKey' in prompt && 'messageKey' in prompt) {
          return {
            title: t(prompt.titleKey as any, { defaultValue: prompt.titleKey }),
            message: t(prompt.messageKey as any, {
              defaultValue: prompt.messageKey,
            }),
          };
        }
        return prompt as { title: string; message: string };
      });
    };

    const DEFAULT_PROMPTS = questionValidationEnabled
      ? translatePrompts(RHDH_SAMPLE_PROMPTS)
      : translatePrompts([...DEFAULT_SAMPLE_PROMPTS, ...RHDH_SAMPLE_PROMPTS]);

    const userConfiguredPrompts: SamplePrompts = (
      configApi?.getOptionalConfigArray('lightspeed.prompts') ?? []
    ).map(config => ({
      title: config.getString('title') ?? '',
      message: config.getString('message') ?? '',
    }));
    return getRandomSamplePrompts(userConfiguredPrompts, DEFAULT_PROMPTS);
  }, [configApi, t, questionValidationEnabled]);
};
