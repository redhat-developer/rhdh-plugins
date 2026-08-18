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

import type { KagentiApiClient } from './client/KagentiApiClient';
import { KagentiStreamNormalizer } from './stream/KagentiStreamNormalizer';

const DEFAULT_EXTENSION_BASE = 'https://a2a-extensions.adk.kagenti.dev';

function secretsUri(base?: string): string {
  return `${base ?? DEFAULT_EXTENSION_BASE}/auth/secrets/v1`;
}

function oauthUri(base?: string): string {
  return `${base ?? DEFAULT_EXTENSION_BASE}/auth/oauth/v1`;
}

export interface ApprovalRequest {
  responseId: string;
  callId: string;
  approved: boolean;
  toolName?: string;
  toolArguments?: string;
  reason?: string;
}

export interface ApprovalResult {
  content: string;
  responseId: string;
  toolExecuted: boolean;
  toolOutput?: string;
  pendingApproval?: {
    approvalRequestId: string;
    toolName: string;
    serverLabel?: string;
    arguments?: string;
  };
  handoff?: { fromAgent: string; toAgent: string };
}

function buildApprovalMetadata(
  approval: ApprovalRequest,
  extensionBaseUrl?: string,
): Record<string, unknown> {
  if (approval.toolName === 'secrets_response' && approval.toolArguments) {
    let secretValues: Record<string, string>;
    try {
      secretValues = JSON.parse(approval.toolArguments) as Record<
        string,
        string
      >;
    } catch {
      throw new Error('Invalid JSON in secrets toolArguments');
    }
    const fulfillments: Record<string, { secret: string }> = {};
    for (const [key, value] of Object.entries(secretValues)) {
      fulfillments[key] = { secret: value };
    }
    return {
      [secretsUri(extensionBaseUrl)]: { secret_fulfillments: fulfillments },
    };
  }

  if (approval.toolName === 'oauth_confirm') {
    return {
      [oauthUri(extensionBaseUrl)]: { data: { redirect_uri: 'confirmed' } },
    };
  }

  let parsedArgs: unknown;
  if (approval.toolArguments) {
    try {
      parsedArgs = JSON.parse(approval.toolArguments);
    } catch {
      throw new Error('Invalid JSON in approval toolArguments');
    }
  }
  return {
    approval: {
      callId: approval.callId,
      approved: approval.approved,
      toolName: approval.toolName,
      ...(approval.reason && { reason: approval.reason }),
      toolArguments: parsedArgs,
    },
  };
}

export async function submitApproval(
  apiClient: KagentiApiClient,
  namespace: string,
  name: string,
  approval: ApprovalRequest,
  extensionBaseUrl?: string,
): Promise<ApprovalResult> {
  const contextId = approval.responseId;
  const approvalMessage = approval.approved
    ? `Approved: ${approval.toolName ?? 'tool call'}`
    : `Rejected: ${approval.toolName ?? 'tool call'}`;

  const metadata = buildApprovalMetadata(approval, extensionBaseUrl);
  const normalizer = new KagentiStreamNormalizer();

  let content = '';
  let pendingApproval: ApprovalResult['pendingApproval'];
  let handoff: ApprovalResult['handoff'];
  let toolExecuted = false;
  let toolOutput: string | undefined;

  await apiClient.chatStream(
    namespace,
    name,
    approvalMessage,
    undefined,
    (line: string) => {
      const events = normalizer.normalize(line);
      for (const event of events) {
        if (event.type === 'stream.text.delta') {
          content += event.delta;
        } else if (event.type === 'stream.tool.completed') {
          toolExecuted = true;
          toolOutput = (event as { output?: string }).output;
        } else if (event.type === 'stream.tool.approval') {
          pendingApproval = {
            approvalRequestId: event.callId,
            toolName: event.name,
            arguments: event.arguments,
          };
        } else if (event.type === 'stream.agent.handoff') {
          const he = event as { fromAgent?: string; toAgent?: string };
          handoff = {
            fromAgent: he.fromAgent ?? 'unknown',
            toAgent: he.toAgent ?? 'unknown',
          };
        }
      }
    },
    undefined,
    { contextId, metadata },
  );

  return {
    content,
    responseId: contextId,
    toolExecuted,
    toolOutput,
    pendingApproval,
    handoff,
  };
}
