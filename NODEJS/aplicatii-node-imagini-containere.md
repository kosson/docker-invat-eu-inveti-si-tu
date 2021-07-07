# Aplicații Node.js în Docker

## Preliminarii

Pentru orice eventualitate, deja există o [imagine Node](https://hub.docker.com/_/node) care poate fi utilizată în caz de necesitate (`docker pull node`). Reține faptul că o aplicație într-un container va funcționa întotdeauna sub `root`, ceea ce prezintă riscuri de securitate. Din acest motiv, este necesar să rulăm aplicațiile sub un user creat.

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

- fișierul Dockerfile este citit linie cu linie de sus în jos.
- atunci când reface o imagine, de fiecare dată când `docker` întâlnește o linie modificată în `Dockerfile`, va reconstrui tot ce este sub linia modificată

Alege foarte atent sistemul de operare de la `FROM`.
Pune `EXPOSE număr_port` cât mai sus pentru că această directivă nu se va modifica prea des pentru respectiva aplicație.
Copiază mai întâi `package.json` și lock file-ul și imediat rulează instalarea dependințelor.

```yaml
WORKDIR /var/www/test
COPY package.json package-lock.json* ./
RUN npm install && npm cache clean --force
COPY . .
```

Asterixul din `package-lock.json*` ca indică ca `docker` să copieze fișierul dacă acesta există, dar dacă nu, să nu dea eroare (directorul curent menționat prin `./`). Mai există varianta de a pune un asterix doar după package, precum în `COPY package*.json ./`, directivă care ar conduce la copierea ambelor fișiere.

În ceea ce privește instalarea pachetelor cu `npm`, în momentul în care faci o imagine de producție, instalează cu `RUN npm ci --only=production`. Comanda [npm ci](https://blog.npmjs.org/post/171556855892/introducing-npm-ci-for-faster-more-reliable), trece peste `package.json` și instalează pachetele din `package-lock.json`. Astfel, ne putem baza pe același rezultat privind versiunile pachetelor instalate.

Atunci când construiești imaginea, fii atent să nu permiți copierea directorul `node_modules` în imagine. Pentru a realiza acest lucru, vei construi un fișier `.gitignore` (https://docs.docker.com/engine/reference/builder/#dockerignore-file).

```text
node_modules
npm-debug.log
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
```

cu un posibil conținut

```text
PRETTY_NAME="Debian GNU/Linux 8 (jessie)"
NAME="Debian GNU/Linux"
VERSION_ID="8"
VERSION="8 (jessie)"
ID=debian
HOME_URL="http://www.debian.org/"
SUPPORT_URL="http://www.debian.org/support"
BUG_REPORT_URL="https://bugs.debian.org/
```

Versiunea de Node.js este 10.6

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

## Crearea unor servicii

Aflându-te în directorul de dezvoltare al aplicației Node.js, creează un fișier `.dockerignore` în care specifici care dintre directoare/fișiere nu dorești să ajungă în container.

```text
# exclude modulele Node
node_modules
# exclude repo-ul de git
.git/
# exlude design-ul aplicației
docker-compose*.yml
# exclude /repo
/repo
# exclude .env
.env
# exclude tot ce instalează Bower
/public/lib/bootstrap
/public/lib/datatables.net
```

Să elaborăm fișierul `Dockerfile`

```yaml
FROM node:14
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV
EXPOSE 8080
#ENV NODE_ENV=production
WORKDIR /aplicatii/prima
COPY package.json package-lock*.json ./
RUN npm install && npm cache clean --force
COPY . .
CMD ["node", "./bin/www"]
```

Pornim să construim serviciile.

```yaml
version: '2.4'
services:
  express:
    build: .
    args:
      - NODE_ENV=development
    ports:
      - 3000:3000
    volumes:
      - .:/app
    environment:
      - DEBUG=sample-express:*
      - DATABASE_CLIENT=mongo
      - DATABASE_HOST=mongo
      - DATABASE_PORT=27017
      - DATABASE_NAME=teste
      - NODE_ENV=development
  mongo:
    image: mongo
    volumes:
      - mongo:/data/db
    environment:
      - MONGO_INITDB_DATABASE=teste
volumes:
  mongo:
```

Construim containerul cu `docker-compose build` și ridicăm aplicația cu `docker-compose up -d`. Pentru a verifica că avem containerul în stare de funcționare: `docker-compose ps`.

Această soluție funcționează pentru `docker-compose run express npm install` care va instala pachetele pe sistemul gazdă, dar vor fi reflectate și în container datorită bind-mounting-ul `.:/app`. Remarcă faptul că poți rula comenzi direct pe numele serviciilor (*express*). Partea neplăcută este că pachetele instalate pe host, fiind accesibile containerului, vor fi pregătite să slujească doar containerului. Nu vor putea fi folosite pe mașina gazdă, dacă se dorește rularea aplicației în afara containerului. Pe scurt, pachetele sunt utilizabile doar prin container.

Cea de-a doua soluție ar fi mutarea cu un director mai sus a lui `node_modules`. Acest lucru este comportamentul implicit al lui Node.js, care va căuta directorul `node_modules` în directorul din care rulează aplicația, iar dacă nu-l găsește, va căuta cu un director mai sus ș.a.m.d.

Să remodelăm fișierul `Dockerfile`. Vom menționa directorul de lucru cu o ramură mai sus și apoi vom schomba mai jos de unde va rula aplicația.

```yaml
FROM node:14
ENV NODE_ENV=production
WORKDIR /aplicatii
COPY package.json package-lock*.json ./
RUN npm install && npm cache clean --force
WORKDIR /aplicatii/prima
COPY . .
CMD ["node", "./bin/www"]
```

Va trebui modifica și `docker-compose.yml`. Problema în această soluție este că pachetele se vor instala în `node_modules` pe gazdă în directorul din care va rula și aplicația. Dar proiectul este să folosim `node_modules` cu un director mai sus. În acest caz, avem nevoie să le ascundem pe cele de pe gazdă prin menționarea unui nou volum către cele de mai sus cu o ramură. Vom crea un volum anonim (nu va fi păstrat) - pui un volum într-un bind-mount.

```yaml
version: '2.4'
services:
  express:
    build: .
    ports:
      - 3000:3000
    volumes:
      - .:/node/app
      - /node/app/node_modules
    environment:
      - DEBUG=sample-express:*
```

Construim containerul cu `docker-compose build` și ridicăm aplicația cu `docker-compose up -d`. Pentru vedea structura creată `docker-compose exec express bash`. Un ls pe `node_modules` ar trebui să indice un director gol.

Motivul pentru care vei adopta o astfel de soluție se leagă de posibilitatea rulării și pe alte sisteme de operare. În cazul folosirii Linux, prima soluție este ok.

### Rularea de comenzi în aplicație

În cazul în care ai nevoi să rulezi o comandă în aplicație, nu este nevoie neapărat să ai containerul pornit. Poți foarte bine să folosești `docker-compose run` și Docker va onora toate instrucțiunile și straturile din fișierul `docker-compose.yml`. În acest caz, Docker va crea un container dedicat pentru rularea comenzii.

Pentru cazul în care containerul deja rulează, se va folosi `docker-compose exec`, care va crea un nou shell pentru container.

### Rularea lui nodemon

Atunci când dezvolți pe propriul sistem Linux, poți instala `nodemon` global, dar pentru o instalare într-un container va trebui pus într-o declarație `command`. Nu uita ca la `environment` să adaugi `- NODE_ENV=development`. Această mențiune va atrage după sine instalarea tuturor dependințelor din secțiunea `devDependencies`.

```yaml
version: '2.4'
services:
  express:
    build: .
    command: /nume_director_radacina/node_modules/.bin/nodemon ./nume_director_radacina/app.js
    ports:
      - 3000:3000
    volumes:
      - .:/node/app
      - /node/app/node_modules
    environment:
      - DEBUG=sample-express:*
      - NODE_ENV=development
```

Pentru a putea rula aplicațiile/utilitarele care nu se află în global, va trebui amendat și `Dockerfile` cu o linie care să trimită la directorul binarelor. Este nevoie să suprascrii calea cu - `ENV PATH /nume_director_radacina/node_modules/.bin/:$PATH`.

```yaml
FROM node:14
ENV NODE_ENV=production
WORKDIR /aplicatii
COPY package.json package-lock*.json ./
RUN npm install && npm cache clean --force
ENV PATH /nume_director_radacina/node_modules/.bin/:$PATH
WORKDIR /aplicatii/prima
COPY . .
CMD ["node", "./bin/www"]
```

În acest moment ori de câte ori vei face build sau rebuild, vei avea acces la utilitare fără să mai specifici întreaga cale. S-ar fi putut pune și în `docker-compose`, dar pentru portabilitate, e mai bine în `Dockerfile`.

## Rezolvarea dependințelor

Uneori pot apărea situații când un serviciu depinde de pornirea sau existența altuia. Pentru a rezolva astfel de lanțuri, este nevoie să folosești `depends_on:nume_serviciu`. Această posibilitate este oferită de versiunea 2 a fișierului, nu versiunea 3.

Pentru a rezolva problema dependințeler serviciilor unele de altele, mai întâi de toate, versiunea fișierului `docker-compose` trebuie să fie mare sau egal cu 2.3. Apoi, fiecare serviciu trebuie să se termine cu această linie pentru fiecare serviciu menționat în `depends_on`: `condition: service_healthy`.

Să presupunem că avem un serviu complex format din mai multe servicii.

```yaml
version: '2.4'
services:
  infrastructura:
    build:
      context: .
      target: prod
    ports:
      - '8080:80'
    volumes:
      - .:/var/www/kolector
    depends_on:
      frontend:
        condition: service_healthy

  frontend:
    image: nginx
    depends_on:
      servicenode:
        condition: service_healthy

  servicenode:
    image: node:14.4.0
    command: nodemon --inspect=0.0.0.0:9229 app.js
    environment:
      - NODE_ENV=development
    ports:
      - '8080:80'
      - '9229:9229'
    healthcheck:
      # asigură-te că imaginea de node are curl preinstalat
      test: curl -f http://127.0.0.1
    depends_on:
      mongo:
        condition: service_healthy
      redis:
        condition: service_healthy
      es01:
        condition: service_healthy
      es02:
        condition: service_healthy
      kibana:
        condition: service_healthy

  mongo:
    image: mongo:4.2.8-bionic
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongo localhost:27017/test --quiet

  redis:
      image: redis:alpine
      healthcheck:
        test: ["CMD", "redis-cli", "ping"]
        interval: 1s
        timeout: 3s
        retries: 30

  es01:
    image: elasticsearch:7.8.0
    container_name: es01
    environment:
      - node.name=elasticsearch
      - cluster.name=es-docker-cluster
      - discovery.seed_hosts=es02
      - cluster.initial_master_nodes=es01,es02
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      # Mprește la 2G: -Xmx2g -Xms2g
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - data01:/usr/share/elasticsearch/data
    healthcheck:
      test: ["CMD-SHELL", "curl --silent --fail localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 30s
      retries: 3

  es02:
    image: elasticsearch:7.8.0
    container_name: es02
    environment:
      - node.name=elasticsearch
      - cluster.name=es-docker-cluster
      - discovery.seed_hosts=es02
      - cluster.initial_master_nodes=es01,es02
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - data02:/usr/share/elasticsearch/data
  # sudo nano /etc/sysctl.conf unde adaugi vm.max_map_count=262144
  # aplică setarea cu sysctl -w vm.max_map_count=262144
  kibana:
    image: kibana:7.8.0
    container_name: kibana
    depends_on:
      es01:
        condition: service_healthy
      es02:
        condition: service_healthy
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_URL=http://elasticsearch:9200
      - XPACK_MONITORING_ENABLED=false

volumes:
  data01:
    driver: local
  data02:
    driver: local
```

Aceste teste le faci pentru a nu avea erori la pornirea lui `node` deoarece un server a întârziat sau nu a pornit.

## Variabile de mediu

În cazul unui `docker-compose` poți preciza variabile de mediu care nu este același lucru cu obiectul YAML `environment` pe care îl trimiți containerului la momentul în care pornește. Folosind notația `${NUMEVAR}` poți rezolva aceste valori dinamice la momentul în care fișierul YAML este procesat.

```yaml
version: '2.4'
services:
  node:
    image: node:${VERSIUNE_NODE}
```

Apoi, în momentul executării `docker-compose up`, poți introduce variabila care va fi pasată în YAML.

```bash
VERSIUNE_NODE=14.4.0 docker-compose up
```

Variabilele mai pot fi puse în fișiere `.env`.

## Gestionarea microserviciilor

Ai nevoie de modalități pentru a coordona microserviciile pe măsură ce cresc numărul endpoint-urilor HTTP și a porturilor. Soluția ar fi integrarea unui serviciu de *reverse proxying* cum ar fi Nginx, HAProxy sau Traefik pentru rutarea headerelor. Pentru cazul în care ai nevoie să realizezi servicii pe HTTPS, va trebui să creezi local și să pui la dispoziția unui proxy aceste certificate.

```yaml
version: '2.4'

services:
  nginx-proxy:
    image: jwilder/nginx-proxy
    ports:
      - "80:80"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock

  nginx:
    image: nginx
    environment:
      - VIRTUAL_HOST=serviciul1.localhost

  ghost:
    image: node:14.4.0-slim
    environment:
      - VIRTUAL_HOST=aplicatie.localhost
```

În setarea din exemplu, este creat un proxy bazat pe nginx pus înaintea tuturor celorlalte servicii. Dacă nu am avea proxy-ul deasupra serviciilor, ar trebui să publicăm porturile fiecăruia. Setarea va asculta traficul din docker engine și astfel poate răspunde la tot ce vine pe portul 80 pe baza DNS-ului sau al unui host virtual.

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
