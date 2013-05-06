#!/bin/bash

./scripts/compile.bash
gsutil setwebcfg gs://www.bitescrow.org
gsutil -h "Cache-Control:public,max-age=86400" cp -z 'html,js,css,txt' -a public-read -R build/index.html gs://www.bitescrow.org
