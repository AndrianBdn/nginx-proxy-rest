
server {
    listen       {proxy_port};
    server_name  {hostname};

    location / {
    	proxy_pass 				{target_url};
    	proxy_set_header    	Host                $host;
    	proxy_set_header   		X-Real-IP           $remote_addr;
    	proxy_set_header    	X-Forwarded-For     $remote_addr;
    	proxy_set_header    	X-Forwarded-Proto   $scheme;
        proxy_set_header        X-Forwarded-Port    {proxy_port};
    	port_in_redirect    	off;
        client_max_body_size  	128M;
    }

}



