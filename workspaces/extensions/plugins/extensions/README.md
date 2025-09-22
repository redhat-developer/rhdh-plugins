# extensions

Welcome to the extensions plugin!

_This plugin was created through the Backstage CLI_

## Getting started

Your plugin has been added to the example app in this repository, meaning you'll be able to access it by running `yarn start` in the root directory, and then navigating to [/extensions](http://localhost:3000/extensions).

You can also serve the plugin in isolation by running `yarn start` in the plugin directory.
This method of serving the plugin provides quicker iteration speed and a faster startup and hot reloads.
It is only meant for local development, and the setup for it can be found inside the [/dev](./dev) directory.

**NOTE**

- When RBAC permission framework is enabled, for non-admin users to access Extensions UI, the role associated with your user should have the following permission policies associated with it. Add the following in your permission policies configuration file:

```CSV
p, role:default/team_a, extensions-plugin, read, allow
p, role:default/team_a, extensions-plugin, create, allow
g, user:default/<login-id/user-name>, role:default/team_a
```
