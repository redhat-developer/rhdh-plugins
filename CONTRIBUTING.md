# Contributing to `backstage/community-plugins`

The `backstage/community-plugins` repository is designed as a collaborative space for Backstage community members to host and manage their plugins for Backstage. This repository will provide plugin maintainers with tools for plugin management and publication. By contributing a plugin to this repository, maintainers agree to adhere to specific guidelines and a standardized release process detailed in this guide.

If you have questions or feedback regarding Community Plugins, you can visit the [Community Plugins #general channel](https://discord.com/channels/687207715902193673/1211692810294788126) in the Backstage [Discord](https://discord.gg/backstage-687207715902193673).

## Table of Contents

- [Contributing to `backstage/community-plugins`](#contributing-to-backstagecommunity-plugins)
  - [Table of Contents](#table-of-contents)
  - [License](#license)
  - [Get Started](#get-started)
    - [Forking the Repository](#forking-the-repository)
    - [Developing Plugins in Workspaces](#developing-plugins-in-workspaces)
  - [Coding Guidelines](#coding-guidelines)
  - [Versioning](#versioning)
  - [Creating Changesets](#creating-changesets)
  - [Release](#release)
  - [Creating a new Workspace](#creating-a-new-workspace)
  - [Creating new plugins or packages in a Workspace](#creating-new-plugins-or-packages-in-a-workspace)
  - [Migrating a plugin](#migrating-a-plugin)
    - [Manual migration steps](#manual-migration-steps)
  - [API Reports](#api-reports)
  - [Submitting a Pull Request](#submitting-a-pull-request)

## License

The community plugins repository is under [Apache 2.0](../LICENSE) license. All plugins added & moved to the repository will be kept under the same license. If you are moving a plugin over make sure that no other license file is in the plugin workspace & all `package.json` files either have no version defined or explicitly use _“Apache 2.0”_.

## Get Started

### Forking the Repository

Ok. So you're gonna want some code right? Go ahead and fork the repository into your own GitHub account and clone that code to your local machine. GitHub's [Fork a repo](https://docs.github.com/en/get-started/quickstart/fork-a-repo) documentation has a great step by step guide if you are not sure how to do this.

If you cloned a fork, you can add the upstream dependency like so:

```bash
git remote add upstream git@github.com:backstage/community-plugins.git
git pull upstream main
```

After you have cloned the Community Plugins repository, you should run the following commands once to set things up for development:

```bash
cd rhdh-plugins
yarn install
cd workspaces/noop
yarn install
```

### Developing Plugins in Workspaces

Frontend and Backend plugins come with a standalone runner that you should be able to utilize in order to develop on your plugins in isolation. You can navigate to a workspace and a plugin inside the plugin folder and run `yarn start` which should kick off the development standalone server for that plugin. It's also possible that this might not be setup for plugins that were migrated from the `backstage/backstage` repository, in which case you can set them up following some prior art in the `backstage/backstage` repository. [backend plugin dev](https://github.com/backstage/backstage/blob/e46d3fe011fe19821b2556f0164442cc0b825363/plugins/auth-backend/dev/index.ts) and [frontend plugin dev](https://github.com/backstage/backstage/blob/e46d3fe011fe19821b2556f0164442cc0b825363/plugins/home/dev/index.tsx) examples.

There could be times when there is a need for a more rich development environment for a workspace. Say that the workspace and it's plugin depend on a full catalog, and maybe the kubernetes plugin already running too, that could be a bit of a pain to set up. In that case, there might be a full Backstage environment that you can run with `yarn dev` in the workspace root, which will start up a full Backstage environment located in `$WORKSPACE_ROOT/packages/app` and `$WORKSPACE_ROOT/packages/backend`.

> [!IMPORTANT]  
> This full Backstage environment is not setup by default, and is setup on a per workspace basis. Check out the workspace `README.md` for more information on how to get a dev environment setup for each plugin.

## Coding Guidelines

All code is formatted with `prettier` using the configuration in the repo. If possible we recommend configuring your editor to format automatically, but you can also use the `yarn prettier --write <file>` command to format files.

## Versioning

For the versioning all packages in this repository are following the semantic versioning standard enforced through Changesets. This is the same approach as in the main “backstage/backstage” repository. If this is your first time working with Changesets checkout [this documentation](https://github.com/backstage/backstage/blob/master/CONTRIBUTING.md#creating-changesets) or read a quick summary below.

## Creating Changesets

We use [changesets](https://github.com/atlassian/changesets) to help us prepare releases. They help us make sure that every package affected by a change gets a proper version number and an entry in its `CHANGELOG.md`. To make the process of generating releases easy, it helps when contributors include changesets with their pull requests.

To create a changeset, follow these steps:

1. Make sure you are in the root directory of the workspace for the plugin you want to create a changeset for. For ex: if you are making changes on the `adr` plugin then you should be on `workspaces/adr` dir

2. Run the following command to create a new changeset:

    ```bash
    $ yarn changeset
    ```

3. You will be prompted to select the packages and the type of change you are making.

4. Enter a short description of the change when prompted. Refer to [backstage/backstage CONTRIBUTING.md#writing-changesets](https://github.com/backstage/backstage/blob/master/CONTRIBUTING.md#writing-changesets) for additional guidance on writing changesets.

5. Review the changeset file that was created. It should be located in the `.changeset` directory of your plugin's workspace.

6. Commit the changeset file to your branch/PR.

Once the changeset is merged, it will trigger the release process for the plugin and create a "Version packages ($workspace_name)" PR. Once the PR is merged, a new version of the plugin will be published based on the type of change made.

> [!NOTE]  
> It's important to create a changeset for each individual change you make to a plugin. This ensures that the release process is properly managed and that dependencies between plugins are correctly updated.

## Release

As soon as a plugin is part of the community plugins repository every PR with a change is expected to contain a changeset. As soon as the PR is merged a follow up PR will be created called _“Version Packages (your-plugin-name)”_. This version packages PR will remove the merged changeset & add it to the changelog for the specific plugin. Additionally the version in the `package.json` is adjusted.

A release is automatically triggered by merging the plugins “Version Packages” PR.

## Creating a new Workspace

For workspaces the name should reflect the name of the plugins contained in a simple manner (e.g. for the plugins `todo` & `todo-backend` the workspace would be called `todo`).

For plugins we will continue to follow the naming pattern suggested by the ADR on the main repository: https://backstage.io/docs/architecture-decisions/adrs-adr011.

You can create a workspace by running the following:

```bash
# jump in to the community-plugins repo that you cloned
cd community-plugins
# install the root dependencies so that you can create workspaces
yarn install
# create a workspace and follow the prompt
yarn create-workspace
```

From there, once the script has finished, you should have a new `yarn workspace` with it's own changesets and releases. You can navigate to the workspace and start developing your plugin.

## Creating new plugins or packages in a Workspace

Once you have a workspace setup, the creation of new plugins and packages is just like any other Backstage repository. You can use the `yarn new` command to run the prompt for creating new plugins or packages.

```bash
cd workspaces/adr
yarn new
```

## Migrating a plugin

Before proceeding with migrating a plugin, please review the following sections of the `README`:

- [Community Plugins Workflow](https://github.com/backstage/community-plugins#community-plugins-workflow)

By migrating a plugin to this repository you will need to ensure you can meet certain requirements and adhere to some specific guidelines:

- Agree to publish the plugin to the `@backstage-community` npm scope.
- Adopt the Changesets workflow for releasing new plugin versions.
- Adhere to the repository security process for handling security-related issues.
- Plugins moved to the repository should be licensed under Apache 2.0.

### Manual migration steps

1. Prepare your environment by cloning both the repository you are migrating from and the `redhat-developer/community-plugins` repository:

```sh
git clone https://github.com/source-repo/existing-plugins.git
git clone https://github.com/redhat-developer/rhdh-plugins.git
```

2. Identify the plugin(s) you wish to migrate. If you're migrating multiple plugins, is recommended to group the migration of these by workspace.

3. Within the `redhat-developer/rhdh-plugins` repository create a new branch for your changes:

```sh
git checkout -b migrate-workspace
```

3. Create a new workspace in the community plugins repository.

4. Copy the plugin files from the source repository to the `redhat-developer/rhdh-plugins` repository.

```sh
cp -r ../existing-plugins/plugins/plugin-name plugins/
```

5. Ensure all metadata files (`package.json`) are updated to reflect the new repository. This includes updating repository URLs, issues URLs, and other references.

6. Add maintainers to the `CODEOWNERS` file for the new workspace.

> **Note:** The `CODEOWNERS` file will have errors until you are a member of the Red Hat Developer GitHub organization. However, it is still useful to add `CODEOWNERS` at this point as it provides a documented reference as to who owns/maintains the plugin.

1. Create a new pull request from your branch.

2. Update external references to the old plugin location such as documentation to point to the new location in the `redhat-developer/rhdh-plugins` repository.

3. In the original repository, update the plugin to indicate that it has been moved to the `redhat-developer/rhdh-plugins` repository. You may wish to deprecate the old version on npm.

## API Reports

Backstage uses [API Extractor](https://api-extractor.com/) and TSDoc comments to generate API Reports in Markdown format. These reports are what drive the [API Reference documentation](https://backstage.io/docs/reference/). What this means is that if you are making changes to the API or adding a new plugin then you will need either generate a new API Report or update an existing API Report. If you don't do this the CI build will fail when you create your Pull Request.

There are two ways you can do this:

1. You can run `yarn build:api-reports` from the root of the project and it will go through all of the existing API Reports and update them or create new ones as needed. This may take a while but is generally the best method if you are new to this.
2. You can run `yarn build:api-reports plugins/<your-plugin-with-changes>` from the workspace root and it will update the existing API Report or create a new one.

> Note: the above commands assume you've run `yarn install` before hand or recently

Each plugin/package has its own API Report which means you might see more then one file updated or created depending on your changes. These changes will then need to be committed as well.

## Submitting a Pull Request

When you've got your contribution working, tested, and committed to your branch it's time to create a Pull Request (PR). If you are unsure how to do this GitHub's [Creating a pull request from a fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork) documentation will help you with that.
