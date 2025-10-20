const concatenate = require("concat-buffers");
const { select } = require("select-case");

const MPI = require("../MPI.js");
const Uint32 = require("../Uint32.js");
const Uint16 = require("../Uint16.js");
const { PublicKeyAlgorithm } = require("../constants.js");

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
  packet.mpi = select(packet.alg, {
    1: () => ({
      n: MPI.parse(_remainder),
      e: MPI.parse(_remainder)
    })
  });
  return packet;
}

module.exports.serialize = function serialize(packet) {
  let { version, creation, alg, mpi } = packet;
  let b = new Uint8Array([version, ...Uint32.serialize(creation), alg]);

  let buffers;
  switch (alg) {
    case 1: {
      buffers = [b, MPI.serialize(mpi.n), MPI.serialize(mpi.e)];
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

module.exports.fromJWK = function fromJWK(jwk, { creation }) {
  return Object.assign({
    version: 4,
    creation,
  }, select(jwk.kty, {
      RSA: () => ({
        alg: 1,
        alg_s: PublicKeyAlgorithm[1],
        mpi: {
          n: jwk.n,
          e: jwk.e
        }
      }),
      default: () => ({})
    })
  );
}

module.exports.toJWK = function toJWK(packet) {
  let {
    alg,
    mpi: { e, n }
  } = packet;
  return Object.assign({
    key_ops: ["verify"],
    ext: true,
  }, select(alg, {
      1: () => ({
        kty: "RSA",
        alg: "RS1",
        e,
        n
      }),
      default: () => ({})
    })
  );
}
