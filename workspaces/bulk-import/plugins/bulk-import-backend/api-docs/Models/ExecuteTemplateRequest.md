# ExecuteTemplateRequest

## Properties

| Name                   | Type                  | Description                                                                                  | Notes                        |
| ---------------------- | --------------------- | -------------------------------------------------------------------------------------------- | ---------------------------- |
| **repositories**       | **List**              | A list of GitHub repository URLs to execute the template against.                            | [optional] [default to null] |
| **templateParameters** | [**Map**](AnyType.md) | Optional key/value pairs to pass to the template.                                            | [optional] [default to null] |
| **templateName**       | **String**            | Optional name of the template to use. If not provided, the default from config will be used. | [optional] [default to null] |

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
