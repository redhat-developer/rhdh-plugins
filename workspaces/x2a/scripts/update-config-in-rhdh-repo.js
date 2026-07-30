#!/usr/bin/env node
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

const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const RHDH_DIR = process.env.RHDH_DIR
  ? path.resolve(process.env.RHDH_DIR)
  : path.resolve(__dirname, '../../../..', 'rhdh');

const LOCAL_CONFIG = path.join(RHDH_DIR, 'app-config.local.yaml');
const INITIAL_CONFIG = path.join(__dirname, 'config-for-rhdh-repo.yaml');
const X2A_FRONTEND_CONFIG = path.join(
  __dirname,
  '../plugins/x2a/app-config.yaml',
);

const pluginKey = 'red-hat-developer-hub.backstage-plugin-x2a';
const dcrPluginKey = 'red-hat-developer-hub.backstage-plugin-x2a-dcr';

const x2aBEConfig = {
  kubernetes: {
    namespace: '${X2A_KUBERNETES_NAMESPACE:-default}',
    image: '${X2A_KUBERNETES_IMAGE:-quay.io/x2ansible/x2a-convertor}',
    imageTag: '${X2A_KUBERNETES_IMAGE_TAG:-latest}',
    ttlSecondsAfterFinished: '${X2A_KUBERNETES_TTL_SECONDS:-86400}',
    resources: {
      requests: {
        cpu: '${X2A_KUBERNETES_CPU_REQUEST:-500m}',
        memory: '${X2A_KUBERNETES_MEMORY_REQUEST:-1Gi}',
      },
      limits: {
        cpu: '${X2A_KUBERNETES_CPU_LIMIT:-2000m}',
        memory: '${X2A_KUBERNETES_MEMORY_LIMIT:-4Gi}',
      },
    },
  },
  credentials: {
    llm: {
      LLM_MODEL: '${LLM_MODEL:-anthropic.claude-v2}',
      AWS_REGION: '${AWS_REGION}',
      AWS_BEARER_TOKEN_BEDROCK: '${AWS_BEARER_TOKEN_BEDROCK}',
    },
    aap: {
      url: '${AAP_URL:-https://aap.example.com}',
      orgName: '${AAP_ORG_NAME:-MyOrganization}',
      username: '${AAP_USERNAME}',
      password: '${AAP_PASSWORD}', // NOSONAR - env placeholder for local app-config, not a real credential
    },
  },
};

const mcpActionsSources = [
  'catalog',
  'software-catalog-mcp-tool',
  'x2a-mcp-extras',
];

const integrationsConfig = {
  github: [{ host: 'github.com' }],
  gitlab: [{ host: 'gitlab.com' }],
  bitbucketCloud: [{ host: 'bitbucket.org' }],
};

const dcrConfig = {
  enabled: true,
  // Local development only — http://* is intentional for DCR redirect patterns.
  allowedRedirectUriPatterns: ['cursor://*', 'https://*', 'http://*'], // NOSONAR
};

const authProvidersConfig = {
  guest: {},
  gitlab: {
    development: {
      clientId: '${AUTH_GITLAB_CLIENT_ID}',
      clientSecret: '${AUTH_GITLAB_CLIENT_SECRET}',
      audience: 'https://gitlab.com',
      signIn: {
        resolvers: [{ resolver: 'usernameMatchingUserEntityName' }],
      },
    },
  },
  github: {
    development: {
      clientId: '${AUTH_GITHUB_CLIENT_ID}',
      clientSecret: '${AUTH_GITHUB_CLIENT_SECRET}',
      signIn: {
        resolvers: [
          { resolver: 'emailMatchingUserEntityProfileEmail' },
          { resolver: 'usernameMatchingUserEntityName' },
        ],
      },
    },
  },
};

const RBAC_POLICY_SOURCE = path.join(
  __dirname,
  '../examples/example-rbac-policy.csv',
);
const RBAC_POLICY_FILENAME = 'rbac-policy-x2a.csv';

const TEMPLATE_SOURCE = path.join(
  __dirname,
  '../plugins/scaffolder-backend-module-x2a/templates/conversion-project-template.yaml',
);
const TEMPLATE_FILENAME = 'x2a-conversion-project-template.yaml';

const ORG_DATA_SOURCE = path.join(__dirname, '../examples/org.yaml');
const ORG_DATA_FILENAME = 'x2a-org.yaml';

const permissionConfig = {
  enabled: true,
  rbac: {
    'policies-csv-file': `../../${RBAC_POLICY_FILENAME}`,
    policyFileReload: true,
    pluginsWithPermission: ['x2a'],
  },
};

/**
 * Recursively assigns default values to `target` only where keys are missing.
 * Arrays and non-plain-object values are never merged - they are set as-is
 * only when the target key is undefined.
 *
 */
function deepDefaults(target, defaults) {
  for (const key of Object.keys(defaults)) {
    if (target[key] === undefined) {
      target[key] = defaults[key];
    } else if (
      typeof target[key] === 'object' &&
      target[key] !== null &&
      typeof defaults[key] === 'object' &&
      defaults[key] !== null &&
      !Array.isArray(target[key]) &&
      !Array.isArray(defaults[key])
    ) {
      deepDefaults(target[key], defaults[key]);
    }
  }
  return target;
}

function loadX2AFEPluginConfig() {
  try {
    const configContent = fs.readFileSync(X2A_FRONTEND_CONFIG, 'utf8');
    const config = yaml.load(configContent);

    if (!config?.dynamicPlugins?.frontend?.[pluginKey]) {
      console.error(
        `❌ Could not find ${pluginKey} config in ${X2A_FRONTEND_CONFIG}`,
      );
      process.exit(1);
    }

    return {
      rootDirectory: 'dynamic-plugins-root',
      frontend: {
        [dcrPluginKey]: {},
        [pluginKey]: config.dynamicPlugins.frontend[pluginKey],
      },
    };
  } catch (error) {
    console.error(`❌ Failed to load x2a plugin config: ${error.message}`);
    process.exit(1);
  }
}

function copyFileToRhdh(source, filename, label) {
  const dest = path.join(RHDH_DIR, filename);
  if (!fs.existsSync(source)) {
    console.warn(`⚠️  ${label} source not found: ${source}`);
    return;
  }
  fs.copyFileSync(source, dest);
  console.log(`✅ Copied ${label} to ${dest}`);
}

function createLocalConfigIfMissing() {
  if (!fs.existsSync(LOCAL_CONFIG)) {
    if (!fs.existsSync(INITIAL_CONFIG)) {
      console.error(`❌ Missing ${INITIAL_CONFIG}`);
      process.exit(1);
    }
    fs.copyFileSync(INITIAL_CONFIG, LOCAL_CONFIG);
    console.log(
      '📝 Created app-config.local.yaml from config-for-rhdh-repo.yaml',
    );
  }
}

function updateConfig() {
  const raw = fs.readFileSync(LOCAL_CONFIG, 'utf8');
  const config = yaml.load(raw) || {};

  const x2aDynamicPlugins = loadX2AFEPluginConfig();

  const defaults = {
    dynamicPlugins: x2aDynamicPlugins,
    backend: { actions: { pluginSources: mcpActionsSources } },
    integrations: integrationsConfig,
    auth: {
      experimentalDynamicClientRegistration: dcrConfig,
      providers: authProvidersConfig,
    },
    permission: permissionConfig,
    catalog: { locations: [] },
    x2a: x2aBEConfig,
  };

  deepDefaults(config, defaults);

  // Normalize shapes that deepDefaults will not replace when the wrong type already exists
  if (!config.permission || typeof config.permission !== 'object') {
    config.permission = { ...permissionConfig };
  }
  if (!config.permission.rbac || typeof config.permission.rbac !== 'object') {
    config.permission.rbac = { ...permissionConfig.rbac };
  }
  if (!config.catalog || typeof config.catalog !== 'object') {
    config.catalog = { locations: [] };
  }
  if (!Array.isArray(config.catalog.locations)) {
    config.catalog.locations = [];
  }

  // Force the RBAC policy path regardless of existing value
  config.permission.rbac['policies-csv-file'] = `../../${RBAC_POLICY_FILENAME}`;

  // catalog.locations: push entries if not already present (array dedup by target)
  const templateTarget = `../../${TEMPLATE_FILENAME}`;
  if (!config.catalog.locations.some(loc => loc.target === templateTarget)) {
    config.catalog.locations.push({
      type: 'file',
      target: templateTarget,
      rules: [{ allow: ['Template'] }],
    });
  }
  const orgTarget = `../../${ORG_DATA_FILENAME}`;
  if (!config.catalog.locations.some(loc => loc.target === orgTarget)) {
    config.catalog.locations.push({
      type: 'file',
      target: orgTarget,
      rules: [{ allow: ['User', 'Group'] }],
    });
  }

  const updated = yaml.dump(config, { lineWidth: -1 });
  fs.writeFileSync(LOCAL_CONFIG, updated, 'utf8');
  console.log(`✅ Updated ${LOCAL_CONFIG} with x2a config.`);
}

function main() {
  if (!fs.existsSync(RHDH_DIR)) {
    console.error(`❌ RHDH repo not found at: ${RHDH_DIR}`);
    process.exit(1);
  }
  copyFileToRhdh(RBAC_POLICY_SOURCE, RBAC_POLICY_FILENAME, 'RBAC policy');
  copyFileToRhdh(TEMPLATE_SOURCE, TEMPLATE_FILENAME, 'scaffolder template');
  copyFileToRhdh(ORG_DATA_SOURCE, ORG_DATA_FILENAME, 'org data');
  createLocalConfigIfMissing();
  updateConfig();
}

main();
