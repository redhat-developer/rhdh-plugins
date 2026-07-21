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

export type ExecutionSummaryKeyword =
  | 'started'
  | 'failed'
  | 'retriggered'
  | 'waiting'
  | 'completed'
  | 'aborted';

export const extractIsoTimestamp = (
  executionSummary: string[],
  keyword: ExecutionSummaryKeyword,
): string | undefined => {
  const matchingMessage = executionSummary.find(str =>
    str.toLowerCase().includes(keyword),
  );
  if (!matchingMessage) {
    return undefined;
  }

  const timeMatch = matchingMessage.match(
    /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)/,
  );
  return timeMatch?.[1];
};

export const extractWaitingNodeId = (
  waitingMessage: string,
): string | undefined => {
  const nodeMatch = waitingMessage.match(/node (\S+) since/);
  return nodeMatch?.[1];
};
