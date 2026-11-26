# Testing with the Notifications plugin

The global header includes a notifications icon button
(`gh-component:global-header/notification-button`) when the Backstage
Notifications plugin is installed. Use the steps below to exercise real-time
notifications in a local RHDH / app-defaults development app.

You can configure an external service as described in the
[Backstage documentation](https://backstage.io/docs/auth/service-to-service-auth/#static-keys-for-plugin-to-plugin-auth)
and add Notifications plugin configuration.

For example, put the following into an `app-config.local.yaml`:

```yaml
backend:
  auth:
    externalAccess:
      - type: static
        options:
          token: ${EXTERNAL_SERVICE_TOKEN}
          subject: cicd-system-completion-events
```

You can optionally enable the email notification processor:

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

To send a notification:

```sh
curl -X POST http://localhost:7007/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"recipients":{"type":"broadcast"},"payload": {"title": "Title of broadcast message","link": "http://foo.com/bar","severity": "high","topic": "The topic"}}'
```

Replace `test-token` if you provided a custom external access token.

You should then see real-time notifications in the header notification button.

To hide the default notifications control:

```yaml
app:
  extensions:
    - gh-component:global-header/notification-button:
        disabled: true
```
