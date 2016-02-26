"use strict";

const http = require('http');
const app = require('express')();
const bodyParser = require('body-parser');
const util = require('util');
const NginxController = require('./NginxController');
const ifconfigSecureListenHosts = require('./ifconfigSecureListenHosts');

const CONTROL_PORT = 1081;

const nginx = new NginxController(__dirname);

function validateEndpoint(endpoint, res) {
    if (!endpoint.match(/[0-9a-z\.\-_]{4,}/)) {
        res.status(400).end('endpoint is suspicious: ' + endpoint + "\n");
        return false;
    }
    return true;
}

function proxyCreateHandler(endpoint, url, res) {
    res.set('Content-type', 'text/plain');

    if (!validateEndpoint(endpoint, res))
        return;

    nginx.generateProxyConfig(endpoint, url);
    nginx.reloadNginx();

    const msg = util.format('proxy %s -> %s\n', endpoint, url);
    res.status(201).end(msg);
}


app.use(bodyParser.json());


app.delete('/proxy/:endpoint', (req, res) => {

    const endpoint = req.params.endpoint;
    if (!validateEndpoint(endpoint, res))
        return;

    nginx.deleteProxyConfig(endpoint);
    nginx.reloadNginx();

    res.end('delete');
});

app.put('/proxy/:endpoint/to-port/:port', (req, res) => {
    const port = Number.parseInt(req.params.port, 10);

    if (!(port > 1 && port < 65535 )) {
        res.status(400).end('bad port specified\n');
        return;
    }

    const url = 'http://' + (req.ip.indexOf(':') > -1 ? '[' + req.ip + ']' : req.ip) + ':' + port;

    proxyCreateHandler(req.params.endpoint, url, res);

});

app.put('/proxy/:endpoint/to-http-url/:url', (req, res) => {
    const rawUrl = req.params.url;

    // 1.1.1.1:1

    if (!rawUrl.match(/^[\d\.:]{9,}/)) {
        res.status(400).end("url should contain numeric ip4 address, possible semicolon (encoded as %3a) and port\n");
        return;
    }

    const url = 'http://' + rawUrl;

    proxyCreateHandler(req.params.endpoint, url, res);
});


ifconfigSecureListenHosts((hosts) => {

    hosts.map((host) => {

        http.createServer(app).listen(CONTROL_PORT, host);
        console.log("%s: control REST API listening on %s:%d", new Date(), host, CONTROL_PORT);

    });

    nginx.run();

});


process.on('SIGTERM', function () {
    nginx.stop();
    process.exit(0);
});
