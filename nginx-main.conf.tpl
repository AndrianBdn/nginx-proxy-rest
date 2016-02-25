worker_processes 1;
error_log {nginx_runtime}/error.log;
pid {nginx_runtime}/nginx.pid;
daemon off;

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  {nginx_runtime}/access.log  main;
    
    client_body_temp_path {nginx_runtime}/client_body;
    fastcgi_temp_path {nginx_runtime}/fastcgi_temp;
    proxy_temp_path {nginx_runtime}/proxy_temp;
    scgi_temp_path {nginx_runtime}/scgi_temp;
    uwsgi_temp_path {nginx_runtime}/uwsgi_temp;


    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 2048;

    include             {nginx_config}/mime.types;
    default_type        application/octet-stream;

    include "{nginx_config}/nginx-host*.conf";
}