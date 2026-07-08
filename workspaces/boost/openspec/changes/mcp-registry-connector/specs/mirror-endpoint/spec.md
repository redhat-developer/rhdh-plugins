# Mirror Endpoint Configuration

> **Status: Draft** — Pre-implementation specification.

## Description

The MCP Registry connector must support configurable mirror endpoints for air-gapped deployments. When a customer-mirrored registry is configured, the connector must use only that endpoint and make zero outbound requests to the public MCP Registry (`registry.modelcontextprotocol.io`).

This specification covers RHIDP-15317: MCP Registry mirror endpoint and zero-internet validation.

## EXISTING Requirements

None — this is a new productization wrapper around the upstream MCP Registry entity provider (RHDHPLAN-393).

## ADDED Requirements

### Requirement: Configurable Registry Endpoint

**WHEN** the connector is configured with a custom mirror endpoint in app-config:

```yaml
catalog:
  providers:
    mcpRegistry:
      endpoint: https://registry.internal.example.com
```

**THEN** the connector uses the configured mirror endpoint for all registry API requests.

**AND** the connector never falls back to the public registry endpoint (`registry.modelcontextprotocol.io`).

**AND** the connector logs the configured endpoint at startup for observability.

---

**WHEN** the connector is configured without a custom mirror endpoint:

```yaml
catalog:
  providers:
    mcpRegistry: {}
```

**THEN** the connector uses the default public registry endpoint (`registry.modelcontextprotocol.io`).

**AND** the connector logs a warning that no mirror endpoint is configured (for air-gapped environments, this is likely a misconfiguration).

---

**WHEN** the connector is configured with an invalid mirror endpoint URL:

```yaml
catalog:
  providers:
    mcpRegistry:
      endpoint: not-a-valid-url
```

**THEN** the connector fails to start with a clear error message indicating the invalid URL.

**AND** the error message includes the invalid value and remediation steps.

**AND** the connector does not fall back to the public registry endpoint.

---

**WHEN** the connector is configured with a non-HTTPS mirror endpoint:

```yaml
catalog:
  providers:
    mcpRegistry:
      endpoint: http://registry.internal.example.com
```

**THEN** the connector logs a security warning about using an unencrypted endpoint.

**AND** the connector proceeds with the configured HTTP endpoint (customer responsibility for network security).

**AND** the warning message recommends using HTTPS for production deployments.

### Requirement: Zero-Internet Validation

**WHEN** the connector is configured with a mirror endpoint:

```yaml
catalog:
  providers:
    mcpRegistry:
      endpoint: https://registry.internal.example.com
```

**THEN** the integration test validates that zero outbound HTTP requests are made to `registry.modelcontextprotocol.io`.

**AND** the integration test validates that all HTTP requests target the configured mirror endpoint.

**AND** the integration test validates that DNS resolution requests target only the mirror endpoint's domain.

---

**WHEN** the mirror endpoint is unreachable (network error, DNS failure, connection timeout):

**THEN** the connector logs a clear error message indicating the mirror endpoint is unreachable.

**AND** the connector does NOT fall back to the public registry endpoint.

**AND** the error message includes the mirror endpoint URL and network error details.

**AND** the connector retries the mirror endpoint with exponential backoff (max 3 retries, 5s/10s/20s delays).

### Requirement: Endpoint Validation at Startup

**WHEN** the connector starts with a configured mirror endpoint:

**THEN** the connector validates that the endpoint URL is well-formed (scheme://host[:port][/path]).

**AND** the connector validates that the endpoint responds to health check requests (HTTP GET to `/health` or `/`).

**AND** the connector logs the validation result (success or failure).

**AND** if validation fails, the connector logs a warning but proceeds (mirror may be temporarily unreachable).

---

**WHEN** the connector starts without a configured mirror endpoint:

**THEN** the connector skips endpoint validation (default public registry endpoint is assumed reachable).

**AND** the connector logs a warning recommending mirror endpoint configuration for air-gapped deployments.

### Requirement: Mirror Endpoint Configuration Override

**WHEN** the connector is configured with both `endpoint` and environment variable `MCP_REGISTRY_ENDPOINT`:

**THEN** the app-config `endpoint` value takes precedence over the environment variable.

**AND** the connector logs which configuration source was used (app-config vs. environment variable).

---

**WHEN** the connector is configured with only the environment variable `MCP_REGISTRY_ENDPOINT`:

**THEN** the connector uses the environment variable value as the mirror endpoint.

**AND** the connector logs that the endpoint was configured via environment variable.

### Requirement: Prometheus Metrics for Endpoint Usage

**WHEN** the connector makes HTTP requests to the registry endpoint:

**THEN** Prometheus metrics track request count, latency, and error rate per endpoint.

**AND** metrics include labels for endpoint URL, HTTP status code, and request method.

**AND** metrics allow monitoring to differentiate between mirror endpoint and public endpoint usage.

---

**WHEN** the connector is configured with a mirror endpoint but makes requests to the public registry endpoint (bug scenario):

**THEN** Prometheus metrics expose a `mcp_registry_endpoint_violation_total` counter.

**AND** the counter increments for each unintended public endpoint request.

**AND** the connector logs an ERROR-level message for each violation.
