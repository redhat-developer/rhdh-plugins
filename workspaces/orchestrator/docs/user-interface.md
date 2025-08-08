# User Interface

The Orchestrator plugin supports two primary modes of workflow interaction:

## 1. Direct Workflow Access

The user interface is accessible via the orchestrator button added in the Backstage sidebar. It provides a list of workflows and the option to run the workflows and view the results.

![user interface](./userInterface.png)

## 2. Template-based Workflow Integration

Workflows can also be invoked from Backstage software templates using the `orchestrator:workflow:run` action. When workflows are executed this way, a dedicated "Workflows" tab appears on the entity page, allowing users to view and manage workflow instances associated with that specific entity.

## Key Features

### Workflow Management

- Browse available workflows
- Execute workflows with custom parameters
- Monitor workflow execution status
- View workflow results and outputs

### Entity Integration

- Workflow tabs on entity pages
- Entity-specific workflow instances
- Integration with Backstage catalog

### Template Integration

- Scaffold integration via custom actions
- Workflow execution from software templates
- Automated workflow triggering

## Navigation

- **Main Interface**: Access via the "Orchestrator" sidebar item
- **Entity Workflows**: Available on entity pages when workflows are associated
- **Template Workflows**: Launched from software template execution

## Permissions

The user interface respects the permission system configured for the orchestrator backend. See the [Permissions Guide](./Permissions.md) for details on access control configuration.
