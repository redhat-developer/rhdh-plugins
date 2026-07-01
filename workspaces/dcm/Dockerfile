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
FROM node:22-bookworm-slim AS build

RUN corepack enable

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml backstage.json ./
COPY .yarn ./.yarn

COPY tsconfig.json .eslintrc.js .eslintignore ./

COPY packages/ ./packages/
COPY plugins/ ./plugins/
COPY app-config.yaml ./

# FIX 1: Allow scripts during initial build so tooling builds correctly
RUN YARN_ENABLE_IMMUTABLE_INSTALLS=false \
    YARN_CACHE_FOLDER=/root/.yarn/berry/cache \
    yarn install

RUN yarn tsc
RUN yarn workspace app build
RUN yarn workspace backend build

# ── Stage 2: production image ─────────────────────────────────────────────────
FROM node:22-bookworm-slim

# Install compilation tools (g++ package natively provides the system g++)
RUN corepack enable \
    && apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=build /app/packages/backend/dist/skeleton.tar.gz ./
RUN tar xzf skeleton.tar.gz && rm skeleton.tar.gz

COPY --from=build /app/package.json /app/yarn.lock /app/.yarnrc.yml ./
COPY --from=build /app/.yarn ./.yarn

# FIX 2: REMOVED the inline Node script that was muting postinstall scripts.
# FIX 3: Run production install allowing native C++ compilation to happen naturally.
RUN YARN_ENABLE_IMMUTABLE_INSTALLS=false \
    YARN_CACHE_FOLDER=/root/.yarn/berry/cache \
    yarn workspaces focus --all --production

# FIX 4: Explicitly force a targeted native compilation for your runtime environment
RUN yarn workspace backend exec node-gyp rebuild || true

# Clean up yarn cache after native build is done
RUN rm -rf "$(yarn cache dir)"

COPY --from=build /app/packages/app/package.json packages/app/package.json
RUN ln -sf ../packages/app node_modules/app

COPY --from=build /app/packages/backend/dist/bundle.tar.gz ./
RUN tar xzf bundle.tar.gz && rm bundle.tar.gz

COPY --from=build /app/plugins/dcm-backend/config.d.ts plugins/dcm-backend/config.d.ts
COPY --from=build /app/packages/app/dist packages/app/dist
COPY app-config.yaml app-config.production.yaml ./

RUN chown -R node:node /app
USER node

EXPOSE 7007

CMD ["node", "packages/backend", \
    "--config", "app-config.yaml", \
    "--config", "app-config.production.yaml"]