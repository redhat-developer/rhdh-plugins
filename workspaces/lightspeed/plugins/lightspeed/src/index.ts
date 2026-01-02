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

export {
  lightspeedPlugin,
  LightspeedPage,
  LightspeedDrawerProvider,
} from './plugin';
export { LightspeedIcon, LightspeedFABIcon } from './components/LightspeedIcon';
export { LightspeedFAB } from './components/LightspeedFAB';
export { LightspeedChatContainer } from './components/LightspeedChatContainer';
export { LightspeedDrawerStateExposer } from './components/LightspeedDrawerStateExposer';
export { useLightspeedDrawerContext } from './hooks/useLightspeedDrawerContext';
export { lightspeedApiRef } from './api/api';
export { LightspeedApiClient } from './api/LightspeedApiClient';
export type { LightspeedDrawerContextType } from './components/LightspeedDrawerContext';
export type {
  DrawerStateExposerProps,
  DrawerState,
} from './components/LightspeedDrawerStateExposer';
export type { LightspeedAPI } from './api/api';
export type { Options } from './api/LightspeedApiClient';
export type {
  LCSModel,
  LCSModelType,
  LCSModelApiModelType,
  BaseMessage,
  Attachment,
  ConversationList,
  ConversationSummary,
  CaptureFeedback,
  ReferencedDocuments,
  ReferencedDocument,
} from './types';
