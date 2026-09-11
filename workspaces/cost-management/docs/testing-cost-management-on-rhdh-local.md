# Testing Cost Management 2.2.0 on RHDH Local

## Overview

This guide covers how to run and test the cost-management dynamic plugin (v2.2.0) locally using the `rhdh-local` Compose-based setup. This is useful for verifying plugin behavior before deploying to a real RHDH cluster.

There are two ways to install the plugin locally:

1. **Pre-install via override file** — plugin is installed at startup (recommended for development)
2. **Install via Extensions Catalog UI** — plugin is browsed and installed from the marketplace UI (simulates the user experience)

## Prerequisites

- **Podman** or **Docker** with Compose support
- The `rhdh-local` repository checked out at `rhdh-local/`
- The `rhdh-plugin-export-overlays` repository checked out at `rhdh-plugin-export-overlays/` (sibling directory)
- Cost Management API credentials (`CM_CLIENT_ID`, `CM_CLIENT_SECRET`) if testing backend functionality

## RHDH Image Version

The cost-management 2.2.0 plugin is built against **Backstage 1.49.4**. The default RHDH image (`quay.io/rhdh-community/rhdh:1.9`) ships with Backstage ~1.36.x, which is significantly older. To ensure compatibility, use the `next` tag.

Add to your `.env` file:

```bash
RHDH_IMAGE=quay.io/rhdh-community/rhdh:next
```

Available image tags:

| Tag        | Description                | Backstage Version | Use Case                                                      |
| ---------- | -------------------------- | ----------------- | ------------------------------------------------------------- |
| `1.9`      | Current GA (stable)        | ~1.36.x           | Customer-facing compatibility testing                         |
| `next`     | Nightly from `main` branch | ~1.49.x           | Development/testing of plugins built against latest Backstage |
| `next-1.9` | Nightly patches for 1.9    | ~1.36.x           | Testing 1.9 patches                                           |
| `1.10`     | **Not available yet**      | N/A               | Will be created when 1.10 goes GA                             |

For more details on available images, see `rhdh-local/docs/rhdh-local-guide/container-image-guide.md`.

## Setup

### 1. Dynamic Plugins Configuration (Pre-install Method)

The override file has been created at:

```
rhdh-local/configs/dynamic-plugins/dynamic-plugins.override.yaml
```

It configures both the frontend and backend cost-management plugins from the Quay registry:

- **Frontend**: `oci://quay.io/redhat-resource-optimization/dynamic-plugins:2.2.0!red-hat-developer-hub-plugin-cost-management`
- **Backend**: `oci://quay.io/redhat-resource-optimization/dynamic-plugins:2.2.0!red-hat-developer-hub-plugin-cost-management-backend`

The frontend plugin configuration includes:

- Sidebar menu with "Cost management" parent and nested "Optimizations" and "OpenShift" items (using dot notation for `menuItems` keys)
- Custom icon (`CostManagementIconOutlined`)
- Two dynamic routes (`/cost-management/optimizations` and `/cost-management/openshift`)

### 2. Environment Variables

Create a `.env` file in the `rhdh-local/` root (or add to the existing one):

```bash
# Use the next image to match plugin's Backstage version
RHDH_IMAGE=quay.io/rhdh-community/rhdh:next

# Cost Management API credentials
CM_CLIENT_ID=your-client-id-here
CM_CLIENT_SECRET=your-client-secret-here
```

These are referenced by the backend plugin's `pluginConfig` via `${CM_CLIENT_ID}` and `${CM_CLIENT_SECRET}`.

### 3. App Config

The `configs/app-config/app-config.local.yaml` contains two important sections:

**Cost Management backend config** — required for the backend plugin to authenticate with the Red Hat API:

```yaml
costManagement:
  clientId: ${CM_CLIENT_ID}
  clientSecret: ${CM_CLIENT_SECRET}
  optimizationWorkflowId: 'patch-k8s-resource'
```

This config block is required regardless of how you install the plugin (pre-install or Extensions Catalog). The `${CM_CLIENT_ID}` and `${CM_CLIENT_SECRET}` are substituted from your `.env` file at RHDH startup.

**Catalog entities** — registers cost-management Plugin and Package entities for the Extensions Catalog:

```yaml
# Cost Management entities (for local testing)
- type: file
  target: /marketplace/catalog-entities/plugins/cost-management.yaml
  rules:
    - allow: [Plugin]
- type: file
  target: /marketplace/catalog-entities/packages/cost-management/cost-management.yaml
  rules:
    - allow: [Package]
- type: file
  target: /marketplace/catalog-entities/packages/cost-management/cost-management-backend.yaml
  rules:
    - allow: [Package]
```

These are bind-mounted from `rhdh-plugin-export-overlays` via `compose.override.yaml`.

## Running

### Start RHDH Local

```bash
cd rhdh-local

# Start the stack (install-dynamic-plugins runs first, then RHDH starts)
podman compose up -d

# Or with Docker
docker compose up -d
```

The startup sequence:

1. `install-dynamic-plugins` service runs `prepare-and-install-dynamic-plugins.sh` — detects the override file and uses it
2. Plugin OCI images are pulled from Quay and installed into the `dynamic-plugins-root` volume
3. `rhdh` service starts once plugins are installed, loading the generated `app-config.dynamic-plugins.yaml`

### Verify Plugin Installation

```bash
# Check logs for plugin loading
podman compose logs rhdh | grep -i "cost-management"

# Check install logs
podman compose logs install-dynamic-plugins | grep -i "cost-management"
```

Look for messages like:

```
loaded dynamic frontend plugin 'red-hat-developer-hub-plugin-cost-management'
loaded dynamic backend plugin 'red-hat-developer-hub-plugin-cost-management-backend'
```

### Access RHDH

Open **http://localhost:7008** in your browser.

Verify:

- "Cost management" appears in the sidebar with the custom icon
- Clicking it expands to show "Optimizations" and "OpenShift" nested items
- Navigating to `/cost-management/optimizations` loads the Optimizations page
- Navigating to `/cost-management/openshift` loads the OpenShift page

### Restart After Config Changes

If you modify the override file or app config:

```bash
# Re-install plugins and restart
podman compose run install-dynamic-plugins
podman compose restart rhdh
```

### Stop

```bash
podman compose down
```

## Testing Different Image Sources

### Using GHCR Images (PR-built)

To test with a PR-built image from the overlay repo (e.g., PR #2398):

```yaml
# In dynamic-plugins.override.yaml, replace the package lines:
- package: oci://ghcr.io/redhat-developer/rhdh-plugin-export-overlays/red-hat-developer-hub-plugin-cost-management:pr_2398__2.2.0!red-hat-developer-hub-plugin-cost-management
```

### Using GHCR Images (production)

After merging to main in the overlay repo, production images are tagged `bs_<backstage-version>__<plugin-version>`:

```yaml
- package: oci://ghcr.io/redhat-developer/rhdh-plugin-export-overlays/red-hat-developer-hub-plugin-cost-management:bs_1.49.4__2.2.0!red-hat-developer-hub-plugin-cost-management
```

### Using Local Build

If you've built the plugin locally with `dynamic-plugins.sh`:

```yaml
- package: ./local-plugins/red-hat-developer-hub-plugin-cost-management
```

Mount the local directory via `compose-dynamic-plugins-root.yaml`:

```bash
podman compose -f compose.yaml -f compose-dynamic-plugins-root.yaml up -d
```

## Troubleshooting

### Plugin not loading

1. Check install logs: `podman compose logs install-dynamic-plugins`
2. Verify the override file is detected: look for "Using dynamic-plugins.override.yaml" in logs
3. Check RHDH logs for errors: `podman compose logs rhdh | grep -i error`

### Sidebar menu not showing nested items

Ensure `menuItems` keys use **dot notation** (not slashes):

- Correct: `cost-management.optimizations`
- Incorrect: `cost-management/optimizations`

### OCI image pull failures

If pulling from Quay fails, ensure you're authenticated:

```bash
podman login quay.io
# or for GHCR:
podman login ghcr.io
```

For GHCR, set `REGISTRY_AUTH_FILE` in `.env` if needed (see `docs/rhdh-local-guide/container-image-guide.md`).

### Backend plugin errors (401/403)

Verify `CM_CLIENT_ID` and `CM_CLIENT_SECRET` are set correctly in your `.env` file and that the credentials have access to the cost.redhat.com API.

## Testing via Extensions Catalog (Marketplace UI)

Instead of pre-installing the plugin via the override file, you can test the full user experience of discovering and installing the plugin through the Extensions Catalog UI. This simulates how customers would install plugins on a real RHDH cluster.

### Prerequisites

The following must already be in place (these are already configured in this workspace):

1. **`compose.override.yaml`** — bind-mounts Plugin and Package catalog entities from `rhdh-plugin-export-overlays` into the container
2. **`app-config.local.yaml`** — registers the cost-management Plugin and Package entities as catalog locations, and includes the `costManagement` config block with `clientId` and `clientSecret`
3. **Extensions plugins enabled** — the `dynamic-plugins.override.yaml` (or default `dynamic-plugins.yaml`) must include the Extensions frontend and backend plugins

**Important:** The `costManagement` config block must be in `app-config.local.yaml` (not just in the dynamic plugins config). When the Extensions Catalog installs a plugin, it saves the `pluginConfig` to `dynamic-plugins.extensions.yaml`, but top-level app-config keys like `costManagement` must exist in the actual app-config files. Without this, the backend plugin will fail with:

```
Missing required config value at 'costManagement.clientId' in 'app-config.local.yaml'
```

### Steps

1. **Start RHDH without cost-management pre-installed.**

   If you want to test the Extensions Catalog flow exclusively, remove the cost-management entries from `dynamic-plugins.override.yaml` (keep only the `includes` and Extensions plugins). Or use the default `dynamic-plugins.yaml` which already has Extensions enabled — just rename/delete the override file.

2. **Start the stack:**

   ```bash
   cd rhdh-local
   podman compose up -d
   ```

3. **Open the Extensions Catalog:**

   Navigate to **http://localhost:7008/extensions** in your browser.

4. **Find the Cost Management plugin:**

   Search for "cost-management" or browse the catalog. You should see both:

   - **Cost Management Frontend** — with version 2.2.0
   - **Cost Management Backend** — with version 2.2.0

   These are loaded from the Package entities mounted from `rhdh-plugin-export-overlays/workspaces/cost-management/metadata/`.

5. **Install the plugin via the UI:**

   Click on the plugin and follow the install flow. The Extensions backend saves the installation config to `dynamic-plugins.extensions.yaml` inside the container volume.

6. **Restart to apply:**

   After installing via the UI, restart to load the newly installed plugins:

   ```bash
   podman compose run install-dynamic-plugins
   podman compose restart rhdh
   ```

7. **Verify** the plugin appears in the sidebar and pages load correctly.

### How It Works

The Extensions Catalog flow relies on three pieces:

- **Plugin entities** (`cost-management.yaml` in `catalog-entities/extensions/plugins/`) — define the plugin in the marketplace catalog
- **Package entities** (`metadata/cost-management.yaml`, `metadata/cost-management-backend.yaml`) — contain the `dynamicArtifact` OCI reference and `appConfigExamples` that the Extensions UI uses to generate install config
- **Extensions backend plugin** — writes the install config to `dynamic-plugins.extensions.yaml`, which is included via the `includes` directive in the dynamic plugins config

### Pre-install vs. Extensions Catalog

| Aspect             | Pre-install (Override File)      | Extensions Catalog (UI)                                    |
| ------------------ | -------------------------------- | ---------------------------------------------------------- |
| **Setup**          | Edit YAML config manually        | Browse and click in UI                                     |
| **Config control** | Full control over `pluginConfig` | Generated from `appConfigExamples` in metadata             |
| **Testing focus**  | Plugin functionality             | End-user install experience + metadata correctness         |
| **When to use**    | Day-to-day development           | Validating metadata, `appConfigExamples`, and install flow |
| **Restart needed** | At initial startup               | After each UI install                                      |

Testing via the Extensions Catalog is particularly useful for validating that:

- The `appConfigExamples` in metadata produce a working configuration
- The `dynamicArtifact` OCI reference is correct and pullable
- The plugin appears correctly in the marketplace with proper metadata

For automated E2E testing on OpenShift, see [adding-e2e-tests-to-overlay-repo.md](adding-e2e-tests-to-overlay-repo.md).

## File Reference

| File                                                               | Purpose                                  |
| ------------------------------------------------------------------ | ---------------------------------------- |
| `rhdh-local/configs/dynamic-plugins/dynamic-plugins.override.yaml` | Plugin config with cost-management 2.2.0 |
| `rhdh-local/configs/app-config/app-config.local.yaml`              | Catalog entities for cost-management     |
| `rhdh-local/compose.override.yaml`                                 | Bind mounts for overlay repo metadata    |
| `rhdh-local/default.env`                                           | Default env vars (BASE_URL, DB, etc.)    |
| `rhdh-local/.env`                                                  | Your local overrides (CM credentials)    |
