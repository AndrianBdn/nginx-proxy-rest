'use strict';

const http = require('http');
const exec = require('child_process').exec;
const fs = require('fs');
const format = require("string-template");
const assert = require("assert");
const app = require('express')();
const bodyParser = require('body-parser');
const util = require('util');


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
        console.log("%s: starting nginx", new Date());
        this.nginxChildProcess = exec(this.nginxSuidWrapper + ' -c ' + this.nginxConfMainFile,
            (error, stdout, stderr) => {
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
                if (error !== null) {
                    console.log(`exec error: ${error}`);
                }
            });
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


    generateProxyConfig(hostname, url) {
        // because we use hostnames as files
        assert(hostname.indexOf('/') === -1);

        NginxController.configTemplate(
            this.nginxRootDir + '/nginx-host.conf.tpl',
            this.nginxConfDir + '/nginx-host-' + hostname + '.conf',
            {
                hostname: NginxController.xipioHostname(hostname),
                proxy_port: this.nginxProxyPort,
                target_url: url
            }
        );


        exec('nginx -t -c ' + this.nginxConfMainFile,
            (error, stdout, stderr) => {
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
                if (error !== null) {
                    console.log(`exec error: ${error}`);
                }
            });

    }

}

const nginx = new NginxController(__dirname);
nginx.run();


app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.end('ok');
});

app.put('/proxy/:endpoint', (req, res) => {
    res.set('Content-type', 'text/plain');

    const endpoint = req.params.endpoint;

    if (!endpoint.match(/[0-9a-z\.\-_]{4,}/)) {
        res.status(400).end('endpoint is suspicious: ' + endpoint + "\n");
        return
    }

    if (
        typeof req.body !== 'object' ||
        (typeof req.body.url !== 'string' && typeof req.body.port !== 'number' && typeof req.body.port !== 'string')
    )
    {
        res.status(400).end('request body should be json with "url" string key or number|string "port" key' + "\n");
        return
    }

    const url = req.body.url ?
        req.body.url :
        'http://' + (req.ip.indexOf(':') > -1 ? '[' + req.ip + ']' : req.ip) + ':' + req.body.port;

    nginx.generateProxyConfig(endpoint, url);
    nginx.reloadNginx();

    const msg = util.format('proxy %s -> %s', endpoint, url);
    res.status(201).end(msg);
});


const port = 1080;
console.log("%s: control REST API listening on :%d", new Date(), port);
app.listen(port);


