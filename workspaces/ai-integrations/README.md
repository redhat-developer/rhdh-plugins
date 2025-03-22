# [Backstage](https://backstage.io)

## Running the module

To run the rhdh model catalog backend module in development mode:

1. Ensure the following environment variables are set:

- `RHDH_AI_BRIDGE_SERVER`: Set to the server hosting the RHDH AI Bridge
- `RHDH_BRIDGE_HOST`: Similar as above, but without the protocol
- `RHDH_TOKEN`: Any 8 character password to use for authentication with RHDH

2. Run `yarn install` to install dependencies

3. Run `yarn dev` to launch the module
