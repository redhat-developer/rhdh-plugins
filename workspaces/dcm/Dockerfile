# Copyright Red Hat, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS build

# Enable Corepack so that the "packageManager" field in package.json selects
# Yarn 3.x instead of the Node.js-bundled Yarn 1.x.
RUN corepack enable

WORKDIR /app

# Copy the entire workspace so yarn can resolve all workspace packages.
COPY . .

# YARN_ENABLE_SCRIPTS=0 prevents lifecycle hooks (postinstall etc.) from running.
# The workspace root postinstall does `cd ../../ && yarn install` which is only
# meaningful inside the monorepo and would fail inside the container.
# YARN_ENABLE_IMMUTABLE_INSTALLS=false lets Yarn adjust the lockfile copy inside
# the container if peer-dependency metadata differs in the clean environment;
# this does not affect the committed yarn.lock in the source repository.
# YARN_CACHE_FOLDER points to the host-mounted cache (see dynamic-plugins.sh);
# if the volume is not mounted the path simply won't exist and Yarn will fall
# back to fetching packages from the registry.
RUN YARN_ENABLE_SCRIPTS=0 \
    YARN_ENABLE_IMMUTABLE_INSTALLS=false \
    YARN_CACHE_FOLDER=/root/.yarn/berry/cache \
    yarn install

# Compile TypeScript across all packages, then build the React app and the
# Backstage backend bundle.
RUN yarn tsc
RUN yarn workspace app build
RUN yarn workspace backend build

# ── Stage 2: production image ─────────────────────────────────────────────────
FROM node:20-bookworm-slim

RUN corepack enable

# Build tools are required to compile native Node.js addons (isolated-vm,
# better-sqlite3, etc.) when yarn installs production dependencies.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# skeleton.tar.gz contains only the package.json files needed by
# `yarn workspaces focus` to resolve the production dependency graph.
COPY --from=build /app/packages/backend/dist/skeleton.tar.gz ./
RUN tar xzf skeleton.tar.gz && rm skeleton.tar.gz

# Copy root Yarn workspace config (required for yarn workspaces focus).
COPY --from=build /app/package.json /app/yarn.lock /app/.yarnrc.yml ./
COPY --from=build /app/.yarn ./.yarn

# Neutralise the monorepo postinstall hook. The original script does
# `cd ../../ && yarn install`, which is only valid inside the full monorepo
# and would fail (or re-run an unnecessary full install) in this container.
RUN node -e " \
  const fs = require('fs'); \
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')); \
  if (pkg.scripts) pkg.scripts.postinstall = 'true'; \
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2)); \
"

# Install only production dependencies. Scripts are intentionally enabled here
# so that native addons (isolated-vm, better-sqlite3) can compile their
# platform-specific binaries via node-gyp.
# NOTE: packages/app/package.json is intentionally NOT present at this point.
# It has workspace:^ deps on frontend plugins that are not part of the backend
# production bundle. Copying it before focus would cause a resolution error.
RUN YARN_ENABLE_IMMUTABLE_INSTALLS=false \
    YARN_CACHE_FOLDER=/root/.yarn/berry/cache \
    yarn workspaces focus --all --production && rm -rf "$(yarn cache dir)"

# Copy packages/app/package.json and create the node_modules/app symlink AFTER
# yarn focus so Yarn does not try to resolve its workspace:^ frontend deps.
# The symlink is required because @backstage/backend-plugin-api resolves
# `require('app/package.json')` via node_modules/app to locate the app plugin.
COPY --from=build /app/packages/app/package.json packages/app/package.json
RUN ln -sf ../packages/app node_modules/app

# bundle.tar.gz contains the full workspace structure plus all compiled dist/
# files (packages/backend/dist/index.cjs.js, plugins/*/dist/, etc.).
COPY --from=build /app/packages/backend/dist/bundle.tar.gz ./
RUN tar xzf bundle.tar.gz && rm bundle.tar.gz

# config.d.ts is referenced by the plugin's package.json "configSchema" field.
# Backstage's config-loader reads this file at startup to build the schema
# and validate app-config values; it is not part of the dist bundle.
COPY --from=build /app/plugins/dcm-backend/config.d.ts plugins/dcm-backend/config.d.ts

# The frontend static files are built separately and served by the backend.
COPY --from=build /app/packages/app/dist packages/app/dist

# Runtime config files — app-config.production.yaml overrides app-config.yaml.
COPY app-config.yaml app-config.production.yaml ./

EXPOSE 7007

# node resolves `packages/backend` → packages/backend/dist/index.cjs.js via
# the "main" field in packages/backend/package.json.
CMD ["node", "packages/backend", \
     "--config", "app-config.yaml", \
     "--config", "app-config.production.yaml"]
