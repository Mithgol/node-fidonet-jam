The **Fidonet JAM** module is able to read headers and texts of Fidonet echomail messages from JAM message bases according to [the Joaquim-Andrew-Mats Message Base Proposal.](JAM.txt)

This module is written in JavaScript and requires [Node.js](http://nodejs.org/) to run. (Node.js version 0.10.x or 0.12.x is recommended. The latest stable [io.js](https://iojs.org/) is fine too.)

This repository does also contain draft standards of **Fidonet avatars** for the Fidonet Global Hypertext Interface project.

* The [`avatar.txt`](avatar.txt) file is the English version of the draft.

* The [`avatar.rus.txt`](avatar.rus.txt) file is the Russian version of the draft. This version is provided in UTF-8 (for the diffs to look reasonably good on GitHub and other git tools) and thus should be converted to CP866 encoding (common in Russian Fidonet) before posting to Fidonet.

This module is a reference implementation of these standards, though incomplete (a support for section 8 has never been implemented).

## Installing Fidonet JAM

[![(npm package version)](https://nodei.co/npm/fidonet-jam.png?downloads=true)](https://npmjs.org/package/fidonet-jam)  [![(a histogram of downloads)](https://nodei.co/npm-dl/fidonet-jam.png?months=3)](https://npmjs.org/package/fidonet-jam)

* Latest packaged version: `npm install fidonet-jam`

* Latest githubbed version: `npm install https://github.com/Mithgol/node-fidonet-jam/tarball/master`

The npm package does not contain the tests, they're published on GitHub only.

You may visit https://github.com/Mithgol/node-fidonet-jam#readme occasionally to read the latest `README` because the package's version is not planned to grow after changes when they happen in `README` only. (And `npm publish --force` is [forbidden](http://blog.npmjs.org/post/77758351673/no-more-npm-publish-f) nowadays.)

## Using Fidonet JAM

When you `require()` the installed module, you get a constructor that uses the path to a JAM echo base as its parameter:

```js
var JAM = require('fidonet-jam');
var echobase = JAM(basePath);
```

Names of echo base files are generated by appending lowercase extensions (`.jhr`, `.jdt`, `.jdx`, `.jlr`) to the given path.

The constructed object has the following methods:

### crc32(string, options)

JAM data structures sometimes use CRC-32 hashes of strings. These hashes are calculated with the following two nuances:

* before CRC-32 is calculated, the given string is converted to lowercase (where the lowercasing function converts `A-Z` to `a-z` only);

* after CRC-32 is calculated, a bit inversion is applied. For example, the resulting CRC-32 of an empty string is `4294967295` (the maximum 32-bit number) instead of `0` (zero).

This method returns JAM CRC-32 of the given string. (The returned value may then be used for comparison with CRC-32-containing fields of JAM data structures.)

The optional `options` parameter is an object with two optional properties:

* `keepCase` property, if it's present and `true`, dictates that the case of the given string is not altered before CRC-32 is calculated;

* `encoding` property (it defaults to `'utf8'`) specifies how the given `string` should be encoded to a Node.js Buffer before its CRC32 hash is calculated. (The given encoding has to be a known encoding of [Node.js Buffers](http://nodejs.org/docs/latest/api/buffer.html#buffer_buffer) or known to the [`iconv-lite`](https://github.com/ashtuchkin/iconv-lite) module.)

For simplicity, `true` value of the `options` parameter may be given instead of the `{keepCase: true}` object.

### readJHR(callback)

Asynchronously reads the `.jhr` file (JAM headers) into memory, populating the object's `.JHR` property with a raw Buffer. Then calls `callback(error)`.

The data is cached. Subsequent calls to `.readJHR` won't repeat the reading operation unless the object's `.JHR` property is `null`.

### readJDT(callback)

Asynchronously reads the `.jdt` file (JAM message texts) into memory, populating the object's `.JDT` property with a raw Buffer. Then calls `callback(error)`.

The data is cached. Subsequent calls to `.readJDT` won't repeat the reading operation unless the object's `.JDT` property is `null`.

### readJLR(callback)

Asynchronously reads the `.jlr` file (JAM lastread storage) into memory and parses it, populating the object's `.lastreads` property with an array of objects with the following properties:

* `UserCRC` — JAM CRC-32 of the lowercase (`A-Z`→`a-z` only) user name.

* `UserID` — Unique ID of that user. (Some echomail readers, such as GoldED+ and GoldED-NSF, use a duplicate of `UserCRC` as `UserID`.)

* `LastRead` — Number of the message last read by that user.

* `HighRead` — Highest of the numbers of the messages read by that user.

Then `callback(error)` is called.

The data is cached. Subsequent calls to `.readJLR` won't repeat the reading operation unless the object's `.lastreads` property is `null`.

Both `LastRead` and `HighRead` use internal numbering of the messages (e.g. equal to the `MessageNumber` property of the corresponding message's header).

### readJDX(callback)

Asynchronously reads the `.jdx` file (JAM index) into memory and parses that index, populating the object's `.indexStructure` property with an array of objects with the following properties:

* `ToCRC` — JAM CRC-32 of the lowercase (`A-Z`→`a-z` only) name of the message's recipient.

* `offset` — the physical offset of the message's header in the `.jhr` (header) file.

* `MessageNum0` — a message's rebased (zero-based) internal number. Starts from `0` (zero), i.e. `.indexStructure[0].MessageNum0 === 0`. The `basemsgnum` value from the “JAM fixed header” (see below) should be added to generate the actual internal number of a message. Deleted messages leave gaps in that numbering (such as `.indexStructure[i].MessageNum0 > i` and `.indexStructure[i].MessageNum0 > .indexStructure[i-1].MessageNum0 + 1`) until the message base is packed by an echoprocessor.

Then `callback(error)` is called.

The data is cached. Subsequent calls to `.readJDX` won't repeat the reading operation unless the object's `.indexStructure` property is `null`.

### size()

Returns `.indexStructure.length` property (or `undefined` when `.indexStructure` is `null`).

### clearCache(cache)

Writes `null` to the `JHR`, `fixedHeader`, `JDT`, `lastreads` and `indexStructure` properties of the object.

The memory cache becomes empty and thus the next `readJHR`, `readJDT`, `readJLR` or `readJDX` will read the data from the disk again.

The behaviour can be altered by passing a string `cache` parameter:

* `cache === 'header'` (or `'headers'`) — only `JHR` and `fixedHeader` become `null`;

* `cache === 'text'` (or `'texts'`) — only `JDT` becomes `null`;

* `cache === 'lastread'` (or `'lastreads'`) — only `lastreads` becomes `null`;

* `cache === 'index'` — only `indexStructure` becomes `null`;

* any other value (or just `.clearCache()` without parameters) — all of the above properties become `null`.

### readFixedHeaderInfoStruct(callback)

Asynchronously reads the “JAM fixed header” of the echo base (calling `.readJHR` method in the process) and stores it in the object's `.fixedHeader` property. Then calls `callback(error)`.

That “JAM fixed header” is an object with the following properties:

* `Signature` is a four-bytes Buffer (should contain `'JAM\0'`).

* `datecreated` is the (32 bit) creation date of the base.

* `modcounter` is the (32 bit) counter that (according to the JAM specifications) must be incremented and updated on disk each time an application modifies the contents of the message base. (When it reaches `0xffffffff`, it wraps to zero.)

* `activemsgs` is the (32 bit) number of active (i.e. not deleted) messages in the base.

* `passwordcrc` is the (32 bit) JAM CRC-32 of a password to access.

* `basemsgnum` is the (32 bit) lowest message number in the index file.

According to the JAM specifications, the `basemsgnum` property determines the lowest message number in the index file. The value for this field is one (`1`) when a message area is first created. By using this property, a message area can be packed (when deleted messages are removed) without renumbering it. For example, if BaseMsgNum contains `500`, then the first index record points to message number 500. This property has to be taken into account when an application calculates the next available message number (for creating new messages) as well as the highest and lowest message number in a message area.

The contents of “JAM fixed header” are cached. Subsequent calls to `.readJHR` won't happen unless the object's `.fixedHeader` property is `null`.

### indexLastRead(username, [encoding], callback)

Finds out which message was last read by the given user, calling `.readJLR` and (probably) `.readFixedHeaderInfoStruct` and `.readJDX` in the process.

The user is designated by a `username` string and optional `encoding` string (it defaults to `'utf8'`) containing the encoding that is applied to the given `username` before CRC-32 calculations. That encoding, if given, has to be a known encoding of [Node.js Buffers](http://nodejs.org/docs/latest/api/buffer.html#buffer_buffer) or known to the [`iconv-lite`](https://github.com/ashtuchkin/iconv-lite) module. It becomes necessary only if `username` is non-Latin **and** the `.jlr` file (JAM lastread storage) is generated by (or shared with) some Fidonet application that does not use UTF-8.

Afterwards `callback(error, index)` is called where `index` is the (zero-based) position of that last read message in the object's `.indexStructure` array. (However, `index` becomes `null` if the last read message is not known.)

That's done in a couple of steps:

* After `.readJLR` is called, the object's `.lastreads` array is expected to contain an element which has `UserCRC` property equal to `.crc32(username, {encoding: encoding})`. If there's no such element, `callback(null, null)` is immediately called (and thus `.readFixedHeaderInfoStruct` and `.readJDX` are never called).

* Then an attempt is made to find an `index` such as `.indexStructure[index].MessageNum0 + basemsgnum === LastRead` where `basemsgnum` is taken from `.readFixedHeaderInfoStruct` and `LastRead` is a property from the element in `.lastreads` that was found on the previous step. The search for such `index` goes backwards through `.indexStructure` because the last read message is more likely to be found among the latest received messages.

### readHeader(number, callback)

Asynchronously reads a JAM header by its number (calling `.readJDX` and `.readJHR` methods in the process).

The accepted `number` values start from (and including) `1` and go to (and including) `.size()` without gaps, ignoring the internal `MessageNumber` values in the headers. If the given number is below zero or above `.size()`, then `callback(new Error(…))` is called (see the error codes in the bottom of `fidonet-jam.js`).

The callback has the form `callback(error, header)`. That `header` has the following structure:

* `Signature` is a four-bytes Buffer (should contain `'JAM\0'`).

* `Revision` is the (16 bit) revision level of the header (`1` in the known JAM specification).

* `ReservedWord` is the (16 bit) value reserved for some future use.

* `SubfieldLen` is the (32 bit) length of the `Subfields` data (see below), given in bytes.

* `TimesRead` is the (32 bit) number of times the message was read.

* `MSGIDcrc` and `REPLYcrc` are the (32 bit) JAM CRC-32 values of the MSGID and REPLY lines of the message.

* `ReplyTo`, `Reply1st` and `ReplyNext` are the (32 bit) values that are used in saving the tree of replies to a message (as seen in the bottom of the JAM specs). **Note:** `ReplyNext` was called `Replynext` before version 2.0.0 (according to the upper table in the JAM specs; but that's probably a typo in the specs).

* `DateWritten`, `DateReceived` and `DateProcessed` are the (32 bit) timestamps of the moments when the message was written, received and processed by a tosser (or a scanner).

* `MessageNumber` is the (32 bit, 1-based) internal number of the message. Can be different from the value of the `number` parameter given to the `.readHeader` method. (However, you may expect the message's internal number to be strictly equal to `.indexStructure[number-1].MessageNum0 + basemsgnum` where `.indexStructure` is populated by `.readJDX` and `basemsgnum` is a property of the “JAM fixed header”.)

* `Attribute` is the (32 bit) bitfield containing the message's attributes.

* `Attribute2` is the (32 bit) value reserved for some future use.

* `Offset` and `TxtLen` are the (32 bit) offset and length of the message's text in the `.jdt` file.

* `PasswordCRC` is the (32 bit) JAM CRC-32 values of the password necessary to access the message.

* `Cost` is the (32 bit) cost value of the message.

* `Subfields` is an array of message's fields. Each of its elements is an object that has the following structure:
   * `LoID` is the (16 bit) identifier of the field's type.
   * `HiID` is the (16 bit) value reserved for some future use.
   * `datlen` is the (32 bit) length of the field.
   * `Buffer` is the Node.js Buffer containing the field's data.
   * `type` is the JavaScript string corresponing to the value of `LoID` (i.e. containing the field's type).

The following `LoID / type` pairs are possible:

* `0 / 'OADDRESS'` — The network address of the message's origin.
* `1 / 'DADDRESS'` — The network address of the message's destination.
* `2 / 'SENDERNAME'` — The sender (author) of the message.
* `3 / 'RECEIVERNAME'` — The recepient of the message.
* `4 / 'MSGID'` — The ID of the message.
* `5 / 'REPLYID'` — If the message is a reply to some other message, contains the MSGID of that message.
* `6 / 'SUBJECT'` — The subject of the message.
* `7 / 'PID'` — The PID of the program that generated the message.
* `8 / 'TRACE'` — Information about a system which the message has travelled through.
* `9 / 'ENCLOSEDFILE'` — A name of a file attached to the message.
* `10 / 'ENCLOSEDFILEWALIAS'` — Same as `'ENCLOSEDFILE'`, but the filename is followed by `\0` and intended to be transmited to the remote system in place of the local name of the file.
* `11 / 'ENCLOSEDFREQ'` — A request for one or more files.
* `12 / 'ENCLOSEDFILEWCARD'` — Same as `'ENCLOSEDFILE'`, but may contain wildcards.
* `13 / 'ENCLOSEDINDIRECTFILE'` — Same as `'ENCLOSEDFILE'`, but indirectly (the filename points to an ASCII file containing one filename entry per line).
* `1000 / 'EMBINDAT'` — Reserved for some future use.
* `2000 / 'FTSKLUDGE'` — FTS-compliant “kludge” line (not otherwise represented here).
* `2001 / 'SEENBY2D'` — Two-dimensional (`net/node`) SEEN-BY information.
* `2002 / 'PATH2D'` — Two-dimensional (`net/node`) PATH information.
* `2003 / 'FLAGS'` — FTN `FLAGS` kludge (stripped from the flags that have binary representation in the JAM message header).
* `2004 / 'TZUTCINFO'` — Time zone information in `+HHmm` or `-HHmm` form (for example, `-0400`) where `+` may be omitted.
* `other / 'UNKNOWN'` — A value not documented in the JAM documentation.

The above description of possible `type` values is abridged (you may read the JAM documentation for details).

Here's a header's screenshot for example:

![(screenshot)](https://cloud.githubusercontent.com/assets/1088720/2612172/7a797f9a-bbba-11e3-8a29-a77938d3ff10.png)

### readAllHeaders(callback)

Asynchronously reads all JAM headers from the base (calling `.readJDX`, `.readFixedHeaderInfoStruct` and `.readHeader` methods in the process; therefore `.indexStructure` and `.JHR` and `.fixedHeader` properties of the object are populated, though the latter is not used anywhere in the method).

Then calls `callback(error, messageHeaders)`, where `messageHeaders` is an array containing JAM headers of the individual messages as returned by `.readHeader`.

**Note 1: ** as in any other JavaScript array, the indexes of `messageHeaders` are 0-based, while the `number` parameter of the `.readHeader` method is 1-based (and the `.MessageNumber` property of the header starts from `.fixedHeader.basemsgnum`, which is either `1` or greater).

**Note 2: ** scanning of the whole base takes some time. As tests show, almost a second (or several seconds on an older computer or older Node.js engine) is necessary to scan even a single echo base containing 9151 messages. To avoid freezing of the Node.js event loop, each `.readHeader` call is postponed with `setImmediate()`.

### encodingFromHeader(header)

Searches the `Subfields` array of the given `header` for its `FTSKLUDGE`-type subfields (i.e. for FTS control lines aka kludges) and returns the lowercase encoding of the corresponding message (such as `'cp866'` for example) according to the [FTS-5003.001](http://ftsc.org/docs/fts-5003.001) standard:

* For the first `CHRS: <identifier> <level>` or `CHARSET: <identifier> <level>` kludge found, its `identifier` value is lowercased and returned.

* If the identifier has the `'ibmpc'` value, a search for a `CODEPAGE: <identifier> <level>` kludge is performed. If found, the `identifier` value of the first such kludge is lowercased and returned instead of `'ibmpc'`.

* The ` <level>` part is ignored even if present.

* If neither `CHRS: <identifier> <level>` nor `CHARSET: <identifier> <level>` kludge is found, `null` is returned.

Before the value is returned, the following replacements are made:

* `'+7_fido'` → `'cp866'` (according to FTS-5003.001 section 4)

* `'+7'` → `'cp866'` (to mitigate a relatively common mistake of declaring `'+7 FIDO'` instead of `'+7_FIDO'`)

* `'iso-8859-1'` → `'latin-1'` (that's a synonym)

* `'utf-8'` → `'utf8'` (making it more compatible with the corresponding Node.js Buffer's encoding)

### decodeHeader(header, options)

Uses the encoding (determined by `.encodingFromHeader(header)`) to decode strings from the Buffer properties of the header's Subfields.

* If `.encodingFromHeader` returns `null`, `options.defaultEncoding` is used.

* If `.encodingFromHeader` returns an unknown encoding (`Buffer.isEncoding()` returns `false` even after it is [extended](https://github.com/ashtuchkin/iconv-lite#extend-nodejs-own-encodings)), `options.defaultEncoding` is used if `options.useDefaultIfUnknown` is true. And if `options.defaultEncoding` is also an unknown encoding, an error is thrown.

The default values of `options`:

```js
{
defaultEncoding: 'cp866',
useDefaultIfUnknown: true
}
```

Returns the decoded header, which is an object with the following properties:

* `origTime` — an array (`[year, month, day, hour, minute, second, 0]`) converted from the header's `DateWritten` property. (Month numbers are `1…12` unlike JS `Date`.)

* `procTime` — an array (`[year, month, day, hour, minute, second, 0]`) converted from the header's `DateProcessed` property. (Month numbers are `1…12` unlike JS `Date`.)

* `kludges` — an array of kludge strings without the preceding SOH (`Ctrl+A`, `0x01`) code. Collected from the header's `Subfields` of `FTSKLUDGE` type. Kludges of some special types (`MSGID`, `REPLY`, `PID`, `PATH`, `SEEN-BY`) are converted to their own properties (see below).

The same returned object may also have one or more of the following properties:

* `origAddr` — sender's address.

* `toAddr` — destination's address. (Optional in echomail.)

* `from` — sender's name.

* `to` — receiver's name.

* `subj` — the message's subject.

* `msgid` and `replyid` — the `MSGID` of the message and the source it replies to.

* `pid` — the program that generated the message.

* `path` — space-separated list of the nodes the message travelled through. (The 2D addresses of that nodes are given.)

* `seenby` — space-separated incomplete list of the nodes that seen the message. (The 2D addresses of that nodes are given.)

* `timezone` — sender's time zone in `+HHmm` or `-HHmm` form (for example, `-0400`) where `+` may be omitted.

### decodeKludges(header, options)

Does a minor part of what `decodeHeader` does: decodes only the kludge lines.

Uses the encoding (determined by `.encodingFromHeader(header)`) to decode strings from the Buffer properties of the header's Subfields. If `.encodingFromHeader` returns `null`, uses `options` or defaults the same way `decodeHeader` does it.

The kludges are decoded only from the following Subfield types:

* `4 / 'MSGID'` — The ID of the message.
* `5 / 'REPLYID'` — If the message is a reply to some other message, contains the MSGID of that message.
* `7 / 'PID'` — The PID of the program that generated the message.
* `2004 / 'TZUTCINFO'` — Time zone information in `+HHmm` or `-HHmm` form (for example, `-0400`) where `+` may be omitted. (Becomes a `TZUTC` kludge.)
* `2000 / 'FTSKLUDGE'` — other FTS-compliant “kludge” lines.

The other subfields (including `PATH` and `SEEN-BY`) are ignored.

The kludge lines are decoded without the preceding SOH (`Ctrl+A`, `0x01`) code.

The returned value is a string containing all the kludge lines separated by the Unix line endings (`LF`, `'\n'`).

### decodeMessage(header, options, callback)

Using the given header, reads the text of the corresponding message (calling `.readJDT` in the process). Then uses the encoding (determined by `.encodingFromHeader(header)`) to decode the text of the message. Calls `callback(error, messageText)` when the decoding is finished.

* If `.encodingFromHeader` returns `null`, `options.defaultEncoding` is used.

* If `.encodingFromHeader` returns an unknown encoding (`Buffer.isEncoding()` returns `false` even after it is [extended](https://github.com/ashtuchkin/iconv-lite#extend-nodejs-own-encodings)), `options.defaultEncoding` is used if `options.useDefaultIfUnknown` is true. And if `options.defaultEncoding` is also an unknown encoding, an error is thrown.

The default values of `options`:

```js
{
defaultEncoding: 'cp866',
useDefaultIfUnknown: true
}
```

Before `messageText` is given to the callback, all occurences of the Fidonet line ending (`CR`, `'\r'`) are replaced by the Unix line ending (`LF`, `'\n'`).

### getAvatarsForHeader(header, schemes, avatarOptions)

Using the given `header`, returns an array of URLs of avatars designated for the corresponding message.

This is accomplished by calling `.decodeHeader` and then scanning the kludges according to the above mentioned [standard](avatar.txt) of **Fidonet avatars** for the Fidonet Global Hypertext Interface project.

The parameter `schemes` must contain the array of supported URL schemes (for example, `['http', 'https']` if only Web-hosted avatars are supported), case-insensitive. Only the supported avatar URLs are returned from the method.

An optional `avatarOptions` parameter is an object with the following optional properties:

* `defaultEncoding` (**by default,** `'cp866'`) and `useDefaultIfUnknown` (**by default,** `true`) are the options given to `.decodeHeader`.

* `size` (**by default,** `200`) is an avatar size (in pixels) to be requested from the Gravatar service, if a gravatar is encountered. The default value (`200`) implies 200×200 avatar.

* `rating` (**by default,** `'x'`) is an avatar rating to be given to the Gravatar service, if a gravatar is encountered. The service is expected to return an avatar up to and including that rating according to the following list:
   * `'g'` — suitable for display on all websites with any audience type;
   * `'pg'` — may contain rude gestures, provocatively dressed individuals, the lesser swear words, or mild violence;
   * `'r'` — may contain such things as harsh profanity, intense violence, nudity, or hard drug use;
   * `'x'` — may contain hardcore sexual imagery or extremely disturbing violence.

* `gravatarDefault` (**by default,** `'mm'`) is a keyword of an avatar to be returned by the Gravatar service, if an unknown gravatar is encountered. (See http://gravatar.com/site/implement/images/ for details.)

* `origAddr` is a string to be used as the message's sender's address if a `freq://...` URL is created from a `GIF` kludge. If this option is missing, the `origAddr` property of the object returned from `.decodeHeader` is used. (If both are missing, that `GIF` kludge is ignored.)

### numbersForMSGID(MSGID, options, callback)

Using the given `MSGID` string (or an array of MSGID strings), generates an array containing numbers of messages identified by any of the given MSGIDs, calling `.readAllHeaders` in the process. Then `callback(error, numbers)` is called.

Possible number values start from (and including) `1` and go to (and including) `.size()` without gaps, ignoring the internal `MessageNumber` values in the headers. (Note: `.size()` becomes available because `.readAllHeaders` calls `.readJDX`.)

The array of numbers may be empty if the message base does not contain messages that correspond to the given MSGIDs. The array may contain one number per MSGID if such messages are found. However, it may contain **several** numbers (corresponding to several messages) per one MSGID: though FTS-0009 states that two messages from a given system may not have the same serial number within a three years period, the message base itself may easily span more than three years.

When a non-ASCII MSGID is decoded, an optional `options` parameter is taken into account:

* If `.encodingFromHeader` returns `null`, `options.defaultEncoding` is used.

* If `.encodingFromHeader` returns an unknown encoding (`Buffer.isEncoding()` returns `false` even after it is [extended](https://github.com/ashtuchkin/iconv-lite#extend-nodejs-own-encodings)), `options.defaultEncoding` is used if `options.useDefaultIfUnknown` is true.

* After that, if the encoding is still unknown, the default value of `options.defaultEncoding` is used. (That's `'cp866'`, see below.)

The default values of `options`:

```js
{
defaultEncoding: 'cp866',
useDefaultIfUnknown: true
}
```

### headersForMSGID(MSGID, options, callback)

Works exactly as `.numbersForMSGID`, but an array of messages' headers (instead of their numbers) is given to the callback: `callback(error, headers)`.

Each of the headers (found for the given MSGID or MSGIDs) has the same properties as a result of `.readHeader`. Each header is additionally given another property (`MessageIndex`) that contains its number as found in `.numbersForMSGID`. (Do not confuse it with JAM's internal `MessageNumber` property of the same header object.)

### getParentNumber(number, callback)

Using the given message's number, finds out that message's parent in the tree of replies (i.e. the message that the given message replies to), calling `.readHeader` and `.readFixedHeaderInfoStruct` in the process. Then `callback(error, parentNumber)` is called, where `parentNumber === null` if the parent message cannot be found (for example, if the given message is not a reply).

Possible number values (of the given and the found number) start from (and including) `1` and go to (and including) `.size()` without gaps. (The internal `MessageNumber` values are used only internally in this method.)

### get1stChildNumber(number, callback)

Using the given message's number, finds out the number of its first child in the tree of replies (i.e. the first of the messages that reply to the given message), calling `.readHeader` and `.readFixedHeaderInfoStruct` in the process. Then `callback(error, childNumber)` is called, where `childNumber === null` if the given message has no replies.

Possible number values (of the given and the found number) start from (and including) `1` and go to (and including) `.size()` without gaps. (The internal `MessageNumber` values are used only internally in this method.)

### getNextChildNumber(number, callback)

Using the given message's number, finds out the number of its next sibling in the tree of replies (i.e. the next of the messages that reply to the given message's parent), calling `.readHeader` and `.readFixedHeaderInfoStruct` in the process. Then `callback(error, siblingNumber)` is called, where `siblingNumber === null` if such sibling message cannot be found (for example, if the given message is not a reply or if it's the last of the replies ever given to its parent message).

Possible number values (of the given and the found number) start from (and including) `1` and go to (and including) `.size()` without gaps. (The internal `MessageNumber` values are used only internally in this method.)

### getChildrenNumbers(number, callback)

Using the given message's number, finds out the numbers of its children in the tree of replies (i.e. the messages that reply to the given message), calling `.get1stChildNumber` and (probably) `.getNextChildNumber` in the process. Then `callback(error, childrenNumbers)` is called, where `childrenNumbers` is an array (can be `[]` if the given message has no replies).

Possible number values (of the given and the found numbers) start from (and including) `1` and go to (and including) `.size()` without gaps. (The internal `MessageNumber` values are used only internally in this method.)

### getOrigAddr(header, decodeOptions, callback)

Using the given message's header, finds the Fidonet address of that message's origin (sender), using the following sources in the following order:

* If `.decodeHeader` returns an object with existing `.origAddr` property, that property is used.

* If `.decodeHeader` returns an object with existing `.msgid` property and that property's first part (before a whitespace) resembles a Fidonet address, that part is used.

* If `.decodeMessage` returns a text and that text's last line resembles a Fidonet origin line and that line's last part (before a closing parenthesis) resembles a Fidonet address, that part is used.

Then `callback(error, origAddr)` is called. (When all of the above three sources are not available, `origAddr === null`.)

The optional `decodeOptions` parameter controls decoding (it is passed to `.decodeHeader` and `.decodeMessage` verbatim).

This method is only necessary when the `.origAddr` property is unreliable by itself, i.e. when the echomail processor (such as `hpt/w32-mvcdll 1.4.0-sta 25-02-07` for example) sometimes does not fill `OADDRESS` subfield in the header. Numerous Fidonet applications are forced to work around this issue ([example](https://github.com/ftnapps/smapinntpd/blob/5f4d7de9041a3f027aa6b619837a651c80e6f868/docs/smapinntpd.txt#L67-71)) until better echomail processors are widespread.

This method treats a message's origin line as a source less reliable than that message's MSGID. That's because an error in quoting may cause an error in echomail processing where the quoted origin would replace the original origin. (See the FAQ of SU.FidoTech for details.)

## Locking files

The module **does not** lock any files and **does not** create any “lock files” (flag files, semaphore files). The module's caller should control the access to the message base.

That's because Fidonet software uses different locking methods. For example, GoldED+ uses OS file locking (as seen in its [source code](http://golded-plus.cvs.sourceforge.net/viewvc/golded-plus/golded%2B/goldlib/gall/gfilport.cpp?revision=1.5&view=markup)) and HPT uses a lock file (the file's name is given on the `LockFile` line in the HPT's config). It would complicate the module if it were the module's job to know what locking is necessary.

## Testing Fidonet JAM

[![(build testing status)](https://img.shields.io/travis/Mithgol/node-fidonet-jam/master.svg?style=plastic)](https://travis-ci.org/Mithgol/node-fidonet-jam)

The tests currently contain ≈14 megabytes of input data and thus are not included in the npm package of the module. Use the version from GitHub.

It is necessary to install [Mocha](http://visionmedia.github.io/mocha/) and [JSHint](http://jshint.com/) for testing.

* You may install Mocha globally (`npm install mocha -g`) or locally (`npm install mocha` in the directory of the Fidonet JAM module).

* You may install JSHint globally (`npm install jshint -g`) or locally (`npm install jshint` in the directory of the Fidonet JAM module).

After that you may run `npm test` (in the directory of the Fidonet JAM module).

## License

Distribution of the Fidonet avatar standards is unlimited (see section 1), provided that the text is not altered without notice.

The JavaScript code is MIT-licensed (see the `LICENSE` file).

This product uses the JAM(mbp) API — Copyright 1993 Joaquim Homrighausen, Andrew Milner, Mats Birch, Mats Wallin. ALL RIGHTS RESERVED. (JAM may be used by any developer as long as [its specifications](JAM.txt) are followed exactly. JAM may be used free-of-charge by any developer for any purpose, commercially or otherwise.)