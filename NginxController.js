"use strict";

const fs = require('fs');
const format = require("string-template");
const assert = require("assert");
const exec = require('child_process').exec;

class NginxController {

    constructor(nginxRootDir) {
        this.nginxProxyPort = 80;
        this.nginxRootDir = nginxRootDir;
        this.nginxConfDir = this.nginxRootDir + '/nginx-conf';
        this.nginxConfMainFile = this.nginxConfDir + '/nginx-main.conf';
        this.nginxChildProcess = null;
        this.nginxSuidWrapper = this.nginxRootDir + '/nginx-suid/nginx-as-root';
    }

    static configTemplate(src, dst, options) {

        assert.equal(typeof options, "object", "options should be an object");


        var template = fs.readFileSync(src, 'utf8');

        assert(template, "source file should exist");

        var configString = format(template, options);
        fs.writeFileSync(dst, configString, 'utf8');
    }


    updateMainConfig() {

        NginxController.configTemplate(
            this.nginxRootDir + '/nginx-main.conf.tpl',
            this.nginxConfMainFile,
            {
                nginx_runtime: this.nginxRootDir + '/nginx-runtime',
                nginx_config: this.nginxConfDir
            }
        );

    }


    run() {
        this.updateMainConfig();
        console.log("%s: starting nginx, will use %d proxy port", new Date(), this.nginxProxyPort);
        this.nginxChildProcess = exec(this.nginxSuidWrapper + ' -c ' + this.nginxConfMainFile,
            (error, stdout, stderr) => {
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
                if (error !== null) {
                    console.log(`exec error: ${error}`);
                }
            });
    }

    stop() {
        process.kill(this.nginxChildProcess.pid, 'SIGTERM');
    }

    reloadNginx() {
        assert(this.nginxChildProcess);
        process.kill(this.nginxChildProcess.pid, 'SIGHUP');
    }


    static xipioHostname(hostname) {

        const xipMarker = '.__xip.io';

        if (!hostname.endsWith(xipMarker))
            return;

        hostname = hostname.replace(xipMarker, ''); // hopefully it will be at the end only
        hostname = hostname.replace('.', '\\.');


        return '~' + hostname + '\\..+\\.xip\\.io';
    }

    hostConfig(hostname) {
        return this.nginxConfDir + '/nginx-host-' + hostname + '.conf';
    }

    generateProxyConfig(hostname, url) {
        // because we use hostnames as files
        assert(hostname.indexOf('/') === -1);

        NginxController.configTemplate(
            this.nginxRootDir + '/nginx-host.conf.tpl',
            this.hostConfig(hostname),
            {
                hostname: NginxController.xipioHostname(hostname),
                proxy_port: this.nginxProxyPort,
                target_url: url
            }
        );


        exec(this.nginxSuidWrapper + ' -t -c ' + this.nginxConfMainFile,
            (error, stdout, stderr) => {
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
                if (error !== null) {
                    console.log(`exec error: ${error}`);
                }
            });

    }

    deleteProxyConfig(hostname) {
        fs.unlinkSync(this.hostConfig(hostname));
    }

}


module.exports = NginxController;
