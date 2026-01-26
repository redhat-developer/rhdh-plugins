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
import { X2AConfig, ProjectCredentials, JobCreateParams } from './types';

describe('JobResourceBuilder', () => {
  let mockConfig: X2AConfig;
  let projectCredentials: ProjectCredentials;

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
          model: 'anthropic.claude-v2',
          region: 'us-east-1',
          accessKeyId: 'AKIA_TEST',
          secretAccessKey: 'test-secret-key',
        },
        aap: {
          url: 'https://aap.example.com',
          orgName: 'TestOrg',
          oauthToken: 'test-oauth-token',
        },
      },
    };

    projectCredentials = {
      sourceRepo: {
        url: 'https://github.com/org/source',
        token: 'source-token',
        branch: 'main',
      },
      targetRepo: {
        url: 'https://github.com/org/target',
        token: 'target-token',
        branch: 'main',
      },
    };
  });

  describe('buildProjectSecret', () => {
    const projectId = 'proj-123';

    describe('LLM credential validation', () => {
      it('should create secret with IAM credentials', () => {
        const secret = JobResourceBuilder.buildProjectSecret(
          projectId,
          projectCredentials,
          mockConfig,
        );

        expect(secret.stringData).toMatchObject({
          LLM_MODEL: 'anthropic.claude-v2',
          AWS_REGION: 'us-east-1',
          AWS_ACCESS_KEY_ID: 'AKIA_TEST',
          AWS_SECRET_ACCESS_KEY: 'test-secret-key',
        });
        expect(secret.stringData!.AWS_BEARER_TOKEN_BEDROCK).toBeUndefined();
        expect(secret.metadata?.annotations).toMatchObject({
          'x2a.redhat.com/llm-auth-method': 'iam',
        });
      });

      it('should create secret with bearer token', () => {
        mockConfig.credentials.llm = {
          model: 'anthropic.claude-v2',
          region: 'us-east-1',
          bearerToken: 'test-bearer-token',
        };

        const secret = JobResourceBuilder.buildProjectSecret(
          projectId,
          projectCredentials,
          mockConfig,
        );

        expect(secret.stringData).toMatchObject({
          LLM_MODEL: 'anthropic.claude-v2',
          AWS_REGION: 'us-east-1',
          AWS_BEARER_TOKEN_BEDROCK: 'test-bearer-token',
        });
        expect(secret.stringData!.AWS_ACCESS_KEY_ID).toBeUndefined();
        expect(secret.stringData!.AWS_SECRET_ACCESS_KEY).toBeUndefined();
        expect(secret.metadata?.annotations).toMatchObject({
          'x2a.redhat.com/llm-auth-method': 'bearer-token',
        });
      });

      it('should throw error when no LLM credentials provided', () => {
        mockConfig.credentials.llm = {
          model: 'anthropic.claude-v2',
          region: 'us-east-1',
        };

        expect(() =>
          JobResourceBuilder.buildProjectSecret(
            projectId,
            projectCredentials,
            mockConfig,
          ),
        ).toThrow(
          'LLM credentials must include either AWS IAM credentials (accessKeyId + secretAccessKey) OR bearerToken',
        );
      });

      it('should throw error when both IAM and bearer token provided', () => {
        mockConfig.credentials.llm = {
          model: 'anthropic.claude-v2',
          region: 'us-east-1',
          accessKeyId: 'AKIA_TEST',
          secretAccessKey: 'test-secret-key',
          bearerToken: 'test-bearer-token',
        };

        expect(() =>
          JobResourceBuilder.buildProjectSecret(
            projectId,
            projectCredentials,
            mockConfig,
          ),
        ).toThrow(
          'LLM credentials should have either IAM credentials OR bearerToken, not both',
        );
      });

      it('should throw error when only accessKeyId provided', () => {
        mockConfig.credentials.llm = {
          model: 'anthropic.claude-v2',
          region: 'us-east-1',
          accessKeyId: 'AKIA_TEST',
        };

        expect(() =>
          JobResourceBuilder.buildProjectSecret(
            projectId,
            projectCredentials,
            mockConfig,
          ),
        ).toThrow(
          'LLM credentials must include either AWS IAM credentials (accessKeyId + secretAccessKey) OR bearerToken',
        );
      });

      it('should throw error when only secretAccessKey provided', () => {
        mockConfig.credentials.llm = {
          model: 'anthropic.claude-v2',
          region: 'us-east-1',
          secretAccessKey: 'test-secret-key',
        };

        expect(() =>
          JobResourceBuilder.buildProjectSecret(
            projectId,
            projectCredentials,
            mockConfig,
          ),
        ).toThrow(
          'LLM credentials must include either AWS IAM credentials (accessKeyId + secretAccessKey) OR bearerToken',
        );
      });
    });

    describe('AAP credential validation', () => {
      it('should create secret with OAuth token from config', () => {
        const secret = JobResourceBuilder.buildProjectSecret(
          projectId,
          projectCredentials,
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
          password: 'admin-password',
        };

        const secret = JobResourceBuilder.buildProjectSecret(
          projectId,
          projectCredentials,
          mockConfig,
        );

        expect(secret.stringData).toMatchObject({
          AAP_CONTROLLER_URL: 'https://aap.example.com',
          AAP_ORG_NAME: 'TestOrg',
          AAP_USERNAME: 'admin',
          AAP_PASSWORD: 'admin-password',
        });
        expect(secret.stringData!.AAP_OAUTH_TOKEN).toBeUndefined();
        expect(secret.metadata?.annotations).toMatchObject({
          'x2a.redhat.com/aap-auth-method': 'basic',
          'x2a.redhat.com/aap-source': 'config',
        });
      });

      it('should use user-provided AAP credentials over config', () => {
        const credsWithAAP: ProjectCredentials = {
          ...projectCredentials,
          aapCredentials: {
            url: 'https://user-aap.example.com',
            orgName: 'UserOrg',
            username: 'user',
            password: 'pass',
          },
        };

        const secret = JobResourceBuilder.buildProjectSecret(
          projectId,
          credsWithAAP,
          mockConfig,
        );

        expect(secret.stringData).toMatchObject({
          AAP_CONTROLLER_URL: 'https://user-aap.example.com',
          AAP_ORG_NAME: 'UserOrg',
          AAP_USERNAME: 'user',
          AAP_PASSWORD: 'pass',
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
            projectCredentials,
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
            projectCredentials,
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
          oauthToken: 'test-oauth-token',
          username: 'admin',
          password: 'admin-password',
        };

        expect(() =>
          JobResourceBuilder.buildProjectSecret(
            projectId,
            projectCredentials,
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
            projectCredentials,
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
          password: 'admin-password',
        };

        expect(() =>
          JobResourceBuilder.buildProjectSecret(
            projectId,
            projectCredentials,
            mockConfig,
          ),
        ).toThrow(
          'AAP credentials must include either oauthToken OR username+password',
        );
      });
    });

    describe('Git repository credentials', () => {
      it('should include source repository credentials', () => {
        const secret = JobResourceBuilder.buildProjectSecret(
          projectId,
          projectCredentials,
          mockConfig,
        );

        expect(secret.stringData).toMatchObject({
          SOURCE_REPO_URL: 'https://github.com/org/source',
          SOURCE_REPO_TOKEN: 'source-token',
          SOURCE_REPO_BRANCH: 'main',
        });
      });

      it('should include target repository credentials', () => {
        const secret = JobResourceBuilder.buildProjectSecret(
          projectId,
          projectCredentials,
          mockConfig,
        );

        expect(secret.stringData).toMatchObject({
          TARGET_REPO_URL: 'https://github.com/org/target',
          TARGET_REPO_TOKEN: 'target-token',
          TARGET_REPO_BRANCH: 'main',
        });
      });
    });

    describe('Secret metadata', () => {
      it('should include correct labels', () => {
        const secret = JobResourceBuilder.buildProjectSecret(
          projectId,
          projectCredentials,
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
          projectCredentials,
          mockConfig,
        );

        expect(secret.metadata?.name).toBe(`x2a-project-secret-${projectId}`);
      });

      it('should include description annotation', () => {
        const secret = JobResourceBuilder.buildProjectSecret(
          projectId,
          projectCredentials,
          mockConfig,
        );

        expect(secret.metadata?.annotations).toMatchObject({
          'x2a.redhat.com/created-by': 'x2a-backend-plugin',
          'x2a.redhat.com/description': 'Credentials for X2A migration project',
        });
      });

      it('should be Opaque secret type', () => {
        const secret = JobResourceBuilder.buildProjectSecret(
          projectId,
          projectCredentials,
          mockConfig,
        );

        expect(secret.type).toBe('Opaque');
        expect(secret.apiVersion).toBe('v1');
        expect(secret.kind).toBe('Secret');
      });
    });
  });

  describe('buildJobSpec', () => {
    const baseParams: JobCreateParams = {
      jobId: 'job-123',
      projectId: 'proj-123',
      projectName: 'Test Project',
      phase: 'init',
      user: 'user:default/test',
      callbackToken: 'callback-token-123',
      callbackUrl: 'http://backstage:7007/api/x2a/callback',
    };

    describe('Job metadata', () => {
      it('should generate unique job name with phase', () => {
        const job1 = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);
        const job2 = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        expect(job1.metadata?.name).toMatch(/^job-x2a-init-[a-f0-9]{8}$/);
        expect(job2.metadata?.name).toMatch(/^job-x2a-init-[a-f0-9]{8}$/);
        expect(job1.metadata?.name).not.toBe(job2.metadata?.name);
      });

      it('should include all required labels', () => {
        const job = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        expect(job.metadata?.labels).toMatchObject({
          'app.kubernetes.io/name': 'x2a-job',
          'app.kubernetes.io/component': 'migration',
          'app.kubernetes.io/managed-by': 'x2a-backend-plugin',
          'x2a.redhat.com/project-id': 'proj-123',
          'x2a.redhat.com/project-name': 'Test Project',
          'x2a.redhat.com/phase': 'init',
          'x2a.redhat.com/user': 'user:default/test',
          'x2a.redhat.com/job-id': 'job-123',
        });
      });

      it('should include module labels when moduleId provided', () => {
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
            'http://backstage:7007/api/x2a/callback',
        });
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

    describe('Init container - git clone', () => {
      it('should include git-clone init container', () => {
        const job = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        const initContainers = job.spec?.template.spec?.initContainers;
        expect(initContainers).toHaveLength(1);
        expect(initContainers![0].name).toBe('git-clone');
        expect(initContainers![0].image).toBe('alpine/git:latest');
      });

      it('should use shell command for git operations', () => {
        const job = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        const initContainer = job.spec?.template.spec?.initContainers![0];
        expect(initContainer!.command).toEqual(['/bin/sh', '-c']);
        expect(initContainer!.args).toHaveLength(1);
      });

      it('should clone both source and target repositories', () => {
        const job = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        const script = job.spec?.template.spec?.initContainers![0].args![0];
        expect(script).toContain('git clone');
        expect(script).toContain('/workspace/source');
        expect(script).toContain('/workspace/target');
        expect(script).toContain('SOURCE_REPO_BRANCH');
        expect(script).toContain('TARGET_REPO_BRANCH');
        expect(script).toContain('SOURCE_REPO_TOKEN');
        expect(script).toContain('TARGET_REPO_TOKEN');
      });

      it('should mount workspace volume in init container', () => {
        const job = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        const volumeMounts =
          job.spec?.template.spec?.initContainers![0].volumeMounts;
        expect(volumeMounts).toContainEqual({
          name: 'workspace',
          mountPath: '/workspace',
        });
      });

      it('should source credentials from project secret', () => {
        const job = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        const envFrom = job.spec?.template.spec?.initContainers![0].envFrom;
        expect(envFrom).toContainEqual({
          secretRef: {
            name: 'x2a-project-secret-proj-123',
          },
        });
      });
    });

    describe('Main container - x2a-convertor', () => {
      it('should use configured image and tag', () => {
        const job = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.name).toBe('x2a-convertor');
        expect(container!.image).toBe('quay.io/x2ansible/x2a-convertor:latest');
      });

      it('should set working directory to /workspace', () => {
        const job = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.workingDir).toBe('/workspace');
      });

      it('should mount workspace volume', () => {
        const job = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.volumeMounts).toContainEqual({
          name: 'workspace',
          mountPath: '/workspace',
        });
      });

      it('should source credentials from project secret', () => {
        const job = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.envFrom).toContainEqual({
          secretRef: {
            name: 'x2a-project-secret-proj-123',
          },
        });
      });

      it('should set resource requests and limits', () => {
        const job = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.resources).toEqual({
          requests: {
            cpu: '500m',
            memory: '1Gi',
          },
          limits: {
            cpu: '2000m',
            memory: '4Gi',
          },
        });
      });

      it('should set base environment variables', () => {
        const job = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.env).toEqual(
          expect.arrayContaining([
            { name: 'PHASE', value: 'init' },
            { name: 'PROJECT_ID', value: 'proj-123' },
            {
              name: 'CALLBACK_URL',
              value: 'http://backstage:7007/api/x2a/callback',
            },
            { name: 'CALLBACK_TOKEN', value: 'callback-token-123' },
          ]),
        );
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

    describe('Volumes', () => {
      it('should define workspace emptyDir volume', () => {
        const job = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        const volumes = job.spec?.template.spec?.volumes;
        expect(volumes).toContainEqual({
          name: 'workspace',
          emptyDir: {},
        });
      });
    });

    describe('Command generation for init phase', () => {
      it('should generate correct command for init without user prompt', () => {
        const job = JobResourceBuilder.buildJobSpec(baseParams, mockConfig);

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.command).toEqual([
          'uv',
          'run',
          'app.py',
          'init',
          '--source-dir',
          '/workspace/source',
        ]);
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
        expect(container!.command).toEqual([
          'uv',
          'run',
          'app.py',
          'init',
          '--source-dir',
          '/workspace/source',
          'Focus on security',
        ]);
      });
    });

    describe('Command generation for analyze phase', () => {
      it('should generate correct command for analyze with module name', () => {
        const analyzeParams: JobCreateParams = {
          ...baseParams,
          phase: 'analyze',
          moduleId: 'module-123',
          moduleName: 'nginx-cookbook',
        };

        const job = JobResourceBuilder.buildJobSpec(analyzeParams, mockConfig);

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.command).toEqual([
          'uv',
          'run',
          'app.py',
          'analyze',
          '--source-dir',
          '/workspace/source',
          'nginx-cookbook',
        ]);
      });

      it('should use user prompt instead of module name when provided', () => {
        const analyzeParams: JobCreateParams = {
          ...baseParams,
          phase: 'analyze',
          moduleId: 'module-123',
          moduleName: 'nginx-cookbook',
          userPrompt: 'Focus on nginx config files',
        };

        const job = JobResourceBuilder.buildJobSpec(analyzeParams, mockConfig);

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.command).toEqual([
          'uv',
          'run',
          'app.py',
          'analyze',
          '--source-dir',
          '/workspace/source',
          'Focus on nginx config files',
        ]);
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
      it('should generate correct command for migrate', () => {
        const migrateParams: JobCreateParams = {
          ...baseParams,
          phase: 'migrate',
          moduleId: 'module-123',
          moduleName: 'nginx-cookbook',
        };

        const job = JobResourceBuilder.buildJobSpec(migrateParams, mockConfig);

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.command).toEqual([
          'uv',
          'run',
          'app.py',
          'migrate',
          '--source-dir',
          '/workspace/source',
          '--source-technology',
          'Chef',
          '--high-level-migration-plan',
          '/workspace/target/migration-plan.md',
          '--module-migration-plan',
          '/workspace/target/modules/nginx-cookbook/module_migration-plan.md',
          'Convert nginx-cookbook',
        ]);
      });

      it('should use user prompt in migrate command when provided', () => {
        const migrateParams: JobCreateParams = {
          ...baseParams,
          phase: 'migrate',
          moduleId: 'module-123',
          moduleName: 'nginx-cookbook',
          userPrompt: 'Preserve all comments',
        };

        const job = JobResourceBuilder.buildJobSpec(migrateParams, mockConfig);

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.command).toEqual([
          'uv',
          'run',
          'app.py',
          'migrate',
          '--source-dir',
          '/workspace/source',
          '--source-technology',
          'Chef',
          '--high-level-migration-plan',
          '/workspace/target/migration-plan.md',
          '--module-migration-plan',
          '/workspace/target/modules/nginx-cookbook/module_migration-plan.md',
          'Preserve all comments',
        ]);
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
      it('should generate correct command for publish', () => {
        const publishParams: JobCreateParams = {
          ...baseParams,
          phase: 'publish',
          moduleId: 'module-123',
          moduleName: 'nginx-cookbook',
        };

        const job = JobResourceBuilder.buildJobSpec(publishParams, mockConfig);

        const container = job.spec?.template.spec?.containers![0];
        expect(container!.command).toEqual([
          'uv',
          'run',
          'app.py',
          'publish',
          '--target-dir',
          '/workspace/target',
          '--module-name',
          'nginx-cookbook',
        ]);
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
