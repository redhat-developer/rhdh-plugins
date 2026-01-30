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

import { X2AConfig } from '../../config';
import {
  MigrationPhase,
  ProjectCredentials,
  JobCreateParams,
  GitRepoCredentials,
  AAPCredentials,
} from './types';

// Test constants for git repository credentials
const testSourceRepo: GitRepoCredentials = {
  url: 'https://github.com/org/source',
  token: 'ghp_src123', // NOSONAR
  branch: 'main',
};

const testTargetRepo: GitRepoCredentials = {
  url: 'https://github.com/org/target',
  token: 'ghp_tgt456', // NOSONAR
  branch: 'main',
};

describe('types', () => {
  describe('MigrationPhase', () => {
    it('should accept all valid phase values', () => {
      const phases: MigrationPhase[] = [
        'init',
        'analyze',
        'migrate',
        'publish',
      ];

      phases.forEach(phase => {
        expect(['init', 'analyze', 'migrate', 'publish']).toContain(phase);
      });
    });

    it('should have exactly 4 valid phases', () => {
      const validPhases: MigrationPhase[] = [
        'init',
        'analyze',
        'migrate',
        'publish',
      ];
      expect(validPhases).toHaveLength(4);
    });
  });

  describe('X2AConfig', () => {
    it('should accept valid config with IAM credentials', () => {
      const config: X2AConfig = {
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
            oauthToken: 'test-oauth-token', // NOSONAR
          },
        },
      };

      expect(config.kubernetes.namespace).toBe('test-namespace');
      expect(config.credentials.llm.model).toBe('anthropic.claude-v2');
      expect(config.credentials.llm.accessKeyId).toBe('AKIA_TEST');
      expect(config.credentials.aap?.url).toBe('https://aap.example.com');
    });

    it('should accept valid config with bearer token for LLM', () => {
      const config: X2AConfig = {
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
            bearerToken: 'test-bearer-token', // NOSONAR
          },
          aap: {
            url: 'https://aap.example.com',
            orgName: 'TestOrg',
            username: 'admin',
            password: 'admin-password', // NOSONAR
          },
        },
      };

      expect(config.credentials.llm.bearerToken).toBe('test-bearer-token');
      expect(config.credentials.llm.accessKeyId).toBeUndefined();
      expect(config.credentials.aap?.username).toBe('admin');
      expect(config.credentials.aap?.password).toBe('admin-password');
    });

    it('should accept config without AAP credentials (optional)', () => {
      const config: X2AConfig = {
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
        },
      };

      expect(config.credentials.aap).toBeUndefined();
    });

    it('should accept config with AAP OAuth token', () => {
      const config: X2AConfig = {
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
            oauthToken: 'test-oauth-token', // NOSONAR
          },
        },
      };

      expect(config.credentials.aap?.oauthToken).toBe('test-oauth-token');
      expect(config.credentials.aap?.username).toBeUndefined();
      expect(config.credentials.aap?.password).toBeUndefined();
    });

    it('should accept config with AAP username and password', () => {
      const config: X2AConfig = {
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
            username: 'admin',
            password: 'admin-password', // NOSONAR
          },
        },
      };

      expect(config.credentials.aap?.username).toBe('admin');
      expect(config.credentials.aap?.password).toBe('admin-password');
      expect(config.credentials.aap?.oauthToken).toBeUndefined();
    });
  });

  describe('GitRepoCredentials', () => {
    it('should accept valid git repository credentials', () => {
      const gitCreds: GitRepoCredentials = {
        url: 'https://github.com/org/repo',
        token: 'ghp_testtoken123', // NOSONAR
        branch: 'main',
      };

      expect(gitCreds.url).toBe('https://github.com/org/repo');
      expect(gitCreds.token).toBe('ghp_testtoken123');
      expect(gitCreds.branch).toBe('main');
    });

    it('should accept different branch names', () => {
      const gitCreds: GitRepoCredentials = {
        url: 'https://github.com/org/repo',
        token: 'ghp_testtoken123', // NOSONAR
        branch: 'develop',
      };

      expect(gitCreds.branch).toBe('develop');
    });
  });

  describe('AAPCredentials', () => {
    it('should accept AAP credentials with OAuth token', () => {
      const aapCreds: AAPCredentials = {
        url: 'https://aap.example.com',
        orgName: 'MyOrg',
        oauthToken: 'oauth-token-123', // NOSONAR
      };

      expect(aapCreds.url).toBe('https://aap.example.com');
      expect(aapCreds.orgName).toBe('MyOrg');
      expect(aapCreds.oauthToken).toBe('oauth-token-123');
      expect(aapCreds.username).toBeUndefined();
      expect(aapCreds.password).toBeUndefined();
    });

    it('should accept AAP credentials with username and password', () => {
      const aapCreds: AAPCredentials = {
        url: 'https://aap.example.com',
        orgName: 'MyOrg',
        username: 'admin',
        password: 'secure-password', // NOSONAR
      };

      expect(aapCreds.username).toBe('admin');
      expect(aapCreds.password).toBe('secure-password');
      expect(aapCreds.oauthToken).toBeUndefined();
    });
  });

  describe('ProjectCredentials', () => {
    it('should accept project credentials without AAP credentials', () => {
      const projectCreds: ProjectCredentials = {
        sourceRepo: {
          url: 'https://github.com/org/source',
          token: 'ghp_source', // NOSONAR
          branch: 'main',
        },
        targetRepo: {
          url: 'https://github.com/org/target',
          token: 'ghp_target', // NOSONAR
          branch: 'main',
        },
      };

      expect(projectCreds.sourceRepo.url).toBe('https://github.com/org/source');
      expect(projectCreds.targetRepo.url).toBe('https://github.com/org/target');
      expect(projectCreds.aapCredentials).toBeUndefined();
    });

    it('should accept project credentials with user-provided AAP credentials', () => {
      const projectCreds: ProjectCredentials = {
        sourceRepo: {
          url: 'https://github.com/org/source',
          token: 'ghp_source', // NOSONAR
          branch: 'main',
        },
        targetRepo: {
          url: 'https://github.com/org/target',
          token: 'ghp_target', // NOSONAR
          branch: 'main',
        },
        aapCredentials: {
          url: 'https://user-aap.example.com',
          orgName: 'UserOrg',
          oauthToken: 'user-oauth-token', // NOSONAR
        },
      };

      expect(projectCreds.aapCredentials).toBeDefined();
      expect(projectCreds.aapCredentials?.url).toBe(
        'https://user-aap.example.com',
      );
      expect(projectCreds.aapCredentials?.orgName).toBe('UserOrg');
    });
  });

  describe('JobCreateParams', () => {
    it('should accept valid job creation params for init phase', () => {
      const params: JobCreateParams = {
        jobId: 'job-uuid-123',
        projectId: 'project-uuid-456',
        projectName: 'Test Project',
        phase: 'init',
        user: 'user:default/testuser',
        callbackToken: 'callback-token-789', // NOSONAR
        callbackUrl: 'http://backstage:7007/api/x2a/callback', // NOSONAR
        sourceRepo: testSourceRepo,
        targetRepo: testTargetRepo,
      };

      expect(params.phase).toBe('init');
      expect(params.jobId).toBe('job-uuid-123');
      expect(params.projectId).toBe('project-uuid-456');
      expect(params.projectName).toBe('Test Project');
      expect(params.user).toBe('user:default/testuser');
      expect(params.callbackToken).toBe('callback-token-789');
      expect(params.callbackUrl).toBe('http://backstage:7007/api/x2a/callback'); // NOSONAR
      expect(params.moduleId).toBeUndefined();
      expect(params.moduleName).toBeUndefined();
      expect(params.userPrompt).toBeUndefined();
    });

    it('should accept valid job creation params for analyze phase with module', () => {
      const params: JobCreateParams = {
        jobId: 'job-uuid-123',
        projectId: 'project-uuid-456',
        projectName: 'Test Project',
        phase: 'analyze',
        user: 'user:default/testuser',
        callbackToken: 'callback-token-789', // NOSONAR
        callbackUrl: 'http://backstage:7007/api/x2a/callback', // NOSONAR
        moduleId: 'module-uuid-999',
        moduleName: 'nginx-cookbook',
        sourceRepo: testSourceRepo,
        targetRepo: testTargetRepo,
      };

      expect(params.phase).toBe('analyze');
      expect(params.moduleId).toBe('module-uuid-999');
      expect(params.moduleName).toBe('nginx-cookbook');
    });

    it('should accept valid job creation params for migrate phase with module', () => {
      const params: JobCreateParams = {
        jobId: 'job-uuid-123',
        projectId: 'project-uuid-456',
        projectName: 'Test Project',
        phase: 'migrate',
        user: 'user:default/testuser',
        callbackToken: 'callback-token-789', // NOSONAR
        callbackUrl: 'http://backstage:7007/api/x2a/callback', // NOSONAR
        moduleId: 'module-uuid-999',
        moduleName: 'nginx-cookbook',
        sourceRepo: testSourceRepo,
        targetRepo: testTargetRepo,
      };

      expect(params.phase).toBe('migrate');
      expect(params.moduleId).toBe('module-uuid-999');
      expect(params.moduleName).toBe('nginx-cookbook');
    });

    it('should accept valid job creation params for publish phase with module', () => {
      const params: JobCreateParams = {
        jobId: 'job-uuid-123',
        projectId: 'project-uuid-456',
        projectName: 'Test Project',
        phase: 'publish',
        user: 'user:default/testuser',
        callbackToken: 'callback-token-789', // NOSONAR
        callbackUrl: 'http://backstage:7007/api/x2a/callback', // NOSONAR
        moduleId: 'module-uuid-999',
        moduleName: 'nginx-cookbook',
        sourceRepo: testSourceRepo,
        targetRepo: testTargetRepo,
      };

      expect(params.phase).toBe('publish');
      expect(params.moduleId).toBe('module-uuid-999');
      expect(params.moduleName).toBe('nginx-cookbook');
    });

    it('should accept optional userPrompt', () => {
      const params: JobCreateParams = {
        jobId: 'job-uuid-123',
        projectId: 'project-uuid-456',
        projectName: 'Test Project',
        phase: 'init',
        user: 'user:default/testuser',
        callbackToken: 'callback-token-789', // NOSONAR
        callbackUrl: 'http://backstage:7007/api/x2a/callback', // NOSONAR
        userPrompt: 'Focus on security configurations',
        sourceRepo: testSourceRepo,
        targetRepo: testTargetRepo,
      };

      expect(params.userPrompt).toBe('Focus on security configurations');
    });

    it('should accept params with all optional fields', () => {
      const params: JobCreateParams = {
        jobId: 'job-uuid-123',
        projectId: 'project-uuid-456',
        projectName: 'Test Project',
        phase: 'migrate',
        user: 'user:default/testuser',
        callbackToken: 'callback-token-789', // NOSONAR
        callbackUrl: 'http://backstage:7007/api/x2a/callback', // NOSONAR
        moduleId: 'module-uuid-999',
        moduleName: 'nginx-cookbook',
        userPrompt: 'Preserve all comments and documentation',
        sourceRepo: testSourceRepo,
        targetRepo: testTargetRepo,
      };

      expect(params.moduleId).toBe('module-uuid-999');
      expect(params.moduleName).toBe('nginx-cookbook');
      expect(params.userPrompt).toBe('Preserve all comments and documentation');
    });
  });

  describe('Type consistency', () => {
    it('should maintain consistent phase values across different interfaces', () => {
      const phases: MigrationPhase[] = [
        'init',
        'analyze',
        'migrate',
        'publish',
      ];

      phases.forEach(phase => {
        const params: JobCreateParams = {
          jobId: 'job-123',
          projectId: 'proj-456',
          projectName: 'Test',
          phase,
          user: 'user:default/test',
          callbackToken: 'token-123', // NOSONAR
          callbackUrl: 'http://localhost:7007/callback', // NOSONAR
          sourceRepo: testSourceRepo,
          targetRepo: testTargetRepo,
        };

        expect(params.phase).toBe(phase);
      });
    });

    it('should allow all credential combinations for X2AConfig', () => {
      // IAM + OAuth
      const config1: X2AConfig = {
        kubernetes: {
          namespace: 'test',
          image: 'image',
          imageTag: 'latest',
          ttlSecondsAfterFinished: 86400,
          resources: {
            requests: { cpu: '500m', memory: '1Gi' },
            limits: { cpu: '2000m', memory: '4Gi' },
          },
        },
        credentials: {
          llm: {
            model: 'claude',
            region: 'us-east-1',
            accessKeyId: 'key',
            secretAccessKey: 'secret',
          },
          aap: {
            url: 'https://aap.example.com',
            orgName: 'Org',
            oauthToken: 'token', // NOSONAR
          },
        },
      };

      // Bearer + Username/Password
      const config2: X2AConfig = {
        kubernetes: {
          namespace: 'test',
          image: 'image',
          imageTag: 'latest',
          ttlSecondsAfterFinished: 86400,
          resources: {
            requests: { cpu: '500m', memory: '1Gi' },
            limits: { cpu: '2000m', memory: '4Gi' },
          },
        },
        credentials: {
          llm: {
            model: 'claude',
            region: 'us-east-1',
            bearerToken: 'bearer-token', // NOSONAR
          },
          aap: {
            url: 'https://aap.example.com',
            orgName: 'Org',
            username: 'user',
            password: 'pass', // NOSONAR
          },
        },
      };

      expect(config1.credentials.llm.accessKeyId).toBe('key');
      expect(config2.credentials.llm.bearerToken).toBe('bearer-token');
      expect(config1.credentials.aap?.oauthToken).toBe('token');
      expect(config2.credentials.aap?.username).toBe('user');
    });
  });
});
