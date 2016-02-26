
# Description 

This is very simple REST controlled nginx proxy for docker containers (currently Mac-only)


# Usage 

## proxy target auto-discovery

```
curl -X PUT http://192.168.64.1:1081/proxy/[endpoint]/port/[port]
```
 
will add host with [endpoint] name (port 80) and forward all traffic to host that called curl 
(docker-machine) and specified port. 

example: **http://192.168.64.1:1081/proxy/myhost.local/port/8080**


## specifying URL 


```
curl -X PUT http://192.168.64.1:1081/proxy/[endpoint]/to-http-url/[host-and-port]
```
 
will add host with [endpoint] name (port 80) and forward all traffic to [host-and-port] (http)

example: **http://192.168.64.1:1081/proxy/myhost.local/to-http-url/192.168.1.11%3a8080**

## xip.io support 


Just use ".__xip.io" zone to create [xip.io](xip.io) proxy host. 

Example: **curl http://127.0.0.1:1081/proxy/test.__xip.io/to-port/8080**

After this you can use http://test.127.0.0.1.xip.io/


# Installation 

- you will need to install nginx on your Mac (brew install nginx)
- run npm install (will ask for sudo)