# RHDH agentic chat catalog model

## When to use `agent-rhdh-chat`

Set `spec.type` to `agent-rhdh-chat` when you want users to interact with an
agent through the built-in agentic chat experience in Red Hat Developer Hub
(RHDH). For example, use it to describe a developer support agent that helps
users find internal documentation from chat.

This package defines and validates the `AiResource` catalog entity for that
experience. The RHDH deployment needs the agentic chat runtime to run the
agent.

## Define an agent

This example configures a Developer Support agent for questions such as
“Where can I find the guide for deploying my service to staging?” The agent
searches TechDocs and returns a short answer with links to the relevant guides.

```yaml
apiVersion: backstage.io/v1alpha1
kind: AiResource
metadata:
  name: developer-support
  title: Developer Support
  description: Helps developers find internal guides and runbooks in TechDocs.
spec:
  type: agent-rhdh-chat
  owner: group:default/ai-platform
  instructions: |
    Search TechDocs for guides and runbooks relevant to the user's question.
    Give a short answer and include links to the pages you used.
    If you cannot find a relevant page, ask for the service name or team
    and return an empty sources list.
  inferenceProvider:
    name: openai
    model: gpt-4o
    modelConfig:
      temperature: 0.2
      maxTokens: 1024
  tools:
    - search-techdocs
  outputSchema:
    type: object
    required: [answer, sources]
    properties:
      answer:
        type: string
      sources:
        type: array
        items:
          type: string
          format: uri
  executionMode: subprocess
```

Under `spec`, only `type` and `owner` are required.

To select a model for this agent, set `spec.inferenceProvider` with both
`name` and `model`. Its optional `modelConfig` supports `temperature` and
`maxTokens`. The entity also supports optional `spec.tools` for allowed tool
references and `spec.outputSchema` for the response format.

### Execution mode

`spec.executionMode` controls the agent execution mode during runtime.

- `in-process` runs the agent inside the same process.
- `subprocess` runs the agent in a separate child process.
- `sandbox` runs the agent under a sandbox profile predefined by an
  administrator. The profile determines the restrictions that apply to the
  agent.
