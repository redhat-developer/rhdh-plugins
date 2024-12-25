# Initial setup



#### How to use the Git Hub identity provider

The `workspaces/orchestrator/app-config.yaml` and the `workspaces/orchestrator/packages/app/src/App.tsx` files contain sufficient configuration to use the Git Hub identity provider.

Feel free to update the `users.yaml` file to match your identity.

To run, additional secrets needs to be provided:

```
export AUTH_GITHUB_CLIENT_ID=...fill
export AUTH_GITHUB_CLIENT_SECRET=...fill

yarn dev
```


#### API Development instruction

Checkout the backstage-plugin

`git clone git@github.com:red-hat-developer-hub/backstage-plugins.git`

If you need to change the OpenAPI spec, edit the [openapi.yaml](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/orchestrator/plugins/orchestrator-common/src/openapi/openapi.yaml) according to your needs and then execute from the project root folder:

`yarn --cwd plugins/orchestrator-common openapi`

This command updates the [generated files](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/orchestrator/plugins/orchestrator-common/src/generated) including API, client and docs.

> NOTE: Do not manually edit auto-generated files

If you add a new component in the spec, then you need to export the generated typescript object [here](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/orchestrator/plugins/orchestrator-common/src/generated/client/api.ts). For example, if you define

```yaml
components:
  schemas:
    Person:
      type: object
      properties:
        name:
          type: string
        surname:
          type: string
```

then

```typescript
export type Person = components['schemas']['Person'];
```

When defining a new endpoint, you have to define the `operationId`.
That `id` is the one that you can use to implement the endpoint logic.

For example, let's assume you add

```yaml
paths:
  /names:
    get:
      operationId: getNames
      description: Get a list of names
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
               type: array
                items:
                  $ref: '#/components/schemas/Person'
```

Then you can implement the endpoint in [router.ts](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/orchestrator/plugins/orchestrator-backend/src/service/router.ts) referring the operationId `getNames`:

```typescript
api.register('getNames', async (_c, _req, res: express.Response, next) => {
  // YOUR LOGIC HERE
  const result: Person[] = [
    { name: 'John', surname: 'Snow' },
    { name: 'John', surname: 'Black' },
  ];

  res.status(200).json(result);
});
```
