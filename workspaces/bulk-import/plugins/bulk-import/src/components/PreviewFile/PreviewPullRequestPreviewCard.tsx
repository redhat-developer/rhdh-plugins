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

import { MarkdownContent } from '@backstage/core-components';

import { useTranslation } from '../../hooks/useTranslation';

export const PreviewPullRequestPreviewCard = ({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={['bulk-import-preview-pr-card', className]
        .filter(Boolean)
        .join(' ')}
    >
      <h4 className="bulk-import-preview-pr-card__title">{title}</h4>
      <p className="bulk-import-preview-pr-card__subheader">
        {t('previewFile.pullRequest.previewCardSubheader')}
      </p>
      <div className="bulk-import-preview-pr-card__body">
        <MarkdownContent content={description} />
      </div>
    </div>
  );
};
