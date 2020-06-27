# Aplicații Node.js în Docker

## Preliminarii

Pentru orice eventualitate, deja există o [imagine Node](https://hub.docker.com/_/node) care poate fi utilizată în caz de necesitate (`docker pull node`).
Reține faptul că o aplicație într-un container va funcționa întodeauna sub `root`, ceea ce prezintă riscuri de securitate. Din acest motiv, este necesar să rulăm aplicațiile sub un user creat.

```yaml
USER node
```

După ce ai declarat userul `node`, toate comenzile vor rula sub `node`.

Comenzile RUN, CMD și ENTRYPOINT vor putea fi rulate sub userul `node`. Pentru restul cazurilor poți folosi un combo cu `chown`:

```yaml
RUN mkdir app && chown -R node:node .
```

Dacă dorești să execuți comenzi în container ca utilizatorul `root`, vei putea lansa o comandă `docket-compose exec -u root`. Acest lucru se poate dovedi foarte util dacă dorești să actualizezi dependința sau să intalezi altele. Acest lucru se poate face doar ca `root`.

Ca să ai access la consolă: `docker run -it nume_container bash`.

Concluzia ar fi dacă este nevoie de crearea unui director sau alte acțiuni care necesită contul de root ce permite lucrul nerestricționat în container, vei rula comanda ca root, dar vei seta cu `chown` userul și grupul la `node`. Chiar și în cazul lui `docker-compose` acest lucru este posibil: `docker-compose exec -u root`.
De exemplu, când vei copia fișierele aplicației în directorul creat, vei face acest lucru cu opțiunea care setează ceea ce se copiază la `node:node`: `COPY --chown node:node . .`.

## Crearea unei imagini a unei aplicații Node

Reguli:

- fișierul Docekrfile este cititi linie cu linie de sus în jos.
- de fiecare dată când docker întâlnește o linie modificată în Dockerfile atunci când reface o imagine, va reconstrui tot ce este sub linia modificată

Alege foarte atent sistemul de operare de la `FROM`.
Pune `EXPOSE număr_port` cât mai sus pentru că această directivă nu se va modifica prea des pentru respectiva aplicație.
Copiază mai întâi `package.json` și lock file-ul și imediat rulează instalarea dependințelor.

```yaml
WORKDIR /var/www/test
COPY package.json package-lock.json* ./
RUN npm install && npm cache clean --force
COPY . .
```

Asterixul din `package-lock.json*` ca indică ca docker să copieze fișierul dacă acesta există, dar dacă nu, să nu dea eroare (directorul curent menționat prin `./`).

Nu permite copierea directorul `node_modules` în imagine. Pentru a realiza acest lucru, vei construi un fișier `.gitignore` (https://docs.docker.com/engine/reference/builder/#dockerignore-file).
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

Nu folosi `npm start` în containere. Este un anti-pattern. Rulează aplicațiile direct cu `node` în containere. Din nefericire `npm` nu pasează semnalele corect către `node`.

## Stabilirea versiunii

Primul lucru care este necesar, este să identificăm sistemul de operare pe care vom dezvolta. Preferința face să alegem imaginea sistemului de operare [Ubuntu 18.04](https://hub.docker.com/_/ubuntu).

```yaml
FROM node:
ENV NODE_VERSION 14.4.0
```

Imaginea vine cu un sistem Debian (Jessie).

```bash
uname -a
Linux 7b2c8355f0b2 4.15.0-24-generic #26-Ubuntu SMP Wed Jun 13 08:44:47 UTC 2018 x86_64 GNU/Linux
cat /etc/*release
PRETTY_NAME="Debian GNU/Linux 8 (jessie)"
NAME="Debian GNU/Linux"
VERSION_ID="8"
VERSION="8 (jessie)"
ID=debian
HOME_URL="http://www.debian.org/"
SUPPORT_URL="http://www.debian.org/support"
BUG_REPORT_URL="https://bugs.debian.org/
```

Versiunea de node este 10.6

## Gestionarea semnalelor

Într-un sistem, PID 1 este primul proces din sistem, din container în cazul docker. Acest proces este `init`. În momentul în care sistemul vrea să modifice starea unui proces, folosește semnale specifice. Cele mai des întâlnite sunt `SIGINT` (echivalentul lui CTRL + C), `SIGTERM` (docker container stop) și `SIGKILL`.

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

- [Docker and Node.js Best Practices from Bret Fisher at DockerCon](https://www.youtube.com/watch?v=Zgx0o8QjJk4)
- [passing unix signals to child rather than dying? | Github](https://github.com/npm/npm/issues/4603)
- [lifecycle: propagate SIGTERM to child | Github](https://github.com/npm/npm/pull/10868)
- [ RisingStack / kubernetes-graceful-shutdown-example](https://github.com/RisingStack/kubernetes-graceful-shutdown-example/blob/master/src/index.js)
