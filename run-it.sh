#!/usr/bin/env bash

echo "-> starting prisma migrations to postgres...\n"
cd /usr/app/
./wait-for-it.sh db:5432 -- echo "db online\n"
npm run migrate:save --name initprod
npm run migrate:up

sleep 5

npm run build
npm start