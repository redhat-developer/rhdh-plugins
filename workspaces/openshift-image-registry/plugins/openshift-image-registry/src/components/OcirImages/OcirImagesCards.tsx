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
import { useCallback, useState } from 'react';

import { EmptyState, ItemCardGrid } from '@backstage/core-components';

import { ImageStreamMetadata } from '../../types';
import { OcirImagesCard } from './OcirImagesCard';
import { OcirImageSearchBar } from './OcirImageSearchBar';
import { OcirImageSidebar } from './OcirImageSidebar';

type OcirImagesCardsProps = {
  imageStreams: ImageStreamMetadata[];
};

export const OcirImagesCards = ({ imageStreams }: OcirImagesCardsProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeImageStream, setActiveImageStream] =
    useState<ImageStreamMetadata>();
  const [filteredImageStreams, setFilteredImageStreams] = useState<
    ImageStreamMetadata[] | undefined
  >();

  const imageStreamsList = filteredImageStreams ?? imageStreams;

  const handleImageStreamSelected = useCallback(
    (imageStream: ImageStreamMetadata) => {
      setActiveImageStream(imageStream);
      setIsOpen(true);
    },
    [],
  );
  const handleClose = useCallback(() => setIsOpen(false), [setIsOpen]);

  return (
    <>
      <OcirImageSearchBar
        imageStreams={imageStreams}
        setImageStreams={setFilteredImageStreams}
      />
      {imageStreamsList?.length ? (
        <>
          <ItemCardGrid>
            {imageStreamsList.map((imageStream: ImageStreamMetadata) => (
              <OcirImagesCard
                key={imageStream.uid}
                imageStream={imageStream}
                onImageStreamSelected={handleImageStreamSelected}
              />
            ))}
          </ItemCardGrid>
          {activeImageStream && (
            <OcirImageSidebar
              open={isOpen}
              onClose={handleClose}
              imageStream={activeImageStream}
            />
          )}
        </>
      ) : (
        <div style={{ width: '100%', height: '100vh' }}>
          <EmptyState missing="content" title="No ImageStreams found" />
        </div>
      )}
    </>
  );
};
