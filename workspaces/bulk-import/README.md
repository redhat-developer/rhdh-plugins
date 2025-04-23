# [Backstage](https://backstage.io)

This is your newly scaffolded Backstage App, Good Luck!

To start the app, run:

```sh
yarn install
yarn start
```

To enable GitHub authentication, set up the following environment variables: `GITHUB_TOKEN`, `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` required in the `app-config.yaml` file, and update `workspaces/bulk-import/examples/org.yaml` L18-L41 using your GitHub id and email as the following:

```yaml
---
apiVersion: backstage.io/v1alpha1
kind: User
metadata:
  name: <your_github_id>
spec:
  profile:
    email: <your_github_email>
  memberOf: [rhdh-ui-test]
---
apiVersion: backstage.io/v1alpha1
kind: Group
metadata:
  name: rhdh-ui-test
  description: The RHDH UI test group
spec:
  type: team
  profile:
    displayName: RHDH UI test
  children: []
  members: [<your_github_id>]
```

To generate knip reports for this app, run:

```sh
yarn backstage-repo-tools knip-reports
```
