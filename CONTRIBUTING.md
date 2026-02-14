# Contributing to `redhat-developer/rhdh-plugins`

The `redhat-developer/rhdh-plugins` repository is designed as a collaborative space to host and manage plugins developed by Red Hat. This repository will provide plugin maintainers with tools for plugin management and publication. By contributing a plugin to this repository, maintainers agree to adhere to specific guidelines and a standardized release process detailed in this guide.

## Table of Contents

- [Contributing to `redhat-developer/rhdh-plugins`](#contributing-to-redhat-developerrhdh-plugins)
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
    - [Using the cli to migrate plugins from janus-idp/backstage-plugins](#using-the-cli-to-migrate-plugins-from-janus-idpbackstage-plugins)
    - [Next steps](#next-steps)
    - [Maintenance of older versions](#maintenance-of-older-versions)
  - [API Reports](#api-reports)
  - [Submitting a Pull Request](#submitting-a-pull-request)
  - [Plugin Owner Responsibilities](#plugin-owner-responsibilities)
    - [Responsibilities](#responsibilities)
    - [Keeping Workspaces Up to Date with Backstage](#keeping-workspaces-up-to-date-with-backstage)
      - [Process](#process)
    - [Updating Dependencies with Renovate](#updating-dependencies-with-renovate)
      - [Types of PRs](#types-of-prs)
        - [Dependency Updates](#dependency-updates)
        - [Security Fixes](#security-fixes)
    - [Opt-in to Knip Reports Check](#opt-in-to-knip-reports-check)

## License

The rhdh plugins repository is under [Apache 2.0](./LICENSE) license. All plugins added & moved to the repository will be kept under the same license. If you are moving a plugin over make sure that no other license file is in the plugin workspace & all `package.json` files either have no version defined or explicitly use _“Apache 2.0”_.

## Get Started

### Forking the Repository

Ok. So you're gonna want some code right? Go ahead and fork the repository into your own GitHub account and clone that code to your local machine. GitHub's [Fork a repo](https://docs.github.com/en/get-started/quickstart/fork-a-repo) documentation has a great step by step guide if you are not sure how to do this.

If you cloned a fork, you can add the upstream dependency like so:

```bash
git remote add upstream git@github.com:redhat-developer/rhdh-plugins.git
git pull upstream main
```

After you have cloned the RHDH Plugins repository, you should run the following commands once to set things up for development:

```bash
cd rhdh-plugins
yarn install
cd workspaces/noop
yarn install
```

### Developing Plugins in Workspaces

Most plugins come with a standalone runner that you should be able to utilize in order to develop on your plugins in isolation. You can navigate to a workspace and a plugin inside the plugin folder and run `yarn start` which should kick off the development standalone server for that plugin. It's also possible that this might not be setup for some plugins, in which case you can set them up following some prior art in the `backstage/backstage` repository. [backend plugin dev](https://github.com/backstage/backstage/blob/e46d3fe011fe19821b2556f0164442cc0b825363/plugins/auth-backend/dev/index.ts) and [frontend plugin dev](https://github.com/backstage/backstage/blob/e46d3fe011fe19821b2556f0164442cc0b825363/plugins/home/dev/index.tsx) examples.

There could be times when there is a need for a more rich development environment for a workspace. Say that the workspace and it's plugin depend on a full catalog, and maybe the kubernetes plugin already running too, that could be a bit of a pain to set up. In that case, there might be a full Backstage environment that you can run with `yarn dev` in the workspace root, which will start up a full Backstage environment located in `$WORKSPACE_ROOT/packages/app` and `$WORKSPACE_ROOT/packages/backend`.

> [!IMPORTANT]
> Both the full Backstage environment and standalone runners are configured on a per-workspace basis. Be sure to check the workspace `README.md` for specific instructions on setting up the development environment for each plugin.

## Coding Guidelines

All code is formatted with `prettier` using the configuration in the repo. If possible we recommend configuring your editor to format automatically, but you can also use the `yarn prettier --write <file>` command to format files.

## Versioning

For the versioning all packages in this repository are following the semantic versioning standard enforced through Changesets. This is the same approach as in the “backstage/community-plugins" repository. If this is your first time working with Changesets checkout [this documentation](https://github.com/backstage/backstage/blob/master/CONTRIBUTING.md#creating-changesets) or read a quick summary below.

## Creating Changesets

We use [changesets](https://github.com/atlassian/changesets) to help us prepare releases. They help us make sure that every package affected by a change gets a proper version number and an entry in its `CHANGELOG.md`. To make the process of generating releases easy, it helps when contributors include changesets with their pull requests.

To create a changeset, follow these steps:

1. Make sure you are in the root directory of the workspace for the plugin you want to create a changeset for. For ex: if you are making changes on the `openshift-image-registry` plugin then you should be on `workspaces/openshift-image-registry` dir

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

As soon as a plugin is part of the rhdh plugins repository every PR with a change is expected to contain a changeset. As soon as the PR is merged a follow up PR will be created called _“Version Packages (your-plugin-name)”_. This version packages PR will remove the merged changeset & add it to the changelog for the specific plugin. Additionally the version in the `package.json` is adjusted.

A release is automatically triggered by merging the plugins “Version Packages” PR.

> [!IMPORTANT]
> Please note that plugins with the private property set to 'true' will not be published upon merging the "Version Packages" PR. If you want full autonomy over the release process, you can mark your plugin as private. In this case, the release process will be managed by the plugin maintainer.

## Creating a new Workspace

For workspaces the name should reflect the name of the plugins contained in a simple manner (e.g. for the plugins `todo` & `todo-backend` the workspace would be called `todo`).

For plugins we will continue to follow the naming pattern suggested by the ADR on the [backstage](https://github.com/backstage/backstage/tree/master) repository: <https://backstage.io/docs/architecture-decisions/adrs-adr011>.

You can create a workspace by running the following:

```bash
# jump in to the rhdh-plugins repo that you cloned
cd rhdh-plugins
# install the root dependencies so that you can create workspaces
yarn install
# create a workspace and follow the prompt
yarn create-workspace
```

From there, once the script has finished, you should have a new `yarn workspace` with its own changesets and releases. You can navigate to the workspace and start developing your plugin.

## Creating new plugins or packages in a Workspace

Once you have a workspace set up, the creation of new plugins and packages is just like any other Backstage repository. You can use the `yarn new` command to run the prompt for creating new plugins or packages.

```bash
cd workspaces/openshift-image-registry
yarn install
yarn new
```

## Migrating a plugin

Before proceeding with migrating a plugin, please review the following sections of the `README`:

- [RHDH Plugins Workflow](https://github.com/redhat-developer/rhdh-plugins/tree/main?tab=readme-ov-file#plugins-workflow)

By migrating a plugin to this repository you will need to ensure you can meet certain requirements and adhere to some specific guidelines:

- Agree to publish the plugin to the `@red-hat-developer-hub` npm scope.
- Adopt the Changesets workflow for releasing new plugin versions.
- Adhere to the repository security process for handling security-related issues.
- Plugins moved to the repository should be licensed under Apache 2.0.

### Manual migration steps

1. Prepare your environment by cloning both the repository you are migrating from and the `redhat-developer/rhdh-plugins` repository:

```sh
git clone https://github.com/source-repo/existing-plugins.git
git clone https://github.com/redhat-developer/rhdh-plugins.git
```

2. Identify the plugin(s) you wish to migrate. If you're migrating multiple plugins, it is recommended to group the migration of these by workspace.

3. Within the `redhat-developer/rhdh-plugins` repository create a new branch for your changes:

```sh
git checkout -b migrate-workspace
```

4. Create a new workspace in the rhdh plugins repository.

```sh
yarn create-workspace
```

5. Copy the plugin files from the source repository to the `redhat-developer/rhdh-plugins` repository.

```sh
cd your-workspace-name
cp -r ../existing-plugins/plugins/plugin-name plugins/
```

6. Ensure all metadata files (`package.json`) are updated to reflect the new repository. This includes updating repository URLs, issues URLs, and other references.

7. Add maintainers to the `CODEOWNERS` file for the new workspace.

> **Note:** The `CODEOWNERS` file will have errors until you are a member of the Red Hat Developer GitHub organization. However, it is still useful to add `CODEOWNERS` at this point as it provides a documented reference as to who owns/maintains the plugin.

8. Create a new pull request from your branch.

9. Update external references to the old plugin location such as documentation to point to the new location in the `redhat-developer/rhdh-plugins` repository.

10. In the original repository, update the plugin to indicate that it has been moved to the `redhat-developer/rhdh-plugins` repository. You may wish to deprecate the old version on npm.

### Using the cli to migrate plugins from janus-idp/backstage-plugins

1. Prepare your environment by cloning a fork of both the `janus-idp/backstage-plugins` and the `redhat-developer/rhdh-plugins` repositories

2. In both repositories, create a new branch:

   - For `janus-idp/backstage-plugins`:

     ```bash
     git checkout -b "deprecate-workspace-name"
     ```

   - For `redhat-developer/rhdh-plugins`:

     ```bash
     git checkout -b "migrate-workspace-name"
     ```

3. In the `redhat-developer/rhdh-plugins` repository, execute the janus-plugin migrate command. - Usage:`yarn rhdh-cli janus-plugin migrate --monorepo-path [path_to_backstage_plugins] --workspace-name [workspace_name] --branch [branch_name] --maintainers [maintainer1],[maintainer2],[maintainer3],...`

   - The `path_to_backstage_plugins` is the path to the `backstage-plugins` project where the plugin(s) you want to migrate live.
   - The `workspace-name` is the name of the workspace you wish to create in the `rhdh-plugins` project. All plugins in the `backstage-plugins` that either are exactly or start with `@janus-idp/backstage-plugin-[workspace_name]` will be migrated to this new workspace.
   - The `branch_name` is the name of the branch in the `backstage-plugins` project where the changes to add a deprecate note for the migrated plugins will be made.
   - The `maintainers` array of arguments is the github usernames of those individuals that should be listed as the maintainers for the migrated plugins. Please separate each maintainer by a comma while supplying this value.

   - example usage:

     ```bash
      yarn rhdh-cli janus-plugin migrate --monorepo-path ../backstage-plugins --workspace-name workspace-name --branch deprecate-workspace-name --maintainers @maintainer1,@maintainer2,@maintainer3
     ```

4. The script will generate changesets in both repositories. Be sure to commit these changes and open pull requests.

> [!IMPORTANT]
> This script updates metadata commonly found across all plugins. Please review your migrated plugins to ensure that all references to "janus" have been updated to point to "rhdh-plugins."

5. If you run into CI issues take a look at [this github gist](https://gist.github.com/Fortune-Ndlovu/1562789f3905b4fe818b9079a3032982) which outlines the process taken to migrate argocd plugins in great detail.

6. Check if the migrated plugins need to be added to janus-idp/backstage-showcase. If they do, create a wrapper for them following the steps below:

- In `dynamic-plugins/wrappers` create a directory, name it based on your plugin (e.g.: `backstage-community-plugin-3scale-backend`)
- Create a `src` directory within it
- Add a `index.ts` file to this src directory and export from the plugin package here. E.g.: `export * from '@backstage-community/plugin-3scale-backend';`
- In `dynamic-plugins/wrappers/backstage-community-plugin-3scale-backend` (or whatever you named your wrapper directory), add a `package.json` file. Add your plugin package in dependencies.
  - [Frontend plugin `package.json` example](https://github.com/janus-idp/backstage-showcase/blob/main/dynamic-plugins/wrappers/backstage-community-plugin-redhat-argocd/package.json)
  - [Backend plugin `package.json` example](https://github.com/janus-idp/backstage-showcase/blob/main/dynamic-plugins/wrappers/backstage-community-plugin-3scale-backend/package.json)
- run `yarn export-dynamic` to generate dist-dynamic directory

### Next steps

Once PRs are merged in the new repo, you should [mark the old plugins deprecated, and delete the content - leaving only a README.md](https://github.com/janus-idp/backstage-plugins/pull/2482/files#diff-74b70d63dd0c250dcfdd7cacf4639fc82a1a66098d9fc2a269bb98bf89790f9fR1).

### Maintenance of older versions

As only a single version will be migrated to the new repo, maintenance of older plugins for previous RHDH releases should continue to be done in the older repo, as the migrated versions will be aligned to newer versions of Backstage and may not be compatible.

## API Reports

This repository uses [API Extractor](https://api-extractor.com/) and TSDoc comments to generate API Reports in Markdown format, similar to those used in Backstage. If you make changes to the API or add a new plugin then you will need either generate a new API Report or update an existing API Report. If you don't do this the CI build will fail when you create your Pull Request.

There are two ways you can do this:

1. You can run `yarn build:api-reports` from the root of the project and it will go through all of the existing API Reports and update them or create new ones as needed. This may take a while but is generally the best method if you are new to this.
2. You can run `yarn build:api-reports plugins/<your-plugin-with-changes>` from the workspace root and it will update the existing API Report or create a new one.

> Note: the above commands assume you've run `yarn install` beforehand or recently

Each plugin/package has its own API Report which means you might see more than one file updated or created depending on your changes. These changes will then need to be committed as well.

## Submitting a Pull Request

When you've got your contribution working, tested, and committed to your branch it's time to create a Pull Request (PR). If you are unsure how to do this GitHub's [Creating a pull request from a fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork) documentation will help you with that.

> [!NOTE]
> Only [repository maintainers](https://github.com/orgs/redhat-developer/teams/rhdh-plugins-maintainers) can bypass the SonarCloud test. We typically grant a one-time exception for new plugins that require a full application instead of a standalone development server. If this applies to your pull request, please mention it in the description.

## Plugin Owner Responsibilities

> [!NOTE]
> To carry out your responsibilities as a plugin owner, you will need write access to the repository. If you are a plugin owner and do not have write access, please reach out to one of the [repository maintainers](https://github.com/orgs/redhat-developer/teams/rhdh-plugins-maintainers).

As a plugin owner, you are responsible for the ongoing health and maintenance of your plugin(s) in this repository.

### Responsibilities

- **Review, approve, and merge PRs** opened against your plugin, including:
  - Community contributions
  - Renovate PRs (See [Updating Dependencies with Renovate](#updating-dependencies-with-renovate))
  - Dependabot PRs
  - Version package PRs
- **Keep your workspace(s) up to date** with the latest Backstage version supported by RHDH.
  See [Keeping Workspaces Up to Date](#keeping-workspaces-up-to-date-with-backstage).
- **Manage security updates and patches**:
  Work with your security team to address vulnerabilities according to SLA and product lifecycle requirements.
  Since this repository does not maintain release branches, Renovate only opens PRs against the latest code.
  If your plugin is used in multiple product versions, you are responsible for backporting critical patches.
- **Justify Dependency-Related PR closures**:
  If you choose not to merge a Renovate or dependency-related PR, include a brief explanation when closing it.

### Keeping Workspaces Up to Date with Backstage

To keep plugins in the various workspaces up to date with Backstage we have a [Version Bump Workflow](https://github.com/redhat-developer/rhdh-plugins/actions/workflows/version-bump.yml) in place, similar to the one that is used in the [backstage/community-plugins](https://github.com/backstage/community-plugins) repository.

#### Process

When a Plugin Owner wants to upgrade their workspace(s) to the latest version of Backstage they will simply need to do the following:

1. Navigate to the [Version Bump](https://github.com/redhat-developer/rhdh-plugins/actions/workflows/version-bump.yml) workflow
2. On the right hand side click on the "Run workflow" button
3. In the menu that appears use the following:
   1. For "Use workflow from" use the default "Branch: main"
   2. For "Release Line" use the default "main"
   3. For "Workspace (this must be a JSON array)" you will enter the name(s) of the workspace(s). For example for a single workspace it would look like this: `["bulk-import"]` and for multiple workspaces it would look like this: `["lightspeed", "homepage", "extensions"]`
   4. For "Specifies the type of version update to apply" use the default "minor"
4. Now click the "Run workflow" button
5. The workflow will then run and create a PR to upgrade each of the specified workspaces to the latest `main` release of Backstage
6. Review and merge the generated PR(s)

### Updating Dependencies with Renovate

This repository uses [Renovate](https://docs.renovatebot.com/) to automatically manage dependency updates for your plugins.

#### Types of PRs

##### Dependency Updates

- PRs will be created for dependencies that have patch or minor version updates.
- Major version updates will require [dashboard approval](https://github.com/redhat-developer/rhdh-plugins/issues/175) in order to generate a PR. Alternatively, the plugin owner can manually create their own PR to update to a major version.

##### Security Fixes

- PRs can also be opened for security alerts. These PRs are distinguishable with a `[security]` suffix in its title and will also have a `security` label.

### Opt-in to Knip Reports Check

Plugin owners can opt in to Knip reports check in CI by creating a `bcp.json` file in the root of their workspace (`workspaces/${WORKSPACE}/bcp.json`) and adding `{ "knip-reports": true }`. This ensures that knip reports in your workspace stay up to date.

[Knip](https://knip.dev/) is a tool that helps with clean-up and maintenance by identifying unused dependencies within workspaces. Regularly reviewing and addressing these reports can significantly improve code quality and reduce bloat.
