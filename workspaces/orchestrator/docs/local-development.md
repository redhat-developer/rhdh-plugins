# Local Development Setup

The orchestrator workspace is structured like a standard Backstage application. To get it up and running locally for development, follow these steps:

## Prerequisites

- Docker or podman up and running
  - If using podman, see the [Using Podman Instead of Docker](#using-podman-instead-of-docker) section for additional configuration steps
- Developer tools installed:
  - **Fedora/Red Hat-based Linux**:
    ```bash
    sudo dnf install python3 make g++ zlib-devel brotli-devel openssl-devel libuv-devel
    ```
  - **Debian/Ubuntu-based Linux**:
    ```bash
    sudo apt-get install python3 g++ build-essential
    ```
  - **Windows**: Follow the [Windows setup instructions](https://github.com/nodejs/node-gyp#on-windows) in the `node-gyp` documentation.
  - **macOS**: Follow the [macOS setup instructions](https://github.com/nodejs/node-gyp#on-macos) in the `node-gyp` documentation.

## Installation and Startup

1. Navigate to the orchestrator workspace and start the app:
   ```bash
   cd workspaces/orchestrator
   yarn install
   yarn dev
   ```

This will trigger the following:

1. **Clone workflow repository**: The [backstage-orchestrator-workflows](https://github.com/rhdhorchestrator/backstage-orchestrator-workflows) repository is cloned to `packages/backend/.devModeTemp` within the orchestrator workspace.
2. **Start SonataFlow container**: The SonataFlow devmode container is started and configured to load workflows from the locally cloned repository.
3. **Launch Backstage application**: The Backstage development server is started with the orchestrator plugin enabled and connected to the local SonataFlow instance.

## Using Podman Instead of Docker

If you're using podman instead of Docker, you'll need to modify the `app-config.yaml` file to configure the orchestrator properly:

1. **Set the runtime to podman**: Uncomment and modify the runtime setting in the orchestrator configuration:

   ```yaml
   orchestrator:
     sonataFlowService:
       runtime: podman # uncomment this line
   ```

2. **Update the notifications URL**: Change the notifications URL to use the podman-specific hostname:
   ```yaml
   orchestrator:
     sonataFlowService:
       notificationsUrl: http://host.containers.internal:7007 # uncomment this line
       # notificationsUrl: http://host.docker.internal:7007    # comment out the Docker line
   ```

These settings can be found in the `app-config.yaml` file, where they are already present but commented out for easy activation.

## How to use the GitHub identity provider

The [app config](../app-config.yaml) and the [App.tsx](../packages/app/src/App.tsx) files contain sufficient configuration to use the GitHub identity provider.

Follow these steps to login to backstage using your GitHub account:

### Create a GitHub OAuth App

Go to your GitHub account -> Setting -> Developer settings -> OAuth Apps -> New OAuth App.
Enter a name, enter http://localhost:3000 to Homepage URL and http://localhost:7007/api/auth/github/handler/frame to Authorization callback URL and click on Register application.

### Update backstage user entity

Update [users.yaml](../users.yaml) to match you GitHub account. Put your GitHub username in the metadata.name field, and you GitHub email in spec.profile.email field.

### Setup environment variables and run

```
export AUTH_GITHUB_CLIENT_ID=...fill from OAuth App client ID
export AUTH_GITHUB_CLIENT_SECRET=...fill from OAuth App client secret

yarn dev
```
