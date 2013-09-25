var fs = require('fs');

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
   /*
   this.JDT = null;
   this.JLR = null;
   */
};

JAM.prototype.readJHR = function(callback){ // (err)
   var _JAM = this;
   if (_JAM.JHR !== null) callback(null);

   fs.readFile(_JAM.echoPath+'.jhr', function (err, data) {
      if (err) callback(err);

      _JAM.JHR = data;
      callback(null);
   });
};

JAM.prototype.readJDX = function(callback){ // (err)
   var _JAM = this;
   if (_JAM.indexStructure !== null) callback(null);

   fs.readFile(_JAM.echoPath+'.jdx', function (err, data) {
      if (err) callback(err);

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

JAM.prototype.clearCache = function(){
   this.JHR = null;
   this.indexStructure = null;
};

JAM.prototype.readAllHeaders = function(callback){ // err, struct
   var _JAM = this;
   _JAM.readJDX(function(err){
      if (err) callback(err);

      _JAM.readJHR(function(err){
         if (err) callback(err);

         var offsetJHR = 0;
         var structure = {
            'FixedHeaderInfoStruct': {},
            'MessageHeaders': []
         };

         // populate FixedHeaderInfoStruct

         structure.FixedHeaderInfoStruct.Signature = new Buffer(4);
         _JAM.JHR.copy(structure.FixedHeaderInfoStruct.Signature, 0, 0, 4);
         offsetJHR += 4;

         structure.FixedHeaderInfoStruct.datecreated =
            _JAM.JHR.readUInt32LE(offsetJHR); //ulong
         offsetJHR += 4;

         structure.FixedHeaderInfoStruct.modcounter =
            _JAM.JHR.readUInt32LE(offsetJHR); //ulong
         offsetJHR += 4;

         structure.FixedHeaderInfoStruct.activemsgs =
            _JAM.JHR.readUInt32LE(offsetJHR); //ulong
         offsetJHR += 4;

         structure.FixedHeaderInfoStruct.passwordcrc =
            _JAM.JHR.readUInt32LE(offsetJHR); //ulong
         offsetJHR += 4;

         structure.FixedHeaderInfoStruct.basemsgnum =
            _JAM.JHR.readUInt32LE(offsetJHR); //ulong
         offsetJHR += 4;

         offsetJHR += 1000; // skip RESERVED 1000 uchar

         var indexLen = _JAM.indexStructure.length;
         for( var indexNum = 0; indexNum < indexLen; indexNum++ ){
            var nextHeader = {};
            offsetJHR = _JAM.indexStructure[indexNum].offset;

            nextHeader.Signature = new Buffer(4);
            _JAM.JHR.copy(nextHeader.Signature, 0, offsetJHR, offsetJHR+4);
            offsetJHR += 4;

            nextHeader.Revision = _JAM.JHR.readUInt16LE(offsetJHR);
            offsetJHR += 2; //ushort
            nextHeader.ReservedWord = _JAM.JHR.readUInt16LE(offsetJHR);
            offsetJHR += 2; //ushort

            nextHeader.SubfieldLen = _JAM.JHR.readUInt32LE(offsetJHR);
            offsetJHR += 4; //ulong
            nextHeader.TimesRead = _JAM.JHR.readUInt32LE(offsetJHR);
            offsetJHR += 4; //ulong
            nextHeader.MSGIDcrc = _JAM.JHR.readUInt32LE(offsetJHR);
            offsetJHR += 4; //ulong
            nextHeader.REPLYcrc = _JAM.JHR.readUInt32LE(offsetJHR);
            offsetJHR += 4; //ulong
            nextHeader.ReplyTo = _JAM.JHR.readUInt32LE(offsetJHR);
            offsetJHR += 4; //ulong
            nextHeader.Reply1st = _JAM.JHR.readUInt32LE(offsetJHR);
            offsetJHR += 4; //ulong
            nextHeader.Replynext = _JAM.JHR.readUInt32LE(offsetJHR);
            offsetJHR += 4; //ulong
            nextHeader.DateWritten = _JAM.JHR.readUInt32LE(offsetJHR);
            offsetJHR += 4; //ulong
            nextHeader.DateReceived = _JAM.JHR.readUInt32LE(offsetJHR);
            offsetJHR += 4; //ulong
            nextHeader.DateProcessed = _JAM.JHR.readUInt32LE(offsetJHR);
            offsetJHR += 4; //ulong
            nextHeader.MessageNumber = _JAM.JHR.readUInt32LE(offsetJHR);
            offsetJHR += 4; //ulong
            nextHeader.Attribute = _JAM.JHR.readUInt32LE(offsetJHR);
            offsetJHR += 4; //ulong
            nextHeader.Attribute2 = _JAM.JHR.readUInt32LE(offsetJHR);
            offsetJHR += 4; //ulong
            nextHeader.Offset = _JAM.JHR.readUInt32LE(offsetJHR);
            offsetJHR += 4; //ulong
            nextHeader.TxtLen = _JAM.JHR.readUInt32LE(offsetJHR);
            offsetJHR += 4; //ulong
            nextHeader.PasswordCRC = _JAM.JHR.readUInt32LE(offsetJHR);
            offsetJHR += 4; //ulong
            nextHeader.Cost = _JAM.JHR.readUInt32LE(offsetJHR);
            offsetJHR += 4; //ulong

            nextHeader.Subfields = [];
            var preSubfields = offsetJHR;
            while( offsetJHR - preSubfields < nextHeader.SubfieldLen ){
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

               nextHeader.Subfields.push( subfield );
            }

            structure.MessageHeaders.push( nextHeader );
         }

         callback(null, structure);
      });
   });
};

module.exports = JAM;