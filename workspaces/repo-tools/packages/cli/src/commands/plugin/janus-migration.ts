/*
 * Copyright The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import chalk from 'chalk';
import fs from 'fs-extra';
import { OptionValues } from 'commander';
import findUp from 'find-up';
import path from 'path';
import { getPackages, Package } from '@manypkg/get-packages';
import { createWorkspace } from '../../lib/workspaces/createWorkspace';
import { ExitCodeError } from '../../lib/errors';
import { promisify } from 'util';
import { execFile } from 'child_process';

const replace = require('replace-in-file');

const exec = promisify(execFile);

// Do some magic to get the right paths, that are idempotent regardless of where the command is run from
const getPaths = async (options: {
  monorepoPath: string;
  workspaceName: string;
}) => {
  const rhdhPluginsPackageJson = await findUp(
    async dir => {
      const packageJsonPath = path.join(dir, 'package.json');
      const hasPackageJson = await findUp.exists(packageJsonPath);
      if (hasPackageJson) {
        const packageJsonContents = require(packageJsonPath);
        if (packageJsonContents.name === '@redhat-developer/rhdh-plugins') {
          return packageJsonPath;
        }
      }

      return undefined;
    },
    { type: 'file' },
  );

  if (!rhdhPluginsPackageJson) {
    throw new Error('Could not find rhdh plugins package.json');
  }

  const rhdhPluginsRoot = path.dirname(rhdhPluginsPackageJson);

  return {
    rhdhPluginsRoot,
    monorepoRoot: options.monorepoPath,
    workspacePath: path.join(
      rhdhPluginsRoot,
      'workspaces',
      options.workspaceName,
    ),
  };
};

const getMonorepoPackagesForWorkspace = async (options: {
  monorepoRoot: string;
  workspaceName: string;
}) => {
  const packages = await getPackages(options.monorepoRoot);

  const workspacePackages = packages.packages.filter(
    pkg =>
      pkg.packageJson.name.startsWith(
        `@janus-idp/backstage-plugin-${options.workspaceName}-`,
      ) ||
      pkg.packageJson.name ===
        `@janus-idp/backstage-plugin-${options.workspaceName}`,
  );

  return workspacePackages;
};

const generateNewPackageName = (name: string) =>
  name.replace(`@janus-idp`, `@red-hat-developer-hub`);

const ensureWorkspaceExists = async (options: {
  workspacePath: string;
  workspaceName: string;
  rhdhPluginsRoot: string;
}) => {
  // check if the workspace exists, create it if not.
  const workspaceExists = await fs
    .access(options.workspacePath, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);

  if (workspaceExists) {
    console.error(
      chalk.red`Workspace already exists at ${options.workspacePath}`,
    );
    throw new ExitCodeError(1);
  }

  console.log(chalk.yellow`Creating workspace at ${options.workspacePath}`);

  await createWorkspace({
    cwd: options.rhdhPluginsRoot,
    name: options.workspaceName,
  });
};

const fixSourceCodeReferences = async (options: {
  packagesToBeMoved: Package[];
  workspacePath: string;
}) => {
  // Rename app-config.janus-idp.yaml to app-config.yaml for each package
  for (const pkg of options.packagesToBeMoved) {
    const oldConfigPath = path.join(
      options.workspacePath,
      (pkg.packageJson as any).repository?.directory,
      'app-config.janus-idp.yaml',
    );
    const newConfigPath = path.join(
      options.workspacePath,
      (pkg.packageJson as any).repository?.directory,
      'app-config.yaml',
    );

    // Check if app-config.janus-idp.yaml.js exists
    const appConfigFileExists = await fs.pathExists(oldConfigPath);

    if (appConfigFileExists) {
      await fs.rename(oldConfigPath, newConfigPath);
      const replacements = {
        'janus-idp': 'red-hat-developer-hub',
      };

      await replaceInFile(newConfigPath, replacements);
    }

    // Update janus references in catalog-info.yaml
    const catalogInfoPath = path.join(
      options.workspacePath,
      (pkg.packageJson as any).repository?.directory,
      'catalog-info.yaml',
    );

    // Check if catalog-info.yaml exists
    const catalogInfoFileExists = await fs.pathExists(catalogInfoPath);

    if (catalogInfoFileExists) {
      updateCatalogInfoYaml(
        catalogInfoPath,
        path.basename(options.workspacePath),
      ).catch(console.error);
    }

    // Update janus references in .prettierrc.js
    const prettierConfigPath = path.join(
      options.workspacePath,
      (pkg.packageJson as any).repository?.directory,
      '.prettierrc.js',
    );

    // Check if .prettierrc.js exists
    const prettierConfigFileExists = await fs.pathExists(prettierConfigPath);

    if (prettierConfigFileExists) {
      const replacements = {
        '@janus-idp': '@red-hat-developer-hub',
      };
      await replaceInFile(prettierConfigPath, replacements);
    }

    // update links in README.md
    const readmePath = path.join(
      options.workspacePath,
      (pkg.packageJson as any).repository?.directory,
      'README.md',
    );

    const replacements = {
      'https://github.com/janus-idp/backstage-plugins/tree/main': `https://github.com/redhat-developer/rhdh-plugins/tree/main/workspaces/${path.basename(
        options.workspacePath,
      )}`,
    };
    await replaceInFile(readmePath, replacements);
  }

  return await replace({
    files: path.join(options.workspacePath, '**', '*'),
    processor: (input: string) =>
      options.packagesToBeMoved.reduce((acc, { packageJson }) => {
        const newPackageName = generateNewPackageName(packageJson.name);
        return acc.replace(new RegExp(packageJson.name, 'g'), newPackageName);
      }, input),
  });
};

const createChangeset = async (options: {
  packages: string[];
  workspacePath: string;
  message: string;
}) => {
  const changesetFile = path.join(
    options.workspacePath,
    '.changeset',
    `migrate-${new Date().getTime()}.md`,
  );

  const changesetContents = `\
---
${options.packages.map(p => `'${p}': patch`).join('\n')}
---

${options.message}
`;

  await fs.appendFile(changesetFile, changesetContents);
};
const deprecatePackage = async (options: { package: Package }) => {
  const newPackageName = generateNewPackageName(
    options.package.packageJson.name,
  );

  // Define the package directory
  const packageDir = options.package.dir;

  // First, update the README
  await fs.writeFile(
    path.join(packageDir, 'README.md'),
    `# Deprecated\n\nThis package has been moved to the [red-hat-developer/rhdh-plugins](https://github.com/redhat-developer/rhdh-plugins) repository. Migrate to using \`${newPackageName}\` instead.\n`,
  );

  // List all files in the directory
  const files = await fs.readdir(packageDir);

  // Filter out README.md and delete the rest
  await Promise.all(
    files
      .filter(file => file !== 'README.md') // Exclude README.md
      .map(file =>
        fs.rm(path.join(packageDir, file), { recursive: true, force: true }),
      ),
  );
};

// Function to replace content in the file
async function replaceInFile(
  filePath: string,
  replacements: Record<string, string>,
) {
  try {
    let content = await fs.readFile(filePath, 'utf8');

    // Perform replacements
    for (const [oldValue, newValue] of Object.entries(replacements)) {
      const regex = new RegExp(oldValue, 'g');
      content = content.replace(regex, newValue);
    }

    // Write the updated content back to the file
    await fs.writeFile(filePath, content);
  } catch (err) {
    console.error(`Error processing ${filePath}: ${err}`);
  }
}

// Main function to update catalog-info.yaml
async function updateCatalogInfoYaml(
  catalogInfoPath: string,
  workspaceName: string,
) {
  const replacements = {
    'https://github.com/janus-idp/backstage-plugins/tree/main': `https://github.com/redhat-developer/rhdh-plugins/tree/main/workspaces/${workspaceName}`,
    'https://github.com/janus-idp/backstage-plugins/blob/main': `https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/${workspaceName}`,
    'https://github.com/janus-idp/backstage-plugins/edit/main': `https://github.com/redhat-developer/rhdh-plugins/edit/main/workspaces/${workspaceName}`,
    'janus-idp/maintainers-plugins': 'rhdh/maintainers-plugins',
    'sonarqube.org/project-key: janus-idp_backstage-plugins':
      'sonarqube.org/project-key: red_hat_developer_hub_plugins',
    'janus-idp-backstage': 'red-hat-developer-hub',
    'janus-idp': 'red-hat-developer-hub',
  };

  await replaceInFile(catalogInfoPath, replacements);
}

const packageAndTypeMap = {
  lodash: { name: '@types/lodash', version: '^4.14.151' },
  recharts: { name: '@types/lodash', version: '^4.14.151' },
  uuid: { name: '@types/uuid', version: '^9.0.0' },
  'humanize-duration': { name: '@types/humanize-duration', version: '^3.18.1' },
  'mime-types': { name: '@types/mime-types', version: '^2.1.0' },
  supertest: { name: '@types/supertest', version: '^2.0.8' },
  pluralize: { name: '@types/pluralize', version: '^0.0.33' },
  'git-url-parse': { name: '@types/git-url-parse', version: '^9.0.0' },
  'node-fetch': { name: '@types/node-fetch', version: '^2.5.12' },
  dompurify: { name: '@types/dompurify', version: '^3.0.0' },
  'react-dom': { name: '@types/react-dom', version: '^18.2.19' },
  react: { name: '@types/react', version: '^18.2.58' },
};

export default async (opts: OptionValues) => {
  const { monorepoPath, workspaceName, branch, maintainers } = opts as {
    monorepoPath: string;
    workspaceName: string;
    branch?: string;
    maintainers: string[];
  };

  try {
    await exec('git', ['status', '--porcelain'], { cwd: monorepoPath });
  } catch {
    console.error(
      chalk.red`The provided monorepo path is either not a git repository or not clean, please provide a valid monorepo path.`,
    );
    process.exit(1);
  }

  const { rhdhPluginsRoot, monorepoRoot, workspacePath } = await getPaths({
    monorepoPath,
    workspaceName,
  });

  // find all the packages in the main monorepo that should be in the workspace
  const packagesToBeMoved = await getMonorepoPackagesForWorkspace({
    monorepoRoot,
    workspaceName,
  });
  if (packagesToBeMoved.length === 0) {
    console.error(chalk.red`No packages found for plugin ${workspaceName}`);
    process.exit(1);
  }

  console.log(
    chalk.green`Found ${packagesToBeMoved.length} packages to be moved`,
    chalk.blueBright`${packagesToBeMoved
      .map(p => p.packageJson.name)
      .join(', ')}`,
  );

  // Create new workspace in rhdh plugins repository
  await ensureWorkspaceExists({
    workspacePath,
    workspaceName,
    rhdhPluginsRoot,
  });

  for (const packageToBeMoved of packagesToBeMoved) {
    const newPathForPackage = path.join(
      workspacePath,
      packageToBeMoved.relativeDir,
    );
    console.log(
      chalk.yellow`Moving package ${packageToBeMoved.packageJson.name} to ${newPathForPackage}`,
    );

    // Move the code
    await fs.copy(packageToBeMoved.dir, newPathForPackage);

    // Update the package.json versions to the latest published versions if not being moved across.
    const movedPackageJsonPath = path.join(newPathForPackage, 'package.json');
    const movedPackageJson = await fs.readJson(movedPackageJsonPath);

    // Fix the repositories field in the new repo
    movedPackageJson.repository = {
      type: 'git',
      url: 'https://github.com/redhat-developer/rhdh-plugins',
      directory: `workspaces/${workspaceName}/${packageToBeMoved.relativeDir}`,
    };

    movedPackageJson.bugs =
      'https://github.com/redhat-developer/rhdh-plugins/issues';
    if (movedPackageJson.files) {
      const updatedFiles = movedPackageJson.files.map((file: string) =>
        file === 'app-config.janus-idp.yaml' ? 'app-config.yaml' : file,
      );
      movedPackageJson.files = updatedFiles;
    }
    movedPackageJson.devDependencies ??= {};
    movedPackageJson.dependencies ??= {};

    movedPackageJson.maintainers = [];

    maintainers.forEach(maintainer => {
      movedPackageJson.maintainers.push(maintainer);
    });

    // make sure to add all peerDependencies as devDeps as these won't be installed in the app any longer and tests might fail
    for (const [key, value] of Object.entries(
      movedPackageJson.peerDependencies ?? {},
    )) {
      if (!movedPackageJson.devDependencies[key]) {
        movedPackageJson.devDependencies[key] = value;
      }
    }

    // Add additional types that could come from elsewhere
    for (const [key, value] of Object.entries(packageAndTypeMap)) {
      if (
        (movedPackageJson.dependencies[key] ||
          movedPackageJson.devDependencies[key]) &&
        !movedPackageJson.devDependencies[value.name] &&
        !movedPackageJson.dependencies[value.name]
      ) {
        movedPackageJson.devDependencies[value.name] = value.version;
      }
    }

    // remove @janus-idp/cli from devDeps
    delete movedPackageJson.devDependencies['@janus-idp/cli'];

    // Remove export-dynamic and export-dynamic:clean scripts if they exist
    delete movedPackageJson.scripts['export-dynamic'];
    delete movedPackageJson.scripts['export-dynamic:clean'];
    delete movedPackageJson.scripts.postversion;

    // If it's a frontend package do some magic
    const frontendDevDeps = {
      '@testing-library/dom': '^10.0.0',
      '@testing-library/jest-dom': '^6.0.0',
      '@testing-library/react': '^15.0.0',
    };

    if (movedPackageJson.backstage.role === 'frontend-plugin') {
      for (const [key, value] of Object.entries(frontendDevDeps)) {
        movedPackageJson.devDependencies[key] = value;
      }
    }

    // if it's got material-ui pickers as a dep we need some other magic
    const materialUiPickersDep =
      movedPackageJson.dependencies['@material-ui/pickers'] ||
      movedPackageJson.devDependencies['@material-ui/pickers'];
    if (materialUiPickersDep) {
      // copy the patch
      await fs.mkdirp(path.join(workspacePath, '.yarn', 'patches'));
      await fs.copyFile(
        path.join(
          __dirname, // eslint-disable-line no-restricted-syntax
          '..',
          '..',
          'lib',
          'workspaces',
          'patches',
          '@material-ui-pickers-npm-3.3.11-1c8f68ea20.patch',
        ),
        path.join(
          workspacePath,
          '.yarn',
          'patches',
          '@material-ui-pickers-npm-3.3.11-1c8f68ea20.patch',
        ),
      );

      const rootPackageJson = await fs.readJson(
        path.join(workspacePath, 'package.json'),
      );

      rootPackageJson.resolutions ??= {};
      rootPackageJson.resolutions[
        `@material-ui/pickers@${materialUiPickersDep}`
      ] =
        'patch:@material-ui/pickers@npm%3A3.3.11#./.yarn/patches/@material-ui-pickers-npm-3.3.11-1c8f68ea20.patch';

      await fs.writeJson(
        path.join(workspacePath, 'package.json'),
        rootPackageJson,
        { spaces: 2 },
      );
    }

    // Fix for some packages without react/react-dom deps
    if (movedPackageJson.peerDependencies?.react) {
      movedPackageJson.devDependencies.react =
        movedPackageJson.peerDependencies.react;
      movedPackageJson.devDependencies['react-dom'] =
        movedPackageJson.peerDependencies.react;
      movedPackageJson.devDependencies['react-router-dom'] = '^6.0.0';
    }

    await fs.writeJson(movedPackageJsonPath, movedPackageJson, { spaces: 2 });
  }

  // Fix source code references for outdated package names
  await fixSourceCodeReferences({
    packagesToBeMoved,
    workspacePath,
  });

  // Create changeset for the new packages
  await createChangeset({
    packages: packagesToBeMoved.map(p =>
      generateNewPackageName(p.packageJson.name),
    ),
    workspacePath,
    message:
      'Migrated from [janus-idp/backstage-plugins](https://github.com/janus-idp/backstage-plugins).',
  });

  console.log(chalk.yellow`Running yarn install in new repository`);

  // Copy current yarn lock from monorepo to workspace to keep deps where possible
  await fs.copyFile(
    path.join(monorepoPath, 'yarn.lock'),
    path.join(workspacePath, 'yarn.lock'),
  );

  await exec('yarn', ['install'], {
    cwd: workspacePath,
  });

  const workspacePackageJsonPath = path.join(workspacePath, 'package.json');
  const workspacePackageJson = await fs.readJson(workspacePackageJsonPath);

  console.log(chalk.yellow`Running yarn tsc in new repository`);
  try {
    await exec('yarn tsc', { cwd: workspacePath, shell: true });
  } catch (error) {
    console.error(`Exec failed: ${error}`);
  }

  console.log(chalk.yellow`Running yarn tsc:full in new repository`);
  try {
    await exec('yarn tsc:full', { cwd: workspacePath, shell: true });
  } catch (error) {
    console.log(
      chalk.blueBright`Running yarn tsc:full resulted in an error. Setting --skipLibCheck true to solve it.`,
    );
    workspacePackageJson.scripts['tsc:full'] =
      'tsc --skipLibCheck true --incremental false';
    workspacePackageJson.scripts['build:api-reports'] =
      'yarn build:api-reports:only';
    await fs.writeJson(workspacePackageJsonPath, workspacePackageJson, {
      spaces: 2,
    });
  }

  console.log(chalk.yellow`Running yarn build:api-reports in new repository`);
  try {
    await exec('yarn build:api-reports', { cwd: workspacePath, shell: true });
  } catch (error) {
    console.log(
      chalk.blueBright`Adding --allow-all-warnings flag to build:api-reports:only`,
    );
    workspacePackageJson.scripts['build:api-reports:only'] =
      'backstage-repo-tools api-reports --allow-all-warnings -o ae-wrong-input-file-type --validate-release-tags';
    await fs.writeJson(workspacePackageJsonPath, workspacePackageJson, {
      spaces: 2,
    });
  }

  console.log(chalk.yellow`Running yarn prettier:check in new repository`);
  try {
    await exec('yarn prettier:check', { cwd: workspacePath, shell: true });
  } catch (error) {
    console.log(
      chalk.blueBright`Running yarn prettier:check resulted in an error. Running npx prettier --write . to format files that did not pass the prettier:check`,
    );
    await exec('yarn add @ianvs/prettier-plugin-sort-imports', {
      cwd: workspacePath,
      shell: true,
    });
    await exec('npx prettier --write .', { cwd: workspacePath, shell: true });
  }

  console.log(chalk.yellow`Running npx eslint . --fix in new repository`);
  try {
    await exec('npx eslint . --fix', { cwd: workspacePath, shell: true });
  } catch (error) {
    // Ignore the error or log a generic message
    console.log(
      chalk.blueBright`ESLint completed with errors, but they will be ignored.`,
    );
  }

  // reset monorepo
  await exec('git', ['checkout', 'main'], { cwd: monorepoPath });
  const defaultBranchName = `migrate-${new Date().getTime()}`;

  console.log(
    chalk.yellow`Using ${
      branch ?? defaultBranchName
    } branch in monorepo to apply changes`,
  );
  if (branch) {
    await exec('git', ['checkout', branch], { cwd: monorepoPath });
  } else {
    await exec('git', ['checkout', '-b', defaultBranchName], {
      cwd: monorepoPath,
    });
  }

  // deprecate package in monorepo on new branch and remove all files except the README.md file
  for (const packageToBeMoved of packagesToBeMoved) {
    await deprecatePackage({ package: packageToBeMoved });
  }

  console.log(
    chalk.green`Changesets created, please commit and push both repositories.`,
  );
};
