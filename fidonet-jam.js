var fs = require('fs');
var extend = require('util')._extend;
var moment = require('moment');
var sb = require('singlebyte');

function getSubfieldTypeFromLoID(LoID){
   /* jshint indent: false */
   switch( LoID ){
      case 0: return 'OADDRESS'; //break;
      case 1: return 'DADDRESS'; //break;
      case 2: return 'SENDERNAME'; //break;
      case 3: return 'RECEIVERNAME'; //break;
      case 4: return 'MSGID'; //break;
      case 5: return 'REPLYID'; //break;
      case 6: return 'SUBJECT'; //break;
      case 7: return 'PID'; //break;
      case 8: return 'TRACE'; //break;
      case 9: return 'ENCLOSEDFILE'; //break;
      case 10: return 'ENCLOSEDFILEWALIAS'; //break;
      case 11: return 'ENCLOSEDFREQ'; //break;
      case 12: return 'ENCLOSEDFILEWCARD'; //break;
      case 13: return 'ENCLOSEDINDIRECTFILE'; //break;
      case 1000: return 'EMBINDAT'; //break;
      case 2000: return 'FTSKLUDGE'; //break;
      case 2001: return 'SEENBY2D'; //break;
      case 2002: return 'PATH2D'; //break;
      case 2003: return 'FLAGS'; //break;
      case 2004: return 'TZUTCINFO'; //break;
      default: return 'UNKNOWN'; //break;
   }
}

var JAM = function(echoPath){
   if (!(this instanceof JAM)) return new JAM(echoPath);

   this.echoPath = echoPath;

   // Buffers:
   this.JHR = null;
   this.indexStructure = null;
   this.JDT = null;
   /*
   this.JLR = null;
   */
};

JAM.prototype.readJHR = function(callback){ // (err)
   var _JAM = this;
   if (_JAM.JHR !== null) return callback(null);

   fs.readFile(_JAM.echoPath+'.jhr', function (err, data) {
      if (err) return callback(err);

      _JAM.JHR = data;
      callback(null);
   });
};

JAM.prototype.readJDT = function(callback){ // (err)
   var _JAM = this;
   if (_JAM.JDT !== null) return callback(null);

   fs.readFile(_JAM.echoPath+'.jdt', function (err, data) {
      if (err) return callback(err);

      _JAM.JDT = data;
      callback(null);
   });
};

JAM.prototype.readJDX = function(callback){ // (err)
   var _JAM = this;
   if (_JAM.indexStructure !== null) return callback(null);

   fs.readFile(_JAM.echoPath+'.jdx', function (err, data) {
      if (err) return callback(err);

      var indexOffset = 0;
      var nextToCRC;  // ulong (4 bytes) 32-bit
      var nextOffset; // ulong (4 bytes) 32-bit
      _JAM.indexStructure = [];
      while( indexOffset + 8 <= data.length ){
         nextToCRC = data.readUInt32LE(indexOffset);
         indexOffset += 4;
         nextOffset = data.readUInt32LE(indexOffset);
         indexOffset += 4;
         if( nextToCRC !== 0xffffffff || nextOffset !== 0xffffffff ){
            _JAM.indexStructure.push({
               'ToCRC':  nextToCRC,
               'offset': nextOffset
            });
         }
      }

      callback(null);
   });
};

JAM.prototype.size = function(){
   if( this.indexStructure === null ){
      return void 0;
   } else {
      return this.indexStructure.length;
   }
};

JAM.prototype.clearCache = function(cache){
   /* jshint indent: false */
   switch(cache){
      case 'header':
      case 'headers':
         this.JHR = null;
      break;
      case 'text':
      case 'texts':
         this.JDT = null;
      break;
      case 'index':
         this.indexStructure = null;
      break;
      default:
         this.JHR = null;
         this.JDT = null;
         this.indexStructure = null;
      break;
   }
};

JAM.prototype.readFixedHeaderInfoStruct = function(callback){ // err, struct
   var _JAM = this;

   _JAM.readJHR(function(err){
      if (err) return callback(err);

      var offsetJHR = 0;
      var FixedHeaderInfoStruct = {};

      FixedHeaderInfoStruct.Signature = new Buffer(4);
      _JAM.JHR.copy(FixedHeaderInfoStruct.Signature, 0, 0, 4);
      offsetJHR += 4;

      FixedHeaderInfoStruct.datecreated =
         _JAM.JHR.readUInt32LE(offsetJHR); //ulong
      offsetJHR += 4;

      FixedHeaderInfoStruct.modcounter =
         _JAM.JHR.readUInt32LE(offsetJHR); //ulong
      offsetJHR += 4;

      FixedHeaderInfoStruct.activemsgs =
         _JAM.JHR.readUInt32LE(offsetJHR); //ulong
      offsetJHR += 4;

      FixedHeaderInfoStruct.passwordcrc =
         _JAM.JHR.readUInt32LE(offsetJHR); //ulong
      offsetJHR += 4;

      FixedHeaderInfoStruct.basemsgnum =
         _JAM.JHR.readUInt32LE(offsetJHR); //ulong
      //offsetJHR += 4;

      callback(null, FixedHeaderInfoStruct);
   });
};

JAM.prototype.readHeader = function(number, callback){ // err, struct
   var _JAM = this;
   if( number <= 0 ){
      return callback(new Error(this.errors.NOT_A_POSITIVE));
   }

   _JAM.readJDX(function(err){
      if (err) return callback(err);
      if( number > _JAM.size() ){
         return callback(new Error(this.errors.TOO_BIG));
      }

      _JAM.readJHR(function(err){
         if (err) return callback(err);

         var header = {};
         var offsetJHR = _JAM.indexStructure[number-1].offset;

         header.Signature = new Buffer(4);
         _JAM.JHR.copy(header.Signature, 0, offsetJHR, offsetJHR+4);
         offsetJHR += 4;

         header.Revision = _JAM.JHR.readUInt16LE(offsetJHR);
         offsetJHR += 2; //ushort
         header.ReservedWord = _JAM.JHR.readUInt16LE(offsetJHR);
         offsetJHR += 2; //ushort

         header.SubfieldLen = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.TimesRead = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.MSGIDcrc = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.REPLYcrc = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.ReplyTo = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.Reply1st = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.Replynext = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.DateWritten = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.DateReceived = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.DateProcessed = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.MessageNumber = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.Attribute = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.Attribute2 = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.Offset = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.TxtLen = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.PasswordCRC = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong
         header.Cost = _JAM.JHR.readUInt32LE(offsetJHR);
         offsetJHR += 4; //ulong

         header.Subfields = [];
         var preSubfields = offsetJHR;
         while( offsetJHR - preSubfields < header.SubfieldLen ){
            var subfield = {};

            subfield.LoID = _JAM.JHR.readUInt16LE(offsetJHR);
            offsetJHR += 2; //ushort
            subfield.HiID = _JAM.JHR.readUInt16LE(offsetJHR);
            offsetJHR += 2; //ushort
            subfield.datlen = _JAM.JHR.readUInt32LE(offsetJHR);
            offsetJHR += 4; //ulong

            subfield.Buffer = new Buffer(subfield.datlen);
            _JAM.JHR.copy(
               subfield.Buffer, 0, offsetJHR, offsetJHR+subfield.datlen
            );
            offsetJHR += subfield.datlen;

            subfield.type = getSubfieldTypeFromLoID( subfield.LoID );

            header.Subfields.push( subfield );
         }

         callback(null, header );
      });
   });
};

var normalizedEncoding = function(encoding){
   /* jshint indent: false */
   switch(encoding){
      case '+7_fido':    return 'cp866';   //break
      case '+7':         return 'cp866';   //break
      case 'iso-8859-1': return 'latin-1'; //break
      case 'utf-8':      return 'utf8';    //break
      default:           return encoding;  //break
   }
};

JAM.prototype.encodingFromHeader = function(header){
   var fields = header.Subfields;
   var kludges = [];
   var i;
   for( i = 0; i < fields.length; i++ ){
      if( fields[i].LoID === 2000 ){ // FTSKLUDGE
         kludges.push( fields[i].Buffer.toString('ascii').toLowerCase() );
      }
   }
   for( i = 0; i < kludges.length; i++ ){
      var parts = /^(chrs|charset):\s*(\S+)(\s.*)?$/.exec(kludges[i]);
      if( parts !== null ){
         var chrs = parts[2];
         if( chrs === 'ibmpc' ){
            for( var j = 0; j < kludges.length; j++ ){
               parts = /^codepage:\s*(\S+)(\s.*)?$/.exec(kludges[i]);
               if( parts !== null ){
                  chrs = parts[1];
                  return normalizedEncoding(chrs);
               }
            }
         }
         return normalizedEncoding(chrs);
      }
   }
   return null;
};

var decodeDefaults = {
   defaultEncoding: 'cp866',
   useDefaultIfUnknown: true
};

JAM.prototype.decodeHeader = function(header, decodeOptions){
   /* jshint indent: false */
   var options = extend(decodeDefaults, decodeOptions);

   var encoding = this.encodingFromHeader(header);
   if( encoding === null ) encoding = options.defaultEncoding;
   if( !sb.isEncoding(encoding) && options.useDefaultIfUnknown ){
      encoding = options.defaultEncoding;
   }
   if( !sb.isEncoding(encoding) ){
      throw new Error(this.errors.UNKNOWN_ENCODING);
   }

   var decoded = {};
   decoded.origTime = moment.utc(''+header.DateWritten,   'X').toArray();
   decoded.origTime[1]++;
   decoded.procTime = moment.utc(''+header.DateProcessed, 'X').toArray();
   decoded.procTime[1]++;
   decoded.kludges = [];

   for( var i = 0; i < header.Subfields.length; i++ ){
      switch( header.Subfields[i].LoID ){
         case 0: // OADDRESS
            decoded.origAddr = sb.bufToStr(
               header.Subfields[i].Buffer, encoding
            );
         break;
         case 1: // DADDRESS
            decoded.toAddr = sb.bufToStr(
               header.Subfields[i].Buffer, encoding
            );
         break;
         case 2: // SENDERNAME
            decoded.from = sb.bufToStr(
               header.Subfields[i].Buffer, encoding
            );
         break;
         case 3: // RECEIVERNAME
            decoded.to = sb.bufToStr(
               header.Subfields[i].Buffer, encoding
            );
         break;
         case 4: // MSGID
            decoded.msgid = sb.bufToStr(
               header.Subfields[i].Buffer, encoding
            );
         break;
         case 5: // REPLYID
            decoded.replyid = sb.bufToStr(
               header.Subfields[i].Buffer, encoding
            );
         break;
         case 6: // SUBJECT
            decoded.subj = sb.bufToStr(
               header.Subfields[i].Buffer, encoding
            );
         break;
         case 7: // PID
            decoded.pid = sb.bufToStr(
               header.Subfields[i].Buffer, encoding
            );
         break;
         /*
         case 8: return 'TRACE'; //break;
         case 9: return 'ENCLOSEDFILE'; //break;
         case 10: return 'ENCLOSEDFILEWALIAS'; //break;
         case 11: return 'ENCLOSEDFREQ'; //break;
         case 12: return 'ENCLOSEDFILEWCARD'; //break;
         case 13: return 'ENCLOSEDINDIRECTFILE'; //break;
         case 1000: return 'EMBINDAT'; //break;
         */
         case 2000: // FTSKLUDGE
            decoded.kludges.push(sb.bufToStr(
               header.Subfields[i].Buffer, encoding
            ));
         break;
         case 2001: // SEENBY2D
            decoded.seenby = sb.bufToStr(
               header.Subfields[i].Buffer, encoding
            );
         break;
         case 2002: // PATH2D
            decoded.path = sb.bufToStr(
               header.Subfields[i].Buffer, encoding
            );
         break;
         /*
         case 2003: return 'FLAGS'; //break;
         */
         case 2004: // TZUTCINFO
            decoded.timezone = sb.bufToStr(
               header.Subfields[i].Buffer, encoding
            );
         break;
      }
   }
   return decoded;
};

JAM.prototype.decodeMessage = function(header, decodeOptions, callback){
   if(typeof callback === 'undefined' && typeof decodeOptions === 'function'){
      callback = decodeOptions;
      decodeOptions = void 0;
   }
   var _JAM = this;

   var options = extend(decodeDefaults, decodeOptions);

   var encoding = _JAM.encodingFromHeader(header);
   if( encoding === null ) encoding = options.defaultEncoding;
   if( !sb.isEncoding(encoding) && options.useDefaultIfUnknown ){
      encoding = options.defaultEncoding;
   }
   if( !sb.isEncoding(encoding) ){
      return callback(new Error(this.errors.UNKNOWN_ENCODING));
   }

   _JAM.readJDT(function(err){
      if (err) return callback(err);

      callback(null, sb.bufToStr(
         _JAM.JDT, encoding, header.Offset, header.Offset + header.TxtLen
      ).replace(/\r/g, '\n'));
   });
};

JAM.prototype.readAllHeaders = function(callback){ // err, struct
   var _JAM = this;
   _JAM.readJDX(function(err){
      if (err) return callback(err);

      _JAM.readJHR(function(err){
         if (err) return callback(err);

         _JAM.readFixedHeaderInfoStruct(function(err, FixedHeaderInfoStruct){
            if (err) return callback(err);

            var structure = {
               'FixedHeaderInfoStruct': FixedHeaderInfoStruct,
               'MessageHeaders': []
            };
            var nextHeaderNumber = 0;
            var baseSize = _JAM.size();

            var nextStep;
            if( typeof setImmediate !== 'undefined' ){
               nextStep = setImmediate;
            } else {
               nextStep = process.nextTick;
            }

            var nextHeaderProcessor = function(){
               if( nextHeaderNumber >= baseSize ){
                  // all headers are processed
                  return callback(null, structure);
               }
               // process the next header
               nextHeaderNumber++;
               _JAM.readHeader(nextHeaderNumber, function(err, nextHeader){
                  if(err) return callback(err);

                  structure.MessageHeaders.push( nextHeader );
                  nextStep(nextHeaderProcessor);
               });
            };

            nextHeaderProcessor();
         });
      });
   });
};

JAM.prototype.errors = {
   NOT_A_POSITIVE: "The message's number must be positive!",
   TOO_BIG: "The message's number exceed the message base's size!",
   UNKNOWN_ENCODING: "Unknown encoding!"
};

module.exports = JAM;