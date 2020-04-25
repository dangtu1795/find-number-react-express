#!/usr/bin/env bash

npm run build
cd server
npm install
node server.js
