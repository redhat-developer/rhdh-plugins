(function() {

  var MSB = 0x80
      , REST = 0x7F
      , MSBALL = ~REST
      , INT = Math.pow(2, 31);

  var _ = require('underscore');
  var protobuf = require('protobufjs');
  var path = require('path');

  var f = require('./functional');
  var utils = require('./utils');

  var logger = utils.logger('codec');

  exports.encodeUByte = f.lift(doEncodeUByte, _.identity);
  exports.encodeVInt = f.lift(doEncodeVInt, _.identity);
  exports.encodeVLong = f.lift(doEncodeVLong, _.identity);
  exports.encodeJSON = f.lift(doEncodeJSON, _.identity);
  exports.encodeBytes = f.lift(doEncodeBytes, _.identity);
  exports.encodeBytesWithLength = f.lift(doEncodeBytesWithLength, _.identity);
  exports.encodeString = f.lift(doEncodeString, _.identity);
  exports.encodeSignedInt = f.lift(doEncodeSignedInt, _.identity);
  exports.encodeProtobuf = f.lift(doEncodeProtobuf, _.identity);
  exports.encodeQuery = f.lift(doEncodeQuery,_.identity);

  exports.decodeUByte = f.lift(doDecodeUByte, _.identity);
  exports.decodeVInt = f.lift(doDecodeVInt, _.identity);
  exports.decodeLong = f.lift(doDecodeLong, _.identity);
  exports.decodeVLong = f.lift(doDecodeVLong, _.identity);
  exports.decodeJSON = f.lift(doDecodeJSON, _.identity);
  exports.decodeFixedBytes = f.lift(doDecodeFixedBytes, _.identity);
  exports.decodeString = f.lift(doDecodeString, _.identity);
  exports.decodeSignedInt = f.lift(doDecodeSignedInt, _.identity);
  exports.decodeVariableBytes = f.lift(doDecodeVariableBytes, _.identity);
  exports.decodeShort = f.lift(doDecodeShort, _.identity);
  exports.decodeProtobuf = f.lift(doDecodeProtobuf, _.identity);
  exports.decodeQuery = f.lift(doDecodeQuery,_.identity);

  exports.lastDecoded = function(values) {
    return values[0];
  };

  exports.allDecoded = function(expectedNumEntries) {
    return function(values) {
      if (values.length < expectedNumEntries) {
        logger.tracef("Not enough to read (not array): %s", values);
        return undefined;
      }

      return values;
    };
  };

  exports.bytesEncoded = function(values, state) {
    // If buffer is too big, slice it up so that it can be sent
    // immediately without any further modifications.
    var bytes = values[values.length - 1];
    if (bytes < state.buf.length)
      state.buf = state.buf.slice(0, bytes);

    return bytes;
  };

  function doEncodeUByte(bytebuf, num) {
    return _.compose(updateEncOffset(bytebuf), checkedWriteUByte(bytebuf))(num);
  }

  function doEncodeVInt(bytebuf, num) {
    return _.compose(updateEncOffset(bytebuf), checkedWriteVInt(bytebuf))(num);
  }

  function doEncodeVLong(bytebuf, num) {
    return _.compose(updateEncOffset(bytebuf), checkedWriteVLong(bytebuf))(num);
  }

  function doEncodeJSON(bytebuf, obj, typeId) {
    return _.compose(updateEncOffset(bytebuf), checkedWriteJSON(bytebuf, typeId))(obj);
  }

  function doEncodeString(bytebuf, obj) {
    return _.compose(updateEncOffset(bytebuf), checkedWriteString(bytebuf))(obj);
  }

  function doEncodeBytes(bytebuf, bytes) {
    return _.compose(updateEncOffset(bytebuf), checkedWriteBytes(bytebuf))(bytes);
  }

  function doEncodeBytesWithLength(bytebuf, bytes) {
    return _.compose(updateEncOffset(bytebuf), checkedWriteBytesWithLength(bytebuf))(bytes);
  }

  function doEncodeSignedInt(bytebuf, num) {
    return _.compose(updateEncOffset(bytebuf), checkedWriteSignedInt(bytebuf), zigZag)(num);
  }

  function doEncodeProtobuf(bytebuf, message, typeId) {
    return doEncodeBytesWithLength(bytebuf,encodeProtobuf(message,typeId));
  }

  function encodeProtobufInstance(root){
    return function(obj){
      return root.encode(obj).finish();
    }
  }

  function encodeProtobuf(message,typeId){
    return _.compose(encodeProtobufInstance(WrappedMessage), createWrappedMessage)(message,typeId);
  }

  function doEncodeQuery(bytebuf,query){
    return doEncodeBytesWithLength(bytebuf,encodeProtobufInstance(Query.QueryRequest)(query));
  }

  function createWrappedMessage(message,typeId){
    var wrappedMessage={};
    if(_.isNumber(message)){
      return f.merge(wrappedMessage,{'wrappedDouble':message});
    }
    if(_.isString(message)){
      return f.merge(wrappedMessage,{'wrappedString':message});
    }
    if(_.isBoolean(message)){
      return f.merge(wrappedMessage,{'wrappedBool':message});
    }
    if(_.isArrayBuffer(message)){
      return f.merge(wrappedMessage,{'wrappedBytes':message});
    }
    if(f.existy(message.$type)){
      var encodedMessage = encodeProtobufInstance(message.$type)(message);
      var messageTypeId = typeId(message.$type.fullName);
      return f.merge(wrappedMessage,{'wrappedMessage':encodedMessage},{'wrappedTypeId':messageTypeId});
    }
    throw new Error("Provide valid data types.");
  }

  function zigZag(num) {
    return (num << 1) ^ (num >> 31);
  }

  var nullCheck = f.validator('must not be null', f.existy);
  var number = f.validator('must be a number', _.isNumber);
  var positiveOrZero = f.validator('must be >= 0', f.greaterThan(-1));
  var intTooBig = f.validator('must be less than 2^32', f.lessThan(Math.pow(2, 32)));
  var shortTooBig = f.validator('must be less than 2^16', f.lessThan(Math.pow(2, 16)));
  var longTooBig = f.validator('must be less than 2^53 (javascript safe integer limitation)',
                               f.lessThan(Math.pow(2, 53)));
  var stringOrNullCheck = f.validator('must be a String or null', stringOrNull);

  function stringOrNull(x) {
    return !f.existy(x) || _.isString(x);
  }

  function checkedWriteUByte(bytebuf) {
    return f.partial1(f.condition1(number, positiveOrZero), uncheckedWriteUByte(bytebuf));
  }

  function checkedWriteVInt(bytebuf) {
    return f.partial1(f.condition1(number, positiveOrZero, intTooBig), uncheckedWriteVNum(bytebuf));
  }

  function checkedWriteVLong(bytebuf) {
    return f.partial1(f.condition1(number, positiveOrZero, longTooBig), uncheckedWriteVNum(bytebuf));
  }

  function checkedWriteJSON(bytebuf, typeId) {
    return f.partial1(f.condition1(nullCheck), uncheckedWriteJSON(bytebuf, typeId));
  }

  function checkedWriteString(bytebuf) {
    return f.partial1(f.condition1(stringOrNullCheck), uncheckedWriteString(bytebuf));
  }

  function checkedWriteBytes(bytebuf) {
    return f.partial1(f.condition1(nullCheck), uncheckedWriteBytes(bytebuf));
  }

  function checkedWriteBytesWithLength(bytebuf) {
    return f.partial1(f.condition1(nullCheck), uncheckedWriteBytesWithLength(bytebuf));
  }

  function checkedWriteSignedInt(bytebuf) {
    return f.partial1(f.condition1(number, intTooBig), uncheckedWriteVNum(bytebuf));
  }

  function updateEncOffset(bytebuf) {
    return function(offset) {
      bytebuf.offset = offset;
      return offset;
    }
  }

  function uncheckedWriteUByte(bytebuf) {
    return function(byte) {
      bytebuf = bytebufOverflowProtect(bytebuf, 1);
      // TODO: We can better control validation, e.g. no boundary check but double size, so try passing noAssert=true
      bytebuf.buf.writeUInt8(byte, bytebuf.offset);
      return bytebuf.offset + 1;
    }
  }

  // TODO: Should create an ByteBuf type and move this logic there
  function bytebufOverflowProtect(bytebuf, maxSize) {
    if (bytebuf.offset + maxSize > bytebuf.buf.length) {
      var length = bytebuf.buf.length * 2;
      while (length < bytebuf.offset + maxSize)
        length = length * 2;

      var tmp = Buffer.alloc(length);
      bytebuf.buf.copy(tmp, 0, 0, bytebuf.buf.length);
      bytebuf.buf = tmp;
      return bytebuf;
    }
    return bytebuf;
  }

  function uncheckedWriteVNum(bytebuf) {
    return function(num) {
      // Resize if not enough space to fit the biggest of var nums.
      // Due to Javascript limitations, the biggest var num is 2 ^ 53 - 1,
      // so at most 8 bytes will be needed.
      bytebuf = bytebufOverflowProtect(bytebuf, 8);

      var localOffset = bytebuf.offset;

      while(num >= INT) {
        bytebuf.buf.writeUInt8((num & 0xFF) | MSB, localOffset++);
        num /= 128
      }
      while(num & MSBALL) {
        bytebuf.buf.writeUInt8((num & 0xFF) | MSB, localOffset++);
        num >>>= 7
      }
      bytebuf.buf.writeUInt8(num | 0, localOffset);

      return localOffset + 1;
    }
  }

  function uncheckedWriteJSON(bytebuf) {
    return function(obj) {
      return uncheckedWriteString(bytebuf)(JSON.stringify(obj));
    }
  }

  function uncheckedWriteString(bytebuf) {
    return function(obj) {
      var stringNumBytes = f.existy(obj) ? Buffer.byteLength(obj) : 0;
      var offsetAfterBytes = doEncodeVInt(bytebuf, stringNumBytes);
      if (stringNumBytes > 0) {
        bytebuf = bytebufOverflowProtect(bytebuf, stringNumBytes);
        return bytebuf.buf.write(obj, offsetAfterBytes) + offsetAfterBytes;
      }
      return offsetAfterBytes;
    }
  }

  function uncheckedWriteBytes(bytebuf) {
    return function(bytes) {
      bytebuf = bytebufOverflowProtect(bytebuf, bytes.length);
      var targetStart = bytebuf.offset;
      bytes.copy(bytebuf.buf, targetStart);
      return targetStart + bytes.length;
    }
  }

  function uncheckedWriteBytesWithLength(bytebuf) {
    return function(bytes) {
      var buffNumBytes = f.existy(bytes) ? Buffer.byteLength(bytes) : 0;
      var offsetAfterBytes = doEncodeVInt(bytebuf, buffNumBytes);
      if (buffNumBytes > 0) {
        bytebuf = bytebufOverflowProtect(bytebuf, bytes.length);
        var targetStart = bytebuf.offset;
        bytes.copy(bytebuf.buf, targetStart);
      }
      return targetStart + buffNumBytes;
    }
  }

  function doDecodeUByte(bytebuf) {
    return uncheckedReadUByte(bytebuf)();
  }

  function doDecodeVInt(bytebuf) {
    return uncheckedReadVNum(bytebuf)();
  }

  function doDecodeVLong(bytebuf) {
    return uncheckedReadVNum(bytebuf)();
  }

  function doDecodeLong(bytebuf) {
    return uncheckedReadLong(bytebuf)();
  }

  function doDecodeJSON(bytebuf) {
    return uncheckedReadJSON(bytebuf);
  }

  function doDecodeFixedBytes(bytebuf, num) {
    return uncheckedReadBytes(bytebuf)(num);
  }

  function doDecodeString(bytebuf) {
    return uncheckedReadString(bytebuf)();
  }

  function doDecodeSignedInt(bytebuf) {
    var num = uncheckedReadVNum(bytebuf)();
    if (!f.existy(num))
      return undefined;
    
    return (num & 1) == 0 ? num >>> 1 : ~(num >>> 1);
  }

  function doDecodeVariableBytes(bytebuf) {
    return _.compose(uncheckedReadBytes(bytebuf), uncheckedReadVNum(bytebuf))();
  }

  function doDecodeShort(bytebuf) {
    return uncheckedReadShort(bytebuf)();
  }

  function doDecodeProtobuf(bytebuf,protostreamTypename,root){
    var wrappedObject = _.compose(decodeProtobufMessage(WrappedMessage),trimBytebuf)(bytebuf);
    return unwrapWrappedMessage(wrappedObject,protostreamTypename,root);
  }

  function unwrapWrappedMessage(wrappedObject,protostreamTypename,root){
    switch(true){
      case _.has(wrappedObject,'wrappedDouble'):
        return wrappedObject.wrappedDouble;
      case _.has(wrappedObject,'wrappedString'):
        return wrappedObject.wrappedString;
      case _.has(wrappedObject,'wrappedBool'):
        return wrappedObject.wrappedBool;
      case _.has(wrappedObject,'wrappedBytes'):
        return wrappedObject.wrappedBytes;
      case _.has(wrappedObject,'wrappedMessage'):
        var messageBytes= wrappedObject.wrappedMessage;
        var protobufRoot = findRootByTypeId(protostreamTypename,root)(wrappedObject.wrappedTypeId);
        return decodeProtobufMessage(protobufRoot)(messageBytes);
    }
  }

  function decodeProtobufMessage(root){
    return function(bytebuf){
      return root.decode(bytebuf);
    }
  }

  function findRootByTypeId(protostreamTypename,root){
    return function(wrappedTypeId){
      return _.compose(root,protostreamTypename)(wrappedTypeId);
    } 
  }

  function trimBytebuf(bytebuf,length){
    if(!f.existy(length)) length = doDecodeVInt(bytebuf);
    var retBuf = bytebuf.buf.slice(bytebuf.offset, bytebuf.offset + length);
    bytebuf.offset += length;
    return retBuf;
  }

  function doDecodeQuery(bytebuf,protostreamTypename,root){
    var queryResponse = decodeProtobufMessage(Query.QueryResponse)(trimBytebuf(bytebuf));
    var queryResults = queryResponse.results;
    var projectionSize = queryResponse.projectionSize;
    return f.greaterThan(0)(projectionSize) ? unwrapQueryWithProj(queryResults,projectionSize) :  unwrapQueryWithoutProj(queryResults,protostreamTypename,root);
  }

  function decodeWrappedBytes(result,protostreamTypename,root){
    return _.compose(f.curry3(unwrapWrappedMessage)(root)(protostreamTypename),decodeProtobufMessage(WrappedMessage))(result.wrappedBytes);
  }

  function unwrapQueryWithoutProj(queryResults,protostreamTypeName,root){
    return queryResults.map(f.curry3(decodeWrappedBytes)(root)(protostreamTypeName));
  }

  function unwrapQueryWithProj(queryResults,projectionSize){
    return _.reduce(queryResults,function(acc,cur,i){
      return ((i%projectionSize) ? acc[acc.length-1].push(_.values(cur)[0]) : acc.push([_.values(cur)[0]])) && acc;
    },[]);
  }

  function uncheckedReadUByte(bytebuf) {
    return function() {
      if (1 > bytebuf.buf.length - bytebuf.offset) {
        logger.tracef('Can not fully read unsigned byte (buffer size is %d, buffer offset %d)',
                      bytebuf.buf.length, bytebuf.offset);
        return undefined;
      }

      return bytebuf.buf.readUInt8(bytebuf.offset++);
    }
  }

  function uncheckedReadVNum(bytebuf) {
    return function() {
      var res = 0, shift  = 0, b;

      do {
        if (1 > bytebuf.buf.length - bytebuf.offset) {
          logger.tracef('Can not fully read unsigned byte (buffer size is %d, buffer offset %d)',
                        bytebuf.buf.length, bytebuf.offset);
          return undefined;
        }

        b = bytebuf.buf.readUInt8(bytebuf.offset++);
        res += shift < 28
            ? (b & REST) << shift
            : (b & REST) * Math.pow(2, shift);
        shift += 7;
      } while (b >= MSB);

      return res
    }
  }

  function uncheckedReadLong(bytebuf) {
    return function() {
      if (8 > bytebuf.buf.length - bytebuf.offset) {
        logger.tracef('Can not fully read 8 bytes (buffer size is %d, buffer offset %d)',
                      bytebuf.buf.length, bytebuf.offset);
        return undefined;
      }

      var low = bytebuf.buf.readInt32BE(bytebuf.offset + 4);
      var n = bytebuf.buf.readInt32BE(bytebuf.offset) * 4294967296.0 + low;
      if (low < 0) n += 4294967296;
      bytebuf.offset = bytebuf.offset + 8;
      return n;
    }
  }

  function uncheckedReadBytes(bytebuf) {
    return function(num) {
      var end = bytebuf.offset + num;
      var bytes = bytebuf.buf.slice(bytebuf.offset, end);
      bytebuf.offset = end;
      return bytes;
    }
  }

  function uncheckedReadJSON(bytebuf) {
    var str = uncheckedReadString(bytebuf)();
    logger.tracef("Read object as string: '%s'", str);
    var obj = _.isEmpty(str) ? {} : JSON.parse(str);
    logger.tracef('Returning JSON object: %s', JSON.stringify(obj));
    return obj;
  }

  function uncheckedReadString(bytebuf) {
    return function() {
      var numBytes = uncheckedReadVNum(bytebuf)();
      if (!f.existy(numBytes))
        return undefined;

      if (numBytes > bytebuf.buf.length - bytebuf.offset) {
        logger.tracef('Can not fully read object with %d bytes (buffer size is %d, buffer offset %d)',
                      numBytes, bytebuf.buf.length, bytebuf.offset);
        return undefined;
      }

      var obj = bytebuf.buf.toString(undefined, bytebuf.offset, bytebuf.offset + numBytes);
      bytebuf.offset = bytebuf.offset + numBytes;
      return obj;
    }
  }

  function uncheckedReadShort(bytebuf) {
    return function() {
      var numBytes = bytebuf.buf.readUInt16BE(bytebuf.offset);
      bytebuf.offset = bytebuf.offset + 2;
      return numBytes;
    }
  }

  var WrappedMessage = (function() {
    var root=protobuf.loadSync(path.join(__dirname+'/protostream/message-wrapping.proto'));

    var wrappedMessage = root.lookupType('org.infinispan.protostream.WrappedMessage');

    return wrappedMessage;
  }());

  var Query = (function() {
    var root=protobuf.loadSync(path.join(__dirname+'/protostream/query.proto'));
    protobuf.loadSync(path.join(__dirname+'/protostream/message-wrapping.proto'),root); //loaded the wrappedMessage.proto to the root
    var QueryRequest = root.lookupType('org.infinispan.query.remote.client.QueryRequest');
    var QueryResponse = root.lookupType('org.infinispan.query.remote.client.QueryResponse');

    return {
      QueryRequest,
      QueryResponse
    };
  }());

}.call(this));
