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

import { EmptyState, Progress } from '@backstage/core-components';

import { useAllNsImageStreams } from '../../hooks/useAllNsImageStreams';
import { useImageStreamsMetadataFromTag } from '../../hooks/useImageStreamsMetadataFromTag';
import { OcirImagesCards } from './OcirImagesCards';

export const OcirImagesView = () => {
  const { loading: imageStreamsLoading, imageStreams } = useAllNsImageStreams();

  const { loading: metadataLoading, imageStreamsMetadata } =
    useImageStreamsMetadataFromTag(imageStreams);

  if (imageStreamsLoading || metadataLoading) {
    return <Progress />;
  }

  return imageStreamsMetadata?.length ? (
    <OcirImagesCards imageStreams={imageStreamsMetadata} />
  ) : (
    <div style={{ width: '100%', height: '100vh' }}>
      <EmptyState missing="content" title="No ImageStreams found" />
    </div>
  );
};
