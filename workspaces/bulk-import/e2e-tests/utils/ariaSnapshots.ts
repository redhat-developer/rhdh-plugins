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

import { BulkImportMessages, replaceTemplate } from './translations';

/** BUI floating labels duplicate the label in the accessible name. */
function buiFieldName(label: string, required = false): string {
  return required ? `${label} ${label} *` : `${label} ${label}`;
}

function getCodeownersAriaSnapshot(t: BulkImportMessages): string {
  const message = t.previewFile.pullRequest.useCodeOwnersFile;
  const checkboxName = message.replace(/\*/g, '');
  const warning = t.previewFile.pullRequest.codeOwnersWarning;
  const match = message.match(/^([\s\S]*?)\*([^*]+)\*([\s\S]*)$/);
  if (!match) {
    return `
    - checkbox "${checkboxName}"
    - text: "${warning}"
    `;
  }
  const [, before, emphasis, after] = match;
  const beforeText = before.trim();
  const afterText = `${after.trim()} ${warning}`;
  return `
    - checkbox "${checkboxName}"
    - text: ${beforeText}
    - emphasis: ${emphasis}
    - text: "${afterText}"
  `;
}

const COMBOBOX_SHOW_SUGGESTIONS: Record<string, string> = {
  de: 'Empfehlungen anzeigen',
  en: 'Show suggestions',
  es: 'Mostrar sugerencias',
  fr: 'Afficher les suggestions',
  it: 'Mostra suggerimenti',
  ja: '候補を表示',
};

/**
 * Creates aria snapshot chunks for the Preview Pull Request Sidebar.
 * Each chunk represents a logical section of the sidebar for better readability and maintainability.
 *
 * @param t - Translation messages object
 * @returns Object containing aria snapshot strings for each section
 */
export function getPreviewSidebarSnapshots(
  t: BulkImportMessages,
  locale = 'en',
) {
  const showSuggestions =
    COMBOBOX_SHOW_SUGGESTIONS[locale] ?? COMBOBOX_SHOW_SUGGESTIONS.en;
  const entityOwnerLabel = t.previewFile.pullRequest.entityOwnerLabel;
  const entityOwnerField = buiFieldName(entityOwnerLabel, true);
  const entityOwnerButton = `${showSuggestions} ${entityOwnerLabel} *`;
  const prDetails = replaceTemplate(t.previewFile.pullRequest.details, {
    tool: t.previewFile.pullRequest.title,
  });
  const prTitleLabel = replaceTemplate(t.previewFile.pullRequest.titleLabel, {
    tool: t.previewFile.pullRequest.title,
  });
  const prBodyLabel = replaceTemplate(t.previewFile.pullRequest.bodyLabel, {
    tool: t.previewFile.pullRequest.title,
  });
  const annotationsSeparator = replaceTemplate(
    t.previewFile.useSemicolonSeparator,
    { label: t.previewFile.pullRequest.annotations.toLowerCase() },
  );
  const labelsSeparator = replaceTemplate(t.previewFile.useSemicolonSeparator, {
    label: t.previewFile.pullRequest.labels.toLowerCase(),
  });
  const specSeparator = replaceTemplate(t.previewFile.useSemicolonSeparator, {
    label: t.previewFile.pullRequest.spec.toLowerCase(),
  });

  return {
    /**
     * Pull request details section - contains title and body textboxes
     */
    pullRequestDetails: `
    - heading "${prDetails}" [level=3]
    - textbox "${buiFieldName(prTitleLabel, true)}":
      - /placeholder: ${t.previewFile.pullRequest.titlePlaceholder}
      - text: Add catalog-info.yaml config file
    - text: ${prTitleLabel} *
    - textbox "${buiFieldName(prBodyLabel, true)}":
      - /placeholder: ${t.previewFile.pullRequest.bodyPlaceholder}
      - text: /This pull request adds a .+Backstage entity metadata file.+to this repository/
    - text: ${prBodyLabel} *
  `,

    /**
     * Entity configuration heading and component name field
     */
    entityConfigHeader: `
    - heading "${t.previewFile.pullRequest.entityConfiguration}" [level=3]
    - textbox "${buiFieldName(t.previewFile.pullRequest.componentNameLabel, true)}":
      - /placeholder: ${t.previewFile.pullRequest.componentNamePlaceholder}
      - text: backend-service
    - text: ${t.previewFile.pullRequest.componentNameLabel} *
  `,

    /**
     * Entity owner selection field
     */
    entityOwner: `
    - group:
      - combobox "${entityOwnerField}": user:development/guest
      - button "${entityOwnerButton}"
    - text: ${t.previewFile.pullRequest.entityOwnerLabel} * ${t.previewFile.pullRequest.entityOwnerHelper}
  `,

    /**
     * CODEOWNERS checkbox option
     */
    codeownersOption: getCodeownersAriaSnapshot(t),

    /**
     * Annotations field
     */
    annotations: `
    - textbox "${buiFieldName(t.previewFile.pullRequest.annotations)}":
      - /placeholder: "${t.previewFile.keyValuePlaceholder}"
      - text: "github.com/project-slug: test-org/backend-service"
    - text: ${t.previewFile.pullRequest.annotations} ${annotationsSeparator}
  `,

    /**
     * Labels field
     */
    labels: `
    - textbox "${buiFieldName(t.previewFile.pullRequest.labels)}":
      - /placeholder: "${t.previewFile.keyValuePlaceholder}"
    - text: ${t.previewFile.pullRequest.labels} ${labelsSeparator}
  `,

    /**
     * Spec field
     */
    spec: `
    - textbox "${buiFieldName(t.previewFile.pullRequest.spec)}":
      - /placeholder: "${t.previewFile.keyValuePlaceholder}"
      - text: "type: other; lifecycle: unknown; owner: user:development/guest"
    - text: ${t.previewFile.pullRequest.spec} ${specSeparator}
  `,

    /**
     * Preview pull request section - shows the PR preview with links
     */
    previewPullRequest: `
    - heading "${t.previewFile.preview} ${t.previewFile.pullRequest.title.toLowerCase()}" [level=3]
    - heading "Add catalog-info.yaml config file" [level=4]
    - paragraph: ${t.previewFile.pullRequest.previewCardSubheader}
    - paragraph:
      - text: This pull request adds a
      - strong: Backstage entity metadata file
      - text: to this repository so that the component can be added to the
      - link "software catalog , Opens in a new window":
        - /url: /http:\\/\\/localhost:\\d+\\/catalog/
      - text: . After this pull request is merged, the component will become available. For more information, read an
      - link "overview of the Backstage software catalog , Opens in a new window":
        - /url: https://backstage.io/docs/features/software-catalog/
      - text: . View the import job in your app
      - link "here , Opens in a new window":
        - /url: /http:\\/\\/localhost:\\d+\\/bulk-import\\?repository=https:\\/\\/github\\.com\\/test-org\\/backend-service&defaultBranch=main/
      - text: .
  `,

    /**
     * Preview entities section - shows the generated catalog-info.yaml content
     */
    previewEntities: `
    - heading "${t.previewFile.pullRequest.previewEntities}" [level=3]
    - article:
      - text: https://github.com/test-org/backend-service/catalog-info.yaml
      - code: "apiVersion: backstage.io/v1alpha1 kind: Component metadata: name: backend-service annotations: github.com/project-slug: test-org/backend-service spec: type: other lifecycle: unknown owner: user:development/guest"
  `,
  };
}

/**
 * Type for the preview sidebar snapshots object
 */
export type PreviewSidebarSnapshotsType = ReturnType<
  typeof getPreviewSidebarSnapshots
>;

/**
 * Helper function to get all preview sidebar snapshots combined.
 * Use this when you need to validate the entire sidebar at once.
 *
 * @param t - Translation messages object
 * @returns Combined aria snapshot string for the entire sidebar
 */
export function getFullPreviewSidebarSnapshot(
  t: BulkImportMessages,
  locale = 'en',
): string {
  const snapshots = getPreviewSidebarSnapshots(t, locale);
  return `
    ${snapshots.pullRequestDetails}
    ${snapshots.entityConfigHeader}
    ${snapshots.entityOwner}
    ${snapshots.codeownersOption}
    ${snapshots.annotations}
    ${snapshots.labels}
    ${snapshots.spec}
    ${snapshots.previewPullRequest}
    ${snapshots.previewEntities}
  `;
}
