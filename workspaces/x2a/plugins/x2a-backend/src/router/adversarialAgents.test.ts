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

import request from 'supertest';
import { AuthorizeResult } from '@backstage/plugin-permission-common';

import {
  createApp,
  createDatabase,
  createDatabaseAndService,
  LONG_TEST_TIMEOUT,
  nonExistentId,
  supportedDatabaseIds,
  tearDownDatabases,
} from '../__testUtils__';

const VALID_PROMPT =
  'Review the migration output for security vulnerabilities, privilege escalation, and correctness issues in the generated Ansible playbooks.';

const validAgent = {
  name: 'Security Checker',
  prompt: VALID_PROMPT,
  phases: ['analyze'],
  critical: false,
};

describe('createRouter – adversarial-agents', () => {
  afterEach(async () => {
    await tearDownDatabases();
  });

  describe('GET /adversarial-agents', () => {
    it.each(supportedDatabaseIds)(
      'returns 200 and empty list when no agents exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const response = await request(app).get('/adversarial-agents').send();

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({ agents: [], total: 0 });
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'returns 200 with all agents - %p',
      async databaseId => {
        const { client, x2aDatabase } =
          await createDatabaseAndService(databaseId);
        const app = await createApp(client);

        await x2aDatabase.createAdversarialAgent({
          ...validAgent,
          name: 'Agent Alpha',
          createdBy: 'user:default/admin',
        });
        await x2aDatabase.createAdversarialAgent({
          ...validAgent,
          name: 'Agent Beta',
          critical: true,
          createdBy: 'user:default/admin',
        });

        const response = await request(app).get('/adversarial-agents').send();

        expect(response.status).toBe(200);
        expect(response.body.total).toBe(2);
        expect(response.body.agents).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'Agent Alpha', critical: false }),
            expect.objectContaining({ name: 'Agent Beta', critical: true }),
          ]),
        );
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'filters by phase when ?phase= is provided - %p',
      async databaseId => {
        const { client, x2aDatabase } =
          await createDatabaseAndService(databaseId);
        const app = await createApp(client);

        await x2aDatabase.createAdversarialAgent({
          ...validAgent,
          name: 'Analyze Only',
          phases: ['analyze'],
          createdBy: 'user:default/admin',
        });
        await x2aDatabase.createAdversarialAgent({
          ...validAgent,
          name: 'Migrate Only',
          phases: ['migrate'],
          createdBy: 'user:default/admin',
        });

        const response = await request(app)
          .get('/adversarial-agents?phase=analyze')
          .send();

        expect(response.status).toBe(200);
        expect(response.body.total).toBe(1);
        expect(response.body.agents[0].name).toBe('Analyze Only');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'returns 403 when user has no read permission - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(
          client,
          AuthorizeResult.DENY,
          undefined,
          undefined,
          AuthorizeResult.DENY,
        );

        const response = await request(app).get('/adversarial-agents').send();

        expect(response.status).toBe(403);
        expect(response.body.error.name).toBe('NotAllowedError');
      },
      LONG_TEST_TIMEOUT,
    );
  });

  describe('GET /adversarial-agents/:id', () => {
    it.each(supportedDatabaseIds)(
      'returns 200 with the agent - %p',
      async databaseId => {
        const { client, x2aDatabase } =
          await createDatabaseAndService(databaseId);
        const app = await createApp(client);

        const agent = await x2aDatabase.createAdversarialAgent({
          ...validAgent,
          createdBy: 'user:default/admin',
        });

        const response = await request(app)
          .get(`/adversarial-agents/${agent.id}`)
          .send();

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          id: agent.id,
          name: validAgent.name,
          phases: validAgent.phases,
          critical: false,
        });
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'returns 404 when agent does not exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const response = await request(app)
          .get(`/adversarial-agents/${nonExistentId}`)
          .send();

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotFoundError',
            message: 'Adversarial agent not found',
          },
        });
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'returns 403 when user has no read permission - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(
          client,
          AuthorizeResult.DENY,
          undefined,
          undefined,
          AuthorizeResult.DENY,
        );

        const response = await request(app)
          .get(`/adversarial-agents/${nonExistentId}`)
          .send();

        expect(response.status).toBe(403);
        expect(response.body.error.name).toBe('NotAllowedError');
      },
      LONG_TEST_TIMEOUT,
    );
  });

  describe('POST /adversarial-agents', () => {
    it.each(supportedDatabaseIds)(
      'creates an agent and returns 201 - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const response = await request(app)
          .post('/adversarial-agents')
          .send(validAgent);

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          id: expect.any(String),
          name: validAgent.name,
          prompt: validAgent.prompt,
          phases: validAgent.phases,
          critical: false,
        });
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'creates a critical agent - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const response = await request(app)
          .post('/adversarial-agents')
          .send({ ...validAgent, critical: true });

        expect(response.status).toBe(201);
        expect(response.body.critical).toBe(true);
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'returns 400 when name is missing - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const { name: _name, ...withoutName } = validAgent;
        const response = await request(app)
          .post('/adversarial-agents')
          .send(withoutName);

        expect(response.status).toBe(400);
        expect(response.body.error.name).toBe('InputError');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'returns 400 when prompt is too short - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const response = await request(app)
          .post('/adversarial-agents')
          .send({ ...validAgent, prompt: 'too short' });

        expect(response.status).toBe(400);
        expect(response.body.error.name).toBe('InputError');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'returns 400 when phases is empty - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const response = await request(app)
          .post('/adversarial-agents')
          .send({ ...validAgent, phases: [] });

        expect(response.status).toBe(400);
        expect(response.body.error.name).toBe('InputError');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'returns 400 when critical is missing - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const { critical: _critical, ...withoutCritical } = validAgent;
        const response = await request(app)
          .post('/adversarial-agents')
          .send(withoutCritical);

        expect(response.status).toBe(400);
        expect(response.body.error.name).toBe('InputError');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'returns 403 when user lacks admin write permission - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(
          client,
          AuthorizeResult.ALLOW,
          AuthorizeResult.DENY,
        );

        const response = await request(app)
          .post('/adversarial-agents')
          .send(validAgent);

        expect(response.status).toBe(403);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotAllowedError',
            message: 'You are not allowed to create adversarial agents',
          },
        });
      },
      LONG_TEST_TIMEOUT,
    );
  });

  describe('PUT /adversarial-agents/:id', () => {
    it.each(supportedDatabaseIds)(
      'updates an agent and returns 200 - %p',
      async databaseId => {
        const { client, x2aDatabase } =
          await createDatabaseAndService(databaseId);
        const app = await createApp(client);

        const agent = await x2aDatabase.createAdversarialAgent({
          ...validAgent,
          createdBy: 'user:default/admin',
        });

        const response = await request(app)
          .put(`/adversarial-agents/${agent.id}`)
          .send({ ...validAgent, name: 'Updated Name', critical: true });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          id: agent.id,
          name: 'Updated Name',
          critical: true,
        });
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'returns 404 when agent does not exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const response = await request(app)
          .put(`/adversarial-agents/${nonExistentId}`)
          .send(validAgent);

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotFoundError',
            message: 'Adversarial agent not found',
          },
        });
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'returns 400 when body is invalid - %p',
      async databaseId => {
        const { client, x2aDatabase } =
          await createDatabaseAndService(databaseId);
        const app = await createApp(client);

        const agent = await x2aDatabase.createAdversarialAgent({
          ...validAgent,
          createdBy: 'user:default/admin',
        });

        const response = await request(app)
          .put(`/adversarial-agents/${agent.id}`)
          .send({ name: 'Missing required fields' });

        expect(response.status).toBe(400);
        expect(response.body.error.name).toBe('InputError');
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'returns 403 when user lacks admin write permission - %p',
      async databaseId => {
        const { client, x2aDatabase } =
          await createDatabaseAndService(databaseId);
        const agent = await x2aDatabase.createAdversarialAgent({
          ...validAgent,
          createdBy: 'user:default/admin',
        });

        const app = await createApp(
          client,
          AuthorizeResult.ALLOW,
          AuthorizeResult.DENY,
        );

        const response = await request(app)
          .put(`/adversarial-agents/${agent.id}`)
          .send({ ...validAgent, name: 'Forbidden Update' });

        expect(response.status).toBe(403);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotAllowedError',
            message: 'You are not allowed to update adversarial agents',
          },
        });
      },
      LONG_TEST_TIMEOUT,
    );
  });

  describe('DELETE /adversarial-agents/:id', () => {
    it.each(supportedDatabaseIds)(
      'deletes an agent and returns 204 - %p',
      async databaseId => {
        const { client, x2aDatabase } =
          await createDatabaseAndService(databaseId);
        const app = await createApp(client);

        const agent = await x2aDatabase.createAdversarialAgent({
          ...validAgent,
          createdBy: 'user:default/admin',
        });

        const response = await request(app)
          .delete(`/adversarial-agents/${agent.id}`)
          .send();

        expect(response.status).toBe(204);

        // Verify agent is gone
        const listResponse = await request(app)
          .get('/adversarial-agents')
          .send();
        expect(listResponse.body.total).toBe(0);
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'returns 404 when agent does not exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const response = await request(app)
          .delete(`/adversarial-agents/${nonExistentId}`)
          .send();

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotFoundError',
            message: 'Adversarial agent not found',
          },
        });
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'returns 403 when user lacks admin write permission - %p',
      async databaseId => {
        const { client, x2aDatabase } =
          await createDatabaseAndService(databaseId);
        const agent = await x2aDatabase.createAdversarialAgent({
          ...validAgent,
          createdBy: 'user:default/admin',
        });

        const app = await createApp(
          client,
          AuthorizeResult.ALLOW,
          AuthorizeResult.DENY,
        );

        const response = await request(app)
          .delete(`/adversarial-agents/${agent.id}`)
          .send();

        expect(response.status).toBe(403);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotAllowedError',
            message: 'You are not allowed to delete adversarial agents',
          },
        });
      },
      LONG_TEST_TIMEOUT,
    );
  });
});
