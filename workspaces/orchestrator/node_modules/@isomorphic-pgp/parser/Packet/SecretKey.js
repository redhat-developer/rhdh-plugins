const concatenate = require("concat-buffers");
const { select } = require("select-case");

const MPI = require("../MPI.js");
const Uint32 = require("../Uint32.js");
const Uint16 = require("../Uint16.js");
const { PublicKeyAlgorithm } = require("../constants.js");

function checksum16(buffers) {
  let i = 0;
  for (let buffer of buffers) {
    for (let byte of buffer) {
      i = (i + byte) & 0xffff;
    }
  }
  return new Uint8Array([i >> 8, i & 0xff]);
}

module.exports.parse = function parse(b) {
  let [version, c1, c2, c3, c4, alg] = b;
  let creation = Uint32.parse([c1, c2, c3, c4]);
  let packet = {
    version,
    creation,
    alg,
    alg_s: PublicKeyAlgorithm[alg]
  };
  let _remainder = { b: b.slice(6), i: 0 };
  let mpi = select(alg, {
    1: () => ({
      n: MPI.parse(_remainder),
      e: MPI.parse(_remainder)
    })
  });
  let symEncType = _remainder.b[_remainder.i++];
  if (symEncType !== 0) {
    throw new Error("Does not support password-encrypted Private Keys at this time.");
  }
  let checksum = checksum16([_remainder.b.slice(_remainder.i, -2)]);
  switch (alg) {
    case 1: {
      Object.assign(mpi, {
        d: MPI.parse(_remainder),
        p: MPI.parse(_remainder),
        q: MPI.parse(_remainder),
        u: MPI.parse(_remainder)
      });
      break;
    }
  }
  let _checksum = _remainder.b.slice(_remainder.i);
  if (_checksum.length !== 2) throw new Error("Checksum length error");
  if (checksum[0] !== _checksum[0] || checksum[1] !== _checksum[1]) {
    throw new Error("SecretKey.js: Checksum value error");
  }
  packet.mpi = mpi;
  return packet;
}

module.exports.serialize = function serialize(packet) {
  let { version, creation, alg, mpi } = packet;
  let b = new Uint8Array([version, ...Uint32.serialize(creation), alg]);

  let buffers;
  switch (packet.alg) {
    case 1: {
      buffers = [
        b,
        MPI.serialize(mpi.n),
        MPI.serialize(mpi.e),
        new Uint8Array([0]),
        MPI.serialize(mpi.d),
        MPI.serialize(mpi.p),
        MPI.serialize(mpi.q),
        MPI.serialize(mpi.u)
      ];
      let checksum = checksum16(buffers.slice(-4));
      buffers.push(checksum);
      break;
    }
  }
  return concatenate(buffers);
}

module.exports.serializeForHash = function serializeForHash(packet) {
  let buffer = module.exports.serialize(packet);
  let buffers = [new Uint8Array([0x99, ...Uint16.serialize(buffer.length)]), buffer];
  return concatenate(buffers);
}

// NOTE: user must compute and add 'u' to jwk data
module.exports.fromJWK = function fromJWK(jwk, { creation }) {
  let { n, e, d, p, q, u } = jwk;
  return Object.assign({
    version: 4,
    creation,
  }, select(jwk.kty, {
      RSA: () => ({
        alg: 1,
        alg_s: PublicKeyAlgorithm[1],
        mpi: { n, e, d, p, q, u }
      })
    })
  );
}

// Note: output includes the extraneous 'u' parameter
module.exports.toJWK = function toJWK(packet) {
  let {
    alg,
    mpi: { e, n, d, p, q, u }
  } = packet;
  return Object.assign({
    key_ops: ["sign"],
    ext: true,
  }, select(alg, {
      // Note: JWK does not export a 'u' parameter
      1: () => ({ kty: "RSA", alg: "RS1", e, n, d, p, q, u })
    })
  );
}

module.exports.toPublicKey = function toPublicKey(packet) {
  delete packet.mpi.d;
  delete packet.mpi.p;
  delete packet.mpi.q;
  delete packet.mpi.u;
}
