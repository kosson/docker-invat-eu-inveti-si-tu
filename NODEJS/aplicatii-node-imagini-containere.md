# Aplicații Node.js în Docker

## Preliminarii

Pentru orice eventualitate, deja există o [imagine Node](https://hub.docker.com/_/node) care poate fi utilizată în caz de necesitate (`docker pull node`). Reține faptul că o aplicație într-un container va funcționa întotdeauna sub `root`, ceea ce prezintă riscuri de securitate. Din acest motiv, este necesar să rulăm aplicațiile sub un user creat. Imaginea de node oficială creează userul node.

```yaml
USER node
```

După ce ai declarat userul `node`, toate comenzile vor rula sub auspiciile lui `node`.

Comenzile RUN, CMD și ENTRYPOINT vor putea fi rulate sub userul `node`. Pentru restul cazurilor poți folosi un combo cu `chown`:

```yaml
RUN mkdir /app && chown -R node:node /app
WORKDIR /app
USER node
```

Aceasta este un fragment împrumutat din experiența dobândită de Bret Fisher în cazul în care îți construiești propria imagine de Node.js.

Dacă dorești să execuți comenzi în container ca utilizatorul `root`, vei putea lansa o comandă `docker-compose exec -u root`. Acest lucru se poate dovedi foarte util dacă dorești să actualizezi dependințe sau să instalezi altele. Acest lucru se poate face doar ca `root`.

Ca să ai access la consolă: `docker run -it nume_container bash`.

Concluzia ar fi dacă este nevoie de crearea unui director sau alte acțiuni care necesită contul de root ce permite lucrul nerestricționat în container, vei rula comanda ca root, dar vei seta cu `chown` userul și grupul la `node`. Chiar și în cazul lui `docker-compose` acest lucru este posibil: `docker-compose exec -u root`.
De exemplu, când vei copia fișierele aplicației în directorul creat, vei face acest lucru cu opțiunea care setează ceea ce se copiază la `node:node`: `COPY --chown node:node . .`.

## Crearea unei imagini a unei aplicații Node

Reguli:

- fișierul `Dockerfile` este citit linie cu linie de sus în jos;
- atunci când reface o imagine, de fiecare dată când `docker` întâlnește o linie modificată în `Dockerfile`, va reconstrui tot ce este sub linia modificată. În concluzie, pune instrucțiunile care se modifică cel mai rar primele pentru ca acele straturi să nu fie reconstruite.

Alege foarte atent sistemul de operare de la `FROM`. O bună obișnuiță spune să arunci un ochi peste imaginea pe care o vei folosi drept bază direct la sursă în Docker hub pentru a fi avizat în ceea ce privește pachetele care sunt instalate din oficiu. Mai jos este exemplificată o secvență de pași pentru a rula o aplicație Node.js în Docker.
Pune `EXPOSE număr_port` cât mai sus pentru că această directivă nu se va modifica prea des pentru respectiva aplicație. Copiază mai întâi `package.json` și lock file-ul și imediat rulează instalarea dependințelor.

```yaml
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
RUN npm ci --only=production --omit=dev && npm cache clean --force
COPY --chown=node:node . /var/www/test
# Nu folosi npm în containere pentru cu nu poate gestiona semnale
CMD ["node", "index.js"]    
```

Un set complet al pașilor poate fi similar cu următorul. Observă că am adăugat `-omit=dev` pentru a elimina orice posibilă utilizare a pachetelor pentru dezvoltare.

```text
docker build -t test_node_19_bullseye .
Sending build context to Docker daemon  6.656kB
Step 1/11 : FROM node:19-bullseye-slim
 ---> bc61eaf3a075
Step 2/11 : RUN apt-get update     && apt-get install -y --no-install-recommends     tini     && rm -rf /var/lib/apt/lists/*
 ---> Using cache
 ---> 697320515cb9
Step 3/11 : ENTRYPOINT ["/usr/bin/tini", "--"]
 ---> Using cache
 ---> aea79a20a5a2
Step 4/11 : EXPOSE 3000
 ---> Using cache
 ---> a5192a74997a
Step 5/11 : RUN mkdir -p /var/www/test && chown -R node:node /var/www/test
 ---> Using cache
 ---> 60cb1df67885
Step 6/11 : WORKDIR /var/www/test
 ---> Using cache
 ---> f5fc52b8f785
Step 7/11 : USER node
 ---> Using cache
 ---> 7360340011f2
Step 8/11 : COPY --chown=node:node package*.json package-lock.json* ./
 ---> Using cache
 ---> 72efc5956a8d
Step 9/11 : RUN npm ci --only=production && npm cache clean --force
 ---> Using cache
 ---> e161b65a42ee
Step 10/11 : COPY --chown=node:node . .
 ---> Using cache
 ---> e72eb4dd51c6
Step 11/11 : CMD ["node", "index.js"]
 ---> Using cache
 ---> 23f88b99d393
Successfully built 23f88b99d393
Successfully tagged test_node_19_bullseye:latest
```

Asterixul din `package-lock.json*` cere lui `docker` să copieze fișierul dacă acesta există, dar dacă nu, să nu dea eroare (directorul curent menționat prin `./` care este `WORKDIR`). Mai există varianta de a pune un asterix doar după package, precum în `COPY package*.json ./`, directivă care ar conduce la copierea ambelor fișiere.

În ceea ce privește instalarea pachetelor cu `npm`, în momentul în care faci o imagine de producție, instalează cu `RUN npm ci --only=production`. Comanda [npm ci](https://blog.npmjs.org/post/171556855892/introducing-npm-ci-for-faster-more-reliable), trece peste `package.json` și instalează pachetele din `package-lock.json`. Astfel, ne putem baza pe același rezultat privind versiunile pachetelor instalate fără teama că npm va instala versiuni ale pachetelor pe care nu le dorim.

Atunci când construiești imaginea, fii atent să nu permiți copierea directorul `node_modules` în imagine. Pentru a realiza acest lucru, vei scrie un fișier `.dockerignore` (https://docs.docker.com/engine/reference/builder/#dockerignore-file).

```text
node_modules
npm-debug.log
```

Pentru a construi imaginea rapid: `docker build -t test4node .`. Apoi un run rapid cu `docker container run -rm -p 80:3000 test4node` (`rm` este pentru a rula o singur dată aplicația și apoi pentru a șterge imaginea). Rezultatul va fi o imagine nouă cu numele ales drept tag. După cum se observă mai jos, construcția imaginii a eșuat pentru că nu există *package-lock.json*. Mai întâi trebuie instalată aplicația local (`npm install`). În acest moment este disponibil și *package-lock.json*.

```text
Step 8/11 : COPY --chown=node:node package*.json package-lock.json* ./
 ---> bc3cce577655
Step 9/11 : RUN npm ci --only=production && npm cache clean --force
 ---> Running in c4177603736d
npm WARN config only Use `--omit=dev` to omit dev dependencies from the install.
npm ERR! code EUSAGE
npm ERR! 
npm ERR! The `npm ci` command can only install with an existing package-lock.json or
npm ERR! npm-shrinkwrap.json with lockfileVersion >= 1. Run an install with npm@5 or
npm ERR! later to generate a package-lock.json file, then try again.
npm ERR! 
npm ERR! Clean install a project
npm ERR! 
npm ERR! Usage:
npm ERR! npm ci
npm ERR! 
npm ERR! Options:
npm ERR! [-S|--save|--no-save|--save-prod|--save-dev|--save-optional|--save-peer|--save-bundle]
npm ERR! [-E|--save-exact] [-g|--global] [--global-style] [--legacy-bundling]
npm ERR! [--omit <dev|optional|peer> [--omit <dev|optional|peer> ...]]
npm ERR! [--strict-peer-deps] [--no-package-lock] [--foreground-scripts]
npm ERR! [--ignore-scripts] [--no-audit] [--no-bin-links] [--no-fund] [--dry-run]
npm ERR! [-w|--workspace <workspace-name> [-w|--workspace <workspace-name> ...]]
npm ERR! [-ws|--workspaces] [--include-workspace-root] [--install-links]
npm ERR! 
npm ERR! aliases: clean-install, ic, install-clean, isntall-clean
npm ERR! 
npm ERR! Run "npm help ci" for more info

npm ERR! A complete log of this run can be found in:
npm ERR!     /home/node/.npm/_logs/2022-11-05T08_03_21_742Z-debug-0.log
```

Toate imaginile Node.js au un utilizator `node` care este inactiv până când nu menționezi directiva `USER node`. Activează acest utilizator pentru ca toate directivele `RUN` să ruleze sub acest utilizator.

Nu folosi `npm start` în containere pentru că npm nu gestionează corect semnalele. Rulează aplicațiile direct cu `node` în containere. Din nefericire `npm` nu pasează semnalele corect către și dinspre `node`.

```yaml
CMD ["node", "app.js"]
```

Dacă ești mulțumit cu setările, construiește imaginea cu `docker buid -t nume_utilizator_dockerhub/nume_aplicație .`. După construcția imaginii, o poți testa cu `docker run -p numar_port_extern:numar_port_aplicație -d nume_utilizator_dockerhub/nume_aplicație`.

```text
docker images

REPOSITORY                  TAG                IMAGE ID       CREATED         SIZE
test_node_19_bullseye       latest             23f88b99d393   3 minutes ago   245MB
```

Pentru un test rapid, rulează aplicația cu `docker container run -p 80:3000 test_node_19_bullseye` și verifică în browser pe localhost:80.

Vezi care este containerul care rulează aplicația cu `docker ps` și la nevoie poți afișa log-urile aplicației cu `docker logs număr_container`. Dacă ai nevoie să accesezi consola containerului deschide o sesiune cu `docker exec -it număr_container /bin/bash`. Dacă dorești să testezi aplicația, poți trimite de test o cerere similară cu `curl -i localhost:numar_port_extern`.

## Gestionarea semnalelor

Într-un sistem, **PID 1** este primul proces din container în cazul docker. Acest proces este `init`. În momentul în care sistemul vrea să modifice starea unui proces, folosește semnale specifice. Cele mai des întâlnite sunt `SIGINT` (echivalentul lui CTRL + C), `SIGTERM` (docker container stop) și `SIGKILL`.

Gestionarea semnalelor într-un container care rulează node este necesară pentru că în cazul în care dorim oprirea containerului cu un posibil `docker container stop`, în cazul în care nu este primit un semnal de la aplicație, `docker` va emite un `SIGKILL`, ceea ce va acea ca efect stabilirea unei perioade de grație de 10 secunde după care containerul va fi oprit fără să mai aștepte vreun semnal de la aplicație.

Pentru a gestiona corect semnalele într-un container care rulează o aplicație node, se va folosi utilitarul `tini` care este inclus deja în Docker. Pentru a-l folosi, rulează containerul cu `--init`: `docker run --init -d imagineApp`. Aceasta ar fi prima soluție rapidă.
Cel mai bine ar fi să-l introduci direct în imagine, precum în următorul exemplu.

```yaml
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "./bin/www"]
```

Cea de-a treia opțiune este scrierea de cod care să poată gestiona închiderea frumoasă a aplicației care rulează în container prin tratarea semnalelor chiar de către aplicație.

```javascript
// GESTIONAREA SEMNALELOR
process.on('SIGINIT', function onSiginit () {
    console.info('Am prins un SIGINIT (ctr+c). Închid procesul finuț', new Date().toISOString());
    shutdownserver();
});

process.on('SIGTERM', function onSiginit () {
    console.info('Am prins un SIGTERM (stop). Închid procesul finuț', new Date().toISOString());
    shutdownserver();
});

function shutdownserver () {
    server.close(function onServerClosed (err) {
        if (err) {
            console.error(err);
            process.exitCode = 1;
        }
        process.exit(1);
    });
};

process.on('uncaughtException', (un) => {
    console.log('[app.js] A apărul un uncaughtException cu detaliile ', un);
});
```

## Resurse

- [Dockerizing a Node.js web app](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Docker and Node.js Best Practices](https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md)
- [Docker and Node.js Best Practices from Bret Fisher at DockerCon](https://www.youtube.com/watch?v=Zgx0o8QjJk4)
- [passing unix signals to child rather than dying? | Github](https://github.com/npm/npm/issues/4603)
- [lifecycle: propagate SIGTERM to child | Github](https://github.com/npm/npm/pull/10868)
- [RisingStack / kubernetes-graceful-shutdown-example](https://github.com/RisingStack/kubernetes-graceful-shutdown-example/blob/master/src/index.js)
- [nginx-proxy](https://github.com/nginx-proxy/nginx-proxy)
- [Certificates for localhost](https://letsencrypt.org/docs/certificates-for-localhost/)
- [Docker best practices with Node.js](https://dev.to/nodepractices/docker-best-practices-with-node-js-4ln4)
