Pinboard Plus [![Build Status](https://travis-ci.org/clvrobj/Pinboard-Plus.svg?branch=master)](https://travis-ci.org/clvrobj/Pinboard-Plus)
=============
Pinboard Plus is a better Chrome extension for [Pinboard.in](http://pinboard.in). 

Easy to know current page has been saved or not.

Features
--------

* Icon changing to show current page has been saved or not
* Add, modify and delete bookmarks from the popup window
* Same UI style with Pinboard official site
* Set `private` if in Incognito Mode


Installation
------------
You can install in Chrome webstore: [Pinboard Plus](https://chrome.google.com/webstore/detail/mphdppdgoagghpmmhodmfajjlloijnbd)

Development
-----------
Software required for development:

* [bower](https://bower.io/)
* [npm](https://www.npmjs.com/)

Install dependencies:

```bash
$ npm install
$ bower install
```

Follow the official instruction to [load the extenstion](https://developer.chrome.com/extensions/getstarted#unpacked).

LiveReload:

```bash
$ gulp watch
```

Build the extension:

```bash
$ gulp build
```

For testing, open the `chrome-extension://[Extension ID]/tests/tests.html` in the browser to check the test results.

### [Contributors](https://github.com/clvrobj/Pinboard-Plus/graphs/contributors)
