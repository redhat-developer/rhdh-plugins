# Audit Logs

The orchestrator backend has audit logs for all incoming requests.

## Overview

Audit logging provides a complete record of all API requests made to the orchestrator backend, including:

- Request timestamps
- User information
- API endpoints accessed
- Request parameters
- Response status codes
- Error details (when applicable)

## Configuration

Audit logs are automatically enabled for all orchestrator backend endpoints. The logs follow the standard RHDH audit logging format and configuration.

## Log Format

Audit logs include the following information:

- **Timestamp**: When the request was made
- **User**: Identity of the requesting user
- **Endpoint**: The API endpoint that was called
- **Method**: HTTP method (GET, POST, PUT, DELETE)
- **Parameters**: Request parameters and body (sensitive data is masked)
- **Status**: HTTP response status code
- **Duration**: Time taken to process the request

## Storage and Access

For information about configuring audit log storage and access in Red Hat Developer Hub, please refer to:

- [Red Hat Developer Hub Audit Logs Documentation](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.6/html/audit_logs_in_red_hat_developer_hub/index)
- [OpenShift Log Storage Documentation](https://docs.openshift.com/container-platform/4.15/observability/logging/log_storage/about-log-storage.html)

## Security Considerations

- Sensitive information such as passwords and tokens are automatically masked in audit logs
- Audit logs should be stored securely and access should be restricted to authorized personnel
- Regular log rotation and archival policies should be implemented
- Monitor audit logs for unusual access patterns or potential security incidents

## Compliance

Audit logs help meet compliance requirements by providing:

- Complete audit trail of all system access
- User accountability and traceability
- Evidence of data access and modifications
- Security event monitoring capabilities
