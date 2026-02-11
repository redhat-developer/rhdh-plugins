The Cost Management plugin protects its backend endpoints with the builtin permission mechanism and combines it with the RBAC plugin.

The Cost Management plugin consists of two main sections, each with its own set of permissions:

- **Optimizations**: Uses permissions starting with `ros.`
- **OpenShift**: Uses permissions starting with `cost.`

## 1. Optimizations Section

The Optimizations section allows users to view resource usage trends and optimization recommendations for workloads running on OpenShift clusters.

### Optimizations Section Permissions

| Name                              | Resource Type | Policy | Description                                                                                                                |
| --------------------------------- | ------------- | ------ | -------------------------------------------------------------------------------------------------------------------------- |
| ros.plugin                        | -             | read   | Allows the user to access all optimization data in the Cost Management plugin                                              |
| ros.[CLUSTER_NAME]                | -             | read   | Allows the user to access optimization data for a specific Cluster in the Cost Management plugin                           |
| ros.[CLUSTER_NAME].[PROJECT_NAME] | -             | read   | Allows the user to access optimization data for a specific Project within a specific Cluster in the Cost Management plugin |

The user is permitted to do an action if either the generic permission or the specific one allows it. In other words, it is not possible to grant generic ros.plugin and then selectively disable it for a specific cluster via ros.[CLUSTER_NAME] with deny.

## 2. OpenShift Section

The OpenShift section displays cost tracking for OpenShift clusters with flexible grouping options by cluster, project, node, or tag.

### OpenShift Section Permissions

| Name                               | Resource Type | Policy | Description                                                                                                                  |
| ---------------------------------- | ------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| cost.plugin                        | -             | read   | Allows the user to access all OpenShift cost data in the Cost Management plugin                                              |
| cost.[CLUSTER_NAME]                | -             | read   | Allows the user to access OpenShift cost data for a specific Cluster in the Cost Management plugin                           |
| cost.[CLUSTER_NAME].[PROJECT_NAME] | -             | read   | Allows the user to access OpenShift cost data for a specific Project within a specific Cluster in the Cost Management plugin |

The user is permitted to do an action if either the generic permission or the specific one allows it. In other words, it is not possible to grant generic cost.plugin and then selectively disable it for a specific cluster via cost.[CLUSTER_NAME] with deny.

## Defining Policy File

To get started with policies, we recommend defining roles and assigning them to groups or users in a dedicated CSV file.

Here is an example policy file that includes permissions for both Optimizations (`ros.`) and OpenShift (`cost.`) sections of the Cost Management plugin:

```csv
####
# Optimizations Section (ros.) - Generic permissions
####
p, role:default/rosUser, ros.plugin, read, deny

####
# Optimizations Section (ros.) - Cluster RBAC permissions
####
p, role:default/rosUser, ros.OpenShift on AWS, read, allow
p, role:default/rosUser, ros.demolab, read, allow

####
# Optimizations Section (ros.) - Cluster+Project RBAC permissions
####
p, role:default/rosUser, ros.demolab.thanos, read, allow
p, role:default/rosUser, ros.OpenShift on Azure.mobile, read, allow

####
# OpenShift Section (cost.) - Generic permissions
####
p, role:default/costUser, cost.plugin, read, deny

####
# OpenShift Section (cost.) - Cluster RBAC permissions
####
p, role:default/costUser, cost.OpenShift on AWS, read, allow
p, role:default/costUser, cost.demolab, read, allow

####
# OpenShift Section (cost.) - Cluster+Project RBAC permissions
####
p, role:default/costUser, cost.demolab.thanos, read, allow
p, role:default/costUser, cost.OpenShift on Azure.mobile, read, allow

g, user:default/preeti.exploring.life, role:default/rosUser
g, user:default/preeti.exploring.life, role:default/costUser
```

## Permission Examples

### Optimizations Section

#### ros.plugin Permission

Since the `test_user_1` user has the `default/rosUser` role, which has `ros.plugin` permission, it can:

- See the list of all the clusters and projects specified for the service account which is specified in the [app-config file](../app-config.yaml) file using `clientId` and `clientSecret` and optimization recommendations for the same.

```csv
p, role:default/rosUser, ros.plugin, read, allow

g, user:default/test_user_1, role:default/rosUser
```

#### ros.[CLUSTER_NAME]

Since the `test_user_2` user has the `default/rosClusterUser` role, which has `ros.OpenShift on AWS` permission, it can:

- See the list of records for `OpenShift on AWS` cluster for the service account which is specified in the [app-config file](../app-config.yaml) file using `clientId` and `clientSecret` and optimization recommendations for the same.

```csv
p, role:default/rosClusterUser, ros.OpenShift on AWS, read, allow

g, user:default/test_user_2, role:default/rosClusterUser
```

#### ros.[CLUSTER_NAME].[PROJECT_NAME]

Since the `test_user_3` user has the `default/rosClusterProjectUser` role, which has `ros.demolab.thanos` permission, it can:

- See the list of records for `thanos` project under `demolab` cluster for the service account which is specified in the [app-config file](../app-config.yaml) file using `clientId` and `clientSecret` and optimization recommendations for the same.

```csv
p, role:default/rosClusterProjectUser, ros.demolab.thanos, read, allow

g, user:default/test_user_3, role:default/rosClusterProjectUser
```

### OpenShift Cost Section

#### cost.plugin Permission

Since the `test_user_4` user has the `default/costUser` role, which has `cost.plugin` permission, it can:

- See the list of all the clusters and projects specified for the service account which is specified in the [app-config file](../app-config.yaml) file using `clientId` and `clientSecret` and cost data for the same.

```csv
p, role:default/costUser, cost.plugin, read, allow

g, user:default/test_user_4, role:default/costUser
```

#### cost.[CLUSTER_NAME]

Since the `test_user_5` user has the `default/costClusterUser` role, which has `cost.OpenShift on AWS` permission, it can:

- See the list of records for `OpenShift on AWS` cluster for the service account which is specified in the [app-config file](../app-config.yaml) file using `clientId` and `clientSecret` and cost data for the same.

```csv
p, role:default/costClusterUser, cost.OpenShift on AWS, read, allow

g, user:default/test_user_5, role:default/costClusterUser
```

#### cost.[CLUSTER_NAME].[PROJECT_NAME]

Since the `test_user_6` user has the `default/costClusterProjectUser` role, which has `cost.demolab.thanos` permission, it can:

- See the list of records for `thanos` project under `demolab` cluster for the service account which is specified in the [app-config file](../app-config.yaml) file using `clientId` and `clientSecret` and cost data for the same.

```csv
p, role:default/costClusterProjectUser, cost.demolab.thanos, read, allow

g, user:default/test_user_6, role:default/costClusterProjectUser
```

See https://casbin.org/docs/rbac for more information about casbin rules.

## Enable permissions

To enable permissions, you need to add the following in the [app-config file](../app-config.yaml):

```
permission:
  enabled: true
  rbac:
    policies-csv-file: <absolute path to the policy file>
    policyFileReload: true
    admin:
      users:
        - name: user:default/YOUR_USER
```

[Refer to this link](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.6/html/authorization_in_red_hat_developer_hub/index) to configure and enable RBAC for Red Hat Developer Hub.
