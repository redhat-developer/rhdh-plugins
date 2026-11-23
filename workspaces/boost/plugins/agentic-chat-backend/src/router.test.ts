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

import express, { type Response } from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { ConfigReader } from '@backstage/config';
import {
  catalogServiceRef,
  type CatalogService,
} from '@backstage/plugin-catalog-node';
import { createServiceFactory } from '@backstage/backend-plugin-api';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { NotAllowedError } from '@backstage/errors';
import {
  mockCredentials,
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';
import agenticChatPlugin from './index';
import { createRouter } from './router';
import legalAgent from '../examples/legal-agent.json';
import legalUpstreamRequest from '../examples/legal-upstream-request.json';
import legalRunRequest from '../examples/legal-run-request.json';

// External Backstage services are test doubles; runtime forwarding uses real HTTP.

const agent = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'AiResource',
  metadata: { name: 'support' },
  spec: {
    type: 'agent-rhdh-chat',
    lifecycle: 'production',
    owner: 'platform',
    model: 'granite',
    instructions: 'Support instructions',
    executionMode: 'in-process',
    tools: ['search'],
  },
};
const selection = {
  agentRef: 'airesource:default/support',
  provider: 'openai',
  model: 'selected-model',
};
const testConversationId = '550e8400-e29b-41d4-a716-446655440000';

let server: Server;
let port: number;
let calls: Array<{
  path: string;
  owner: string | null;
  method: string;
  body: unknown;
  authorization?: string;
}>;
let respondUpstream: ((response: Response) => void) | undefined;
let catalogLookups: Array<{ ref: string; owner: string }> = [];

beforeAll(async () => {
  const upstream = express();
  upstream.use(express.json());
  upstream.use((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const owner = url.searchParams.get('user_id');
    calls.push({
      path: req.path,
      owner,
      method: req.method,
      body: req.body,
      authorization: req.headers.authorization,
    });
    if (respondUpstream) {
      respondUpstream(res);
      return;
    }
    if (url.pathname === '/v1/agent/run') {
      res.status(202).json({ workflow_id: 'wf-1', status: 'running' });
      return;
    }
    if (req.method === 'DELETE') {
      res.status(204).end();
      return;
    }
    res.json({
      conversations:
        owner === 'user:default/alice'
          ? [{ conversation_id: testConversationId }]
          : [],
    });
  });
  server = await new Promise<Server>(resolve => {
    const listener = upstream.listen(0, '127.0.0.1', () => resolve(listener));
  });
  port = (server.address() as AddressInfo).port;
});
afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close(error => (error ? reject(error) : resolve())),
  );
});
beforeEach(() => {
  calls = [];
  catalogLookups = [];
  respondUpstream = undefined;
});

async function app(
  options: {
    allowed?: boolean;
    anonymous?: boolean;
    catalogDenied?: boolean;
    missingAgent?: boolean;
    catalogAgent?: typeof agent;
  } = {},
) {
  const router = await createRouter({
    config: new ConfigReader({
      'agentic-chat': {
        servicePort: port,
      },
    }),
    logger: mockServices.logger.mock(),
    httpAuth: mockServices.httpAuth({
      defaultCredentials: options.anonymous
        ? mockCredentials.none()
        : mockCredentials.user('user:default/alice'),
    }),
    userInfo: mockServices.userInfo(),
    permissions: mockServices.permissions.mock({
      authorize: async items =>
        items.map(({ permission }) => ({
          result:
            permission.name === 'agentic-chat.chat' && options.allowed !== false
              ? AuthorizeResult.ALLOW
              : AuthorizeResult.DENY,
        })),
    }),
    catalog: {
      getEntityByRef: async (
        ref: string,
        { credentials }: Parameters<CatalogService['getEntityByRef']>[1],
      ) => {
        const identity = await mockServices.userInfo().getUserInfo(credentials);
        catalogLookups.push({ ref, owner: identity.userEntityRef });
        if (
          options.catalogDenied ||
          identity.userEntityRef !== 'user:default/alice'
        )
          throw new NotAllowedError('Forbidden');
        if (options.missingAgent) return undefined;
        if (ref === 'airesource:default/support')
          return options.catalogAgent ?? agent;
        if (ref === 'airesource:default/legal-chat') return legalAgent;
        return undefined;
      },
    } as unknown as CatalogService,
  });
  return express().use(router);
}

it('submits one mapped workflow with trusted identity and preserves upstream acceptance', async () => {
  const response = await request(await app())
    .post('/v1/agent/run')
    .send({
      ...selection,
      query: 'Hello',
      conversation_id: testConversationId,
    });
  expect(response.status).toBe(202);
  expect(response.body).toEqual({ workflow_id: 'wf-1', status: 'running' });
  expect(calls).toEqual([
    {
      path: '/v1/agent/run',
      owner: 'user:default/alice',
      method: 'POST',
      authorization: undefined,
      body: {
        agent: 'support',
        prompt: 'Hello',
        instructions: 'Support instructions',
        spawn: 'none',
        tools: ['search'],
        inference_provider: { name: 'openai', model: 'selected-model' },
        conversation_id: testConversationId,
      },
    },
  ]);
});

it.each([
  ['get', '/v2/conversations'],
  ['get', `/v2/conversations/${testConversationId}`],
  ['delete', `/v2/conversations/${testConversationId}`],
  ['post', '/v1/agent/run'],
])('requires agentic-chat.chat on %s %s', async (method, path) => {
  const client = request(await app({ allowed: false }));
  let response;
  if (method === 'post') {
    response = await client.post(path).send({ ...selection, query: 'Hello' });
  } else if (method === 'delete') {
    response = await client.delete(path);
  } else {
    response = await client.get(path);
  }
  expect(response.status).toBe(403);
  expect(calls).toHaveLength(0);
});

it('rejects anonymous callers before runtime dispatch', async () => {
  expect(
    (await request(await app({ anonymous: true })).get('/v2/conversations'))
      .status,
  ).toBe(401);
  expect(calls).toHaveLength(0);
});

it('forwards history with trusted owner instead of browser user_id or Authorization', async () => {
  const response = await request(await app())
    .get('/v2/conversations?user_id=user:default/bob')
    .set('Authorization', mockCredentials.user.header('user:default/alice'));
  expect(response.status).toBe(200);
  expect(response.body).toEqual({
    conversations: [{ conversation_id: testConversationId }],
  });
  expect(calls[0]).toMatchObject({
    owner: 'user:default/alice',
    authorization: undefined,
  });
});

it('preserves a successful no-content delete response', async () => {
  const response = await request(await app()).delete(
    `/v2/conversations/${testConversationId}`,
  );
  expect(response.status).toBe(204);
  expect(response.text).toBe('');
  expect(calls[0]).toMatchObject({
    method: 'DELETE',
    path: `/v2/conversations/${testConversationId}`,
    owner: 'user:default/alice',
  });
});

it.each([
  ['get', testConversationId.replace('-', '%2d')],
  ['delete', testConversationId.replace('-', '%2d')],
  ['get', '%2E'],
  ['delete', '%2E%2E'],
] as const)(
  'forwards the encoded conversation ID unchanged on %s for %s',
  async (method, encodedId) => {
    respondUpstream = res => res.status(400).json({ error: 'Invalid ID' });
    const path = `/v2/conversations/${encodedId}`;
    const response = await request(await app())[method](path);

    expect(response.status).toBe(400);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      method: method.toUpperCase(),
      path,
      owner: 'user:default/alice',
    });
  },
);

it('leaves run request conversation ID format validation to LCORE', async () => {
  respondUpstream = res => res.status(400).json({ error: 'Invalid ID' });
  const conversationId = 'invalid id';
  const response = await request(await app())
    .post('/v1/agent/run')
    .send({ ...selection, query: 'Hello', conversation_id: conversationId });

  expect(response.status).toBe(400);
  expect(calls).toHaveLength(1);
  expect(calls[0].body).toMatchObject({ conversation_id: conversationId });
});

it('rejects identity overrides and reports missing Catalog agents', async () => {
  const client = request(await app());
  expect(
    (
      await client
        .post('/v1/agent/run')
        .send({ ...selection, query: 'Hello', user_id: 'bob' })
    ).status,
  ).toBe(400);
  expect(
    (
      await client.post('/v1/agent/run').send({
        ...selection,
        query: 'Hello',
        agentRef: 'airesource:default/other',
      })
    ).status,
  ).toBe(404);
  expect(calls).toHaveLength(0);
});

it.each([
  [{ ...agent, kind: 'Component' }, 'Expected an AiResource agent'],
  [
    { ...agent, apiVersion: 'backstage.io/v1beta1' },
    'Invalid agent configuration',
  ],
  [
    { ...agent, spec: { ...agent.spec, type: 'agent' } },
    'Invalid agent configuration',
  ],
])(
  'rejects invalid Catalog agents before upstream dispatch %#',
  async (catalogAgent, message) => {
    const response = await request(await app({ catalogAgent }))
      .post('/v1/agent/run')
      .send({ ...selection, query: 'Hello' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({ name: 'InputError', message });
    expect(calls).toHaveLength(0);
  },
);

it('honors Catalog denial and missing entities before submission', async () => {
  expect(
    (
      await request(await app({ catalogDenied: true }))
        .post('/v1/agent/run')
        .send({ ...selection, query: 'Hello' })
    ).status,
  ).toBe(403);
  expect(
    (
      await request(await app({ missingAgent: true }))
        .post('/v1/agent/run')
        .send({ ...selection, query: 'Hello' })
    ).status,
  ).toBe(404);
  expect(calls).toHaveLength(0);
});

it('returns a safe dependency failure without upstream details', async () => {
  respondUpstream = res => {
    res.status(500).json({ error: 'PRIVATE_UPSTREAM_CREDENTIAL' });
  };
  const response = await request(await app()).get('/v2/conversations');
  expect(response.status).toBe(502);
  expect(response.text).not.toContain('PRIVATE_UPSTREAM_CREDENTIAL');
});

it.each(['120', undefined])(
  'preserves upstream rate limiting with Retry-After %s',
  async retryAfter => {
    respondUpstream = res => {
      if (retryAfter !== undefined) res.set('Retry-After', retryAfter);
      res.status(429).json({ error: 'PRIVATE_UPSTREAM_CREDENTIAL' });
    };
    const response = await request(await app())
      .post('/v1/agent/run')
      .send({ ...selection, query: 'Hello' });

    expect(response.status).toBe(429);
    expect(response.headers['retry-after']).toBe(retryAfter);
    expect(response.body).toEqual({ error: 'Chat runtime request failed' });
  },
);

it('returns a sanitized 502 when LCORE disconnects', async () => {
  respondUpstream = res => {
    res.destroy();
  };

  const response = await request(await app()).get('/v2/conversations');

  expect(response.status).toBe(502);
  expect(response.body).toEqual({ error: 'Chat runtime unavailable' });
});

it('returns a sanitized 502 when the LCORE request times out', async () => {
  respondUpstream = () => undefined;
  const createTimeout = AbortSignal.timeout;
  const timeout = jest
    .spyOn(AbortSignal, 'timeout')
    .mockImplementationOnce(() => createTimeout(100));

  try {
    const response = await request(await app()).get('/v2/conversations');

    expect(response.status).toBe(502);
    expect(response.body).toEqual({ error: 'Chat runtime unavailable' });
  } finally {
    timeout.mockRestore();
  }
});

it('returns a sanitized 502 without following an LCORE redirect', async () => {
  respondUpstream = res => {
    res.redirect('/redirect-target');
  };

  const response = await request(await app()).get('/v2/conversations');

  expect(response.status).toBe(502);
  expect(response.body).toEqual({ error: 'Chat runtime unavailable' });
  expect(calls.map(call => call.path)).toEqual(['/v2/conversations']);
});

it('returns a sanitized 502 when LCORE returns malformed JSON', async () => {
  respondUpstream = res => {
    res.type('json').send('{"error":"PRIVATE_UPSTREAM_CREDENTIAL"');
  };

  const response = await request(await app()).get('/v2/conversations');

  expect(response.status).toBe(502);
  expect(response.body).toEqual({ error: 'Chat runtime unavailable' });
});

it('captures the supplied Legal agent request at the new upstream agent endpoint', async () => {
  const { server: backendServer } = await startTestBackend({
    features: [
      agenticChatPlugin,
      mockServices.rootConfig.factory({
        data: {
          'agentic-chat': {
            servicePort: port,
          },
        },
      }),
      mockServices.permissions.factory({ result: AuthorizeResult.ALLOW }),
      createServiceFactory({
        service: catalogServiceRef,
        deps: {},
        factory: async () =>
          ({
            getEntityByRef: async (ref: string) =>
              ref === 'airesource:default/legal-chat' ? legalAgent : undefined,
          }) as unknown as CatalogService,
      }),
    ],
  });
  const response = await request(backendServer)
    .post('/api/agentic-chat/v1/agent/run')
    .set('Authorization', mockCredentials.user.header('user:default/alice'))
    .send(legalRunRequest);
  expect(response.status).toBe(202);
  expect(calls).toEqual([
    {
      path: '/v1/agent/run',
      owner: 'user:default/alice',
      method: 'POST',
      authorization: undefined,
      body: legalUpstreamRequest,
    },
  ]);
});

it.each([
  {},
  { provider: 'openai' },
  { model: 'selected-model' },
  { provider: '  ', model: 'selected-model' },
  { provider: 'openai', model: {} },
  { provider: { name: 'openai' }, model: 'selected-model' },
])(
  'rejects invalid frontend selection before upstream dispatch: %j',
  async fields => {
    const response = await request(await app())
      .post('/v1/agent/run')
      .send({ query: 'Hello', agentRef: selection.agentRef, ...fields });
    expect(response.status).toBe(400);
    expect(calls).toHaveLength(0);
  },
);

it.each(['support', 'legal-chat'])(
  'resolves the requested %s agent with trusted caller credentials',
  async name => {
    const agentRef = `airesource:default/${name}`;
    const response = await request(await app())
      .post('/v1/agent/run')
      .send({
        ...selection,
        agentRef,
        query: 'Hello',
      });
    expect(response.status).toBe(202);
    expect(catalogLookups).toEqual([
      { ref: agentRef, owner: 'user:default/alice' },
    ]);
    expect(calls[0].body).not.toHaveProperty('provider');
    const entity = name === 'support' ? agent : legalAgent;
    expect(calls[0].body).not.toHaveProperty('definition');
    expect(calls[0].body).not.toHaveProperty('inference_provider.modelConfig');
    expect(calls).toMatchObject([
      {
        body: {
          agent: name,
          prompt: 'Hello',
          instructions: entity.spec.instructions,
          inference_provider: { name: 'openai', model: 'selected-model' },
        },
      },
    ]);
  },
);

it('canonicalizes frontend references before Catalog lookup', async () => {
  const response = await request(await app())
    .post('/v1/agent/run')
    .send({
      ...selection,
      agentRef: 'AiResource:DEFAULT/LEGAL-CHAT',
      query: 'Hello',
    });
  expect(response.status).toBe(202);
  expect(catalogLookups).toEqual([
    { ref: 'airesource:default/legal-chat', owner: 'user:default/alice' },
  ]);
});

it.each([undefined, null, '', '  ', 'airesource:default/', ':default/legal'])(
  'rejects absent or malformed agentRef %j before Catalog lookup',
  async agentRef => {
    const response = await request(await app())
      .post('/v1/agent/run')
      .send({
        ...selection,
        query: 'Hello',
        agentRef,
      });
    expect(response.status).toBe(400);
    expect(catalogLookups).toHaveLength(0);
    expect(calls).toHaveLength(0);
  },
);
