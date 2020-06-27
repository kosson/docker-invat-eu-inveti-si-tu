# Docker compose

Docker Compose este un instrument pentru definirea și rularea unei aplicații care folosește mai multe containere. Pentru a reuși acest lucru este folosit un fișier YAML în care sunt precizate toate serviciile și modul cum se configurează.

## Fișierul `docker-compose.yml`

Fișierele `docker-compose.yml` folosesc un format de fișier care se numește YAML. Acronimul vine de la recursivul YAML Ain't Markup Language, fiind o structură de codare a informațiilor (serializare a datelor) bazată pe spațiere și pe linii, care țintește ușoara înțelegere de către oameni, dar și mașini. Mai multe detalii privind acest tip de fișiere la yaml.org.

Acest fișier este folosit pentru configurarea serviciilor. De fapt ceea ce poți realiza este o orchestrare a mai multor containere Docker și pentru a crea legături între acestea. Acest fișier este prelucrat printr-un proces de `build`, din care va rezulta o imagine.

Fișierele de configurare se construiesc după cerințele unei versiuni. Fișierele `docker-compose.yml` au la început menționată versiunea de fișier. În secțiunea `services` sunt menționate cele care vor fi folosite: `node`, `mongodb`, etc.

```yaml
version: '2'
services:
  node:
    build:
      context: .
      dockerfile: dockerfilenode
    networks:
      - prima-retea
```

În cazul de mai sus, serviciul `node` va fi unul particularizat pentru că construit pornind cu fișierele din directorul curent (`.`), menționat la `context`, folosind fișierul `Dockerfile` numit `dockerfilenode`. Pe scurt, vom căuta să *injectăm* aplicația proprie pe un layer suplimentar chiar în imaginea de node. Pentru ca toate containerele care vor rula, trebuie să existe o rețea în care să comunice. Rețeaua va fi precizată cu un nume la alegere la secțiunea `networks`. Uzual, rețeaua este de tip `bridge`. Serviciului `node` îi poți adăuga un `mongodb`.

```yaml
version: '2'
services:
  node:
    build:
      context: .
      dockerfile: numele_Dokerfileului
    ports:
      - "3000:3000"
    networks:
      - prima-retea
  mongodb:
    image: mongo
    networks:
      - prima-retea
  postgres:
    image: postgres
    environment:
      POSTGRES_PASSWORD: "cevaBun1ceL$"
    networks:
      - prima-retea
networks:
  prima-retea
    driver: bridge
```

În cazul serviciului `mongo`, nu vom crea o imagine care să fie particularizată, așa că vom folosi imaginea pusă la dispoziție de hub-ul Docker.
Când ai terminat de adăugat toate componentele, se va folosi comanda `docker-compose build` pentru a construi toate imaginile și pentru a parametriza rețeaua de comunicare. După această etapă, se poate folosi comanda `docker-compose up` pentru a genera containerele. În cazul în care dorim să refolosim terminalul, vom pasa și `-d`.

În cazul serviciului de baze de date Postgres, ceea ce este vizibil în plus este secțiunea dedicată variabilelor de mediu pentru imaginea respectivă. Setarea de parolă este necesară accesului din celelalte containere.

### Versiunea 3 a fișierului `docker-compose.yml`

Versiunea 3 nu va înlocui versiunea 2. Versiunea 2 a fișierului este focalizată pe noduri unice folosite pentru dezvoltare sau testare. Versiunea 3 se focalizează mai mult pe orchestrarea multi-node. Este recomandabil ca în cazul în care nu este folosit Kubernetes sau Swarm, folosește versiunea 2, care este actualizată continuu.

Versiunea de lucru care trebuie specificată pentru fișierul `docker-compose.yml` este importantă pentru că sunt diferite interpretări ale directivelor de pe fiecare linie în funcție de versiunea de `docker-compose` care este instalată odată cu Docker. Începând cu Docker 18.06.0+ este indicat ca versiunea folosită să fie 3.7.

### Gestionarea volumelor

În cazul în care dorești ca un volum să fie cunoscut după un nume date de tine, dar să fie legat de un director din imagine, acest lucru trebuie menționat în fișierul `docker-compose.yml` în mod explicit.

Acest lucru este echivalentul creării unui volum mai întâi rulând `docker volume create volume nume_dorit_al_volumului`, urmat de atașarea volumului la container.

```bash
docker container run -d --name redis -v nume_dorit:/data --network reteaua_containerelor redis:alpine
```

Acest lucru se realizează mai simplu prin introducerea directă în `docker-compose.yml`.

```yaml
version "3"
services:
  redis:
    image: alpine:redis
    volumes:
      - date_redis:/data
    restart: always
volumes:
  date_redis:
```

## Obținerea unui shell într-un container

În cazul în care este nevoie să obții un shell într-unul din containerele care constituie aplicația, se va folosi subcomanda `exec`. Să presupunem că un serviciu numit `db` este o bază de date PostgreSQL. Pentru a obține un shell în containerul bazei de date după ce întregul eșafodaj a fost *ridicat* cu `docker-compose -f docker-compose.special.yml up -d`, poți apela la subcomanda `exec` caracteristică containerelor:

```bash
docker-compose -f docker-compose.special.yml exec db bash
```

## Utilitarul docker-compose drept CLI

Uneori ai nevoie să lansezi aplicațiile la momentul constituirii containerului prin rularea lui `docker-compose run`.

```yaml
version "3"
services:
  app:
    build: ./app
    command: python3 app.py
    volumes:
      - ./app:/app
    ports:
      - "5000:80"
    networks:
      - front-end
      - back-end
```

Aceste instrucțiuni îi spun lui `docker-compose.yml` să caute fișierul `Dockerfile` în directorul `app`. Apoi se va monta directorul mașinii gazdă `app` în container într-un director `app`.

La rețele, au fost menționate două. Cea de `front-end`, care va expune porturile către mașina gazdă și `back-end`, care va rula izolat fără a expune nimic.

### Comanda `docker-compose build`

Este comanda care va construi întreg eșafodajul de imagini cu sau fără particularizări, volume, driverele de rețea și rețelele folosite de viitoarele containere. Este folosită pentru build-uri și rebuild-uri.
Uneori este nevoie de reconstruirea unui singur serviciu, de exemplu în cazul în care dorești o imagine actualizată de pe Docker Hub. În acest caz poți aplica `docker-compose build nume_serviciu` pentru a reconstrui unul singur.

Dacă ai modificat fișierul `Dockerfile` va trebui să faci un rebuild al imaginilor pentru a reflecta ultimele modificări. De exemplu, să instalezi un utilitar.
Un posibil scenariu de rebuild este `docker-compose up -d --build`.

Pentru a reconstrui imaginile de fiecare dată, poți specifica `docker-compose build --no-cache`. Flag-ul `--no-cache` ca curăța și va ține imaginile la o dimensiune căt mai redusă.

### Comanda `docker-compose up`

Este comanda care pornește containerele. Util ar fi să rulezi comanda `detached`: `docker-compose up -d`. Mai sunt cazuri în care poate dorești pornirea unui singur serviciu din toate cele pe care le-ai menționat în `docker-compose.yml`.

```bash
docker-compose up --no-deps node
```

Pentru această comandă, nu este nevoie să modifici celelalte componente ale mediului. Pentru a specifica acest lucru, se introduce opțiunea `--no-deps`. Acest lucru va conduce la oprirea și reconfigurarea doar a imaginii de nod cu repornirea acestuia fără a afecta celelalte componente.

În cazul în care dorești să specifici un anumit fișier `docker-compose.yml`, să spunem că se numește `docker-compose.special.yml`, va trebui menționat în comandă folosind `-f`.

```bash
docker-compose -f docker-compose.special.yml up -d
```

### Comanda `docker-compose down`

Oprești containerele din construcția `docker-compose.yml`. Este folosită pentru momentul în care ai nevoie de a opri toate containerele din varii motive. Dacă vrei să oprești containerele și să distrugi și imaginile, poți apela la opțiunea `--rmi all`. Dacă nici volumele în care persiști datele nu mai dorești să le păstrezi, vei menționa și opțiunea `--volumes` (sau `-v`).

```bash
docker-compose down --rmi all --volumes
```

### Comanda `docker-compose logs`

Oferă accesul la istoric. Log-urile le poți consulta pentru toate serviciile definite în `dockerfile`, precum în `docker-compose log web`. Pentru toate serviciile, lansezi o comandă `docker-compose log`.

### Comanda `docker-compose ps`

Comanda afișează o listă a serviciilor.

De exemplu:

```textul
Name                    Command               State           Ports
---------------------------------------------------------------------------------
sample-02_web_1   docker-entrypoint.sh node  ...   Up      0.0.0.0:3000->3000/tcp
```

### Comanda `docker-compose stop`

Această comandă oprește containerele, nu le șterge.

### Comanda `docker-compose start`

### Comanda `docker-compose logs`

Comanda afișează log-urile tuturor containerelor.

### Comanda `docker-compose push`

Încarcă imaginile în registry.

### Comanda `docker-compose exec`

Este o comandă pentru a executa o comandă într-un container.

### Comanda `docker-compose rm`

## Studiul unui fișier `docker-compose.yml`

```yaml
version: '3.6'
services:
  api:
    image: node:10.15.3-alpine
    container_name: tqd-node
    build: .
    ports:
      - 3000:3000
    environment:
     - NODE_ENV=local
     - ES_HOST=elasticsearch
     - NODE_PORT=3000
     - ELASTIC_URL=http://elasticsearch:9200
    volumes:
      - .:/usr/src/app/quotes
    command: npm run start
    links:
        - elasticsearch
    depends_on:
        - elasticsearch
    networks:
      - esnet
  elasticsearch:
    container_name: tqd-elasticsearch
    image: docker.elastic.co/elasticsearch/elasticsearch:7.0.1
    volumes:
      - esdata:/usr/share/elasticsearch/data
    environment:
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - discovery.type=single-node
    logging:
      driver: none
    ports:
      - 9300:9300
      - 9200:9200
    networks:
      - esnet
volumes:
  esdata:
networks:
  esnet:
```

În secțiunea `services` declarăm primul serviciu numit `api`, care va fi aplicația noastră Node.js. Acest container va fi numit arbitrar `tqd-node`.
Comanda `build` va căuta în același director în care se află fișierul `docker-compose.yml` fișierul `Dockerfile.yml` pentru a genera containerul dedicat serviciului. Va fi expus portul `3000` făcându-se un NAT traversal de la portul intern 3000 al containerului, la portul extern accesibil mașinii pe care se face construcția serviciilor.
Urmează setarea unor variabile de mediu și apoi se montează un director al containerului în care vor fi păstrate date chiar și după restartul containerului (permanentizare).
Urmează menționarea comenzii care trebuie lansată la momentul în care containerul este pornit.

```yaml
links:
    - elasticsearch
depends_on:
    - elasticsearch
```

Urmează menționarea faptului că prezentul container al aplicației se leagă de containerul în care va rula Elasticsearch numit `elasticsearch`. Instrucțiunea `depends_on` spune curentului container că depinde de containerul `elasticsearch` și trebuie să aștepte ca acela să pornească mai întâi.

Ultima instrucțiune îi spune containerului să conecteze serviciul `api` pe rețeaua `esnet`. Acest lucru trebuie menționat expres pentru că fiecare container are rețeaua lui. În cazul nostru, instruim containerul `api` să se conecteze la rețeaua generată de containerul în care va rula Elasticsearch.

Pentru a nu crea loguri, la setarea serviciului elasticsearch, se va pune la `logging` un `driver` pe valoarea `none`.

## Resurse

- [Full-text search with Node.js and ElasticSearch on Docker](https://www.jsmonday.dev/articles/38/full-text-search-with-node-js-and-elasticsearch-on-docker)
