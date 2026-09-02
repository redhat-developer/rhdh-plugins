# DORA Mean Time to Restore

- **Metric ID**: `dora.meanTimeToRestore`
- **Type**: Number
- **Unit**: hours
- **Computation window**: 30 days

Mean Time to Restore measures how quickly service is restored after incidents occur.

The metric computes mean incident recovery time for incidents in the last 30 days.
Only resolved incidents are considered (`resolutionAt` is not `null`).
For each resolved incident, recovery time is `resolutionAt - createdAt` in hours.
The result is: `mean(recoveryHours)`.

If there are no incidents, or only unresolved ones, calculation fails with an error.
If resolved incidents exist but none have a measurable recovery time (for example `resolutionAt` before `createdAt`), calculation fails with an error.

## Default thresholds

Thresholds are applied to the computed value in hours:

- `elite`: `<1`
- `medium`: `1-24`
- `low`: `>24`

Configure thresholds via:

- `scorecard.metricProviders.dora.meanTimeToRestore.thresholds`

## Collectors

DORA module uses [**collectors**](../../../scorecard-backend/docs/collectors.md) - reusable components designed to gather data from various datasources, such as Jira or GitHub. You can create your custom data collector to tailor data collection for your specific setup.

This metric requires [Incidents collector](#incidents-collector).

### Incidents collector

Collects incidents in a time window.

Available incidents collectors:

- `jira:incidents` (default)

For more information on the collector above, see incident collector details in [scorecard-backend-module-jira README](../../../scorecard-backend-module-jira/README.md).

**Important:** This collector requires that you have `@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-jira` installed.

Required entity annotations for the default `jira:incidents` collector:

- `jira/incident-project-key` (preferred), or
- `jira/project-key` (fallback when `jira/incident-project-key` is not set)

Optional incident-only filters:

- `jira/incident-component`
- `jira/incident-label`
- `jira/incident-team`
- `jira/incident-issue-type` (overrides app-config `scorecard.metricProviders.dora.meanTimeToRestore.options.collectors.incidents.input.issueType`; default issue type is `Incident`)

#### Incidents collector contract

If you're implementing a custom _Incidents_ collector, it must adhere to the following contract:

Required input:

- `from: string` (ISO datetime)
- `to: string` (ISO datetime)
- `updatedSince: string` (ISO datetime)

Required output:

- `incidents: Array<{ id: string; createdAt: string; updatedAt: string; resolutionAt: string | null }>`

`createdAt` and `updatedAt` must be valid ISO datetimes.
`resolutionAt` must be `null` for unresolved incidents or a valid ISO datetime for resolved incidents.

Collector-specific extra input fields are allowed, but they do not replace required contract fields.

## Collector configuration

### Use default Jira incidents collector

- Default, no need to provide configuration.

```yaml
scorecard:
  metricProviders:
    dora:
      meanTimeToRestore:
        options:
          collectors:
            incidents:
              id: jira:incidents
              # Optional: override default Incident issue type
              # input:
              #   issueType: ServiceIncident
```

Updating `issueType` in your configuration creates a new data identity and triggers a full 30-day data refresh.

For more details about the `jira:incidents` collector, see the [scorecard-backend-module-jira README](../../../scorecard-backend-module-jira/README.md).

### Use custom incidents collector

```yaml
scorecard:
  metricProviders:
    dora:
      meanTimeToRestore:
        options:
          collectors:
            incidents:
              id: customDatasource:incidents
              input:
                # optional collector-specific extra input
```
