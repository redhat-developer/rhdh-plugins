# [Backstage](https://backstage.io)

## Running the module

To run the rhdh model catalog backend module in development mode:

1. Ensure the following environment variables are set:

- `RHDH_AI_BRIDGE_SERVER`: Set to the server hosting the RHDH AI Bridge
- `RHDH_BRIDGE_HOST`: Similar as above, but without the protocol
- `RHDH_TOKEN`: Any 8 character password to use for authentication with RHDH

2. Run `yarn install` to install dependencies

3. Run `yarn dev` to launch the module

## Building the plugin archive

**Note:** We suggest building on an x86 environment (we've found the plugin archive does not successfully deploy when built on an arm64 environment)

The ai-experience plugins are packaged as part of an OCI archive.

To build the plugin archive, ensure you have `docker` or `podman` installed on your system, and run:

```
npx --yes @red-hat-developer-hub/cli@latest plugin package --tag "${PLUGIN_CONTAINER_TAG}"
```

Where `PLUGIN_CONTAINER_TAG` is the image tag you would like to use (e.g. `quay.io/<your-user>/ai-experience:latest`)

If you would like to build with `docker`, add the `--user-docker` tag like so:

```
npx --yes @red-hat-developer-hub/cli@latest plugin package --tag --tag "${PLUGIN_CONTAINER_TAG}" --use-docker
```
