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

import { useState, useRef, useCallback } from 'react';
import type { AugmentApi } from '../api/AugmentApi';
import type { ChatAgentConfig } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { Message } from '../types';

interface UseAgentSelectionOptions {
  api: AugmentApi;
  isKagenti: boolean;
  chatAgentConfigs: ChatAgentConfig[];
  messages: Message[];
  onMessagesChange: (messages: Message[]) => void;
  chatInputRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function useAgentSelection({
  api,
  isKagenti,
  chatAgentConfigs,
  messages,
  onMessagesChange,
  chatInputRef,
}: UseAgentSelectionOptions) {
  const [selectedModel, setSelectedModel] = useState<string | undefined>();
  const [agentHealthWarning, setAgentHealthWarning] = useState<string | null>(
    null,
  );
  const [agentStarters, setAgentStarters] = useState<string[]>([]);
  const [agentDescription, setAgentDescription] = useState<
    string | undefined
  >();
  const kagentiFetchRef = useRef<AbortController | null>(null);

  const handleAgentSelect = useCallback(
    (agentId: string, _agentName: string) => {
      setSelectedModel(agentId);
      setAgentHealthWarning(null);

      const adminCfg = chatAgentConfigs.find(c => c.agentId === agentId);

      setAgentDescription(adminCfg?.description);

      if (adminCfg?.conversationStarters?.length) {
        setAgentStarters(adminCfg.conversationStarters.slice(0, 4));
      } else {
        setAgentStarters([]);
      }

      if (adminCfg?.greeting && messages.length === 0) {
        onMessagesChange([
          {
            id: `greeting-${Date.now()}`,
            text: adminCfg.greeting,
            isUser: false,
            timestamp: new Date(),
            agentName: adminCfg.displayName || _agentName,
          },
        ]);
      }

      chatInputRef.current?.focus();

      if (isKagenti && agentId.includes('/')) {
        const [ns, name] = agentId.split('/');
        kagentiFetchRef.current?.abort();
        const ctrl = new AbortController();
        kagentiFetchRef.current = ctrl;
        api
          .getKagentiAgent(ns, name)
          .then(detail => {
            if (ctrl.signal.aborted) return;
            const statusStr =
              typeof detail.status === 'string'
                ? detail.status
                : String(
                    (detail.status as Record<string, unknown>)?.phase ?? '',
                  );
            if (statusStr && statusStr.toLowerCase() !== 'ready') {
              setAgentHealthWarning(`Agent status: ${statusStr}`);
            }
            const card = (
              detail as {
                agentCard?: {
                  description?: string;
                  skills?: Array<{ examples?: string[] }>;
                };
              }
            ).agentCard;
            if (!adminCfg?.description && card?.description) {
              setAgentDescription(card.description);
            }
            if (!adminCfg?.conversationStarters?.length && card?.skills) {
              const examples = card.skills
                .flatMap(s => s.examples || [])
                .slice(0, 4);
              if (examples.length > 0) setAgentStarters(examples);
            }
          })
          .catch(() => {
            if (ctrl.signal.aborted) return;
            setAgentHealthWarning('Unable to verify agent health');
          });
      }
    },
    [
      api,
      isKagenti,
      chatAgentConfigs,
      messages.length,
      onMessagesChange,
      chatInputRef,
    ],
  );

  const resetAgentSelection = useCallback(() => {
    setSelectedModel(undefined);
    setAgentHealthWarning(null);
    setAgentStarters([]);
    setAgentDescription(undefined);
    kagentiFetchRef.current?.abort();
  }, []);

  return {
    selectedModel,
    setSelectedModel,
    agentHealthWarning,
    agentStarters,
    agentDescription,
    handleAgentSelect,
    resetAgentSelection,
  };
}
