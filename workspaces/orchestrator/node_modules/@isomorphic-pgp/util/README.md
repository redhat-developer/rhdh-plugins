# @isomorphic-pgp/util [WORK IN PROGRESS]

## Basic Usage

```js
const { keyId } = require('@isomorphic-pgp/util/keyId.js')

// Can be a public key, private key, or signature.
let message = `-----BEGIN PGP PUBLIC KEY BLOCK-----

mI0EW+OfpwEEALe77ILV9zRL91oGCOdUOreVKfF8ruiC6W0zytuoDTCoqpiqFRxh
3rXVzwuY6/5GLuO2vfW8DzWS6ckRDS5DeOSpdo3N05QsUbdcItWnP3ZNIP0Ty6+x
4pfCEOHOUlTD4+KEBBcs6INtQoSZj/TZpP+zgqqRSTdmjuCkORBZjByZABEBAAG0
LE1yLiBFeGFtcGxlIChUZXN0IEtleSkgPGV4YW1wbGVAZXhhbXBsZS5jb20+iLgE
EwECACIFAlvjn6cCGwMGCwkIBwMCBhUIAgkKCwQWAgMBAh4BAheAAAoJEPLwztil
JhPE1w4EAJZkx8G0wYzvkZp+k5GHOwBQRe//qVP9ujsW2801MRJ93n33XqRVTlq2
W4k+pydv8WbOIIdZZNT9diaR3yDoAYsT+7JYvYg4TKHnA2FRZfQ7RcnPUAUDPmmC
h67cssoijG6M5LGW2Vb9l3eUQ0vp7svT5tpqY86WGi+Kf7pWhY52uI0EW+OfpwEE
AMC82ow4zQ5VZ3dSNZJHsBDOO+y5vCK4Y3i9rgeOKeQ2s9sgNXGSm/KchCaC1n6T
yeriD85++vQT69QL2ZBi0pZEx7H8Ib0M81MDaczu1VtAeeqH3t8briKAnQ5DwlOW
9b/olqkB3DS2ITZglpeIhLFSbPyHvK5LqKeItqETS09xABEBAAGInwQYAQIACQUC
W+OfpwIbDAAKCRDy8M7YpSYTxEe0A/9aKairOlsiX28EP0gF876rsj157/IYFGUV
3niDK0szRi9EO35av7qtd1dNeqtz6uAmcQvu6SR2XSlachFfGLZRVm1no92IFm/v
OJERShiw0E0cDEoG1FCGLmCjoH9sAl69LBkukfIxTII9rzWCBIReXH4J8lY3OPzV
8sLgkhutKg==
=SwUk
-----END PGP PUBLIC KEY BLOCK-----`

// Parse into a JSON representation
let keyid = keyId(openpgptext)
```

## API

- `keyId(openpgptext)`
- `fingerprint(packet)`
