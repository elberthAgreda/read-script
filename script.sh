#!/bin/bash

# Create logs with timestamps
for i in {1..10}
do
    echo "Log entry $i - $(date)"
    sleep 1
done
