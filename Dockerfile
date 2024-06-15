FROM --platform=linux/amd64 node:17-alpine

COPY . /usr/src
WORKDIR /usr/src

RUN npm i

CMD ["node", "index.js"]