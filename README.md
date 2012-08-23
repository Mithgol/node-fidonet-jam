[![build status](https://secure.travis-ci.org/Mithgol/node-fidonet-jam.png)](http://travis-ci.org/Mithgol/node-fidonet-jam)
# Purpose

Reads headers of Fidonet echomail messages from JAM message bases.

# Requirements

Written in JavaScript, requires [Node.js](http://nodejs.org/) to run.

Depends on the [jParser](https://github.com/vjeux/jParser) module.

# Installation

Use [npm](http://npmjs.org/) to install:

```
npm install FidoJAM
```

**Notes:**

* The package's name is case-sensitive; it's `FidoJAM`, not lowercase `fidojam`.

* The package may contain a version older than the code in GitHub repository.

* The package does not contain the `test` folder.

# TODO

* Faster scan time (currently scanning of ≈2 Mb takes ≈5 seconds, see the test).

* Better API.

* Reading messages (not only headers).

* Support reply trees.

* Support FGHI.

# See also

* JAM (The Joaquim-Andrew-Mats Message Base Proposal) [quoted in Ru.FTN.Develop](http://groups.google.com/group/fido7.ru.ftn.develop/msg/e2f5486f80394418)