The **Fidonet JAM** module reads headers of Fidonet echomail messages from JAM message bases according to JAM (The Joaquim-Andrew-Mats Message Base Proposal) [quoted in Ru.FTN.Develop.](http://groups.google.com/group/fido7.ru.ftn.develop/msg/e2f5486f80394418)

The module is written in JavaScript and requires [Node.js](http://nodejs.org/) to run.

The [jParser](https://github.com/vjeux/jParser) module is also required as a dependency.

## Installing Fidonet JAM

[![(npm package version)](https://badge.fury.io/js/fidonet-jam.png)](https://npmjs.org/package/fidonet-jam)

* Latest packaged version: `npm install fidonet-jam`

* Latest githubbed version: `npm install https://github.com/Mithgol/node-fidonet-jam/tarball/master`

The npm package does not contain the tests, they're published on GitHub only.

You may visit https://github.com/Mithgol/node-fidonet-jam#readme occasionally to read the latest `README` because the package's version is not planned to grow after changes when they happen in `README` only. (However, `npm publish --force` may happen eventually.)

## Testing Fidonet JAM

[![(build testing status)](https://travis-ci.org/Mithgol/node-fidonet-jam.png?branch=master)](https://travis-ci.org/Mithgol/node-fidonet-jam)

It is necessary to install [Mocha](http://visionmedia.github.io/mocha/) and [JSHint](http://jshint.com/) for testing.

* You may install Mocha globally (`npm install mocha -g`) or locally (`npm install mocha` in the directory of the Fidonet JAM module or any of its parent directories).

* You may install JSHint globally (`npm install jshint -g`) or locally (`npm install jshint` in the directory of the Fidonet JAM module or any of its parent directories).

After that you may run `npm test` (in the directory of the Fidonet JAM module) for testing the correctness of JavaScript.

## TODO

The package's development is still in progress and leaves a lot to be desired:

* Faster scan time (currently scanning of ≈2 Mb takes ≈5 seconds, see the test). I may drop jParser and deal with the file directly.

* Better API (and documented in README).

* Reading messages (not only headers).

* Trees of replies.

* [FGHI](https://github.com/Mithgol/FGHI-URL) support.