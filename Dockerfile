FROM node:14-alpine as node

WORKDIR /app

RUN mkdir -p /app

COPY ./ /app/

RUN npm install