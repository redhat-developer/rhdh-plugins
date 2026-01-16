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

const mockWorkflowLog = {
  status: 'success',
  data: {
    resultType: 'streams',
    result: [
      {
        stream: {
          detected_level: 'error',
          service_name: 'unknown_service',
        },
        values: [
          [
            '1764952546330041000',
            '2025-12-05 16:35:14,644 9eb78e04f727 ERROR [org.jbpm.workflow.instance.impl.WorkflowProcessInstanceImpl:1316] (executor-thread-14) Unexpected error while executing node createNotification in process instance 7a6d2622-a315-4737-9278-36311ba4583a: org.jbpm.workflow.instance.WorkflowRuntimeException: [sendnotification:7a6d2622-a315-4737-9278-36311ba4583a - createNotification:[uuid=7]] -- RESTEASY004655: Unable to invoke request: org.apache.http.client.ClientProtocolException',
          ],
        ],
      },
      {
        stream: {
          detected_level: 'info',
          service_name: 'unknown_service',
        },
        values: [
          [
            '1764952546332968000',
            "2025-12-05 16:35:14,668 9eb78e04f727 INFO  [org.kie.kogito.serverless.workflow.devservices.DevModeServerlessWorkflowLogger:50] (executor-thread-14) Workflow 'sendnotification' (7a6d2622-a315-4737-9278-36311ba4583a) was started, now 'Error'",
          ],
          [
            '1764952546327277000',
            '2025-12-05 16:35:14,626 9eb78e04f727 INFO  [org.kie.kogito.process.workitems.impl.DefaultKogitoWorkItemHandler:105] (executor-thread-14) error workItem WorkItem 7ee1509a-03b4-47e2-891f-31f6d225e520 [name=notifications_createNotification, state=1, processInstanceId=7a6d2622-a315-4737-9278-36311ba4583a, parameters{Parameter={"recipients":["user:development/guest"],"title":"This is a notification","topic":"Manually sent"}, payload={severity=normal, link=https://www.redhat.com, description=Description of the notification, topic=Manually sent, title=This is a notification}, recipients={entityRef=[user:development/guest], type=entity}}] handled by notifications_createNotification transition DefaultWorkItemTransitionImpl [id=activate, data={}, policies=[], termination=null] : jakarta.ws.rs.ProcessingException: RESTEASY004655: Unable to invoke request: org.apache.http.client.ClientProtocolException',
          ],
          [
            '1764952546327248000',
            "2025-12-05 16:35:13,632 9eb78e04f727 INFO  [org.kie.kogito.serverless.workflow.devservices.DevModeServerlessWorkflowLogger:64] (executor-thread-14) Triggered node 'createNotification' for process 'sendnotification' (7a6d2622-a315-4737-9278-36311ba4583a)",
          ],
          [
            '1764952546327240000',
            "2025-12-05 16:35:13,628 9eb78e04f727 INFO  [org.kie.kogito.serverless.workflow.devservices.DevModeServerlessWorkflowLogger:64] (executor-thread-14) Triggered node 'SendNotification' for process 'sendnotification' (7a6d2622-a315-4737-9278-36311ba4583a)",
          ],
          [
            '1764952546327187000',
            "2025-12-05 16:35:13,623 9eb78e04f727 INFO  [org.kie.kogito.serverless.workflow.devservices.DevModeServerlessWorkflowLogger:64] (executor-thread-14) Triggered node 'Prepare' for process 'sendnotification' (7a6d2622-a315-4737-9278-36311ba4583a)",
          ],
          [
            '1764952546327177000',
            "2025-12-05 16:35:13,622 9eb78e04f727 INFO  [org.kie.kogito.serverless.workflow.devservices.DevModeServerlessWorkflowLogger:64] (executor-thread-14) Triggered node 'Start' for process 'sendnotification' (7a6d2622-a315-4737-9278-36311ba4583a)",
          ],
          [
            '1764952546327102000',
            "2025-12-05 16:35:13,618 9eb78e04f727 INFO  [org.kie.kogito.serverless.workflow.devservices.DevModeServerlessWorkflowLogger:40] (executor-thread-14) Starting workflow 'sendnotification' (7a6d2622-a315-4737-9278-36311ba4583a)",
          ],
        ],
      },
    ],
  },
};

export default mockWorkflowLog;
