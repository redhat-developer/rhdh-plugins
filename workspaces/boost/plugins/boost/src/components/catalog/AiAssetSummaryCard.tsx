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

import { Card, CardHeader, CardBody, Text } from '@backstage/ui';

export const AiAssetSummaryCard = () => {
  return (
    <Card>
      <CardHeader>
        <Text variant="title-small">AI Asset Summary</Text>
      </CardHeader>
      <CardBody>
        <Text variant="body-medium">
          Category, version, source, and lifecycle information will be displayed
          here.
        </Text>
      </CardBody>
    </Card>
  );
};
