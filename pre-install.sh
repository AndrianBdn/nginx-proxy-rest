#!/usr/bin/env bash

cd `dirname $0`

RESULT=$(./nginx-suid/nginx-as-root -v 2>&1)

if [[ $RESULT != *"nginx version"* ]]; then

    echo "Error during install (pre-install.sh)"
    echo "we expect nginx-as-root wrapper to call nginx"
    echo "possible reasons for fail"
    echo "  - nginx-as-root binary is compiled for Mac, the whole thing is indendent for Mac as now"
    echo "  - you may try to re-compile nginx-as-root binary"
    echo "  - we expect nginx to be present is PATH (install it using brew on mac)"
    echo ""
    exit 1

fi