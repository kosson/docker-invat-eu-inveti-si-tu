FROM node:19-bullseye-slim
# înlocuiește npm cu tini
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    tini \
    && rm -rf /var/lib/apt/lists/*
ENTRYPOINT ["/usr/bin/tini", "--"]
EXPOSE 3000
# contruiește manual calea cu drepturile necesare
RUN mkdir -p /var/www/test && chown -R node:node /var/www/test
WORKDIR /var/www/test
USER node
COPY --chown=node:node package*.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force
COPY --chown=node:node . .
# Nu folosi npm în containere pentru cu nu poate gestiona semnale
CMD ["node", "index.js"]