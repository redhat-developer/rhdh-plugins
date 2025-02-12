# [Backstage](https://backstage.io)

This is your newly scaffolded Backstage App, Good Luck!

To start the app, run:

```sh
yarn install
yarn dev
```

To generate knip reports for this app, run:

```sh
yarn backstage-repo-tools knip-reports
```

To test Global Header with Notifications plugin, you need to set up an external service as described in the [Backstage documentation](https://backstage.io/docs/auth/service-to-service-auth/#static-keys-for-plugin-to-plugin-auth) and add configuration of Notifications plugin. For example, you can use the following configuration:

```yaml
backend:
  auth:
    externalAccess:
      - type: static
        options:
          token: ${EXTERNAL_SERVICE_TOKEN}
          subject: cicd-system-completion-events

# notifications plugin config
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
curl -X POST http://localhost:7007/api/notifications -H "Content-Type: application/json" -H "Authorization: Bearer ${EXTERNAL_SERVICE_TOKEN}" -d '{"recipients":{"type":"broadcast"},"payload": {"title": "Title of boradcast message","link": "http://foo.com/bar","severity": "high","topic": "The topic"}}'
```

Then you will get real-time notifications in this dev app.
