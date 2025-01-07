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

import { useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { useApi } from '@backstage/core-plugin-api';

import { formatDate } from '@janus-idp/shared-react';

import { openshiftImageRegistryApiRef } from '../api';
import { ImageStream } from '../types';

export const useAllNsImageStreams = () => {
  const client = useApi(openshiftImageRegistryApiRef);
  const [imageStreams, setImageStreams] = useState<any[]>([]);

  const { loading } = useAsync(async () => {
    const imgSts = (await client.getAllImageStreams()) ?? [];
    setImageStreams(imgSts);
  });

  const imageStreamsData: ImageStream[] = useMemo(() => {
    if (imageStreams?.length) {
      return imageStreams.map((imgSt: any) => ({
        uid: imgSt.metadata.uid,
        name: imgSt.metadata.name,
        namespace: imgSt.metadata.namespace,
        last_modified: imgSt.status?.tags?.[0]?.items?.[0]?.created
          ? formatDate(imgSt.status.tags[0].items[0].created)
          : '',
        tags: imgSt.status?.tags?.map((t: any) => t.tag) ?? [],
        dockerImageRepo: imgSt.status?.dockerImageRepository ?? '',
      }));
    }
    return [];
  }, [imageStreams]);

  return { loading, imageStreams: imageStreamsData };
};
