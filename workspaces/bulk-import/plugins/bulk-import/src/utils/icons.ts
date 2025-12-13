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

import approvalToolBlackImg from '../images/ApprovalTool_Black.svg';
import approvalToolWhiteImg from '../images/ApprovalTool_White.svg';
import bulkImportBlackImg from '../images/BulkImportIcon-Black.svg';
import bulkImportWhiteImg from '../images/BulkImportIcon-White.svg';
import chooseRepositoriesBlackImg from '../images/ChooseRepositories_Black.svg';
import chooseRepositoriesWhiteImg from '../images/ChooseRepositories_White.svg';
import editPullRequestBlackImg from '../images/EditPullRequest_Black.svg';
import editPullRequestWhiteImg from '../images/EditPullRequest_White.svg';
import generateCatalogInfoBlackImg from '../images/GenerateCatalogInfo_Black.svg';
import generateCatalogInfoWhiteImg from '../images/GenerateCatalogInfo_White.svg';
import missingConfigurationImg from '../images/missing-configuration.png';
import trackStatusBlackImg from '../images/TrackStatus_Black.svg';
import trackStatusWhiteImg from '../images/TrackStatus_White.svg';

const logos = new Map<string, any>()
  .set('icon-edit-pullrequest-black', editPullRequestBlackImg)
  .set('icon-generate-cataloginfo-black', generateCatalogInfoBlackImg)
  .set('icon-track-status-black', trackStatusBlackImg)
  .set('icon-choose-repositories-black', chooseRepositoriesBlackImg)
  .set('icon-approval-tool-black', approvalToolBlackImg)
  .set('icon-edit-pullrequest-white', editPullRequestWhiteImg)
  .set('icon-choose-repositories-white', chooseRepositoriesWhiteImg)
  .set('icon-generate-cataloginfo-white', generateCatalogInfoWhiteImg)
  .set('icon-track-status-white', trackStatusWhiteImg)
  .set('icon-approval-tool-white', approvalToolWhiteImg)
  .set('icon-bulk-import-black', bulkImportBlackImg)
  .set('icon-bulk-import-white', bulkImportWhiteImg)
  .set('missing-configuration', missingConfigurationImg);

export const getImageForIconClass = (iconClass: string): string => {
  return logos.get(iconClass);
};
