/*
 * io.js
 *
 * Provides readers for bit/byte streams (reading) and a byte buffer (writing).
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2011 Google Inc.
 * Copyright(c) 2011 antimatter15
 */

var bitjs = bitjs || {};
bitjs.io = bitjs.io || {};



(function() {

// mask for getting the Nth bit (zero-based)
bitjs.BIT = [   0x01, 0x02, 0x04, 0x08, 
    0x10, 0x20, 0x40, 0x80,
    0x100, 0x200, 0x400, 0x800, 
    0x1000, 0x2000, 0x4000, 0x8000];

// mask for getting N number of bits (0-8)
var BITMASK = [0, 0x01, 0x03, 0x07, 0x0F, 0x1F, 0x3F, 0x7F, 0xFF ];


/**
 * This bit stream peeks and consumes bits out of a binary stream.
 *
 * {ArrayBuffer} ab An ArrayBuffer object or a Uint8Array.
 * {boolean} rtl Whether the stream reads bits from the byte starting
 *     from bit 7 to 0 (true) or bit 0 to 7 (false).
 * {Number} opt_offset The offset into the ArrayBuffer
 * {Number} opt_length The length of this BitStream
 */
bitjs.io.BitStream = function(ab, rtl, opt_offset, opt_length) {
  if (!ab || !ab.toString || ab.toString() !== "[object ArrayBuffer]") {
    throw "Error! BitArray constructed with an invalid ArrayBuffer object";
  }

  var offset = opt_offset || 0;
  var length = opt_length || ab.byteLength;
  this.bytes = new Uint8Array(ab, offset, length);
  this.bytePtr = 0; // tracks which byte we are on
  this.bitPtr = 0; // tracks which bit we are on (can have values 0 through 7)
  this.peekBits = rtl ? this.peekBits_rtl : this.peekBits_ltr;
};

//   byte0      byte1     byte2       byte3
// 7......0 | 7......0 | 7......0 | 7......0
// 
// The bit pointer starts at bit0 of byte0 and moves left until it reaches
// bit7 of byte0, then jumps to bit0 of byte1, etc.
bitjs.io.BitStream.prototype.peekBits_ltr = function(n, movePointers) {
  if (n <= 0 || typeof n != typeof 1) {
    return 0;
  }

  var movePointers = movePointers || false,
    bytePtr = this.bytePtr,
    bitPtr = this.bitPtr,
    result = 0,
    bitsIn = 0,
    bytes = this.bytes;

  // keep going until we have no more bits left to peek at
  // TODO: Consider putting all bits from bytes we will need into a variable and then
  //       shifting/masking it to just extract the bits we want.
  //       This could be considerably faster when reading more than 3 or 4 bits at a time.
  while (n > 0) {
    if (bytePtr >= bytes.length) {
      throw "Error!  Overflowed the bit stream! n=" + n + ", bytePtr=" + bytePtr + ", bytes.length=" +
        bytes.length + ", bitPtr=" + bitPtr;
      return -1;
    }

    var numBitsLeftInThisByte = (8 - bitPtr);
    if (n >= numBitsLeftInThisByte) {
      var mask = (BITMASK[numBitsLeftInThisByte] << bitPtr);
      result |= (((bytes[bytePtr] & mask) >> bitPtr) << bitsIn);

      bytePtr++;
      bitPtr = 0;
      bitsIn += numBitsLeftInThisByte;
      n -= numBitsLeftInThisByte;
    }
    else {
      var mask = (BITMASK[n] << bitPtr);
      result |= (((bytes[bytePtr] & mask) >> bitPtr) << bitsIn);

      bitPtr += n;
      bitsIn += n;
      n = 0;
    }
  }

  if (movePointers) {
    this.bitPtr = bitPtr;
    this.bytePtr = bytePtr;
  }

  return result;
};

//   byte0      byte1     byte2       byte3
// 7......0 | 7......0 | 7......0 | 7......0
// 
// The bit pointer starts at bit7 of byte0 and moves right until it reaches
// bit0 of byte0, then goes to bit7 of byte1, etc.
bitjs.io.BitStream.prototype.peekBits_rtl = function(n, movePointers) {
  if (n <= 0 || typeof n != typeof 1) {
    return 0;
  }

  var movePointers = movePointers || false,
    bytePtr = this.bytePtr,
    bitPtr = this.bitPtr,
    result = 0,
    bytes = this.bytes;

  // keep going until we have no more bits left to peek at
  // TODO: Consider putting all bits from bytes we will need into a variable and then
  //       shifting/masking it to just extract the bits we want.
  //       This could be considerably faster when reading more than 3 or 4 bits at a time.
  while (n > 0) {
  
    if (bytePtr >= bytes.length) {
      throw "Error!  Overflowed the bit stream! n=" + n + ", bytePtr=" + bytePtr + ", bytes.length=" +
        bytes.length + ", bitPtr=" + bitPtr;
      return -1;
    }

    var numBitsLeftInThisByte = (8 - bitPtr);
    if (n >= numBitsLeftInThisByte) {
      result <<= numBitsLeftInThisByte;
      result |= (BITMASK[numBitsLeftInThisByte] & bytes[bytePtr]);
      bytePtr++;
      bitPtr = 0;
      n -= numBitsLeftInThisByte;
    }
    else {
      result <<= n;
      result |= ((bytes[bytePtr] & (BITMASK[n] << (8 - n - bitPtr))) >> (8 - n - bitPtr));

      bitPtr += n;
      n = 0;
    }
  }

  if (movePointers) {
    this.bitPtr = bitPtr;
    this.bytePtr = bytePtr;
  }

  return result;
};

//some voodoo magic
bitjs.io.BitStream.prototype.getBits = function() {
  return (((((this.bytes[this.bytePtr] & 0xff) << 16) +
              ((this.bytes[this.bytePtr+1] & 0xff) << 8) +
              ((this.bytes[this.bytePtr+2] & 0xff))) >>> (8-this.bitPtr)) & 0xffff);
};

bitjs.io.BitStream.prototype.readBits = function(n) {
  return this.peekBits(n, true);
};

// This returns n bytes as a sub-array, advancing the pointer if movePointers
// is true.
// Only use this for uncompressed blocks as this throws away remaining bits in
// the current byte.
bitjs.io.BitStream.prototype.peekBytes = function(n, movePointers) {
  if (n <= 0 || typeof n != typeof 1) {
    return 0;
  }

  // from http://tools.ietf.org/html/rfc1951#page-11
  // "Any bits of input up to the next byte boundary are ignored."
  while (this.bitPtr != 0) {
    this.readBits(1);
  }

  var movePointers = movePointers || false;
  var bytePtr = this.bytePtr,
      bitPtr = this.bitPtr;

  var result = this.bytes.subarray(bytePtr, bytePtr + n);

  if (movePointers) {
    this.bytePtr += n;
  }

  return result;
};

bitjs.io.BitStream.prototype.readBytes = function( n ) {
  return this.peekBytes(n, true);
};


/**
 * This object allows you to peek and consume bytes as numbers and strings
 * out of an ArrayBuffer.
 *
 * This object is much easier to write than the above BitStream since
 * everything is byte-aligned.
 *
 * {ArrayBuffer} ab The ArrayBuffer object.
 * {Number} opt_offset The offset into the ArrayBuffer
 * {Number} opt_length The length of this BitStream
 */
bitjs.io.ByteStream = function(ab, opt_offset, opt_length) {
  var offset = opt_offset || 0;
  var length = opt_length || ab.byteLength;
  this.bytes = new Uint8Array(ab, offset, length);
  this.ptr = 0;
};

// peeks at the next n bytes as an unsigned number but does not advance the pointer
// TODO: This apparently cannot read more than 4 bytes as a number?
bitjs.io.ByteStream.prototype.peekNumber = function( n ) {
  // TODO: return error if n would go past the end of the stream?
  if (n <= 0 || typeof n != typeof 1)
    return -1;

  var result = 0;
  // read from last byte to first byte and roll them in
  var curByte = this.ptr + n - 1;
  while (curByte >= this.ptr) {
    result <<= 8;
    result |= this.bytes[curByte];
    --curByte;
  }
  return result;
};

// returns the next n bytes as an unsigned number (or -1 on error)
// and advances the stream pointer n bytes
bitjs.io.ByteStream.prototype.readNumber = function( n ) {
  var num = this.peekNumber( n );
  this.ptr += n;
  return num;
};

// This returns n bytes as a sub-array, advancing the pointer if movePointers
// is true.
bitjs.io.ByteStream.prototype.peekBytes = function(n, movePointers) {
  if (n <= 0 || typeof n != typeof 1) {
    return 0;
  }

  var result = this.bytes.subarray(this.ptr, this.ptr + n);

  if (movePointers) {
    this.ptr += n;
  }

  return result;
};

bitjs.io.ByteStream.prototype.readBytes = function( n ) {
  return this.peekBytes(n, true);
};
        
// peeks at the next n bytes as a string but does not advance the pointer
bitjs.io.ByteStream.prototype.peekString = function( n ) {
  if (n <= 0 || typeof n != typeof 1) {
    return 0;
  }

  var result = "";
  for (var p = this.ptr, end = this.ptr + n; p < end; ++p) {
    result += String.fromCharCode(this.bytes[p]);
  }
  return result;
};

// returns the next n bytes as a string
// and advances the stream pointer n bytes
bitjs.io.ByteStream.prototype.readString = function(n) {
  var strToReturn = this.peekString(n);
  this.ptr += n;
  return strToReturn;
};


/**
 * A write-only Byte buffer which uses a Uint8 Typed Array as a backing store.
 */
bitjs.io.ByteBuffer = function(numBytes) {
  if (typeof numBytes != typeof 1 || numBytes <= 0) {
    throw "Error! ByteBuffer initialized with '" + numBytes + "'";
  }
  this.data = new Uint8Array(numBytes);
  this.ptr = 0;
};
  
bitjs.io.ByteBuffer.prototype.insertByte = function(b) {
  // TODO: throw if byte is invalid?
  this.data[this.ptr++] = b;
};
  
bitjs.io.ByteBuffer.prototype.insertBytes = function(bytes) {
  // TODO: throw if bytes is invalid?
  this.data.set(bytes, this.ptr);
  this.ptr += bytes.length;
};

})();


if(typeof window !== "undefined"){
   window.bitjs = window.bitjs || {};
}