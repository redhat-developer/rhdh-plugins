# The orchestrator-form-widgets library

This library provides default, but optional, RJSF form widgets for the Orchestrator workflow execution page.
The library is supplied through the `orchestrator-form-widgets` front-end plugin.

## Development of a workflow using orchestrator-form-widgets

Developing workflows with the `orchestrator-form-widgets` follows principles similar to standard workflow creation, with one critical enhancement: the ability to incorporate dynamic UI elements via the `ui:widget` property in your data input schema.

Key Differentiators:

- Dynamic UI Integration: Reference custom UI widgets directly in your schema using `ui:widget`, enabling interactive components like `ActiveTextInput` or `ActiveDropdown`.
- Backend Flexibility: A live HTTP server is required to:
  - Serve JSON Schema snippets for the SchemaUpdater.
  - Provide default data or option lists.
  - Handle complex validation logic for widgets.

Implementation of the HTTP endpoints is out of the scope of this library.

Deployment Considerations:

- Use one or multiple servers depending on organizational needs.
- Ensure endpoint structures and response formats exactly match the naming conventions and data structures defined in your schema’s `ui:props` by the creator of workflow's `data input schema`.

## Content

The frontend plugin provides implementation of `OrchestratorFormApi` (for `orchestratorFormApiRef`) to extend the Workflow execution form for custom provided `ui:widgets`.

## Context

The provided widgets enable forms to incorporate dynamically retrieved data.
This data can be fetched from external HTTP servers, the Backstage API, as well as from other form fields, with all evaluations performed in real time during use.

## SchemaUpdater widget

Referenced as: `"ui:widget": "SchemaUpdater"`.

A headless widget used for fetching snippets of JSON schema and dynamically updating the RJSF form JSON schema on the fly.

Thanks to this component, complex subparts of the form can be changed based on data entered in other fields by the user.

Example of use in workflow's input data schema:

```json
{
  "$id": "classpath:/schemas/myworkflowschema.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  ...
  "properties": {
    "mySchemaUpdater": {
      "type": "string",
      "ui:widget": "SchemaUpdater",
      "ui:props": {
        "fetch:url": "https://service.providing/chunk01"
      }
    },
    "placeholderTwo": {
      "type": "string",
      "title": "This title is used until replaced by any SchemaUpdater"
    },
    "placeholderFour": {
      "type": "string",
      "ui:widget": "hidden"
    }
  }
  ...
}
```

The response of `fetch:url` endpoint is expected to be a JSON document conforming structure defined by the `SchemaChunksResponse` type.

Considering the data-input schema structure above, the response can look like:

```json
{
  "placeholderTwo": {
    "type": "string",
    "title": "This is inputbox supplied by the chunk01 endpoint, backed by a default (non-active) HTML widget"
  },
  "placeholderFour": {
    "type": "string",
    "title": "This is ActiveTextInput ui:widget to test supplied by the chunk01 endpoint",
    "ui:widget": "ActiveTextInput",
    "ui:props": { ... }
  }
}
```

Please note: The response must be a single JSON object whose property names correspond to the identifiers defined in the data-input JSON Schema.

A provided snipped can be of `"type": "object"` and so inject/replace fields for a complex data structure.
Additional `SchemaUpdater` widgets can be instantiated this way as well.

The `SchemaUpdater` widget scans for the identifiers, the top-level property names in the response, and replaces any matching ones with the corresponding values from the response.
Identifiers that do not exist in the current schema are ignored.

Fetching and updating can occur either once or multiple times, depending on the configuration in `ui:props`, particularly the `fetch:retrigger` setting.

You can instantiate multiple `SchemaUpdater` widgets simultaneously. It is up to the endpoints to manage any overlapping responsibilities or potential conflicts.

It is highly recommended that endpoints are implemented as stateless and free from side effects, consistently returning the same response for identical input sets.

### SchmeaUpdater widget ui:props

The widget supports following `ui:props`:

- fetch:url
- fetch:headers
- fetch:method
- fetch:body
- fetch:retrigger

[Check mode details](#content-of-uiprops)

## ActiveTextInput widget

Referenced as: `"ui:widget": "ActiveTextInput"`.

A smart component based on the [@mui/material/TextField](https://mui.com/material-ui/react-text-field/) keeping look&feel with other RJSF-default fields.

### Data fetching

When instantiated, it loads (prefetch) the **default** value using a single HTTP call based on the `fetch:*` from the `ui:props`.

Once fetched the `fetch:response:value` selector is used to pick the default value.
This selector is expected to resolve into a single string.

The data are further re-fetched, if the value of one of the `fetch:retrigger` referenced values is changed.
If the `fetch:retrigger` is omitted, the fetch is issued just once to preload the data.

Because a text input’s default value only applies when the field is initially empty, any changes to the returned value in subsequent requests are ignored if the user has already entered data into that field.

### Data validation

In addition to the AJV validation handled by the RJSF form, an external service can be utilized through the `validate:*` properties via HTTP requests.

If specified, external validation is triggered both upon form submission and when moving to the next step.

The validation is considered successful if an HTTP 200 response is received.

Otherwise, it adds an asynchronous error to the list, typically due to 4xx or 5xx errors.
The error message is derived from the response body which is expected to be in following format:

```json
{
  "myfieldname": [
    "Human readable description of validation",
    "Another validation error for the same field."
  ]
}
```

### Autocomplete

If `fetch:response:autocomplete` selector is provided, it is used to pick-up response data for the autocomplete feature.
The selector is expected to result in an array of strings.

By providing so far typed data in other fields, the autocomplete can provide context aware suggestions.

The `fetch:retrigger` along data so far typed by the user can be optionally used to re-retrieve data for autocomplete.

Example: "fetch:retrigger": ["current.myDataOfAnActiveTextInputField"].

```json
        "myActiveText": {
          "type": "string",
          "title": "Example of ActiveTextInput widget with autocomplete",
          "ui:widget": "ActiveTextInput",
          "ui:props": {
            "fetch:url": "http://my.server/activeTextWhisperer?mydata=$${{current.firstStep.fooTheFirst}}",
            "fetch:response:value": "myresult.foo.default",
            "fetch:response:autocomplete": "bar.something.myautocompleteoptions",
            "fetch:retrigger": ["current.firstStep.fooTheFirst"]
          }
        },

```

### ActiveTextInput widget ui:props

The widget supports following `ui:props`:

- fetch:url
- fetch:headers
- fetch:method
- fetch:body
- fetch:retrigger
- fetch:response:value
- fetch:response:autocomplete
- validate:url
- validate:method
- validate:headers
- validate:body
- validate:retrigger

[Check more details](#content-of-uiprops)

## Content of `ui:props`

A list of particular widgets supported by each widget can be found in its description above.
The behavior of `ui:props` listed below is similar among different components, if supported.

Various selectors (like `fetch:response:*`) are processed by the [jsonata](https://docs.jsonata.org/overview.html) library and so should conform to its [syntax](https://docs.jsonata.org/simple).

### List of widget properties

|    Property of ui:props     |                                                                                                                                                                                                                            Description                                                                                                                                                                                                                             |                        Example value                        |
| :-------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :---------------------------------------------------------: |
|          fetch:url          |                                                                                              The URL to fetch the widget’s data from, can be accompanied by other properties listed below. Can contain ${{...}} templates, i.e. to pass GET request parameters. Check the Backend Proxy chapter for description of behavior for both the absolute and relative URLs.                                                                                               |      `/my.app.config.proxy/v1/$${current.customerId}`       |
|        fetch:headers        |                                                                                                                             HTTP headers of the request. Valid for both the POST and GET. By default, following header is automatically added unless explicitly overridden in the fetch:headers: `"Content-Type": "application/json"`                                                                                                                              |   `{ "Authorization": "Bearer $${{identityApi.token}}"}`    |
|        fetch:method         |                                                                                                                                                                                                              HTTP method to use. The default is GET.                                                                                                                                                                                                               | GET, POST (So far no identified use-case for PUT or DELETE) |
|         fetch:body          |                                                                                                                                                                                                  The body of an HTTP POST request. Not used with the GET method.                                                                                                                                                                                                   |          `{“foo”: “bar $${{identityApi.token}}”}`           |
|       fetch:retrigger       |                                                                                                                                                An array of keys/key families as described in the Backstage API Exposed Parts. If the value referenced by any key from this list is changed, the fetch is triggered.                                                                                                                                                |    `["current.solutionName", "identityApi.profileName"]`    |
| fetch:response:\[YOUR_KEY\] |                                                                                                                           A json selector of data from the fetch-response. There can be any count of the \[YOUR_KEY\] properties, so a single fetch response can be used to retrieve multiple records to be used i.e. by the StaticText                                                                                                                            |               Account.Order.Product.ProductID               |
|    fetch:response:label     |                                                                                                                                                                         Special (well-known) case of the fetch:response:\[YOUR_KEY\] . Used i.e. by the ActiveDropdown to label the items.                                                                                                                                                                         |                                                             |
|    fetch:response:value     |                                                                                                                                                                Like fetch:response:label, but gives i.e. ActiveDropdown item values (not visible to the user but actually used as the field value)                                                                                                                                                                 |                                                             |
| fetch:response:autocomplete |                                                                                                                                                            Special (well-known) case of the fetch:response:\[YOUR_KEY\] . Used for selecting list of strings for autocomplete feature (ActiveTextInput)                                                                                                                                                            |                                                             |
|        validate:url         |                                                                                                                                                                                          Like fetch:url but triggered for validation on form submit, form page transition                                                                                                                                                                                          |                                                             |
|       validate:method       |                                                                                                                                                                                                                      Similar to fetch:method                                                                                                                                                                                                                       |                                                             |
|     validate:retrigger      | An array similar to fetch:retrigger. Force revalidation of the field if a dependency is changed. In the most simple case when just the value of the particular field is listed (sort of \[“current.myField”\], the validation is triggered “on input”, i.e. when the user types a character in ActiveInputBox. The network calls are throttled. No matter if validate:retrigger is used, the validation happens at least on submit or transition to the next page. |                                                             |
|        validate:body        |                                                                                                                                                                                                                       Similar to fetch:body                                                                                                                                                                                                                        |                                                             |
|      validate:headers       |                                                                                                                                                                                                                    Similar to validate:headers                                                                                                                                                                                                                     |                                                             |
|         ui:variant          |                                                                                                                                                                                              So far specific for StaticText widget only. Check the description there.                                                                                                                                                                                              |                                                             |
|           ui:text           |                                                                                                                                                                                              So far specific for StaticText widget only. Check the description there.                                                                                                                                                                                              |                                                             |

### Authentication

To make the `identityApi` working, the [Backstage authentication](https://backstage.io/docs/auth/#sign-in-configuration) needs to be configured.

To use `*AuthApiRef` (e.g. `microsoftAuthApi`), appropriate authentication provider needs to be [configured](https://backstage.io/docs/auth/#configuring-authentication-providers) to make it available for access via the [Utility API](https://backstage.io/docs/auth/#accessing-third-party-resources).

### Backend Proxy

As all widgets and the decorated RJSF form run on the frontend in the browser, making calls to external services leads to several challenges, including CORS limitations and potential firewall blocking.

To mitigate these issues in a production environment, the deployment can be customized after the Orchestrator deployment to set up a [Backstage proxy](https://backstage.io/docs/plugins/proxying/) for each service.

Relative URLs in the data input JSON schema will be automatically prefixed with the Backstage backend URL (including protocol and domain).
Absolute URLs (e.g. including protocol) are used as stated.

Currently, there is no identified need for advanced modifications to the HTTP calls made by the widgets.
However, if such requirements arise in the future, a new endpoint can be added to the existing Orchestrator backend to act as a proxy, enabling additional logic for requests and responses. So far, the existing Backstage proxy mechanism seems to be sufficient.

## Templating and Backstage API Exposed Parts

Values under the `ui:props` can be dynamically composed via `$${{[Key Family].[Key]}}` templates which are evaluated at the time of actual use.

This feature can be useful to compose URLs based on values in any form-fields, to pass tokens via headers, to pass data for validation, to enrich the queries for values provides in other fields or to write conditions for retrigger.

Example:

```json
   "fetch:url": "https://service.providing.data/v1/datafordieldFoo/${{current.bar}}"
```

The `ui:props` templates can dynamically reference different parts of the Backstage API to provide data, such as authentication tokens or values from other form fields entered by the user.

For security reasons, the referenced data selectors are explicitly defined and do not support runtime function evaluation.
They are limited to simple key-value pairs.
The widgets manage waiting for asynchronous promises and chains of functions to retrieve these values internally.

When exposing additional keys in the future, we will consider not only the [frontend-visibility](https://backstage.io/docs/conf/defining/#visibility) but security as well, since a malicious workflow can retrieve configuration of plugins or Backstage, eventually with their secrets.
That’s the reason for listing the exposed keys explicitly.

|                                 Key Family                                  |              Key              |                         Value of at runtime\<br\>(skipping promises for simplicity)                         |
| :-------------------------------------------------------------------------: | :---------------------------: | :---------------------------------------------------------------------------------------------------------: |
|                                   current                                   |  \[whatever property name\]   |                                  Value of other field/property of the form                                  |
|                                 identityApi                                 |             token             |                                     IdentityApi.getCredentials().token                                      |
|                                                                             |         userEntityRef         |                              IdentityApi.getBackstageIdentity().userEntityRef                               |
|                                                                             |         profileEmail          |                                     IdentityApi.getProfileInfo().email                                      |
|                                                                             |          displayName          |                                  IdentityApi.getProfileInfo().displayName                                   |
|                microsoftAuthApi gitlabAuthApi googleAuthApi                 |          openIdToken          | OpenIdConnectApi.getIdToken(undefined /\* defaults \*/) Mind this is not available for Github and Atlassian |
| atlassianAuthApi githubAuthApi microsoftAuthApi gitlabAuthApi googleAuthApi |             token             |                                OAuthApi.getAccessToken(undefined, undefined)                                |
| atlassianAuthApi githubAuthApi microsoftAuthApi gitlabAuthApi googleAuthApi |         profileEmail          |                                 ProfileInfoApi.getProfile(undefined).email                                  |
| atlassianAuthApi githubAuthApi microsoftAuthApi gitlabAuthApi googleAuthApi |          profileName          |                              ProfileInfoApi.getProfile(undefined).displayName                               |
|                                 rjsfConfig                                  | orchestrator.\[whatever key\] |               configApi.getOptionalString(\`${orchestrator.rjsf-widgets.\[whatever key\]}\`)                |

## Retrieving Data from Backstage Catalog

Integration with the Backstage Catalog can be achieved via calling the Catalog REST API, leveraging the fetch:response:\* selectors and the use of the `$${{...}}` templates.

In the future, new widgets wrapping such explicit use case can be added.

## Customization

The recommended approach for introducing customizations or other modifications is to contribute directly to [the library on GitHub](https://github.com/redhat-developer/rhdh-plugins/tree/main/workspaces/orchestrator/plugins/orchestrator-form-widgets).
This ensures your changes are included in upcoming official releases and will get later maintenance.

Alternatively, you can fork the plugin that provides the library and use it as a base for further changes.
**However, you must still comply with the license terms.**
In this scenario, you are responsible for managing updates and fixes, as backward compatibility is not guaranteed for forked versions.

Currently, the Workflow execution RJSF form supports extending only one library at a time, meaning only a single implementation of `orchestratorFormApiRef` is active.
You can fully replace the default implementation with your custom version by undeploying the original.
