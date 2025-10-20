var crypto = require('crypto');
var xor = require('buffer-xor');

exports.XOR = xor;

exports.H = function (algorithm, str) {
    return crypto.createHash(algorithm).update(str).digest();
};

exports.HMAC = function (algorithm, key, str) {
    return crypto.createHmac(algorithm, key).update(str).digest();
};

exports.Hi = function (algorithm, str, salt, iterations) {
    var INT1 = Buffer.from([0, 0, 0, 1], 'binary');
    var ui1 = crypto.createHmac(algorithm, str).update(salt).update(INT1).digest();
    var ui = ui1;
    for (var i = 1; i < iterations; i++) {
        ui1 = exports.HMAC(algorithm, str, ui1);
        ui = exports.XOR(ui, ui1);
    }
    return ui;
};

