## Installing Cost Management on Red Hat Developer Hub

This guide explains how to install the Cost Management plugin on Red Hat Developer Hub (RHDH).

Install by adding the Cost Management packages to your RHDH dynamic plugins configuration (Operator ConfigMap or Helm values). Use the plugin image tag that matches your RHDH release. Other combinations are not supported.

For the latest supported release, see the official [RHDH 2.1 — Install dynamic plugins](https://docs.redhat.com/en/documentation/red_hat_developer_hub/2.1/extend-con_install_dynamic_plugins) documentation.

### Supported versions

RHDH support levels below follow the official [Red Hat Developer Hub Life Cycle](https://access.redhat.com/support/policy/updates/developerhub) (Full Support and Maintenance Support).

| RHDH version     | RHDH support level  | Cost Management plugin image tag | Install section                              |
| ---------------- | ------------------- | -------------------------------- | -------------------------------------------- |
| **2.1** (latest) | Full Support        | `2.4.2`                          | [Install on RHDH 2.1](#install-on-rhdh-21)   |
| **1.10**         | Maintenance Support | `2.2.2`                          | [Install on RHDH 1.10](#install-on-rhdh-110) |

RHDH **1.9** and earlier are end of life and are not supported for this plugin. Life cycle dates and phase definitions can change; always confirm the current status on the [Red Hat Developer Hub Life Cycle](https://access.redhat.com/support/policy/updates/developerhub) page.

> **Important:** Install this plugin through Operator, Helm, or your `dynamic-plugins` configuration as documented below. Installing plugins from the Extensions Catalog UI is supported only in development environments; production blocks UI install. See [RHDH 2.1 — Manage plugins](https://docs.redhat.com/en/documentation/red_hat_developer_hub/2.1/extend-con_manage_plugins).

### Prerequisites

1. Review the RHDH plugin installation docs for your release (see [Related documentation](#related-documentation)).
2. Your clusters must be set up for Cost Management. See [Integrating OpenShift Container Platform data into cost management](https://docs.redhat.com/en/documentation/cost_management_service/1-latest/html/integrating_openshift_container_platform_data_into_cost_management/index).
3. Create a service account with the `Cost OpenShift Viewer` role and copy the `CLIENT_ID` and `CLIENT_SECRET`.
4. Ensure your RHDH deployment can store plugin configuration and credentials, for example:
   - ConfigMap: `dynamic-plugins-rhdh` (or equivalent Helm dynamic plugins config)
   - Secret: `secrets-rhdh` (or equivalent) for Cost Management credentials

---

### Install on RHDH 2.1

Official guides: [Install dynamic plugins (2.1)](https://docs.redhat.com/en/documentation/red_hat_developer_hub/2.1/extend-con_install_dynamic_plugins) · [Install with the Operator](https://docs.redhat.com/en/documentation/red_hat_developer_hub/2.1/extend-con_install_with_operator) · [Install with the Helm chart](https://docs.redhat.com/en/documentation/red_hat_developer_hub/2.1/extend-con_install_with_helm_chart)

Use plugin image tag **`2.4.2`**. Do **not** copy the RHDH 1.10 frontend route and menu configuration from the section below — on RHDH 2.1 those pages are registered automatically.

1. Add Cost Management credentials to your `secrets-rhdh` Secret (base64-encoded values):

   ```yaml
   # Add to secrets-rhdh Secret
   # replace CLIENT_ID and CLIENT_SECRET from your service account
   # with `Cost OpenShift Viewer` role

   CM_CLIENT_ID: # <as base64 string>
   CM_CLIENT_SECRET: # <as base64 string>
   ```

2. Add the frontend and backend packages to your `dynamic-plugins-rhdh` ConfigMap (Operator) or Helm dynamic plugins list:

   ```yaml
   # Add to dynamic-plugins-rhdh ConfigMap

   - package: oci://quay.io/redhat-resource-optimization/dynamic-plugins:2.4.2!red-hat-developer-hub-plugin-cost-management
     disabled: false
   - package: oci://quay.io/redhat-resource-optimization/dynamic-plugins:2.4.2!red-hat-developer-hub-plugin-cost-management-backend
     disabled: false
     pluginConfig:
       costManagement:
         clientId: ${CM_CLIENT_ID}
         clientSecret: ${CM_CLIENT_SECRET}
         optimizationWorkflowId: 'patch-k8s-resource'
   ```

3. Optional: customize page titles or paths in your application config:

   ```yaml
   app:
     extensions:
       - page:cost-management:
           config:
             title: Optimizations
             path: /cost-management/optimizations
       - page:cost-management/openshift:
           config:
             title: Cost Management
             path: /cost-management/openshift
   ```

4. Apply the ConfigMap / Secret (or Helm values) and restart or redeploy your RHDH application.

5. Verify in the RHDH UI: open **Administration > Extensions > Installed** and confirm the sidebar shows **Optimizations** and **Cost Management**.

---

### Install on RHDH 1.10

Official guides: [Install dynamic plugins (1.10)](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/installing_and_viewing_plugins_in_red_hat_developer_hub/install-dynamic-plugins-in-rhdh_installing-and-viewing-plugins-in-rhdh) · [Configuring RHDH (1.10)](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/configuring_red_hat_developer_hub/index)

Use plugin image tag **`2.2.2`** with the configuration below.

1. Add Cost Management credentials to your `secrets-rhdh` Secret (base64-encoded values):

   ```yaml
   # Add to secrets-rhdh Secret
   # replace CLIENT_ID and CLIENT_SECRET from your service account
   # with `Cost OpenShift Viewer` role

   CM_CLIENT_ID: # <as base64 string>
   CM_CLIENT_SECRET: # <as base64 string>
   ```

2. Add the frontend and backend packages to your `dynamic-plugins-rhdh` ConfigMap (Operator) or Helm dynamic plugins list:

   ```yaml
   # Add to dynamic-plugins-rhdh ConfigMap

   - package: oci://quay.io/redhat-resource-optimization/dynamic-plugins:2.2.2!red-hat-developer-hub-plugin-cost-management
     disabled: false
     pluginConfig:
       dynamicPlugins:
         frontend:
           red-hat-developer-hub.plugin-cost-management:
             appIcons:
               - name: costManagementIcon
                 importName: CostManagementIconOutlined
             dynamicRoutes:
               - path: /cost-management/optimizations
                 importName: ResourceOptimizationPage
                 menuItem:
                   icon: costManagementIcon
                   text: Optimizations
               - path: /cost-management/openshift
                 importName: OpenShiftPage
                 menuItem:
                   icon: costManagementIcon
                   text: OpenShift
             menuItems:
               cost-management:
                 icon: costManagementIcon
                 title: Cost management
                 priority: 100
               cost-management.optimizations:
                 parent: cost-management
                 priority: 10
               cost-management.openshift:
                 parent: cost-management
                 priority: 20
   - package: oci://quay.io/redhat-resource-optimization/dynamic-plugins:2.2.2!red-hat-developer-hub-plugin-cost-management-backend
     disabled: false
     pluginConfig:
       costManagement:
         clientId: ${CM_CLIENT_ID}
         clientSecret: ${CM_CLIENT_SECRET}
         optimizationWorkflowId: 'patch-k8s-resource'
   ```

3. Apply the ConfigMap / Secret (or Helm values) and restart or redeploy your RHDH application.

4. Verify in the RHDH UI: open **Administration > Extensions > Installed** (or navigate to **Cost management** in the sidebar) and confirm the Optimizations and OpenShift pages load.

---

### Related documentation

- [Red Hat Developer Hub Life Cycle](https://access.redhat.com/support/policy/updates/developerhub) — supported RHDH versions, platforms, and life cycle phases
- [Red Hat Developer Hub Support Policy](https://access.redhat.com/support/policy/updates/developer-hub) — product and plugin support categories
- [RHDH 2.1 documentation](https://docs.redhat.com/en/documentation/red_hat_developer_hub/2.1/)
- [RHDH 2.1 — Install dynamic plugins](https://docs.redhat.com/en/documentation/red_hat_developer_hub/2.1/extend-con_install_dynamic_plugins)
- [RHDH 2.1 — Install with the Operator](https://docs.redhat.com/en/documentation/red_hat_developer_hub/2.1/extend-con_install_with_operator)
- [RHDH 2.1 — Install with the Helm chart](https://docs.redhat.com/en/documentation/red_hat_developer_hub/2.1/extend-con_install_with_helm_chart)
- [RHDH 2.1 — Manage plugins (Extensions UI)](https://docs.redhat.com/en/documentation/red_hat_developer_hub/2.1/extend-con_manage_plugins)
- [RHDH 1.10 documentation](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/)
- [RHDH 1.10 — Installing and viewing plugins](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/installing_and_viewing_plugins_in_red_hat_developer_hub/index)
- [RHDH 1.10 — Install dynamic plugins](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/installing_and_viewing_plugins_in_red_hat_developer_hub/install-dynamic-plugins-in-rhdh_installing-and-viewing-plugins-in-rhdh)
- [RHDH 1.10 — Configuring Red Hat Developer Hub](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/configuring_red_hat_developer_hub/index)
- [Integrating OpenShift Container Platform data into cost management](https://docs.redhat.com/en/documentation/cost_management_service/1-latest/html/integrating_openshift_container_platform_data_into_cost_management/index)
