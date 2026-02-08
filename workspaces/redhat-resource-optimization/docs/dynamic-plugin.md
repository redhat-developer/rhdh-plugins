## Installing as Dynamic Plugin

Unlike static plugins that necessitate source code modifications, dynamic plugins can be seamlessly integrated through configuration entries in the `dynamic-plugins-rhdh.yaml` file.
Red Hat Developer Hub (RHDH) leverages dynamic plugins to efficiently deploy plugins on a Backstage instance.

The procedure involves the following steps:

1. Ensure you are familiar with the [RHDH configuration docs](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.6/html/configuring_red_hat_developer_hub/index) and [RHDH plugin installation guide](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.6/html/installing_and_viewing_plugins_in_red_hat_developer_hub/index)

2. The plugin consumes services from [Red Hat Hybrid Cloud Console](https://console.redhat.com/openshift/cost-management/optimizations), therefore your clusters [must be configured to receive optimization recommendations](https://docs.redhat.com/en/documentation/cost_management_service/1-latest/html-single/getting_started_with_resource_optimization_for_openshift/index).  
   Copy and save the `CLIENT_ID` & `CLIENT_SECRET` from service account you created earlier with `Cost OpenShift Viewer` role. This will be needed during configuration step below.

3. Specially, make sure you have configured

   - ConfigMaps: `dynamic-plugins-rhdh`
   - Secrets: `secrets-rhdh`

4. Add the following configuration to each one of the objects mentioned above respectively

   ```yaml
   # Add to secrets-rhdh Secret
   # replace the CLIENT_ID and CLIENT_SECRET which you have saved from the previous step from your service account
   # with `Cost OpenShift Viewer` role

   ROS_CLIENT_ID: # <as base64 string>
   ROS_CLIENT_SECRET: # <as base64 string>
   ```

   ```yaml
   # Add to dynamic-plugins-rhdh ConfigMap

   - package: oci://quay.io/redhat-resource-optimization/dynamic-plugins:1.2.0!red-hat-developer-hub-plugin-redhat-resource-optimization
      disabled: false
      pluginConfig:
        dynamicPlugins:
          frontend:
            backstage-community.plugin-redhat-resource-optimization:
              appIcons:
                - name: resourceOptimizationIconOutlined
                  importName: ResourceOptimizationIconOutlined
              dynamicRoutes:
                - path: /redhat-resource-optimization
                  importName: ResourceOptimizationPage
                  menuItem:
                    icon: resourceOptimizationIconOutlined
                    text: Optimizations
    - package: oci://quay.io/redhat-resource-optimization/dynamic-plugins:1.2.0!red-hat-developer-hub-plugin-redhat-resource-optimization-backend
      disabled: false
      pluginConfig:
        proxy:
          endpoints:
            '/cost-management/v1':
              target: https://console.redhat.com/api/cost-management/v1
              allowedHeaders: ['Authorization']
              credentials: dangerously-allow-unauthenticated
        costManagement:
          clientId: ${ROS_CLIENT_ID}
          clientSecret: ${ROS_CLIENT_SECRET}
          optimizationWorkflowId: 'patch-k8s-resource'
   ```

### References

- [Installing ROS-OCP RHDH plugin on Red Hat Developer Hub on a Openshift Cluster](https://docs.google.com/document/d/1tExe7cEBYMJplkk9ppSdBINwE-14KmxURczGjloHqZ4/edit?usp=sharing)

- [Documentation to understand how to export, package & publish plugin as a dynamic plugin](https://github.com/redhat-developer/rhdh/blob/main/docs/dynamic-plugins/packaging-dynamic-plugins.md#packaging-and-publishing-backstage-plugin-as-a-dynamic-plugin)
