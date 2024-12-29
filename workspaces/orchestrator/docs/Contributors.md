## How to use the Git Hub identity provider

The `workspaces/orchestrator/app-config.yaml` and the `workspaces/orchestrator/packages/app/src/App.tsx` files contain sufficient configuration to use the Git Hub identity provider.

Follow these steps to login to backstage using your github account:

### Create a Github OAuth App

Go to your Github account -> Setting -> Developer settings -> OAuth Apps -> New OAuth App
Enter a name, enter http://localhost:3000 to Homepage URL and http://localhost:7007/api/auth/github/handler/frame to Authorization callback URL and click on Register applicatdion.

### Update backstage user entity

Update [users.yaml](../users.yaml) to match you Github account. Put your github username metadata.name field, and you github email in spec.profile.email field.

### Setup environment variables

```
export AUTH_GITHUB_CLIENT_ID=...fill from OAuth App client ID
export AUTH_GITHUB_CLIENT_SECRET=...fill from OAuth App client secret

yarn dev
```

#### API Development instruction

If you need to change the OpenAPI spec, edit the [openapi.yaml](../plugins/orchestrator-common/src/openapi/openapi.yaml) according to your needs.
After you update the spec, run:

`yarn --cwd plugins/orchestrator-common openapi:generate`

This command updates the [generated files](../plugins/orchestrator-common/src/generated/) including API, client and docs.

> NOTE: Do not manually edit auto-generated files

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
