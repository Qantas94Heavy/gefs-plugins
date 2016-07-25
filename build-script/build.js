#!/usr/bin/env node

'use strict';

var requirejs = require('requirejs');
var UglifyJS = require('uglify-js');
var util = require('util');
var fs = require('fs');
var Promise = require('bluebird');
var subprocess = require('child_process');
var optimist = require('optimist');
var args = optimist
   .usage('Build script for GEFS Plugins.')
   
   .boolean('help')
   .describe('help', 'Display this help message.')
   .alias('h', 'help')
   
   .string('output')
   .demand('output')
   .describe('output', 'Specify the location for the output zip file.')
   .alias('o', 'output')
   
   .boolean('release')
   .describe('release', 'Designate the zip file as a release.  New version number and no sourcemap included.')
   
   .string('version')
   .describe('version', 'Override the version number in metadata.')

   .argv;

if (args.help) {
  util.print(optimist.help());
  process.exit();
  return;
}



console.log(JSON.stringify(args));
var version = args.version;
// don't maintain ES3/old IE compatibility
// may IE be dammed
var screwIE8 = true;
var shortName = 'app';
var folder = 'package/' + shortName + '_' + version + '/';

fs.readFile('source/code.user.js', { encoding: 'UTF-8' }).then(function (data) {
  if (!/^\/\/ ==UserScript==/.test(data)) throw new Error('Greasemonkey metadata block missing');
  
  var parts = data.match(splitPartsRegex);
  if (parts) var metadata = parts[1]
    .split(newLineRegex)
    .map(function (val) { return val.match(lineValidationRegex); })
    .filter(function (val) { return val === null; })
    .map(function (val) { return val.slice(1); })
    .reduce(function (obj, keyValue) {
      if (keyValue) {
        var key = keyValue[0];
        var value = keyValue[1];
        obj[key] = key in obj ? [ obj[key], value ] : value;
      }
      return obj;
    }, {});

  var ast = UglifyJS.parse(data,
  { strict: true
  , filename: 'code.user.js' // perhaps a different name?
  });
  ast.figure_out_scope();

  // remove DEBUG from code -- useless code will be optimised away later
  ast = ast.transform(new UglifyJS.TreeTransformer(function (node) {
    // replace any references to DEBUG with the boolean "false"
    if (node instanceof UglifyJS.AST_SymbolRef && node.name === 'DEBUG') return new UglifyJS.AST_False;
    if (node instanceof UglifyJS.AST_Var && transformer.parent === ast) {
      // remove any variable definitions that define DEBUG
      node.definitions = node.definitions.filter(function (def) {
        console.log(def);
        return def.name.name !== 'DEBUG';
      });
      
      // if there are no variable definitions after removal,
      // replace the variable definition node with an empty statement (;)
      return node.definitions.length ? node : new UglifyJS.AST_EmptyStatement;
    }
  }));
  
  ast.figure_out_scope();
  var compressor = new UglifyJS.Compressor(
  { unsafe: true // we don't want unsafe comparisons though
  , unsafe_comps: false
  , screw_ie8: screwIE8
  });
  
  ast.figure_out_scope();
  ast = ast.transform(compressor);
  
  ast.compute_char_frequency();
  ast.mangle_names({ screw_ie8: screwIE8 });

  var readme = fs.readFile('source/README.txt', { encoding: 'UTF-8' });
  var chromeLoader = 'var d=document;top==this&&d.head.appendChild(d.createElement("script")).src=chrome.extension.getURL("c.js")';

  var files =
    [ readme.then(function (str) {
        fs.writeFile(folder + 'README.md', util.format(str, version, version.split('.', 3).join('.')));
      })
    , fs.writeFile(folder + 'l.js', chromeLoader)
    ];

  var sourceMap = UglifyJS.SourceMap({ file: 'c.js' });
  var output = UglifyJS.OutputStream(
  { ascii_only: true
  , source_map: sourceMap
  , screw_ie8: screwIE8
  })
  .toString()
  .replace(/[;\s]*$/, args.release ? '' : '\n//# sourceMappingURL c.map');
  
  var greasemonkey = generateMetadata + '\n' + output;
  files.push
  (  fs.writeFile(folder + 'c.js', output)
  ,  fs.writeFile(folder + 'c.map', sourceMap.toString())
  ,  fs.writeFile(folder + shortName + '_' + version + '.user.js', greasemonkey)
  );

  // when all files have been written, zip up the folder
  return Promise.all(files);
}).then(function () {
  // package chrome extension
}).then(function () {
  // zip folder
});
   
/*
gefs_gc-setup
gefs_gc-setup/c.js
gefs_gc-setup/manifest.json
gefs_gc-setup.crx

app_v0.5.2.user.js
README.md


gefs_gc-setup/l.js
gefs_gc-setup/c.js
gefs_gc-setup/c.map
gefs.gc-setup/code.user.js
gefs_gc-setup/manifest.json

gefs_gc-setup.crx

app.user.js
README.md
LICENSE.md (only in zip);
*/