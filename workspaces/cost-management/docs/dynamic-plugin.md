## Installing as Dynamic Plugin

Unlike static plugins that necessitate source code modifications, dynamic plugins can be seamlessly integrated through configuration entries in the `dynamic-plugins-rhdh.yaml` file.
Red Hat Developer Hub (RHDH) leverages dynamic plugins to efficiently deploy plugins on a Backstage instance.

The procedure involves the following steps:

1. Ensure you are familiar with the Red Hat Developer Hub configuration docs and plugin installation guide. This plugin has been tested with RHDH 1.8 and 1.9.

   **Additional Resources:**

   - [Red Hat Developer Hub 1.9 Documentation](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.9/)
   - [Red Hat Developer Hub 1.8 Documentation](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.8/)

2. The plugin consumes services from [Red Hat Hybrid Cloud Console](https://console.redhat.com/openshift/cost-management) for both OpenShift and Optimizations sections, therefore your clusters [must be configured to access cost management data and optimization recommendations](https://docs.redhat.com/en/documentation/cost_management_service/1-latest/html/integrating_openshift_container_platform_data_into_cost_management/index).
   Copy and save the `CLIENT_ID` & `CLIENT_SECRET` from service account you created earlier with `Cost OpenShift Viewer` role. This will be needed during configuration step below.

3. Specially, make sure you have configured

   - ConfigMaps: `dynamic-plugins-rhdh`
   - Secrets: `secrets-rhdh`

4. Add the following configuration to each one of the objects mentioned above respectively

   ```yaml
   # Add to secrets-rhdh Secret
   # replace the CLIENT_ID and CLIENT_SECRET which you have saved from the previous step from your service account
   # with `Cost OpenShift Viewer` role

   CM_CLIENT_ID: # <as base64 string>
   CM_CLIENT_SECRET: # <as base64 string>
   ```

   ```yaml
   # Add to dynamic-plugins-rhdh ConfigMap

   - package: oci://quay.io/redhat-resource-optimization/dynamic-plugins:2.0.2!red-hat-developer-hub-plugin-cost-management
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
   - package: oci://quay.io/redhat-resource-optimization/dynamic-plugins:2.0.2!red-hat-developer-hub-plugin-cost-management-backend
     disabled: false
     pluginConfig:
       costManagement:
         clientId: ${CM_CLIENT_ID}
         clientSecret: ${CM_CLIENT_SECRET}
         optimizationWorkflowId: 'patch-k8s-resource'
   ```

   > **Note:** No `proxy` configuration is required. Previous versions required a
   > `proxy.endpoints['/cost-management/v1']` entry that forwarded requests to
   > `console.redhat.com` — this has been removed. The backend plugin now
   > communicates with the Red Hat Cost Management API server-side via a secure
   > proxy. SSO tokens are obtained internally via OAuth2 `client_credentials`
   > grant and never exposed to the browser. RBAC filtering is enforced
   > server-side before data is returned. See [rbac.md](./rbac.md) for details.
