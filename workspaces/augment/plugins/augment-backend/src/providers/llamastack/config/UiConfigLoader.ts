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

import type {
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { toErrorMessage } from '../../../services/utils';
import type { Workflow, QuickAction, PromptGroup } from '../../../types';

export function loadWorkflows(
  config: RootConfigService,
  logger: LoggerService,
): Workflow[] {
  try {
    const wfCfg = config.getOptionalConfigArray('augment.workflows');
    if (!wfCfg || wfCfg.length === 0) return [];
    return wfCfg.map(wf => ({
      id: wf.getString('id'),
      name: wf.getString('name'),
      description: wf.getOptionalString('description') || '',
      icon: wf.getOptionalString('icon'),
      category: wf.getOptionalString('category'),
      comingSoon: wf.getOptionalBoolean('comingSoon'),
      comingSoonLabel: wf.getOptionalString('comingSoonLabel'),
      steps: (wf.getOptionalConfigArray('steps') || []).map(s => ({
        title: s.getString('title'),
        prompt: s.getString('prompt'),
        description: s.getOptionalString('description'),
      })),
    }));
  } catch (error) {
    logger.warn(`Failed to load workflows: ${toErrorMessage(error)}`);
    return [];
  }
}

export function loadQuickActions(
  config: RootConfigService,
  logger: LoggerService,
): QuickAction[] {
  try {
    const qpCfg = config.getOptionalConfigArray('augment.quickPrompts');
    if (!qpCfg || qpCfg.length === 0) return [];
    return qpCfg.map(qp => ({
      title: qp.getString('title'),
      description: qp.getOptionalString('description'),
      prompt: qp.getString('prompt'),
      icon: qp.getOptionalString('icon'),
      category: qp.getOptionalString('category'),
      comingSoon: qp.getOptionalBoolean('comingSoon'),
      comingSoonLabel: qp.getOptionalString('comingSoonLabel'),
    }));
  } catch (error) {
    logger.warn(`Failed to load quick prompts: ${toErrorMessage(error)}`);
    return [];
  }
}

export function loadPromptGroups(
  config: RootConfigService,
  logger: LoggerService,
): PromptGroup[] {
  try {
    const groupsConfig = config.getOptionalConfigArray('augment.promptGroups');
    if (!groupsConfig || groupsConfig.length === 0) return [];
    const groups = groupsConfig.map((sl, index) => {
      const cardsConfig = sl.getOptionalConfigArray('cards') || [];
      return {
        id: sl.getString('id'),
        title: sl.getString('title'),
        description: sl.getOptionalString('description'),
        icon: sl.getOptionalString('icon'),
        color: sl.getOptionalString('color'),
        order: sl.getOptionalNumber('order') ?? index + 1,
        cards: cardsConfig.map(card => ({
          title: card.getString('title'),
          description: card.getOptionalString('description'),
          prompt: card.getString('prompt'),
          icon: card.getOptionalString('icon'),
          comingSoon: card.getOptionalBoolean('comingSoon'),
          comingSoonLabel: card.getOptionalString('comingSoonLabel'),
        })),
      };
    });
    return groups.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  } catch (error) {
    logger.warn(`Failed to load prompt groups: ${toErrorMessage(error)}`);
    return [];
  }
}
