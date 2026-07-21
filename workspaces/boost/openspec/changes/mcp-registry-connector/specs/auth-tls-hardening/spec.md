# TLS and Credential Hardening

> **Status: Draft** — Pre-implementation specification.
>
> **Cross-connector dependencies:** RHIDP-15318 is blocked by RHIDP-15265 (endpoint/credential config schema) and RHIDP-15329 (shared CA bundle utility) from RHIDP-15316 (Cross-Connector Shared Infrastructure). The shared `loadCaBundle()` utility and K8s Secret credential patterns must be implemented in RHIDP-15316 before this spec's requirements can be fulfilled.

## Description

The MCP Registry connector must support custom TLS certificate authorities and Kubernetes Secret-based authentication for private/authenticated registries. This enables deployment against mirrored registries with non-public CA certificates and credential-protected endpoints.

This specification covers RHIDP-15318: MCP Registry custom CA bundle and K8s Secret auth.

## EXISTING Requirements

None — this is a new productization wrapper around the upstream MCP Registry entity provider (RHDHPLAN-393).

## ADDED Requirements

### Requirement: Custom CA Bundle from Mounted Path

**WHEN** the connector is configured with a custom CA bundle path:

```yaml
catalog:
  providers:
    mcpRegistry:
      endpoint: https://registry.internal.example.com
      tls:
        caFile: /etc/ssl/certs/custom-ca-bundle.crt
```

**THEN** the connector loads the CA bundle from the specified file path using the shared `loadCaBundle()` utility from RHIDP-15316.

**AND** the connector uses the CA bundle to validate TLS certificates when making HTTPS requests to the registry endpoint.

**AND** the connector enforces TLS certificate validation (`rejectUnauthorized: true`).

**AND** the connector logs the CA bundle path and validation status at startup.

---

**WHEN** the CA bundle file path is invalid or the file does not exist:

**THEN** the connector logs a WARNING-level message indicating the invalid path.

**AND** the connector falls back to the system CA bundle (Node.js default trusted CAs).

**AND** the connector continues operation with system CA bundle (degraded TLS configuration).

**AND** the warning message includes the invalid path and remediation steps.

---

**WHEN** the CA bundle file is unreadable (permissions issue):

**THEN** the connector logs a WARNING-level message indicating the file is unreadable.

**AND** the connector falls back to the system CA bundle.

**AND** the warning message includes the file path and permission error details.

---

**WHEN** the CA bundle file contains malformed PEM data:

**THEN** the connector logs a WARNING-level message indicating the malformed PEM data.

**AND** the connector falls back to the system CA bundle.

**AND** the warning message includes the file path and PEM parsing error details.

### Requirement: Kubernetes Secret-Based Credentials

**WHEN** the connector is configured with a Kubernetes Secret reference for authentication:

```yaml
catalog:
  providers:
    mcpRegistry:
      endpoint: https://registry.internal.example.com
      auth:
        secretRef: mcp-registry-credentials
```

**THEN** the connector reads the Secret from the Kubernetes API using the Backstage Kubernetes client.

**AND** the connector extracts credentials from the Secret data (keys: `username`, `password`, or `token`).

**AND** the connector uses HTTP Basic Auth (username/password) or Bearer token authentication per the Secret contents.

**AND** the connector caches the Secret data with a 5-minute TTL to reduce Kubernetes API load.

---

**WHEN** the Kubernetes Secret does not exist:

**THEN** the connector logs an ERROR-level message indicating the missing Secret.

**AND** the connector fails to start (authentication is required but not available).

**AND** the error message includes the Secret name and namespace.

**AND** the error message includes remediation steps for creating the Secret.

---

**WHEN** the Kubernetes Secret exists but does not contain required keys (`username`/`password` or `token`):

**THEN** the connector logs an ERROR-level message indicating the missing credential keys.

**AND** the connector fails to start.

**AND** the error message includes the Secret name, namespace, and missing keys.

**AND** the error message includes an example Secret manifest with correct keys.

---

**WHEN** the connector uses cached Secret credentials and receives an HTTP 401 Unauthorized response:

**THEN** the connector invalidates the cached Secret data.

**AND** the connector re-fetches the Secret from the Kubernetes API.

**AND** the connector retries the HTTP request with fresh credentials (max 1 retry).

**AND** if the retry fails, the connector logs an ERROR-level message indicating authentication failure.

### Requirement: Per-Connector TLS Configuration

**WHEN** multiple MCP Registry connector instances are configured with different TLS settings:

```yaml
catalog:
  providers:
    mcpRegistryPrimary:
      endpoint: https://registry-primary.internal.example.com
      tls:
        caFile: /etc/ssl/certs/primary-ca-bundle.crt
    mcpRegistrySecondary:
      endpoint: https://registry-secondary.internal.example.com
      tls:
        caFile: /etc/ssl/certs/secondary-ca-bundle.crt
```

**THEN** each connector instance uses its own CA bundle independently.

**AND** TLS validation for `mcpRegistryPrimary` requests uses only the primary CA bundle.

**AND** TLS validation for `mcpRegistrySecondary` requests uses only the secondary CA bundle.

**AND** connector instances do not share CA bundles or TLS configuration state.

### Requirement: TLS Certificate Validation Enforcement

**WHEN** the connector makes HTTPS requests to the registry endpoint:

**THEN** the connector always enforces TLS certificate validation (`rejectUnauthorized: true`).

**AND** the connector does NOT allow disabling TLS validation via configuration.

**AND** the connector logs a FATAL error if TLS validation fails (invalid certificate, expired certificate, hostname mismatch).

**AND** the connector does NOT fall back to HTTP when HTTPS fails.

---

**WHEN** the registry endpoint returns an invalid TLS certificate (self-signed, expired, hostname mismatch):

**THEN** the connector logs an ERROR-level message with certificate validation details.

**AND** the connector does NOT proceed with the request.

**AND** the error message includes the endpoint URL, certificate subject, issuer, and validation failure reason.

**AND** the error message recommends configuring a custom CA bundle if using a private CA.

### Requirement: Shared CA Bundle Utility Integration

**WHEN** the connector loads a custom CA bundle:

**THEN** the connector uses the shared `loadCaBundle()` utility from `@boost/connector-utils` (RHIDP-15316).

**AND** the connector does NOT implement inline CA bundle loading logic.

**AND** the connector benefits from shared error handling, validation, and monitoring.

---

**WHEN** the shared `loadCaBundle()` utility is unavailable (dependency issue):

**THEN** the connector logs a FATAL error indicating the missing dependency.

**AND** the connector fails to start (required infrastructure is unavailable).

**AND** the error message includes the missing package name and version.

### Requirement: Prometheus Metrics for TLS and Auth

**WHEN** the connector validates TLS certificates:

**THEN** Prometheus metrics track TLS validation success and failure rates per endpoint.

**AND** metrics include labels for endpoint URL, validation result (success/failure), and failure reason.

---

**WHEN** the connector authenticates with the registry endpoint using Secret-based credentials:

**THEN** Prometheus metrics track authentication success and failure rates per endpoint.

**AND** metrics include labels for endpoint URL, auth method (basic/bearer), and HTTP status code.

**AND** metrics do NOT include credential values (security).
