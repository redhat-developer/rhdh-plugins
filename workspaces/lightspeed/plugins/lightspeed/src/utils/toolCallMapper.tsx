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

import { ToolCallProps } from '@patternfly/chatbot';

import { ToolCallContent } from '../components/ToolCallContent';
import { ToolCall } from '../types';

/**
 * Maps our internal ToolCall type to PatternFly's ToolCallProps
 */
export const mapToPatternFlyToolCall = (
  toolCall: ToolCall,
  t: (key: any, options?: any) => string,
  role?: 'user' | 'bot',
): ToolCallProps => {
  return {
    titleText: t('toolCall.header' as any, { toolName: toolCall.toolName }),
    isLoading: toolCall.isLoading,
    loadingText: t('toolCall.executing'),
    expandableContent: !toolCall.isLoading ? (
      <ToolCallContent toolCall={toolCall} role={role} />
    ) : undefined,
    actions: [],
  };
};

export default mapToPatternFlyToolCall;
