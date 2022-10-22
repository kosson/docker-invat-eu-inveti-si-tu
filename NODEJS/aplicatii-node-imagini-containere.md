# Aplicații Node.js în Docker

## Preliminarii

Pentru orice eventualitate, deja există o [imagine Node](https://hub.docker.com/_/node) care poate fi utilizată în caz de necesitate (`docker pull node`). Reține faptul că o aplicație într-un container va funcționa întotdeauna sub `root`, ceea ce prezintă riscuri de securitate. Din acest motiv, este necesar să rulăm aplicațiile sub un user creat.

```yaml
USER node
```

După ce ai declarat userul `node`, toate comenzile vor rula sub auspiciile lui `node`.

Comenzile RUN, CMD și ENTRYPOINT vor putea fi rulate sub userul `node`. Pentru restul cazurilor poți folosi un combo cu `chown`:

```yaml
RUN mkdir app && chown -R node:node .
```

Dacă dorești să execuți comenzi în container ca utilizatorul `root`, vei putea lansa o comandă `docker-compose exec -u root`. Acest lucru se poate dovedi foarte util dacă dorești să actualizezi dependințe sau să instalezi altele. Acest lucru se poate face doar ca `root`.

Ca să ai access la consolă: `docker run -it nume_container bash`.

Concluzia ar fi dacă este nevoie de crearea unui director sau alte acțiuni care necesită contul de root ce permite lucrul nerestricționat în container, vei rula comanda ca root, dar vei seta cu `chown` userul și grupul la `node`. Chiar și în cazul lui `docker-compose` acest lucru este posibil: `docker-compose exec -u root`.
De exemplu, când vei copia fișierele aplicației în directorul creat, vei face acest lucru cu opțiunea care setează ceea ce se copiază la `node:node`: `COPY --chown node:node . .`.

## Crearea unei imagini a unei aplicații Node

Reguli:

- fișierul `Dockerfile` este citit linie cu linie de sus în jos;
- atunci când reface o imagine, de fiecare dată când `docker` întâlnește o linie modificată în `Dockerfile`, va reconstrui tot ce este sub linia modificată.

Alege foarte atent sistemul de operare de la `FROM`. O bună obișnuiță spune să arunci un ochi peste imaginea pe care o vei folosi drept bază direct la sursă în Docker hub pentru a fi avizat în ceea ce privește pachetele care sunt instalate din oficiu. Mai jos este exemplificată o secvență de pași pentru a rula o aplicație Node.js în Doceker.
Pune `EXPOSE număr_port` cât mai sus pentru că această directivă nu se va modifica prea des pentru respectiva aplicație. Copiază mai întâi `package.json` și lock file-ul și imediat rulează instalarea dependințelor.

```yaml
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
```

Asterixul din `package-lock.json*` cere lui `docker` să copieze fișierul dacă acesta există, dar dacă nu, să nu dea eroare (directorul curent menționat prin `./` care este `WORKDIR`). Mai există varianta de a pune un asterix doar după package, precum în `COPY package*.json ./`, directivă care ar conduce la copierea ambelor fișiere.

În ceea ce privește instalarea pachetelor cu `npm`, în momentul în care faci o imagine de producție, instalează cu `RUN npm ci --only=production`. Comanda [npm ci](https://blog.npmjs.org/post/171556855892/introducing-npm-ci-for-faster-more-reliable), trece peste `package.json` și instalează pachetele din `package-lock.json`. Astfel, ne putem baza pe același rezultat privind versiunile pachetelor instalate.

Atunci când construiești imaginea, fii atent să nu permiți copierea directorul `node_modules` în imagine. Pentru a realiza acest lucru, vei construi un fișier `.dockerignore` (https://docs.docker.com/engine/reference/builder/#dockerignore-file).

```text
node_modules
npm-debug.log
```

Pentru a construi imaginea rapid: `docker build -t test4node .`. Apoi un run rapid cu `docker container run -rm -p 80:3000 test4node`. Rezultatul va fi o imagine care s-a contruit în pași similari cu următorii.

```text
Sending build context to Docker daemon   5.12kB
Step 1/10 : FROM node:19-alpine
19-alpine: Pulling from library/node
Digest: sha256:bdd47da7e6d246549db69891f5865d82dfc9961eae897197d85a030f254980b1
Status: Image is up to date for node:19-alpine
 ---> 15f69295346c
Step 2/10 : EXPOSE 3000
 ---> Using cache
 ---> 3a14d88902d7
Step 3/10 : RUN apk add --no-cache tini
 ---> Running in 1295823a5840
fetch https://dl-cdn.alpinelinux.org/alpine/v3.16/main/x86_64/APKINDEX.tar.gz
fetch https://dl-cdn.alpinelinux.org/alpine/v3.16/community/x86_64/APKINDEX.tar.gz
(1/1) Installing tini (0.19.0-r0)
Executing busybox-1.35.0-r17.trigger
OK: 8 MiB in 17 packages
Removing intermediate container 1295823a5840
 ---> 4d37de060200
Step 4/10 : ENTRYPOINT ["/sbin/tini", "--"]
 ---> Running in 58500f814dd3
Removing intermediate container 58500f814dd3
 ---> 5f9fb4cf7943
Step 5/10 : RUN mkdir -p /var/www/test
 ---> Running in e67118bf8a78
Removing intermediate container e67118bf8a78
 ---> 59a60c5e54d9
Step 6/10 : WORKDIR /var/www/test
 ---> Running in 949c8692a5f1
Removing intermediate container 949c8692a5f1
 ---> dac5483d94c4
Step 7/10 : COPY package.json package-lock.json* ./
 ---> c819312992ec
Step 8/10 : RUN npm install && npm cache clean --force
 ---> Running in 122a4bef7690

up to date, audited 1 package in 256ms

found 0 vulnerabilities
npm WARN using --force Recommended protections disabled.
Removing intermediate container 122a4bef7690
 ---> b960b6699ded
Step 9/10 : COPY . .
 ---> 14600b7f0c9e
Step 10/10 : CMD ["node", "index.js"]
 ---> Running in fa3512f2e7ea
Removing intermediate container fa3512f2e7ea
 ---> b5f8d32e2899
Successfully built b5f8d32e2899
Successfully tagged test4node:latest
```

Toate imaginile Node au un utilizator `node` care este inactiv până când nu menționezi directiva `USER node`. Activează acest utilizator pentru ca toate directivele `RUN` să ruleze sub acest utilizator.

```yaml
FROM node:14.4.0-slim
EXPOSE 8080
RUN mkdir /var/www/kolektor && chown -R node:node /var/www/kolektor
WORKDIR /var/www/kolektor
USER node
COPY --chown=node:node package.json package-lock*.json ./
RUN npm install && npm cache clean --force
COPY --chown=node:node . .
CMD ["npm", "start"]
```

Nu folosi `npm start` în containere așa cum este în exemplu. Este considerat a fi un mod de lucru problematic. Rulează aplicațiile direct cu `node` în containere. Din nefericire `npm` nu pasează semnalele corect către `node`.

```yaml
CMD ["node", "app.js"]
```

Dacă ești mulțumit cu setările, construiește imaginea cu `docker buid -t nume_utilizator_dockerhub/nume_aplicație .`. După construcția imaginii, o poți testa cu `docker run -p numar_port_extern:numar_port_aplicație -d nume_utilizator_dockerhub/nume_aplicație`.

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
