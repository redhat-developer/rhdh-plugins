/*
 * Copyright Red Hat, Inc.
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

import { ThresholdConfig } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { AbstractMetricProvider } from './AbstractMetricProvider';

/**
 * Configuration for an OpenSSF metric provider.
 */
interface OpenSSFMetricConfig {
  /** The name of the OpenSSF check (e.g., "Maintained", "Code-Review") */
  name: string;
  /** Display title for the metric (e.g., "OpenSSF Maintained") */
  displayTitle: string;
  /** Description of what the metric measures */
  description: string;
}

/**
 * All available OpenSSF Security Scorecard metrics.
 */
const OPENSSF_METRICS: OpenSSFMetricConfig[] = [
  {
    name: 'Binary-Artifacts',
    displayTitle: 'OpenSSF Binary Artifacts',
    description:
      'Determines if the project has generated executable (binary) artifacts in the source repository according to OpenSSF Security Scorecards.',
  },
  {
    name: 'Branch-Protection',
    displayTitle: 'OpenSSF Branch Protection',
    description:
      "Determines if the default and release branches are protected with GitHub's branch protection settings according to OpenSSF Security Scorecards.",
  },
  {
    name: 'CII-Best-Practices',
    displayTitle: 'OpenSSF CII Best Practices',
    description:
      'Determines if the project has an OpenSSF (formerly CII) Best Practices Badge according to OpenSSF Security Scorecards.',
  },
  {
    name: 'CI-Tests',
    displayTitle: 'OpenSSF CI Tests',
    description:
      'Determines if the project runs tests before pull requests are merged according to OpenSSF Security Scorecards.',
  },
  {
    name: 'Code-Review',
    displayTitle: 'OpenSSF Code Review',
    description:
      'Determines if the project requires human code review before pull requests (aka merge requests) are merged according to OpenSSF Security Scorecards.',
  },
  {
    name: 'Contributors',
    displayTitle: 'OpenSSF Contributors',
    description:
      'Determines if the project has a set of contributors from multiple organizations (e.g., companies) according to OpenSSF Security Scorecards.',
  },
  {
    name: 'Dangerous-Workflow',
    displayTitle: 'OpenSSF Dangerous Workflow',
    description:
      "Determines if the project's GitHub Action workflows avoid dangerous patterns according to OpenSSF Security Scorecards.",
  },
  {
    name: 'Dependency-Update-Tool',
    displayTitle: 'OpenSSF Dependency Update Tool',
    description:
      'Determines if the project uses a dependency update tool according to OpenSSF Security Scorecards.',
  },
  {
    name: 'Fuzzing',
    displayTitle: 'OpenSSF Fuzzing',
    description:
      'Determines if the project uses fuzzing according to OpenSSF Security Scorecards.',
  },
  {
    name: 'License',
    displayTitle: 'OpenSSF License',
    description:
      'Determines if the project has defined a license according to OpenSSF Security Scorecards.',
  },
  {
    name: 'Maintained',
    displayTitle: 'OpenSSF Maintained',
    description:
      'Determines if the project is "actively maintained" according to OpenSSF Security Scorecards.',
  },
  {
    name: 'Packaging',
    displayTitle: 'OpenSSF Packaging',
    description:
      'Determines if the project is published as a package that others can easily download, install, easily update, and uninstall according to OpenSSF Security Scorecards.',
  },
  {
    name: 'Pinned-Dependencies',
    displayTitle: 'OpenSSF Pinned Dependencies',
    description:
      'Determines if the project has declared and pinned the dependencies of its build process according to OpenSSF Security Scorecards.',
  },
  {
    name: 'SAST',
    displayTitle: 'OpenSSF SAST',
    description:
      'Determines if the project uses static code analysis according to OpenSSF Security Scorecards.',
  },
  {
    name: 'Security-Policy',
    displayTitle: 'OpenSSF Security Policy',
    description:
      'Determines if the project has published a security policy according to OpenSSF Security Scorecards.',
  },
  {
    name: 'Signed-Releases',
    displayTitle: 'OpenSSF Signed Releases',
    description:
      'Determines if the project cryptographically signs release artifacts according to OpenSSF Security Scorecards.',
  },
  {
    name: 'Token-Permissions',
    displayTitle: 'OpenSSF Token Permissions',
    description:
      "Determines if the project's workflows follow the principle of least privilege according to OpenSSF Security Scorecards.",
  },
  {
    name: 'Vulnerabilities',
    displayTitle: 'OpenSSF Vulnerabilities',
    description:
      'Determines if the project has open, known unfixed vulnerabilities according to OpenSSF Security Scorecards.',
  },
];

/**
 * Configurable metric provider for OpenSSF Security Scorecards.
 * Extracts a specific check from the OpenSSF scorecard response based on the provided configuration.
 */
class ConfigurableMetricProvider extends AbstractMetricProvider {
  constructor(
    private readonly config: OpenSSFMetricConfig,
    thresholds?: ThresholdConfig,
  ) {
    super(thresholds);
  }

  protected getMetricName(): string {
    return this.config.name;
  }

  protected getMetricDisplayTitle(): string {
    return this.config.displayTitle;
  }

  protected getMetricDescription(): string {
    return this.config.description;
  }
}

/**
 * Creates all OpenSSF metric providers.
 * @param thresholds Optional threshold configuration to apply to all providers
 * @returns Array of OpenSSF metric providers
 */
export function createOpenSSFMetricProviders(
  thresholds?: ThresholdConfig,
): MetricProvider<'number'>[] {
  return OPENSSF_METRICS.map(
    config => new ConfigurableMetricProvider(config, thresholds),
  );
}
