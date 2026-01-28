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

import { JobResourceBuilder } from './JobResourceBuilder';
import { X2AConfig, JobCreateParams } from './types';

describe('JobResourceBuilder', () => {
  let mockConfig: X2AConfig;

  beforeEach(() => {
    mockConfig = {
      kubernetes: {
        namespace: 'test-namespace',
        image: 'quay.io/x2ansible/x2a-convertor',
        imageTag: 'latest',
        ttlSecondsAfterFinished: 86400,
        resources: {
          requests: { cpu: '500m', memory: '1Gi' },
          limits: { cpu: '2000m', memory: '4Gi' },
        },
      },
      credentials: {
        llm: {
          LLM_MODEL: 'anthropic.claude-v2',
          AWS_REGION: 'us-east-1',
          AWS_ACCESS_KEY_ID: 'AKIA_TEST',
          AWS_SECRET_ACCESS_KEY: 'test-secret-key', // NOSONAR
        },
        aap: {
          url: 'https://aap.example.com',
          orgName: 'TestOrg',
          oauthToken: 'test-oauth-token', // NOSONAR
        },
      },
    };
  });

  describe('buildProjectSecret', () => {
    const projectId = 'proj-123';

    describe('LLM credential handling', () => {
      it('should include all LLM credentials from config', () => {
        const secret = JobResourceBuilder.buildProjectSecret(
          projectId,
          undefined,
          mockConfig,
        );

        // All LLM credentials should be included as-is
        expect(secret.stringData).toMatchObject({
          LLM_MODEL: 'anthropic.claude-v2',
          AWS_REGION: 'us-east-1',
          AWS_ACCESS_KEY_ID: 'AKIA_TEST',
          AWS_SECRET_ACCESS_KEY: 'test-secret-key', // NOSONAR
        });
      });

      it('should support alternative LLM credential formats', () => {
        mockConfig.credentials.llm = {
          LLM_MODEL: 'anthropic.claude-v2',
          AWS_REGION: 'us-east-1',
          AWS_BEARER_TOKEN_BEDROCK: 'test-bearer-token', // NOSONAR
        };

        const secret = JobResourceBuilder.buildProjectSecret(
          projectId,
          undefined,
          mockConfig,
        );

        // Should include exactly what was in the config
        expect(secret.stringData).toMatchObject({
          LLM_MODEL: 'anthropic.claude-v2',
          AWS_REGION: 'us-east-1',
          AWS_BEARER_TOKEN_BEDROCK: 'test-bearer-token', // NOSONAR
        });
        expect(secret.stringData!.AWS_ACCESS_KEY_ID).toBeUndefined();
        expect(secret.stringData!.AWS_SECRET_ACCESS_KEY).toBeUndefined();
      });

      it('should support generic LLM providers (e.g., OpenAI)', () => {
        mockConfig.credentials.llm = {
          OPENAI_API_KEY: 'sk-test-key', // NOSONAR
          OPENAI_MODEL: 'gpt-4',
          OPENAI_ORG_ID: 'org-test',
        };

        const secret = JobResourceBuilder.buildProjectSecret(
          projectId,
          undefined,
          mockConfig,
        );

        expect(secret.stringData).toMatchObject({
          OPENAI_API_KEY: 'sk-test-key', // NOSONAR
          OPENAI_MODEL: 'gpt-4',
          OPENAI_ORG_ID: 'org-test',
        });
      });
    });

    describe('AAP credential validation', () => {
      it('should create secret with OAuth token from config', () => {
        const secret = JobResourceBuilder.buildProjectSecret(
          projectId,
          undefined,
          mockConfig,
        );

        expect(secret.stringData).toMatchObject({
          AAP_CONTROLLER_URL: 'https://aap.example.com',
          AAP_ORG_NAME: 'TestOrg',
          AAP_OAUTH_TOKEN: 'test-oauth-token',
        });
        expect(secret.stringData!.AAP_USERNAME).toBeUndefined();
        expect(secret.stringData!.AAP_PASSWORD).toBeUndefined();
        expect(secret.metadata?.annotations).toMatchObject({
          'x2a.redhat.com/aap-auth-method': 'oauth-token',
          'x2a.redhat.com/aap-source': 'config',
        });
      });

      it('should create secret with username+password from config', () => {
        mockConfig.credentials.aap = {
          url: 'https://aap.example.com',
          orgName: 'TestOrg',
          username: 'admin',
          password: 'admin-password', // NOSONAR
        };

        const secret = JobResourceBuilder.buildProjectSecret(
          projectId,
          undefined,
          mockConfig,
        );

        expect(secret.stringData).toMatchObject({
          AAP_CONTROLLER_URL: 'https://aap.example.com',
          AAP_ORG_NAME: 'TestOrg',
          AAP_USERNAME: 'admin',
          AAP_PASSWORD: 'admin-password', // NOSONAR
        });
        expect(secret.stringData!.AAP_OAUTH_TOKEN).toBeUndefined();
        expect(secret.metadata?.annotations).toMatchObject({
          'x2a.redhat.com/aap-auth-method': 'basic',
          'x2a.redhat.com/aap-source': 'config',
        });
      });

      it('should use user-provided AAP credentials over config', () => {
        const userAapCreds = {
          url: 'https://user-aap.example.com',
          orgName: 'UserOrg',
          username: 'user',
          password: 'pass', // NOSONAR
        };

        const secret = JobResourceBuilder.buildProjectSecret(
          projectId,
          userAapCreds,
          mockConfig,
        );

        expect(secret.stringData).toMatchObject({
          AAP_CONTROLLER_URL: 'https://user-aap.example.com',
          AAP_ORG_NAME: 'UserOrg',
          AAP_USERNAME: 'user',
          AAP_PASSWORD: 'pass', // NOSONAR
        });
        expect(secret.stringData!.AAP_OAUTH_TOKEN).toBeUndefined();
        expect(secret.metadata?.annotations).toMatchObject({
          'x2a.redhat.com/aap-auth-method': 'basic',
          'x2a.redhat.com/aap-source': 'user-provided',
        });
      });

      it('should throw error when no AAP credentials provided', () => {
        mockConfig.credentials.aap = undefined;

        expect(() =>
          JobResourceBuilder.buildProjectSecret(
            projectId,
            undefined,
            mockConfig,
          ),
        ).toThrow(
          'AAP credentials must be provided either in app-config.yaml or by the user at project creation',
        );
      });

      it('should throw error when AAP has no auth method', () => {
        mockConfig.credentials.aap = {
          url: 'https://aap.example.com',
          orgName: 'TestOrg',
        };

        expect(() =>
          JobResourceBuilder.buildProjectSecret(
            projectId,
            undefined,
            mockConfig,
          ),
        ).toThrow(
          'AAP credentials must include either oauthToken OR username+password',
        );
      });

      it('should throw error when both OAuth token and username+password provided', () => {
        mockConfig.credentials.aap = {
          url: 'https://aap.example.com',
          orgName: 'TestOrg',
          oauthToken: 'test-oauth-token', // NOSONAR
          username: 'admin',
          password: 'admin-password', // NOSONAR
        };

        expect(() =>
          JobResourceBuilder.buildProjectSecret(
            projectId,
            undefined,
            mockConfig,
          ),
        ).toThrow(
          'AAP credentials should have either oauthToken OR username+password, not both',
        );
      });

      it('should throw error when only username provided', () => {
        mockConfig.credentials.aap = {
          url: 'https://aap.example.com',
          orgName: 'TestOrg',
          username: 'admin',
        };

        expect(() =>
          JobResourceBuilder.buildProjectSecret(
            projectId,
            undefined,
            mockConfig,
          ),
        ).toThrow(
          'AAP credentials must include either oauthToken OR username+password',
        );
      });

      it('should throw error when only password provided', () => {
        mockConfig.credentials.aap = {
          url: 'https://aap.example.com',
          orgName: 'TestOrg',
          password: 'admin-password', // NOSONAR
        };

        expect(() =>
          JobResourceBuilder.buildProjectSecret(
            projectId,
            undefined,
            mockConfig,
          ),
        ).toThrow(
          'AAP credentials must include either oauthToken OR username+password',
        );
      });
    });

    it('should NOT include Git repository credentials in project secret', () => {
      const secret = JobResourceBuilder.buildProjectSecret(
        projectId,
        undefined,
        mockConfig,
      );

      // Project secret should only have LLM + AAP credentials
      expect(secret.stringData!.SOURCE_REPO_URL).toBeUndefined();
      expect(secret.stringData!.SOURCE_REPO_TOKEN).toBeUndefined();
      expect(secret.stringData!.SOURCE_REPO_BRANCH).toBeUndefined();
      expect(secret.stringData!.TARGET_REPO_URL).toBeUndefined();
      expect(secret.stringData!.TARGET_REPO_TOKEN).toBeUndefined();
      expect(secret.stringData!.TARGET_REPO_BRANCH).toBeUndefined();
    });

    describe('Secret metadata', () => {
      it('should include correct labels', () => {
        const secret = JobResourceBuilder.buildProjectSecret(
          projectId,
          undefined,
          mockConfig,
        );

        expect(secret.metadata?.labels).toMatchObject({
          'app.kubernetes.io/name': 'x2a-project-secret',
          'app.kubernetes.io/component': 'credentials',
          'app.kubernetes.io/managed-by': 'x2a-backend-plugin',
          'x2a.redhat.com/project-id': projectId,
        });
      });

      it('should include correct secret name', () => {
        const secret = JobResourceBuilder.buildProjectSecret(
          projectId,
          undefined,
          mockConfig,
        );

        expect(secret.metadata?.name).toBe(`x2a-project-secret-${projectId}`);
      });

      it('should include description annotation', () => {
        const secret = JobResourceBuilder.buildProjectSecret(
          projectId,
          undefined,
          mockConfig,
        );

        expect(secret.metadata?.annotations).toMatchObject({
          'x2a.redhat.com/created-by': 'x2a-backend-plugin',
          'x2a.redhat.com/description':
            'Long-lived credentials for X2A migration project (LLM + AAP)',
          'x2a.redhat.com/secret-type': 'project',
        });
      });

      it('should be Opaque secret type', () => {
        const secret = JobResourceBuilder.buildProjectSecret(
          projectId,
          undefined,
          mockConfig,
        );

        expect(secret.type).toBe('Opaque');
        expect(secret.apiVersion).toBe('v1');
        expect(secret.kind).toBe('Secret');
      });
    });
  });

  describe('buildJobSecret', () => {
    const jobId = 'job-456';
    const projectId = 'proj-123';
    const gitCredentials = {
      sourceRepo: {
        url: 'https://github.com/org/source',
        token: 'source-token', // NOSONAR
        branch: 'main',
      },
      targetRepo: {
        url: 'https://github.com/org/target',
        token: 'target-token', // NOSONAR
        branch: 'main',
      },
    };

    it('should include source repository credentials', () => {
      const secret = JobResourceBuilder.buildJobSecret(
        jobId,
        projectId,
        gitCredentials,
      );

      expect(secret.stringData).toMatchObject({
        SOURCE_REPO_URL: 'https://github.com/org/source',
        SOURCE_REPO_TOKEN: 'source-token',
        SOURCE_REPO_BRANCH: 'main',
      });
    });

    it('should include target repository credentials', () => {
      const secret = JobResourceBuilder.buildJobSecret(
        jobId,
        projectId,
        gitCredentials,
      );

      expect(secret.stringData).toMatchObject({
        TARGET_REPO_URL: 'https://github.com/org/target',
        TARGET_REPO_TOKEN: 'target-token',
        TARGET_REPO_BRANCH: 'main',
      });
    });

    it('should NOT include LLM or AAP credentials in job secret', () => {
      const secret = JobResourceBuilder.buildJobSecret(
        jobId,
        projectId,
        gitCredentials,
      );

      // Job secret should only have Git credentials
      expect(secret.stringData!.LLM_MODEL).toBeUndefined();
      expect(secret.stringData!.AWS_REGION).toBeUndefined();
      expect(secret.stringData!.AAP_CONTROLLER_URL).toBeUndefined();
      expect(secret.stringData!.AAP_ORG_NAME).toBeUndefined();
    });

    it('should include correct labels', () => {
      const secret = JobResourceBuilder.buildJobSecret(
        jobId,
        projectId,
        gitCredentials,
      );

      expect(secret.metadata?.labels).toMatchObject({
        'app.kubernetes.io/name': 'x2a-job-secret',
        'app.kubernetes.io/component': 'credentials',
        'app.kubernetes.io/managed-by': 'x2a-backend-plugin',
        'x2a.redhat.com/job-id': jobId,
        'x2a.redhat.com/project-id': projectId,
        'x2a.redhat.com/secret-type': 'job',
      });
    });

    it('should include correct secret name', () => {
      const secret = JobResourceBuilder.buildJobSecret(
        jobId,
        projectId,
        gitCredentials,
      );

      expect(secret.metadata?.name).toBe(`x2a-job-secret-${jobId}`);
    });

    it('should include description annotation', () => {
      const secret = JobResourceBuilder.buildJobSecret(
        jobId,
        projectId,
        gitCredentials,
      );

      expect(secret.metadata?.annotations).toMatchObject({
        'x2a.redhat.com/created-by': 'x2a-backend-plugin',
        'x2a.redhat.com/description':
          'Ephemeral Git credentials for X2A job (auto-deleted with job)',
      });
    });

    it('should be Opaque secret type', () => {
      const secret = JobResourceBuilder.buildJobSecret(
        jobId,
        projectId,
        gitCredentials,
      );

      expect(secret.type).toBe('Opaque');
      expect(secret.apiVersion).toBe('v1');
      expect(secret.kind).toBe('Secret');
    });
  });

  describe('buildJobSpec', () => {
    const baseParams: JobCreateParams = {
      jobId: 'job-123',
      projectId: 'proj-123',
      projectName: 'Test Project',
      phase: 'init',
      user: 'user:default/test',
      callbackToken: 'callback-token-123', // NOSONAR
      callbackUrl: 'http://backstage:7007/api/x2a/callback', // NOSONAR
      sourceRepo: {
        url: 'https://github.com/org/source',
        token: 'source-token', // NOSONAR
        branch: 'main',
      },
      targetRepo: {
        url: 'https://github.com/org/target',
        token: 'target-token', // NOSONAR
        branch: 'main',
      },
    };

    describe('Job metadata', () => {
      it('should generate unique job name with phase', () => {
        const job1 = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);
        const job2 = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        expect(job1.metadata?.name).toMatch(/^job-x2a-init-[a-f0-9]{8}$/);
        expect(job2.metadata?.name).toMatch(/^job-x2a-init-[a-f0-9]{8}$/);
        expect(job1.metadata?.name).not.toBe(job2.metadata?.name);
      });

      it('should include all required labels with sanitized values', () => {
        const job = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        expect(job.metadata?.labels).toMatchObject({
          'app.kubernetes.io/name': 'x2a-job',
          'app.kubernetes.io/component': 'migration',
          'app.kubernetes.io/managed-by': 'x2a-backend-plugin',
          'x2a.redhat.com/project-id': 'proj-123',
          'x2a.redhat.com/project-name': 'Test-Project',
          'x2a.redhat.com/phase': 'init',
          'x2a.redhat.com/user': 'user-default-test',
          'x2a.redhat.com/job-id': 'job-123',
        });
      });

      it('should include module labels when moduleId provided with sanitized module name', () => {
        const paramsWithModule: JobCreateParams = {
          ...baseParams,
          phase: 'analyze',
          moduleId: 'module-123',
          moduleName: 'nginx-cookbook',
        };

        const job = JobResourceBuilder.buildJobSpec(
          paramsWithModule,
          mockConfig,
        );

        expect(job.metadata?.labels).toMatchObject({
          'x2a.redhat.com/module-id': 'module-123',
          'x2a.redhat.com/module-name': 'nginx-cookbook',
        });
      });

      it('should include callback URL in annotations', () => {
        const job = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        expect(job.metadata?.annotations).toMatchObject({
          'x2a.redhat.com/created-by': 'x2a-backend-plugin',
          'x2a.redhat.com/callback-url':
            'http://backstage:7007/api/x2a/callback', // NOSONAR
        });
      });

      it('should handle very long project names without ReDoS (security)', () => {
        // Create a very long string to test ReDoS protection
        const veryLongName = `${'a'.repeat(1000)}!!!!${'b'.repeat(1000)}`;
        const paramsWithLongName: JobCreateParams = {
          ...baseParams,
          projectName: veryLongName,
        };

        // Should complete quickly (not hang due to regex backtracking)
        const startTime = Date.now();
        const job = JobResourceBuilder.buildJobSpec(
          paramsWithLongName,
          mockConfig,
        );
        const duration = Date.now() - startTime;

        // Should complete in reasonable time (less than 100ms)
        expect(duration).toBeLessThan(100);

        // Should truncate to 63 chars and sanitize properly
        const projectNameLabel =
          job.metadata?.labels?.['x2a.redhat.com/project-name'];
        expect(projectNameLabel).toBeDefined();
        expect(projectNameLabel!.length).toBeLessThanOrEqual(63);
        expect(projectNameLabel).toMatch(
          /^[a-zA-Z0-9][-a-zA-Z0-9_.]*[a-zA-Z0-9]$/,
        );
      });
    });

    describe('Job spec configuration', () => {
      it('should set backoffLimit and ttlSecondsAfterFinished', () => {
        const job = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        expect(job.spec?.backoffLimit).toBe(3);
        expect(job.spec?.ttlSecondsAfterFinished).toBe(86400);
      });

      it('should set restartPolicy to Never', () => {
        const job = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        expect(job.spec?.template.spec?.restartPolicy).toBe('Never');
      });

      it('should be batch/v1 Job kind', () => {
        const job = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        expect(job.apiVersion).toBe('batch/v1');
        expect(job.kind).toBe('Job');
      });
    });

    describe('Main container - busybox echo', () => {
      it('should use busybox:latest image', () => {
        const job = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.name).toBe('x2a-echo');
        expect(container!.image).toBe('busybox:latest');
      });

      it('should set base environment variables', () => {
        const job = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.env).toEqual(
          expect.arrayContaining([
            { name: 'PHASE', value: 'init' },
            { name: 'PROJECT_ID', value: 'proj-123' },
            { name: 'PROJECT_NAME', value: 'Test Project' },
            { name: 'JOB_ID', value: 'job-123' },
            { name: 'USER', value: 'user:default/test' },
            {
              name: 'CALLBACK_URL',
              value: 'http://backstage:7007/api/x2a/callback', // NOSONAR
            },
            { name: 'CALLBACK_TOKEN', value: 'callback-token-123' },
          ]),
        );
      });

      it('should mount both project and job secrets via envFrom', () => {
        const job = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.envFrom).toEqual([
          {
            secretRef: {
              name: 'x2a-project-secret-proj-123',
            },
          },
          {
            secretRef: {
              name: 'x2a-job-secret-job-123',
            },
          },
        ]);
      });

      it('should include module environment variables when provided', () => {
        const paramsWithModule: JobCreateParams = {
          ...baseParams,
          phase: 'analyze',
          moduleId: 'module-123',
          moduleName: 'nginx-cookbook',
        };

        const job = JobResourceBuilder.buildJobSpec(
          paramsWithModule,
          mockConfig,
        );

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.env).toEqual(
          expect.arrayContaining([
            { name: 'MODULE_ID', value: 'module-123' },
            { name: 'MODULE_NAME', value: 'nginx-cookbook' },
          ]),
        );
      });

      it('should include user prompt when provided', () => {
        const paramsWithPrompt: JobCreateParams = {
          ...baseParams,
          userPrompt: 'Focus on security configurations',
        };

        const job = JobResourceBuilder.buildJobSpec(
          paramsWithPrompt,
          mockConfig,
        );

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.env).toEqual(
          expect.arrayContaining([
            { name: 'USER_PROMPT', value: 'Focus on security configurations' },
          ]),
        );
      });
    });

    describe('Command generation for init phase', () => {
      it('should generate echo command for init phase', () => {
        const job = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.command).toHaveLength(3);
        expect(container!.command![0]).toBe('/bin/sh');
        expect(container!.command![1]).toBe('-c');
        expect(container!.command![2]).toContain('===== X2A Init Phase =====');
        expect(container!.command![2]).toContain('Project: Test Project');
        expect(container!.command![2]).toContain('Job ID: job-123');
        expect(container!.command![2]).toContain('User: user:default/test');
        expect(container!.command![2]).toContain('Simulating init phase');
      });

      it('should include user prompt in init command when provided', () => {
        const paramsWithPrompt: JobCreateParams = {
          ...baseParams,
          userPrompt: 'Focus on security',
        };

        const job = JobResourceBuilder.buildJobSpec(
          paramsWithPrompt,
          mockConfig,
        );

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.command![2]).toContain(
          'User Prompt: Focus on security',
        );
      });
    });

    describe('Command generation for analyze phase', () => {
      it('should generate echo command for analyze phase', () => {
        const analyzeParams: JobCreateParams = {
          ...baseParams,
          phase: 'analyze',
          moduleId: 'module-123',
          moduleName: 'nginx-cookbook',
        };

        const job = JobResourceBuilder.buildJobSpec(analyzeParams, mockConfig);

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.command![0]).toBe('/bin/sh');
        expect(container!.command![1]).toBe('-c');
        expect(container!.command![2]).toContain(
          '===== X2A Analyze Phase =====',
        );
        expect(container!.command![2]).toContain('Module: nginx-cookbook');
        expect(container!.command![2]).toContain('Simulating analyze phase');
      });

      it('should include user prompt in analyze command when provided', () => {
        const analyzeParams: JobCreateParams = {
          ...baseParams,
          phase: 'analyze',
          moduleId: 'module-123',
          moduleName: 'nginx-cookbook',
          userPrompt: 'Focus on nginx config files',
        };

        const job = JobResourceBuilder.buildJobSpec(analyzeParams, mockConfig);

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.command![2]).toContain(
          'User Prompt: Focus on nginx config files',
        );
      });

      it('should throw error when analyze phase has no module name', () => {
        const invalidParams: JobCreateParams = {
          ...baseParams,
          phase: 'analyze',
        };

        expect(() =>
          JobResourceBuilder.buildJobSpec(invalidParams, mockConfig),
        ).toThrow('moduleName is required for analyze phase');
      });
    });

    describe('Command generation for migrate phase', () => {
      it('should generate echo command for migrate phase', () => {
        const migrateParams: JobCreateParams = {
          ...baseParams,
          phase: 'migrate',
          moduleId: 'module-123',
          moduleName: 'nginx-cookbook',
        };

        const job = JobResourceBuilder.buildJobSpec(migrateParams, mockConfig);

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.command![0]).toBe('/bin/sh');
        expect(container!.command![1]).toBe('-c');
        expect(container!.command![2]).toContain(
          '===== X2A Migrate Phase =====',
        );
        expect(container!.command![2]).toContain('Module: nginx-cookbook');
        expect(container!.command![2]).toContain(
          'Converting Chef code to Ansible',
        );
        expect(container!.command![2]).toContain('Simulating migrate phase');
      });

      it('should include user prompt in migrate command when provided', () => {
        const migrateParams: JobCreateParams = {
          ...baseParams,
          phase: 'migrate',
          moduleId: 'module-123',
          moduleName: 'nginx-cookbook',
          userPrompt: 'Preserve all comments',
        };

        const job = JobResourceBuilder.buildJobSpec(migrateParams, mockConfig);

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.command![2]).toContain(
          'User Prompt: Preserve all comments',
        );
      });

      it('should throw error when migrate phase has no module name', () => {
        const invalidParams: JobCreateParams = {
          ...baseParams,
          phase: 'migrate',
        };

        expect(() =>
          JobResourceBuilder.buildJobSpec(invalidParams, mockConfig),
        ).toThrow('moduleName is required for migrate phase');
      });
    });

    describe('Command generation for publish phase', () => {
      it('should generate echo command for publish phase', () => {
        const publishParams: JobCreateParams = {
          ...baseParams,
          phase: 'publish',
          moduleId: 'module-123',
          moduleName: 'nginx-cookbook',
        };

        const job = JobResourceBuilder.buildJobSpec(publishParams, mockConfig);

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.command![0]).toBe('/bin/sh');
        expect(container!.command![1]).toBe('-c');
        expect(container!.command![2]).toContain(
          '===== X2A Publish Phase =====',
        );
        expect(container!.command![2]).toContain('Module: nginx-cookbook');
        expect(container!.command![2]).toContain(
          'Publishing Ansible content to AAP',
        );
        expect(container!.command![2]).toContain('Simulating publish phase');
      });

      it('should throw error when publish phase has no module name', () => {
        const invalidParams: JobCreateParams = {
          ...baseParams,
          phase: 'publish',
        };

        expect(() =>
          JobResourceBuilder.buildJobSpec(invalidParams, mockConfig),
        ).toThrow('moduleName is required for publish phase');
      });
    });
  });
});
