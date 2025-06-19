# Global header demo application

This is a scaffolded Backstage app to test the Global header plugin.

To start the app, run:

```sh
yarn install
yarn start
```

To generate knip reports for this app, run:

```sh
yarn backstage-repo-tools knip-reports
```

## Notifications plugin

To test Global Header with Notifications plugin the notitcation plugin is added and preconfigured.

You can configure your an external service as described in the [Backstage documentation](https://backstage.io/docs/auth/service-to-service-auth/#static-keys-for-plugin-to-plugin-auth) and add configuration of Notifications plugin.

For example, you can use the following configuration into an `app-config.local.yaml`:

```yaml
backend:
  auth:
    externalAccess:
      - type: static
        options:
          token: ${EXTERNAL_SERVICE_TOKEN}
          subject: cicd-system-completion-events
```

You can optional enable the email notification processor with a configuration like this:

```yaml
notifications:
  processors:
    email:
      transportConfig:
        transport: smtp
        hostname: smtp.gmail.com
        port: 587
        username: test@gmail.com
        password: test
      sender: test@gmail.com
      broadcastConfig:
        receiver: 'users'
```

To send notifications, you can use the following command:

```sh
curl -X POST http://localhost:7007/api/notifications -H "Content-Type: application/json" -H "Authorization: Bearer test-token" -d '{"recipients":{"type":"broadcast"},"payload": {"title": "Title of boradcast message","link": "http://foo.com/bar","severity": "high","topic": "The topic"}}'
```

Replace `test-token` if you provided a custom external access token.

Then you will get real-time notifications in this dev app.
