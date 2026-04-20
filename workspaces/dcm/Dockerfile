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

WORKDIR /app

# Copy workspace config so yarn can re-run with --production.
COPY --from=build /app/package.json /app/yarn.lock /app/.yarnrc.yml ./
COPY --from=build /app/.yarn ./.yarn

# Copy per-package package.json files (needed by yarn workspaces focus).
COPY --from=build /app/packages/app/package.json     packages/app/package.json
COPY --from=build /app/packages/backend/package.json packages/backend/package.json
COPY --from=build /app/plugins/dcm/package.json        plugins/dcm/package.json
COPY --from=build /app/plugins/dcm-backend/package.json plugins/dcm-backend/package.json
COPY --from=build /app/plugins/dcm-common/package.json  plugins/dcm-common/package.json

# Install only production dependencies; purge the yarn cache afterwards.
RUN YARN_ENABLE_SCRIPTS=0 \
    YARN_ENABLE_IMMUTABLE_INSTALLS=false \
    YARN_CACHE_FOLDER=/root/.yarn/berry/cache \
    yarn workspaces focus --all --production && rm -rf "$(yarn cache dir)"

# Copy built output from the build stage.
COPY --from=build /app/packages/app/dist     packages/app/dist
COPY --from=build /app/packages/backend/dist packages/backend/dist
COPY --from=build /app/plugins/dcm/dist        plugins/dcm/dist
COPY --from=build /app/plugins/dcm-backend/dist plugins/dcm-backend/dist
COPY --from=build /app/plugins/dcm-common/dist  plugins/dcm-common/dist

# Runtime config files — app-config.production.yaml overrides app-config.yaml.
COPY app-config.yaml app-config.production.yaml ./

EXPOSE 7007

# `node packages/backend` resolves to packages/backend/dist/index.cjs.js via
# the "main" field in packages/backend/package.json.
CMD ["node", "packages/backend", \
     "--config", "app-config.yaml", \
     "--config", "app-config.production.yaml"]
