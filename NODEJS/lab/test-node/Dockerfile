FROM node:19-alpine
EXPOSE 3000
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]
RUN mkdir -p /var/www/test
WORKDIR /var/www/test
COPY package.json package-lock.json* ./
RUN npm install && npm cache clean --force
COPY . .
CMD ["node", "index.js"]    