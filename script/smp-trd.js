/**
 * XadillaX created at 2014-09-18 16:30:30
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved
 */
var path = require("path");
var walk = require("walk");
var fs = require("fs");
var run = require("sync-runner");
var walker = walk.walk("source");

walker.on("file", function(root, fileStats, next) {
    var filetype = path.extname(fileStats.name);
    if(filetype !== ".md") {
        return next();
    }

    var filename = root + "/" + fileStats.name;
    var oldFilename = filename + ".smp";
    fs.rename(filename, oldFilename, function(err) {
        if(err) {
            console.log("Rename [" + filename + "] failed: " + err.message);
        }

        console.log("Transforming [" + filename + "]...");
        console.log(run("opencc -i " + oldFilename + " -o " + filename));

        next();
    });
});

