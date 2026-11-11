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

import { RhUiAiChatbotIcon } from '@patternfly/react-icons/dist/esm/icons/rh-ui-ai-chatbot-icon';

/** Same absolute 24px box as Remix step icons (`size={24}`). */
export const LightspeedIcon = () => (
  <RhUiAiChatbotIcon width={24} height={24} style={{ display: 'block' }} />
);
