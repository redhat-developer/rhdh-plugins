const concatenate = require("concat-buffers");

const MPI = require("../MPI.js");
const Uint16 = require("../Uint16.js");
const Uint32 = require("../Uint32.js");
const { SignatureType, HashAlgorithm, PublicKeyAlgorithm } = require("../constants.js");
const SubpacketArray = require("./SignatureSubpacket/SubpacketArray.js");

module.exports.parse = function parse(b) {
  let [version, type, alg, hash, hashed1, hashed2] = b;
  let packet = {
    version,
    type,
    type_s: SignatureType[type],
    alg,
    alg_s: PublicKeyAlgorithm[alg],
    hash,
    hash_s: HashAlgorithm[hash],
    hashed: {
      length: Uint16.parse([hashed1, hashed2])
    }
  };

  let i = 6;
  let _hashed = b.slice(i, (i += packet.hashed.length));
  packet.hashed.subpackets = SubpacketArray.parse(_hashed);
  packet.unhashed = {
    length: Uint16.parse([b[i++], b[i++]])
  };
  // packet.unhashed.subpackets = a.b.slice(a.i, (a.i += packet.unhashed.length));
  let _unhashed = b.slice(i, (i += packet.unhashed.length));
  packet.unhashed.subpackets = SubpacketArray.parse(_unhashed);
  packet.left16 = Uint16.parse([b[i++], b[i++]]);
  let _remainder = { b: b.slice(i), i: 0 };
  switch (packet.alg) {
    case 1: {
      packet.mpi = {
        signature: MPI.parse(_remainder)
      };
    }
  }
  return packet;
}

module.exports.serialize = function serialize(packet) {
  let {
    version,
    type,
    alg,
    hash,
    left16,
    hashed: { length: hashedLength },
    unhashed: { length: unhashedLength }
  } = packet;
  let part1 = new Uint8Array([version, type, alg, hash]);

  let part3 = SubpacketArray.serialize(packet.hashed.subpackets);
  let part2 = new Uint8Array(Uint16.serialize(part3.length));

  let part5 = SubpacketArray.serialize(packet.unhashed.subpackets);
  let part4 = new Uint8Array(Uint16.serialize(part5.length));

  let part6 = new Uint8Array(Uint16.serialize(left16));
  let buffers = [part1, part2, part3, part4, part5, part6];
  switch (packet.alg) {
    case 1: {
      buffers.push(MPI.serialize(packet.mpi.signature));
    }
  }
  return concatenate(buffers);
}

module.exports.serializeForHashTrailer = function serializeForHashTrailer(packet) {
  let { version, type, alg, hash } = packet;
  let part2 = SubpacketArray.serialize(packet.hashed.subpackets);
  let hashedLength = part2.length;
  let part1 = new Uint8Array([version, type, alg, hash, ...Uint16.serialize(hashedLength)]);
  let length = part1.length + part2.length;
  let part3 = new Uint8Array([
    4, // version 4
    255, // fixed number
    ...Uint32.serialize(length)
  ]);
  return concatenate([part1, part2, part3]);
}
