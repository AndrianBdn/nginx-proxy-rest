"use strict";

const exec = require('child_process').exec;
const assert = require('assert');


function ifconfigSecureListenHosts(callback) {
    exec('ifconfig', function(error, stdout, stderr) {

        assert(error == null)


        //
        // we're selecting only ip addresses like xxx.xxx.xxx.1
        // they are pretty much rare on the public internet
        //
        const inetRegexp = /^(\w+):|inet6?\s(\d+\.\d+.\d+.1)\s/gm;
        const matches = [];

        var match, iface;

        while(match = inetRegexp.exec(stdout)) {

            if (typeof match[1] !== 'undefined') {
                iface = match[1];
            }
            else if (typeof  match[2] !== 'undefined') {
                const inet = match[2];

                // absolutely no wi-fi
                // absolutely no firewall interfaces

                if (iface != 'en0' && iface.indexOf('fw') == -1) {
                    matches.push(inet);
                }
            }

        }

        callback(matches);
    });
}

module.exports = ifconfigSecureListenHosts;