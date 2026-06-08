# WorkflowOverviewDTO
## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
| **workflowId** | **String** | Workflow unique identifier | [default to null] |
| **name** | **String** | Workflow name | [optional] [default to null] |
| **format** | [**WorkflowFormatDTO**](WorkflowFormatDTO.md) |  | [default to null] |
| **lastRunId** | **String** |  | [optional] [default to null] |
| **lastTriggeredMs** | **BigDecimal** |  | [optional] [default to null] |
| **lastRunStatus** | [**ProcessInstanceStatusDTO**](ProcessInstanceStatusDTO.md) |  | [optional] [default to null] |
| **description** | **String** |  | [optional] [default to null] |
| **isAvailable** | **Boolean** |  | [optional] [default to null] |
| **version** | **String** | Workflow definition version | [optional] [default to null] |
| **successRatio** | **BigDecimal** | Ratio of completed runs to total runs | [optional] [default to null] |
| **runsLastMonth** | **Integer** | Number of runs in the last 30 days | [optional] [default to null] |

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)

