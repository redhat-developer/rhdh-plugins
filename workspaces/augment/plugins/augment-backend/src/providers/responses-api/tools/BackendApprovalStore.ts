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
 * Pending approval for a backend-executed MCP tool.
 * Stored when a tool with `requireApproval` is invoked in backend mode
 * and the user must confirm before execution proceeds.
 */
export interface PendingBackendToolApproval {
  responseId: string;
  callId: string;
  functionName: string;
  argumentsJson: string;
  serverId: string;
  serverUrl: string;
  originalToolName: string;
  conversationId?: string;
  createdAt: number;
  /** Agent key that was active when the approval was requested. */
  agentKey?: string;
}

const TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_PENDING_APPROVALS = 100;

/**
 * In-memory store for pending backend tool approvals.
 *
 * When the backend intercepts a function_call for a tool that
 * requires human approval, it stores the call info here. When
 * the user responds via POST /chat/approve, the approval handler
 * retrieves the stored info, executes the tool, and feeds the
 * result back to LlamaStack.
 *
 * Bounded by MAX_PENDING_APPROVALS to prevent unbounded growth.
 * Expired entries are cleaned up on both store() and get().
 */
export class BackendApprovalStore {
  private readonly pending = new Map<string, PendingBackendToolApproval>();

  private key(responseId: string, callId: string): string {
    return `${responseId}::${callId}`;
  }

  store(approval: PendingBackendToolApproval): void {
    this.cleanup();
    if (this.pending.size >= MAX_PENDING_APPROVALS) {
      let oldestKey: string | undefined;
      let oldestTime = Infinity;
      for (const [key, val] of this.pending) {
        if (val.createdAt < oldestTime) {
          oldestTime = val.createdAt;
          oldestKey = key;
        }
      }
      if (oldestKey) this.pending.delete(oldestKey);
    }
    this.pending.set(this.key(approval.responseId, approval.callId), approval);
  }

  get(
    responseId: string,
    callId: string,
  ): PendingBackendToolApproval | undefined {
    this.cleanup();
    return this.pending.get(this.key(responseId, callId));
  }

  remove(responseId: string, callId: string): void {
    this.pending.delete(this.key(responseId, callId));
  }

  get size(): number {
    return this.pending.size;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, val] of this.pending) {
      if (now - val.createdAt > TTL_MS) {
        this.pending.delete(key);
      }
    }
  }
}
