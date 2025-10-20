module.exports.PacketType = {
  0: "old",
  1: "new"
};

module.exports.OldPacketLengthType = {
  0: "one-octet length",
  1: "two-octet length",
  2: "four-octet length",
  3: "indeterminate length"
};

module.exports.PacketTag = {
  0: "Reserved - a packet tag MUST NOT have this value",
  1: "Public-Key Encrypted Session Key Packet",
  2: "Signature Packet",
  3: "Symmetric-Key Encrypted Session Key Packet",
  4: "One-Pass Signature Packet",
  5: "Secret-Key Packet",
  6: "Public-Key Packet",
  7: "Secret-Subkey Packet",
  8: "Compressed Data Packet",
  9: "Symmetrically Encrypted Data Packet",
  10: "Marker Packet",
  11: "Literal Data Packet",
  12: "Trust Packet",
  13: "User ID Packet",
  14: "Public-Subkey Packet",
  17: "User Attribute Packet",
  18: "Sym.Encrypted and Integrity Protected Data Packet",
  19: "Modification Detection Code Packet",
  60: "Private or Experimental Values",
  61: "Private or Experimental Values",
  62: "Private or Experimental Values",
  63: "Private or Experimental Values"
};

module.exports.PublicKeyAlgorithm = {
  1: "RSA (Encrypt or Sign)",
  2: "RSA Encrypt-Only",
  3: "RSA Sign-Only",
  16: "Elgamal (Encrypt-Only)",
  17: "DSA (Digital Signature Algorithm)",
  18: "Reserved for Elliptic Curve",
  19: "Reserved for ECDSA",
  20: "Reserved (formerly Elgamal Encrypt or Sign)",
  21: "Reserved for Diffie-Hellman (X9.42, as defined for IETF-S/MIME)"
};

module.exports.HashAlgorithm = {
  1: "MD5",
  2: "SHA1",
  3: "RIPEMD160",
  4: "Reserved",
  5: "Reserved",
  6: "Reserved",
  7: "Reserved",
  8: "SHA256",
  9: "SHA384",
  10: "SHA512",
  11: "SHA224"
};

module.exports.SignatureType = {
  0: "Signature of a binary document",
  1: "Signature of a canonical text document",
  2: "Standalone signature",
  16: "Generic certification of a User ID and Public-Key packet",
  17: "Persona certification of a User ID and Public-Key packet",
  18: "Casual certification of a User ID and Public-Key packet",
  19: "Positive certification of a User ID and Public-Key packet",
  24: "Subkey Binding Signature",
  25: "Primary Key Binding Signature",
  31: "Signature directly on a key",
  32: "Key revocation signature",
  40: "Subkey revocation signature",
  48: "Certification revocation signature",
  64: "Timestamp signature",
  80: "Third-Party Confirmation signature"
};

module.exports.SignatureSubpacketType = {
  0: "Reserved",
  1: "Reserved",
  2: "Signature Creation Time",
  3: "Signature Expiration Time",
  4: "Exportable Certification",
  5: "Trust Signature",
  6: "Regular Expression",
  7: "Revocable",
  8: "Reserved",
  9: "Key Expiration Time",
  10: "Placeholder for backward compatibility",
  11: "Preferred Symmetric Algorithms",
  12: "Revocation Key",
  13: "Reserved",
  14: "Reserved",
  15: "Reserved",
  16: "Issuer",
  17: "Reserved",
  18: "Reserved",
  19: "Reserved",
  20: "Notation Data",
  21: "Preferred Hash Algorithms",
  22: "Preferred Compression Algorithms",
  23: "Key Server Preferences",
  24: "Preferred Key Server",
  25: "Primary User ID",
  26: "Policy URI",
  27: "Key Flags",
  28: "Signer's User ID",
  29: "Reason for Revocation",
  30: "Features",
  31: "Signature Target",
  32: "Embedded Signature"
};
