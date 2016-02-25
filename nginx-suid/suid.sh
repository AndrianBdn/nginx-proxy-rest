#!/bin/sh 
cd `dirname $0` 
echo "Hi!"
echo "We will now need root permissions to suid nginx wrapper script" 
echo "Please relax and enter your password for sudo" 
sudo chown root ./nginx-as-root
sudo chmod +s ./nginx-as-root 
