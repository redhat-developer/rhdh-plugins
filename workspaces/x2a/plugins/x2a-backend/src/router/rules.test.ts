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

describe('createRouter – rules', () => {
  afterEach(async () => {
    await tearDownDatabases();
  });

  describe('GET /rules', () => {
    it.each(supportedDatabaseIds)(
      'should return 200 and empty array when no rules exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const response = await request(app).get('/rules').send();

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({ items: [] });
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 200 with rules when rules exist - %p',
      async databaseId => {
        const { client, x2aDatabase } =
          await createDatabaseAndService(databaseId);
        const app = await createApp(client);

        await x2aDatabase.createRule({
          title: 'Rule A',
          description: 'Description A',
          required: true,
        });
        await x2aDatabase.createRule({
          title: 'Rule B',
          description: 'Description B',
          required: false,
        });

        const response = await request(app).get('/rules').send();

        expect(response.status).toBe(200);
        expect(response.body.items).toHaveLength(2);
        expect(response.body.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              title: 'Rule A',
              description: 'Description A',
              required: true,
            }),
            expect.objectContaining({
              title: 'Rule B',
              description: 'Description B',
              required: false,
            }),
          ]),
        );
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 403 when user has no permissions - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(
          client,
          AuthorizeResult.DENY,
          undefined,
          undefined,
          AuthorizeResult.DENY,
        );

        const response = await request(app).get('/rules').send();

        expect(response.status).toBe(403);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotAllowedError',
          },
        });
      },
      LONG_TEST_TIMEOUT,
    );
  });

  describe('GET /rules/:ruleId', () => {
    it.each(supportedDatabaseIds)(
      'should return 200 with rule when rule exists - %p',
      async databaseId => {
        const { client, x2aDatabase } =
          await createDatabaseAndService(databaseId);
        const app = await createApp(client);

        const rule = await x2aDatabase.createRule({
          title: 'Test Rule',
          description: 'Test Description',
          required: true,
        });

        const response = await request(app).get(`/rules/${rule.id}`).send();

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          id: rule.id,
          title: 'Test Rule',
          description: 'Test Description',
          required: true,
        });
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 404 when rule does not exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const response = await request(app)
          .get(`/rules/${nonExistentId}`)
          .send();

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotFoundError',
            message: 'Rule not found',
          },
        });
      },
    );

    it.each(supportedDatabaseIds)(
      'should return 403 when user has no permissions - %p',
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
          .get(`/rules/${nonExistentId}`)
          .send();

        expect(response.status).toBe(403);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotAllowedError',
          },
        });
      },
      LONG_TEST_TIMEOUT,
    );
  });

  describe('POST /rules', () => {
    it.each(supportedDatabaseIds)(
      'should create a rule and return 201 - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const response = await request(app).post('/rules').send({
          title: 'New Rule',
          description: 'New Description',
          required: true,
        });

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          id: expect.any(String),
          title: 'New Rule',
          description: 'New Description',
          required: true,
        });
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should create a rule with required defaulting to false when omitted - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const response = await request(app).post('/rules').send({
          title: 'Optional Rule',
          description: 'Optional Description',
        });

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          title: 'Optional Rule',
          description: 'Optional Description',
        });
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 400 when body is invalid - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const response = await request(app)
          .post('/rules')
          .send({ title: 'Only title' });

        expect(response.status).toBe(400);
        expect(response.body.error.name).toBe('InputError');
      },
    );

    it.each(supportedDatabaseIds)(
      'should return 400 when body is empty - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const response = await request(app).post('/rules').send({});

        expect(response.status).toBe(400);
        expect(response.body.error.name).toBe('InputError');
      },
    );

    it.each(supportedDatabaseIds)(
      'should return 403 when user lacks admin write permission - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(
          client,
          AuthorizeResult.ALLOW,
          AuthorizeResult.DENY,
        );

        const response = await request(app).post('/rules').send({
          title: 'Forbidden Rule',
          description: 'Should be rejected',
          required: false,
        });

        expect(response.status).toBe(403);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotAllowedError',
            message: 'You are not allowed to create rules',
          },
        });
      },
      LONG_TEST_TIMEOUT,
    );
  });

  describe('PUT /rules/:ruleId', () => {
    it.each(supportedDatabaseIds)(
      'should update a rule and return 200 - %p',
      async databaseId => {
        const { client, x2aDatabase } =
          await createDatabaseAndService(databaseId);
        const app = await createApp(client);

        const rule = await x2aDatabase.createRule({
          title: 'Original Title',
          description: 'Original Description',
          required: false,
        });

        const response = await request(app).put(`/rules/${rule.id}`).send({
          title: 'Updated Title',
          description: 'Updated Description',
          required: true,
        });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          id: rule.id,
          title: 'Updated Title',
          description: 'Updated Description',
          required: true,
        });
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 404 when rule does not exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const response = await request(app)
          .put(`/rules/${nonExistentId}`)
          .send({
            title: 'Nonexistent',
            description: 'Should not exist',
            required: false,
          });

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotFoundError',
            message: 'Rule not found',
          },
        });
      },
    );

    it.each(supportedDatabaseIds)(
      'should return 400 when body is invalid - %p',
      async databaseId => {
        const { client, x2aDatabase } =
          await createDatabaseAndService(databaseId);
        const app = await createApp(client);

        const rule = await x2aDatabase.createRule({
          title: 'Some Rule',
          description: 'Some Description',
          required: false,
        });

        const response = await request(app)
          .put(`/rules/${rule.id}`)
          .send({ title: 'Missing required fields' });

        expect(response.status).toBe(400);
        expect(response.body.error.name).toBe('InputError');
      },
    );

    it.each(supportedDatabaseIds)(
      'should return 403 when user lacks admin write permission - %p',
      async databaseId => {
        const { client, x2aDatabase } =
          await createDatabaseAndService(databaseId);
        const rule = await x2aDatabase.createRule({
          title: 'Protected Rule',
          description: 'Cannot update',
          required: false,
        });

        const app = await createApp(
          client,
          AuthorizeResult.ALLOW,
          AuthorizeResult.DENY,
        );

        const response = await request(app).put(`/rules/${rule.id}`).send({
          title: 'Forbidden Update',
          description: 'Should be rejected',
          required: true,
        });

        expect(response.status).toBe(403);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotAllowedError',
            message: 'You are not allowed to update rules',
          },
        });
      },
      LONG_TEST_TIMEOUT,
    );
  });

  describe('DELETE /rules/:ruleId', () => {
    it.each(supportedDatabaseIds)(
      'should delete a rule and return 200 with deletedCount 1 - %p',
      async databaseId => {
        const { client, x2aDatabase } =
          await createDatabaseAndService(databaseId);
        const app = await createApp(client);

        const rule = await x2aDatabase.createRule({
          title: 'Rule to Delete',
          description: 'Will be deleted',
          required: false,
        });

        const response = await request(app).delete(`/rules/${rule.id}`).send();

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({ deletedCount: 1 });

        // Verify rule no longer exists
        const listResponse = await request(app).get('/rules').send();
        expect(listResponse.body.items).toHaveLength(0);
      },
      LONG_TEST_TIMEOUT,
    );

    it.each(supportedDatabaseIds)(
      'should return 404 when rule does not exist - %p',
      async databaseId => {
        const { client } = await createDatabase(databaseId);
        const app = await createApp(client);

        const response = await request(app)
          .delete(`/rules/${nonExistentId}`)
          .send();

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotFoundError',
            message: 'Rule not found',
          },
        });
      },
    );

    it.each(supportedDatabaseIds)(
      'should return 403 when user lacks admin write permission - %p',
      async databaseId => {
        const { client, x2aDatabase } =
          await createDatabaseAndService(databaseId);
        const rule = await x2aDatabase.createRule({
          title: 'Protected Rule',
          description: 'Cannot delete',
          required: false,
        });

        const app = await createApp(
          client,
          AuthorizeResult.ALLOW,
          AuthorizeResult.DENY,
        );

        const response = await request(app).delete(`/rules/${rule.id}`).send();

        expect(response.status).toBe(403);
        expect(response.body).toMatchObject({
          error: {
            name: 'NotAllowedError',
            message: 'You are not allowed to delete rules',
          },
        });
      },
      LONG_TEST_TIMEOUT,
    );
  });
});
