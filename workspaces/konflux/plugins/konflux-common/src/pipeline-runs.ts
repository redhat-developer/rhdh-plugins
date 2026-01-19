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

/** @public */
export enum PipelineRunLabel {
  APPLICATION = 'appstudio.openshift.io/application',
  COMPONENT = 'appstudio.openshift.io/component',
  PIPELINE_USED_BY = 'pipelines.openshift.io/used-by',
  PIPELINE_TYPE = 'pipelines.appstudio.openshift.io/type',
  PIPELINE_NAME = 'tekton.dev/pipeline',
  PIPELINERUN_NAME = 'tekton.dev/pipelineRun',
  COMMIT_LABEL = 'pipelinesascode.tekton.dev/sha',
  COMMIT_ANNOTATION = 'build.appstudio.redhat.com/commit_sha',
  COMMIT_URL_ANNOTATION = 'pipelinesascode.tekton.dev/sha-url',
  COMMIT_BRANCH_ANNOTATION = 'build.appstudio.redhat.com/target_branch',
  COMMIT_USER_LABEL = 'pipelinesascode.tekton.dev/sender',
  COMMIT_REPO_ORG_LABEL = 'pipelinesascode.tekton.dev/url-org',
  COMMIT_REPO_URL_LABEL = 'pipelinesascode.tekton.dev/url-repository',
  COMMIT_FULL_REPO_URL_ANNOTATION = 'pipelinesascode.tekton.dev/repo-url',
  COMMIT_PROVIDER_LABEL = 'pipelinesascode.tekton.dev/git-provider',
  COMMIT_SHA_TITLE_ANNOTATION = 'pipelinesascode.tekton.dev/sha-title',

  SNAPSHOT = 'appstudio.openshift.io/snapshot',
  COMMIT_EVENT_TYPE_LABEL = 'pipelinesascode.tekton.dev/event-type',
  PULL_REQUEST_NUMBER_LABEL = 'pipelinesascode.tekton.dev/pull-request',
  CREATE_SNAPSHOT_STATUS = 'test.appstudio.openshift.io/create-snapshot-status',
  RELEASE_NAMESPACE = 'release.appstudio.openshift.io/namespace',

  TEST_SERVICE_COMMIT = 'pac.test.appstudio.openshift.io/sha',
  TEST_SERVICE_EVENT_TYPE_LABEL = 'pac.test.appstudio.openshift.io/event-type',
  TEST_SERVICE_SCENARIO = 'test.appstudio.openshift.io/scenario',
  ASEB_APPLICATION = 'appstudio.application',

  BUILD_IMAGE_ANNOTATION = 'build.appstudio.openshift.io/image',
  BUILD_SERVICE_REPO_ANNOTATION = 'build.appstudio.openshift.io/repo',
}
