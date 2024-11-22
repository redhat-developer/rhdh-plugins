/*
 * Copyright 2024 The Backstage Authors
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
  HttpAuthService,
  LoggerService,
  PermissionsService,
  UserInfoService,
} from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';

/**
 * @public
 * The lightspeed backend router options
 */
export type RouterOptions = {
  logger: LoggerService;
  config: Config;
  httpAuth: HttpAuthService;
  userInfo: UserInfoService;
  permissions: PermissionsService;
};

/**
 * Define the type for the request body of the /v1/query endpoint.
 */
export interface QueryRequestBody {
  // AI model identifier
  model: string;

  // Query message
  query: string;

  // LLM server URL, expected to be the proxy endpoint
  // for example: http://localhost:7007/api/proxy/lightspeed/api
  serverURL: string;

  // A combination of user_id & session_id in the format of <user_id>+<session_id>
  conversation_id: string;
}

// For create AIMessage, HumanMessage, SystemMessage respectively
export const Roles = {
  AIRole: 'ai',
  HumanRole: 'human',
  SystemRole: 'system',
} as const;

// default number of message history being loaded
export const DEFAULT_HISTORY_LENGTH = 10;

export type ConversationSummary = {
  conversation_id: string;
  summary: string;
  lastMessageTimestamp: number;
};
