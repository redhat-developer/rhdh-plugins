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
import { AAPData, StatusCondition } from '../types';

export const decode = (str: string): string =>
  Buffer.from(str, 'base64').toString('binary');

export enum AnsibleStatus {
  /**
   * the new status indicates that the AAP instance has not been created yet.
   */
  NEW = 'new',
  /**
   * provisioning status indicates that the AAP instance is still provisioning/booting.
   */
  PROVISIONING = 'provisioning',
  /**
   * the unknown status might indicate that the AAP instance is still provisioning/booting and, it doesn't have a status condition yet.
   */
  UNKNOWN = 'unknown',
  /**
   * the ready status indicates that the AAP instance is ready to be used.
   */
  READY = 'ready',
  /**
   * the idled status indicates that the AAP instance
   * has been idled and it's not available to be used.
   */
  IDLED = 'idled',
  NOT_DEPLOYED = 'NOT_DEPLOYED',
}

/** isConditionTrue checks if a given condition type exists and it's status is set to True */
const isConditionTrue = (
  condType: string,
  conditions: StatusCondition[],
): [boolean, StatusCondition | null] => {
  for (const condition of conditions) {
    if (condition.type === condType && condition.status === 'True') {
      return [true, condition];
    }
  }
  return [false, null];
};

export const getReadyCondition = (
  data: AAPData | undefined,
  setError: (errorDetails: string) => void,
): AnsibleStatus => {
  /**
   * Those are the types of conditions you can find in the AAP CR
   *
   * Type       Status  Updated                Reason     Message
   * Successful True    * 23 Dec 2024, 23:56   * - -
   * Failure    False    * 27 Dec 2024, 18:21  * Failed   unknown playbook failure
   * Running    False     * 27 Dec 2024, 18:37 * Running  Running reconciliation
   */
  if (!data || data?.items.length === 0) {
    return AnsibleStatus.NEW;
  }

  if (
    !data?.items[0].status ||
    data?.items[0]?.status?.conditions.length === 0
  ) {
    return AnsibleStatus.UNKNOWN;
  }

  // check if instance is idled
  if (data?.items[0]?.spec?.idle_aap) {
    return AnsibleStatus.IDLED;
  }

  // we can assume that there will be only one aap instance
  const conditions = data?.items[0]?.status?.conditions;

  // if the Successful condition is set to true it means the instance is ready
  const [isSuccessful, conditionSuccessful] = isConditionTrue(
    'Successful',
    conditions,
  );
  if (isSuccessful && conditionSuccessful?.reason === 'Successful') {
    return AnsibleStatus.READY;
  }

  // If the Failure condition is set to True, then we need to return the error
  const [hasFailed, condition] = isConditionTrue('Failure', conditions);
  if (hasFailed) {
    if (condition) {
      setError(condition?.message);
    }
    return AnsibleStatus.UNKNOWN;
  }

  // If the Running condition is set to true it means that the instance it's still provisioning
  const [isStillRunning] = isConditionTrue('Running', conditions);
  if (isStillRunning) {
    return AnsibleStatus.PROVISIONING;
  }

  // unable to find the ready condition
  return AnsibleStatus.UNKNOWN;
};

/**
 * This is custom crafted AAP CR which is able to run properly with the sandbox environment constraints.
 * In future release, some of these values might become defaults or they will be moved into webhooks.
 * For the time being, they are being stored here in order to simplify the configuration and deployment for the end user.
 */
export const AAPObject: string = `
{
   "apiVersion":"aap.ansible.com/v1alpha1",
   "kind":"AnsibleAutomationPlatform",
   "metadata":{
      "name":"sandbox-aap"
   },
   "spec":{
      "idle_aap":false,
      "no_log":false,
      "api":{
         "replicas":1,
         "resource_requirements":{
            "requests":{
               "cpu":"100m",
               "memory":"256Mi"
            },
            "limits":{
               "cpu":"500m",
               "memory":"1000Mi"
            }
         }
      },
      "redis":{
         "replicas":1,
         "resource_requirements":{
            "requests":{
               "cpu":"100m",
               "memory":"256Mi"
            },
            "limits":{
               "cpu":"500m",
               "memory":"500Mi"
            }
         }
      },
      "database":{
         "replicas":1,
         "resource_requirements":{
            "requests":{
               "cpu":"100m",
               "memory":"256Mi"
            },
            "limits":{
               "cpu":"500m",
               "memory":"800Mi"
            }
         }
      },
      "controller":{
         "extra_settings":[
            {
               "setting":"DEFAULT_EXECUTION_QUEUE_POD_SPEC_OVERRIDE",
               "value":{
                  "resources":{
                     "limits":{
                        "cpu":"200m",
                        "memory":"500Mi"
                     },
                     "requests":{
                        "cpu":"220m",
                        "memory":"100Mi"
                     }
                  }
               }
            }
         ],
         "garbage_collect_secrets":true,
         "disabled":false,
         "uwsgi_processes":2,
         "task_resource_requirements":{
            "requests":{
               "cpu":"100m",
               "memory":"150Mi"
            },
            "limits":{
               "cpu":"1000m",
               "memory":"1200Mi"
            }
         },
         "web_resource_requirements":{
            "requests":{
               "cpu":"100m",
               "memory":"200Mi"
            },
            "limits":{
               "cpu":"200m",
               "memory":"1600Mi"
            }
         },
         "ee_resource_requirements":{
            "requests":{
               "cpu":"100m",
               "memory":"64Mi"
            },
            "limits":{
               "cpu":"1000m",
               "memory":"500Mi"
            }
         },
         "redis_resource_requirements":{
            "requests":{
               "cpu":"50m",
               "memory":"64Mi"
            },
            "limits":{
               "cpu":"100m",
               "memory":"200Mi"
            }
         },
         "rsyslog_resource_requirements":{
            "requests":{
               "cpu":"100m",
               "memory":"128Mi"
            },
            "limits":{
               "cpu":"500m",
               "memory":"250Mi"
            }
         },
         "init_container_resource_requirements":{
            "requests":{
               "cpu":"100m",
               "memory":"128Mi"
            },
            "limits":{
               "cpu":"500m",
               "memory":"200Mi"
            }
         }
      },
      "eda":{
         "disabled":false,
         "api":{
            "replicas":1,
            "resource_requirements":{
               "requests":{
                  "cpu":"50m",
                  "memory":"350Mi"
               },
               "limits":{
                  "cpu":"500m",
                  "memory":"400Mi"
               }
            }
         },
         "ui":{
            "replicas":1,
            "resource_requirements":{
               "requests":{
                  "cpu":"25m",
                  "memory":"64Mi"
               },
               "limits":{
                  "cpu":"500m",
                  "memory":"150Mi"
               }
            }
         },
         "scheduler":{
            "replicas":1,
            "resource_requirements":{
               "requests":{
                  "cpu":"50m",
                  "memory":"200Mi"
               },
               "limits":{
                  "cpu":"500m",
                  "memory":"250Mi"
               }
            }
         },
         "worker":{
            "replicas":2,
            "resource_requirements":{
               "requests":{
                  "cpu":"25m",
                  "memory":"200Mi"
               },
               "limits":{
                  "cpu":"250m",
                  "memory":"250Mi"
               }
            }
         },
         "default_worker":{
            "replicas":1,
            "resource_requirements":{
               "requests":{
                  "cpu":"25m",
                  "memory":"200Mi"
               },
               "limits":{
                  "cpu":"500m",
                  "memory":"400Mi"
               }
            }
         },
         "activation_worker":{
            "replicas":1,
            "resource_requirements":{
               "requests":{
                  "cpu":"25m",
                  "memory":"150Mi"
               },
               "limits":{
                  "cpu":"500m",
                  "memory":"400Mi"
               }
            }
         },
         "event_stream":{
            "replicas":1,
            "resource_requirements":{
               "requests":{
                  "cpu":"25m",
                  "memory":"150Mi"
               },
               "limits":{
                  "cpu":"100m",
                  "memory":"300Mi"
               }
            }
         }
      },
      "hub":{
         "redis_data_persistence":false,
         "disabled":false,
         "storage_type":"file",
         "file_storage_storage_class":"efs-sc",
         "file_storage_size":"10Gi",
         "api":{
            "replicas":1,
            "resource_requirements":{
               "requests":{
                  "cpu":"150m",
                  "memory":"256Mi"
               },
               "limits":{
                  "cpu":"800m",
                  "memory":"500Mi"
               }
            }
         },
         "content":{
            "replicas":1,
            "resource_requirements":{
               "requests":{
                  "cpu":"150m",
                  "memory":"256Mi"
               },
               "limits":{
                  "cpu":"800m",
                  "memory":"1200Mi"
               }
            }
         },
         "worker":{
            "replicas":1,
            "resource_requirements":{
               "requests":{
                  "cpu":"150m",
                  "memory":"256Mi"
               },
               "limits":{
                  "cpu":"800m",
                  "memory":"400Mi"
               }
            }
         },
         "web":{
            "replicas":1,
            "resource_requirements":{
               "requests":{
                  "cpu":"100m",
                  "memory":"256Mi"
               },
               "limits":{
                  "cpu":"500m",
                  "memory":"300Mi"
               }
            }
         },
         "redis":{
            "replicas":1,
            "resource_requirements":{
               "requests":{
                  "cpu":"100m",
                  "memory":"250Mi"
               },
               "limits":{
                  "cpu":"300m",
                  "memory":"400Mi"
               }
            }
         }
      }
   }
}
`;
