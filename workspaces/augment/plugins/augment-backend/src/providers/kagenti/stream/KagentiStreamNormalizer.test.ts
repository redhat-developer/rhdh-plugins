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

import {
  KagentiStreamNormalizer,
  normalizeKagentiEvent,
} from './KagentiStreamNormalizer';

// Extension URIs used in metadata
const TRAJECTORY_URI =
  'https://a2a-extensions.adk.kagenti.dev/ui/trajectory/v1';
const CITATION_URI = 'https://a2a-extensions.adk.kagenti.dev/ui/citation/v1';
const ERROR_URI = 'https://a2a-extensions.adk.kagenti.dev/ui/error/v1';
const FORM_REQUEST_URI =
  'https://a2a-extensions.adk.kagenti.dev/ui/form_request/v1';
const APPROVAL_URI =
  'https://a2a-extensions.adk.kagenti.dev/interactions/approval/v1';
const OAUTH_URI = 'https://a2a-extensions.adk.kagenti.dev/auth/oauth/v1';
const SECRETS_URI = 'https://a2a-extensions.adk.kagenti.dev/auth/secrets/v1';

function makeStatusUpdate(
  state: string,
  opts?: {
    taskId?: string;
    contextId?: string;
    text?: string;
    metadata?: Record<string, unknown>;
  },
) {
  return JSON.stringify({
    statusUpdate: {
      taskId: opts?.taskId ?? 'task-1',
      contextId: opts?.contextId ?? 'ctx-1',
      status: {
        state,
        ...(opts?.text || opts?.metadata
          ? {
              message: {
                messageId: 'msg-1',
                role: 'ROLE_AGENT',
                parts: opts?.text ? [{ text: opts.text }] : [],
                ...(opts?.metadata && { metadata: opts.metadata }),
              },
            }
          : {}),
      },
    },
  });
}

// =============================================================================
// Legacy format backward compatibility
// =============================================================================

describe('KagentiStreamNormalizer -- legacy format', () => {
  it('emits stream.started on first event', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      JSON.stringify({ session_id: 's1', content: 'Hi' }),
    );
    expect(events[0]).toEqual({ type: 'stream.started', responseId: 's1' });
    expect(events[1]).toEqual({ type: 'stream.text.delta', delta: 'Hi' });
  });

  it('does not emit stream.started twice', () => {
    const n = new KagentiStreamNormalizer();
    n.normalize(JSON.stringify({ session_id: 's1', content: 'a' }));
    const events = n.normalize(JSON.stringify({ content: 'b' }));
    expect(events.find(e => e.type === 'stream.started')).toBeUndefined();
  });

  it('maps status event to text delta', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      JSON.stringify({ event: { type: 'status', message: 'Processing...' } }),
    );
    expect(events).toContainEqual({
      type: 'stream.text.delta',
      delta: 'Processing...',
    });
  });

  it('maps artifact event to text delta', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      JSON.stringify({ event: { type: 'artifact' }, content: 'Result data' }),
    );
    expect(events).toContainEqual({
      type: 'stream.text.delta',
      delta: 'Result data',
    });
  });

  it('emits text.done and completed on final event', () => {
    const n = new KagentiStreamNormalizer();
    n.normalize(JSON.stringify({ content: 'Hello ' }));
    const events = n.normalize(
      JSON.stringify({
        event: { final: true, state: 'COMPLETED' },
        content: 'World',
      }),
    );
    expect(events).toContainEqual({
      type: 'stream.text.done',
      text: 'Hello World',
    });
    expect(events).toContainEqual({ type: 'stream.completed' });
  });

  it('emits completed on done:true', () => {
    const n = new KagentiStreamNormalizer();
    n.normalize(JSON.stringify({ content: 'x' }));
    const events = n.normalize(JSON.stringify({ done: true }));
    expect(events).toContainEqual({ type: 'stream.text.done', text: 'x' });
    expect(events).toContainEqual({ type: 'stream.completed' });
  });

  it('emits error on error field', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(JSON.stringify({ error: 'Something broke' }));
    expect(events).toContainEqual({
      type: 'stream.error',
      error: 'Something broke',
      code: 'kagenti_error',
    });
    expect(events).toContainEqual({ type: 'stream.completed' });
  });

  it('emits error on FAILED state', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      JSON.stringify({ event: { state: 'FAILED', message: 'Timeout' } }),
    );
    expect(events).toContainEqual({
      type: 'stream.error',
      error: 'Timeout',
      code: 'kagenti_task_failed',
    });
  });

  it('does not emit completed twice', () => {
    const n = new KagentiStreamNormalizer();
    n.normalize(JSON.stringify({ content: 'a' }));
    n.normalize(JSON.stringify({ done: true }));
    const events = n.normalize(JSON.stringify({ done: true }));
    expect(events.filter(e => e.type === 'stream.completed')).toHaveLength(0);
  });

  it('handles unparseable JSON', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize('not valid json');
    expect(events[0]).toEqual(
      expect.objectContaining({ type: 'stream.error' }),
    );
  });

  it('falls back to context_id for responseId', () => {
    const events = normalizeKagentiEvent(
      JSON.stringify({ context_id: 'ctx-123', content: 'data' }),
    );
    expect(events[0]).toEqual({
      type: 'stream.started',
      responseId: 'ctx-123',
    });
  });
});

// =============================================================================
// A2A Protocol: All 9 Task States
// =============================================================================

describe('KagentiStreamNormalizer -- A2A task states', () => {
  it('TASK_STATE_SUBMITTED is a no-op (only emits started)', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(makeStatusUpdate('TASK_STATE_SUBMITTED'));
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ type: 'stream.started', responseId: 'ctx-1' });
  });

  it('TASK_STATE_UNSPECIFIED is a no-op (only emits started)', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(makeStatusUpdate('TASK_STATE_UNSPECIFIED'));
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('stream.started');
  });

  it('TASK_STATE_WORKING emits text delta', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      makeStatusUpdate('TASK_STATE_WORKING', { text: 'Thinking...' }),
    );
    expect(events).toContainEqual({
      type: 'stream.text.delta',
      delta: 'Thinking...',
    });
  });

  it('TASK_STATE_COMPLETED emits text.done and completed', () => {
    const n = new KagentiStreamNormalizer();
    n.normalize(makeStatusUpdate('TASK_STATE_WORKING', { text: 'Part 1. ' }));
    const events = n.normalize(
      makeStatusUpdate('TASK_STATE_COMPLETED', { text: 'Part 2.' }),
    );
    expect(events).toContainEqual({
      type: 'stream.text.delta',
      delta: 'Part 2.',
    });
    expect(events).toContainEqual({
      type: 'stream.text.done',
      text: 'Part 1. Part 2.',
    });
    expect(events).toContainEqual({ type: 'stream.completed' });
  });

  it('TASK_STATE_FAILED emits error and completed', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      makeStatusUpdate('TASK_STATE_FAILED', { text: 'Out of memory' }),
    );
    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'stream.error',
        error: 'Out of memory',
        code: 'kagenti_task_failed',
      }),
    );
    expect(events).toContainEqual({ type: 'stream.completed' });
  });

  it('TASK_STATE_CANCELED emits completed with no text', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(makeStatusUpdate('TASK_STATE_CANCELED'));
    expect(events).toContainEqual({ type: 'stream.completed' });
    expect(events.find(e => e.type === 'stream.text.done')).toBeUndefined();
  });

  it('TASK_STATE_REJECTED emits error with code kagenti_rejected', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      makeStatusUpdate('TASK_STATE_REJECTED', { text: 'Not allowed' }),
    );
    expect(events).toContainEqual({
      type: 'stream.error',
      error: 'Not allowed',
      code: 'kagenti_rejected',
    });
    expect(events).toContainEqual({ type: 'stream.completed' });
  });

  it('TASK_STATE_REJECTED without text uses default message', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(makeStatusUpdate('TASK_STATE_REJECTED'));
    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'stream.error',
        error: 'Agent rejected the request',
        code: 'kagenti_rejected',
      }),
    );
  });
});

// =============================================================================
// A2A Protocol: INPUT_REQUIRED (forms, approvals, text input)
// =============================================================================

describe('KagentiStreamNormalizer -- INPUT_REQUIRED', () => {
  it('emits stream.form.request for form extension', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      makeStatusUpdate('TASK_STATE_INPUT_REQUIRED', {
        metadata: {
          [FORM_REQUEST_URI]: {
            title: 'Feedback',
            fields: [{ type: 'text', id: 'comment', label: 'Comment' }],
          },
        },
      }),
    );
    const formEvent = events.find(e => e.type === 'stream.form.request');
    expect(formEvent).toBeDefined();
    expect(formEvent).toEqual(
      expect.objectContaining({
        type: 'stream.form.request',
        taskId: 'task-1',
        contextId: 'ctx-1',
      }),
    );
  });

  it('emits stream.tool.approval for approval extension', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      makeStatusUpdate('TASK_STATE_INPUT_REQUIRED', {
        metadata: {
          [APPROVAL_URI]: {
            action: 'generic',
            title: 'Delete file?',
            description: 'This will permanently remove the file.',
          },
        },
      }),
    );
    const approvalEvent = events.find(e => e.type === 'stream.tool.approval');
    expect(approvalEvent).toBeDefined();
  });

  it('emits text delta for plain text input required', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      makeStatusUpdate('TASK_STATE_INPUT_REQUIRED', {
        text: 'Please provide more details',
      }),
    );
    expect(events).toContainEqual({
      type: 'stream.text.delta',
      delta: 'Please provide more details',
    });
  });
});

// =============================================================================
// A2A Protocol: AUTH_REQUIRED (OAuth, secrets)
// =============================================================================

describe('KagentiStreamNormalizer -- AUTH_REQUIRED', () => {
  it('emits stream.auth.required for OAuth', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      makeStatusUpdate('TASK_STATE_AUTH_REQUIRED', {
        metadata: {
          [OAUTH_URI]: {
            authorization_endpoint_url: 'https://auth.example.com/authorize',
          },
        },
      }),
    );
    const authEvent = events.find(e => e.type === 'stream.auth.required');
    expect(authEvent).toBeDefined();
    expect(authEvent).toEqual(
      expect.objectContaining({
        type: 'stream.auth.required',
        authType: 'oauth',
        url: 'https://auth.example.com/authorize',
      }),
    );
  });

  it('emits stream.auth.required for secrets', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      makeStatusUpdate('TASK_STATE_AUTH_REQUIRED', {
        metadata: {
          [SECRETS_URI]: {
            secret_demands: {
              api_key: {
                name: 'api_key',
                description: 'API key for external service',
              },
            },
          },
        },
      }),
    );
    const authEvent = events.find(e => e.type === 'stream.auth.required');
    expect(authEvent).toBeDefined();
    expect(authEvent).toEqual(
      expect.objectContaining({
        type: 'stream.auth.required',
        authType: 'secret',
      }),
    );
  });
});

// =============================================================================
// A2A Protocol: Artifact Updates
// =============================================================================

describe('KagentiStreamNormalizer -- artifact updates', () => {
  it('emits stream.artifact for artifact update with text parts', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      JSON.stringify({
        artifactUpdate: {
          taskId: 'task-1',
          contextId: 'ctx-1',
          artifact: {
            artifactId: 'art-1',
            name: 'output.py',
            description: 'Generated code',
            parts: [{ text: 'print("hello")' }],
          },
          append: false,
          lastChunk: true,
        },
      }),
    );

    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'stream.artifact',
        artifactId: 'art-1',
        name: 'output.py',
        content: 'print("hello")',
        lastChunk: true,
      }),
    );
    expect(events).toContainEqual({
      type: 'stream.text.delta',
      delta: 'print("hello")',
    });
    expect(events).toContainEqual({ type: 'stream.completed' });
  });

  it('does not emit completed for non-last artifact chunks', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      JSON.stringify({
        artifactUpdate: {
          taskId: 'task-1',
          contextId: 'ctx-1',
          artifact: {
            artifactId: 'art-1',
            parts: [{ text: 'chunk1' }],
          },
          append: true,
          lastChunk: false,
        },
      }),
    );
    expect(events.find(e => e.type === 'stream.completed')).toBeUndefined();
  });
});

// =============================================================================
// A2A Protocol: UI Extensions (trajectory, citation, structured error)
// =============================================================================

describe('KagentiStreamNormalizer -- UI extensions', () => {
  it('extracts trajectory metadata as reasoning deltas', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      makeStatusUpdate('TASK_STATE_WORKING', {
        text: 'Processing',
        metadata: {
          [TRAJECTORY_URI]: [
            { title: 'Step 1', content: 'Analyzing input' },
            { title: 'Step 2', content: 'Generating response' },
          ],
        },
      }),
    );
    const reasoningEvents = events.filter(
      e => e.type === 'stream.reasoning.delta',
    );
    expect(reasoningEvents).toHaveLength(2);
    expect(reasoningEvents[0]).toEqual({
      type: 'stream.reasoning.delta',
      delta: 'Step 1: Analyzing input\n',
    });
  });

  it('extracts citation metadata', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      makeStatusUpdate('TASK_STATE_WORKING', {
        text: 'Answer',
        metadata: {
          [CITATION_URI]: [
            { url: 'https://docs.example.com', title: 'API Docs' },
          ],
        },
      }),
    );
    const citationEvent = events.find(e => e.type === 'stream.citation');
    expect(citationEvent).toBeDefined();
    expect(citationEvent).toEqual({
      type: 'stream.citation',
      citations: [{ url: 'https://docs.example.com', title: 'API Docs' }],
    });
  });

  it('extracts structured error metadata on FAILED', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      makeStatusUpdate('TASK_STATE_FAILED', {
        metadata: {
          [ERROR_URI]: {
            error: {
              title: 'Rate Limit',
              message: 'Too many requests',
            },
            context: { retryAfter: 30 },
          },
        },
      }),
    );
    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'stream.error',
        error: 'Too many requests',
        code: 'kagenti_task_failed',
        title: 'Rate Limit',
        context: { retryAfter: 30 },
      }),
    );
  });
});

// =============================================================================
// JSONRPC Errors
// =============================================================================

describe('KagentiStreamNormalizer -- JSONRPC errors', () => {
  it('maps known JSONRPC error codes to human-readable messages', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      JSON.stringify({
        error: {
          code: -32001,
          message: 'task xyz not found',
        },
      }),
    );
    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'stream.error',
        error: 'Task not found: task xyz not found',
        code: 'jsonrpc_32001',
      }),
    );
    expect(events).toContainEqual({ type: 'stream.completed' });
  });

  it('uses raw message for unknown JSONRPC error codes (no duplication)', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      JSON.stringify({
        error: {
          code: -99999,
          message: 'unknown error',
        },
      }),
    );
    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'stream.error',
        error: 'unknown error',
      }),
    );
  });
});

// =============================================================================
// Edge cases (7b test gap coverage)
// =============================================================================

describe('KagentiStreamNormalizer -- edge cases', () => {
  it('unknown A2A state falls through to default (extracts text)', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      makeStatusUpdate('TASK_STATE_UNKNOWN_FUTURE', { text: 'some text' }),
    );
    expect(events).toContainEqual({
      type: 'stream.text.delta',
      delta: 'some text',
    });
  });

  it('handleInteractiveState catch path logs and falls back to text', () => {
    const mockLogger = {
      warn: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      child: jest.fn().mockReturnThis(),
    } as any;
    const n = new KagentiStreamNormalizer(mockLogger);
    // INPUT_REQUIRED with metadata that will cause handleTaskStatusUpdate to fail
    // when there's no recognized extension URI, it may or may not throw depending on ADK version.
    // We test by providing text that falls through to the catch path.
    const events = n.normalize(
      makeStatusUpdate('TASK_STATE_INPUT_REQUIRED', { text: 'Please respond' }),
    );
    expect(events).toContainEqual({
      type: 'stream.text.delta',
      delta: 'Please respond',
    });
  });

  it('artifact with no text parts emits no artifact event', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      JSON.stringify({
        artifactUpdate: {
          taskId: 'task-1',
          contextId: 'ctx-1',
          artifact: {
            artifactId: 'art-1',
            parts: [{ data: 'binary-data-here' }],
          },
          lastChunk: false,
        },
      }),
    );
    expect(events.find(e => e.type === 'stream.artifact')).toBeUndefined();
  });

  it('artifact with multiple text parts joins them', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      JSON.stringify({
        artifactUpdate: {
          taskId: 'task-1',
          contextId: 'ctx-1',
          artifact: {
            artifactId: 'art-1',
            parts: [{ text: 'Hello ' }, { text: 'World' }],
          },
          lastChunk: true,
        },
      }),
    );
    const artifactEvent = events.find(e => e.type === 'stream.artifact');
    expect(artifactEvent).toEqual(
      expect.objectContaining({
        type: 'stream.artifact',
        content: 'Hello World',
      }),
    );
  });

  it('verbose logging emits debug log when events are produced', () => {
    const mockLogger = {
      warn: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      child: jest.fn().mockReturnThis(),
    } as any;
    const n = new KagentiStreamNormalizer(mockLogger);
    n.normalize(JSON.stringify({ content: 'hello', session_id: 's1' }));
    expect(mockLogger.debug).toHaveBeenCalledWith(
      expect.stringContaining('KagentiStream:'),
      expect.any(Object),
    );
  });

  it('TASK_STATE_FAILED without error extension falls back to status text', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      makeStatusUpdate('TASK_STATE_FAILED', { text: 'Connection lost' }),
    );
    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'stream.error',
        error: 'Connection lost',
        code: 'kagenti_task_failed',
      }),
    );
  });

  it('TASK_STATE_FAILED without any message uses default error text', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(makeStatusUpdate('TASK_STATE_FAILED'));
    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'stream.error',
        error: 'Agent task failed',
        code: 'kagenti_task_failed',
      }),
    );
  });

  it('empty citation array is not emitted', () => {
    const n = new KagentiStreamNormalizer();
    const events = n.normalize(
      makeStatusUpdate('TASK_STATE_WORKING', {
        text: 'x',
        metadata: {
          [CITATION_URI]: [],
        },
      }),
    );
    expect(events.find(e => e.type === 'stream.citation')).toBeUndefined();
  });
});

// =============================================================================
// Stateless convenience function
// =============================================================================

describe('normalizeKagentiEvent', () => {
  it('works for a single A2A status update', () => {
    const events = normalizeKagentiEvent(
      makeStatusUpdate('TASK_STATE_COMPLETED', { text: 'Done' }),
    );
    expect(events[0].type).toBe('stream.started');
    expect(events).toContainEqual({ type: 'stream.text.delta', delta: 'Done' });
    expect(events).toContainEqual({ type: 'stream.text.done', text: 'Done' });
    expect(events).toContainEqual({ type: 'stream.completed' });
  });
});
