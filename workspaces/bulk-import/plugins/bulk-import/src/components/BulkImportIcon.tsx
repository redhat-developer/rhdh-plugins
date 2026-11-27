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

import { useBulkImportColorScheme } from '../hooks/useBulkImportColorScheme';
import bulkImportBlackImg from '../images/BulkImportIcon-Black.svg';
import bulkImportWhiteImg from '../images/BulkImportIcon-White.svg';

/**
 * @public
 * Bulk Import Icon (kept free of sidebar/permission deps for NFS sync).
 */
export const BulkImportIcon = () => {
  const scheme = useBulkImportColorScheme();

  return (
    <img
      src={scheme === 'dark' ? bulkImportWhiteImg : bulkImportBlackImg}
      alt="bulk import icon"
      style={{ height: '25px' }}
    />
  );
};

export default BulkImportIcon;
