# Dezvoltarea multistage

Acest lucru se referă la faptul că poți avea un singur fișier Dockerfile pe care să-l scrii astfel încât să obții mai multe imagini și apoi containere în funcție de necesitățile de lucru: development, production, testing. Sursa oe care am construit exemplul aparține lui Bret Fisher ca parte a unei prezentări cu ocazia Docker Con 2022 (https://github.com/BretFisher/nodejs-rocks-in-docker/tree/main/dockerfiles).

```yaml
# NIVELUL DE BAZĂ
FROM node:19-bullseye-slim as base
ENV NODE_ENV=production
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

# NIVEL PENTRU DEZVOLTARE
FROM base as dev
ENV NODE_ENV=development
ENV PATH=/var/www/test/node_modules/.bin:$PATH
RUN npm install --only=development
CMD ["nodemon", "index", "--inspect=0.0.0.0:9229"]

# creăm un nivel dedicat codului sursă pe baza căruia vom crea test și prod 
FROM base as source
COPY --chown=node:node . .

# NIVEL DE TEST
FROM source as test
ENV NODE_ENV=development
ENV PATH=/var/www/test/node_modules/.bin:$PATH
COPY --from=dev /var/www/test/node_modules /var/www/test/node_modules
## AICI un singur est simplu de exemplificare
RUN npx eslint .
RUN npm test
CMD ["npm", "run", "test]

# NIVEL DE PRODUCȚIE (este nevoie de acest nivel pentru builderii vechi)
# Dacă testele au fost trecute, se va construi imaginea de producție
FROM base as prod
# este un moment câd se face un mc reset pentru a te asigura că pornește app-ul
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "index.js"]
```

Nivelul codului sursă este creat cu scopul de a folosi nivelurile codului sursă deja create (hash-urile) care vor intra în cel de producție sunt cele pe care vom face testele.

## Resurse

- [Node.js Rocks in Docker, DockerCon 2022 Edition | Bret Fisher | 2022](https://youtu.be/Z0lpNSC1KbM)
- [Only one host for production environment. What to use: docker-compose or single node swarm?](https://github.com/BretFisher/ama/discussions/146
