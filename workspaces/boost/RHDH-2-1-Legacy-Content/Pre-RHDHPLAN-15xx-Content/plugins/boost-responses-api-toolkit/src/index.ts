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

/**
 * Shared Responses API utilities for boost provider modules.
 *
 * Provides types, request builders, and response parsers used by
 * provider modules that communicate via the Responses API protocol.
 *
 * @packageDocumentation
 */

export type {
  ResponsesApiRequest,
  ResponsesApiInputItem,
  ResponsesApiTool,
  ResponsesApiResponse,
  ResponsesApiOutputItem,
  ResponsesApiContentPart,
  ResponsesApiStreamEvent,
} from './types';

export {
  buildResponsesApiRequest,
  type BuildRequestOptions,
  type BuildRequestResult,
} from './requestBuilder';

export {
  extractTextFromResponse,
  normalizeStreamEvent,
} from './responseParser';
