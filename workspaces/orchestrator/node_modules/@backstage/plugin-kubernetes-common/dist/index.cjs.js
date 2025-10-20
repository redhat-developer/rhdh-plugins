'use strict';

var pluginPermissionCommon = require('@backstage/plugin-permission-common');
var lodash = require('lodash');
var luxon = require('luxon');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e : { default: e }; }

var lodash__default = /*#__PURE__*/_interopDefaultCompat(lodash);

const ANNOTATION_KUBERNETES_API_SERVER = "kubernetes.io/api-server";
const ANNOTATION_KUBERNETES_API_SERVER_CA = "kubernetes.io/api-server-certificate-authority";
const ANNOTATION_KUBERNETES_AUTH_PROVIDER = "kubernetes.io/auth-provider";
const ANNOTATION_KUBERNETES_OIDC_TOKEN_PROVIDER = "kubernetes.io/oidc-token-provider";
const ANNOTATION_KUBERNETES_SKIP_METRICS_LOOKUP = "kubernetes.io/skip-metrics-lookup";
const ANNOTATION_KUBERNETES_SKIP_TLS_VERIFY = "kubernetes.io/skip-tls-verify";
const ANNOTATION_KUBERNETES_DASHBOARD_URL = "kubernetes.io/dashboard-url";
const ANNOTATION_KUBERNETES_DASHBOARD_APP = "kubernetes.io/dashboard-app";
const ANNOTATION_KUBERNETES_DASHBOARD_PARAMETERS = "kubernetes.io/dashboard-parameters";
const ANNOTATION_KUBERNETES_AWS_ASSUME_ROLE = "kubernetes.io/aws-assume-role";
const ANNOTATION_KUBERNETES_AWS_CLUSTER_ID = "kubernetes.io/x-k8s-aws-id";
const ANNOTATION_KUBERNETES_AWS_EXTERNAL_ID = "kubernetes.io/aws-external-id";

const kubernetesProxyPermission = pluginPermissionCommon.createPermission({
  name: "kubernetes.proxy",
  attributes: {}
});
const kubernetesPermissions = [kubernetesProxyPermission];

const groupResponses = (fetchResponse) => {
  return fetchResponse.reduce(
    (prev, next) => {
      switch (next.type) {
        case "deployments":
          prev.deployments.push(...next.resources);
          break;
        case "pods":
          prev.pods.push(...next.resources);
          break;
        case "replicasets":
          prev.replicaSets.push(...next.resources);
          break;
        case "services":
          prev.services.push(...next.resources);
          break;
        case "configmaps":
          prev.configMaps.push(...next.resources);
          break;
        case "horizontalpodautoscalers":
          prev.horizontalPodAutoscalers.push(...next.resources);
          break;
        case "ingresses":
          prev.ingresses.push(...next.resources);
          break;
        case "jobs":
          prev.jobs.push(...next.resources);
          break;
        case "cronjobs":
          prev.cronJobs.push(...next.resources);
          break;
        case "customresources":
          prev.customResources.push(...next.resources);
          break;
        case "statefulsets":
          prev.statefulsets.push(...next.resources);
          break;
        case "daemonsets":
          prev.daemonSets.push(...next.resources);
          break;
      }
      return prev;
    },
    {
      pods: [],
      replicaSets: [],
      deployments: [],
      services: [],
      configMaps: [],
      horizontalPodAutoscalers: [],
      ingresses: [],
      jobs: [],
      cronJobs: [],
      customResources: [],
      statefulsets: [],
      daemonSets: []
    }
  );
};

const detectErrorsInObjects = (objects, errorMappers) => {
  return objects.flatMap((o) => {
    return errorMappers.flatMap((em) => em.detectErrors(o));
  });
};

function isPodReadinessProbeUnready({
  container,
  containerStatus
}) {
  if (containerStatus.ready || containerStatus.state?.running?.startedAt === void 0 || !container.readinessProbe) {
    return false;
  }
  const startDateTime = luxon.DateTime.fromISO(
    containerStatus.state?.running?.startedAt
  ).plus({
    seconds: container.readinessProbe?.initialDelaySeconds ?? 0
  }).plus({
    seconds: (container.readinessProbe?.periodSeconds ?? 0) * (container.readinessProbe?.failureThreshold ?? 0)
  });
  return startDateTime < luxon.DateTime.now();
}
const podToContainerSpecsAndStatuses = (pod) => {
  const specs = lodash__default.default.groupBy(pod.spec?.containers ?? [], (value) => value.name);
  const result = [];
  for (const cs of pod.status?.containerStatuses ?? []) {
    const spec = specs[cs.name];
    if (spec.length > 0) {
      result.push({
        container: spec[0],
        containerStatus: cs
      });
    }
  }
  return result;
};
const readinessProbeProposedFixes = (pod) => {
  const firstUnreadyContainerStatus = pod.status?.containerStatuses?.find(
    (cs) => {
      return cs.ready === false;
    }
  );
  return {
    errorType: "ReadinessProbeFailed",
    rootCauseExplanation: `The container ${firstUnreadyContainerStatus?.name} failed to start properly, but is not crashing`,
    actions: [
      "Ensure that the container starts correctly locally",
      "Check the container's logs looking for error during startup"
    ],
    type: "events",
    podName: pod.metadata?.name ?? ""
  };
};
const restartingPodProposedFixes = (pod) => {
  const lastTerminatedCs = (pod.status?.containerStatuses ?? []).find(
    (cs) => cs.lastState?.terminated !== void 0
  );
  const lastTerminated = lastTerminatedCs?.lastState?.terminated;
  if (!lastTerminated) {
    return void 0;
  }
  switch (lastTerminated?.reason) {
    case "Unknown":
      return {
        // TODO check this one, it's more likely a cluster issue
        errorType: "Unknown",
        rootCauseExplanation: `This container has exited with a non-zero exit code (${lastTerminated.exitCode})`,
        actions: ["Check the crash logs for stacktraces"],
        container: lastTerminatedCs.name,
        type: "logs"
      };
    case "Error":
      return {
        errorType: "Error",
        rootCauseExplanation: `This container has exited with a non-zero exit code (${lastTerminated.exitCode})`,
        actions: ["Check the crash logs for stacktraces"],
        container: lastTerminatedCs.name,
        type: "logs"
      };
    case "OOMKilled":
      return {
        errorType: "OOMKilled",
        rootCauseExplanation: `The container "${lastTerminatedCs.name}" has crashed because it has tried to use more memory that it has been allocated`,
        actions: [
          `Increase the amount of memory assigned to the container`,
          "Ensure the application is memory bounded and is not trying to consume too much memory"
        ],
        docsLink: "https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/#exceed-a-container-s-memory-limit",
        type: "docs"
      };
    default:
      return void 0;
  }
};
const waitingProposedFix = (pod) => {
  const waitingCs = (pod.status?.containerStatuses ?? []).find(
    (cs) => cs.state?.waiting !== void 0
  );
  const waiting = (pod.status?.containerStatuses ?? []).map((cs) => cs.state?.waiting).find((w) => w?.reason !== void 0);
  switch (waiting?.reason) {
    case "InvalidImageName":
      return {
        errorType: "InvalidImageName",
        rootCauseExplanation: "The image in the pod is invalid",
        actions: ["Ensure the image name is correct and valid image name"],
        type: "docs",
        docsLink: "https://docs.docker.com/engine/reference/commandline/tag/#extended-description"
      };
    case "ImagePullBackOff":
      return {
        errorType: "ImagePullBackOff",
        rootCauseExplanation: "The image either could not be found or Kubernetes does not have permission to pull it",
        actions: [
          "Ensure the image name is correct",
          "Ensure Kubernetes has permission to pull this image"
        ],
        type: "docs",
        docsLink: "https://kubernetes.io/docs/concepts/containers/images/#imagepullbackoff"
      };
    case "CrashLoopBackOff":
      return {
        errorType: "CrashLoopBackOff",
        rootCauseExplanation: `The container ${waitingCs?.name} has crashed many times, it will be exponentially restarted until it stops crashing`,
        actions: ["Check the crash logs for stacktraces"],
        type: "logs",
        container: waitingCs?.name ?? "unknown"
      };
    case "CreateContainerConfigError":
      return {
        errorType: "CreateContainerConfigError",
        rootCauseExplanation: "There is missing or mismatching configuration required to start the container",
        actions: [
          "Ensure ConfigMaps references in the Deployment manifest are correct and the keys exist",
          "Ensure Secrets references in the Deployment manifest are correct and the keys exist"
        ],
        type: "docs",
        docsLink: "https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/"
      };
    default:
      return void 0;
  }
};
const podErrorMappers = [
  {
    detectErrors: (pod) => {
      return podToContainerSpecsAndStatuses(pod).filter(isPodReadinessProbeUnready).map((cs) => ({
        type: "readiness-probe-taking-too-long",
        message: `The container ${cs.container.name} failed to start properly, but is not crashing`,
        severity: 4,
        proposedFix: readinessProbeProposedFixes(pod),
        sourceRef: {
          name: pod.metadata?.name ?? "unknown pod",
          namespace: pod.metadata?.namespace ?? "unknown namespace",
          kind: "Pod",
          apiGroup: "v1"
        },
        occurrenceCount: 1
      }));
    }
  },
  {
    detectErrors: (pod) => {
      return (pod.status?.containerStatuses ?? []).filter((cs) => cs.state?.waiting?.message !== void 0).map((cs) => ({
        type: "container-waiting",
        message: cs.state?.waiting?.message ?? "container waiting",
        severity: 4,
        proposedFix: waitingProposedFix(pod),
        sourceRef: {
          name: pod.metadata?.name ?? "unknown pod",
          namespace: pod.metadata?.namespace ?? "unknown namespace",
          kind: "Pod",
          apiGroup: "v1"
        },
        occurrenceCount: 1
      }));
    }
  },
  {
    detectErrors: (pod) => {
      return (pod.status?.containerStatuses ?? []).filter((cs) => cs.restartCount > 0).map((cs) => ({
        type: "containers-restarting",
        message: `container=${cs.name} restarted ${cs.restartCount} times`,
        severity: 4,
        proposedFix: restartingPodProposedFixes(pod),
        sourceRef: {
          name: pod.metadata?.name ?? "unknown pod",
          namespace: pod.metadata?.namespace ?? "unknown namespace",
          kind: "Pod",
          apiGroup: "v1"
        },
        occurrenceCount: cs.restartCount
      }));
    }
  }
];
const detectErrorsInPods = (pods) => detectErrorsInObjects(pods, podErrorMappers);

const deploymentErrorMappers = [
  {
    detectErrors: (deployment) => {
      return (deployment.status?.conditions ?? []).filter((c) => c.status === "False").filter((c) => c.message !== void 0).map((c) => ({
        type: "condition-message-present",
        message: c.message ?? "",
        severity: 6,
        sourceRef: {
          name: deployment.metadata?.name ?? "unknown hpa",
          namespace: deployment.metadata?.namespace ?? "unknown namespace",
          kind: "Deployment",
          apiGroup: "apps/v1"
        },
        occurrenceCount: 1
      }));
    }
  }
];
const detectErrorsInDeployments = (deployments) => detectErrorsInObjects(deployments, deploymentErrorMappers);

const hpaErrorMappers = [
  {
    detectErrors: (hpa) => {
      if ((hpa.spec?.maxReplicas ?? -1) === hpa.status?.currentReplicas) {
        return [
          {
            type: "hpa-max-current-replicas",
            message: `Current number of replicas (${hpa.status?.currentReplicas}) is equal to the configured max number of replicas (${hpa.spec?.maxReplicas ?? -1})`,
            severity: 8,
            sourceRef: {
              name: hpa.metadata?.name ?? "unknown hpa",
              namespace: hpa.metadata?.namespace ?? "unknown namespace",
              kind: "HorizontalPodAutoscaler",
              apiGroup: "autoscaling/v2"
            },
            occurrenceCount: 1
          }
        ];
      }
      return [];
    }
  }
];
const detectErrorsInHpa = (hpas) => detectErrorsInObjects(hpas, hpaErrorMappers);

const detectErrors = (objects) => {
  const errors = /* @__PURE__ */ new Map();
  for (const clusterResponse of objects.items) {
    let clusterErrors = [];
    const groupedResponses = groupResponses(clusterResponse.resources);
    clusterErrors = clusterErrors.concat(
      detectErrorsInPods(groupedResponses.pods)
    );
    clusterErrors = clusterErrors.concat(
      detectErrorsInDeployments(groupedResponses.deployments)
    );
    clusterErrors = clusterErrors.concat(
      detectErrorsInHpa(
        groupedResponses.horizontalPodAutoscalers
      )
    );
    errors.set(clusterResponse.cluster.name, clusterErrors);
  }
  return errors;
};

exports.ANNOTATION_KUBERNETES_API_SERVER = ANNOTATION_KUBERNETES_API_SERVER;
exports.ANNOTATION_KUBERNETES_API_SERVER_CA = ANNOTATION_KUBERNETES_API_SERVER_CA;
exports.ANNOTATION_KUBERNETES_AUTH_PROVIDER = ANNOTATION_KUBERNETES_AUTH_PROVIDER;
exports.ANNOTATION_KUBERNETES_AWS_ASSUME_ROLE = ANNOTATION_KUBERNETES_AWS_ASSUME_ROLE;
exports.ANNOTATION_KUBERNETES_AWS_CLUSTER_ID = ANNOTATION_KUBERNETES_AWS_CLUSTER_ID;
exports.ANNOTATION_KUBERNETES_AWS_EXTERNAL_ID = ANNOTATION_KUBERNETES_AWS_EXTERNAL_ID;
exports.ANNOTATION_KUBERNETES_DASHBOARD_APP = ANNOTATION_KUBERNETES_DASHBOARD_APP;
exports.ANNOTATION_KUBERNETES_DASHBOARD_PARAMETERS = ANNOTATION_KUBERNETES_DASHBOARD_PARAMETERS;
exports.ANNOTATION_KUBERNETES_DASHBOARD_URL = ANNOTATION_KUBERNETES_DASHBOARD_URL;
exports.ANNOTATION_KUBERNETES_OIDC_TOKEN_PROVIDER = ANNOTATION_KUBERNETES_OIDC_TOKEN_PROVIDER;
exports.ANNOTATION_KUBERNETES_SKIP_METRICS_LOOKUP = ANNOTATION_KUBERNETES_SKIP_METRICS_LOOKUP;
exports.ANNOTATION_KUBERNETES_SKIP_TLS_VERIFY = ANNOTATION_KUBERNETES_SKIP_TLS_VERIFY;
exports.detectErrors = detectErrors;
exports.groupResponses = groupResponses;
exports.kubernetesPermissions = kubernetesPermissions;
exports.kubernetesProxyPermission = kubernetesProxyPermission;
//# sourceMappingURL=index.cjs.js.map
