#!/bin/sh 
cd `dirname $0` 
echo "Hi!"
echo "We will now need root permissions to suid nginx wrapper script (nginx-as-root)"
echo "We run nginx as root (to listen on port 80) -- that's why we need this"
echo "Please relax and enter your password for sudo" 
sudo chown root ./nginx-as-root
sudo chmod +s ./nginx-as-root 
