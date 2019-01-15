# Docker compose

Docker Compose este un instrument pentru definirea și rularea unei aplicații care folosește mai multe containere. Pentru a reuși acest lucru este folosit un fișier YAML în care sunt precizate toate serviciile și modul cum se configurează.

## docker-compose.yml

Fișierele `docker-compose` folosesc un format de fișier care se numește YAML. Acronimul vine de la recursivul YAML Ain't Markup Language, fiind o structură de codare a informațiilor (serializare a datelor) bazată pe spațiere și pe linii, care țintește ușoara înțelegere de către oameni, dar și mașini. Mai multe detalii privind acest tip de fișiere la yaml.org.

Acest fișier este folosit pentru configurarea serviciilor. Acest fișier este prelucrat printr-un proces de `build`, din care va rezulta o imagine.

Fișierele de configurare se construiesc după cerințele unei versiuni. Fișierele `docker-compose` au la început menționată versiunea de fișier. În secțiunea `services` sunt menționate cele care vor fi folosite: `node`, `mongodb`, etc.

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

În cazul de mai sus, serviciul `node` va fi unul particularizat pentru că construit pornind cu fișierele din directorul curent (`.`), menționat la `context`, folosind fișierul `dockerfile` numit `dockerfilenode`. Pe scurt, vom căuta să *injectăm* aplicația proprie pe un layer suplimentar chiar în imaginea de node. Pentru ca toate containerele care vor rula, trebuie să existe o rețea în care să comunice. Rețeaua va fi precizată cu un nume la alegere la secțiunea `networks`. Uzual, rețeaua este de tip `bridge`. Serviciului `node` îi poți adăuga un `mongodb`.

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
Când ai terminat de adăugat toate componentele, se va folosi comanda `docker-compose build` pentru a construi toate imaginile și pentru a parametriza rețeaua de comunicare. După această etapă, se poate folosi comanda `docker-compose up` pentru a genera containerele.

În cazul serviciului de baze de date Postgres, ceea ce este vizibil în plus este secțiunea dedicată variabilelor de mediu pentru imaginea respectivă. Setarea de parolă este necesară accesului din celelalte containere.

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

### Lansarea de comenzi

Uneori ai nevoie să lansezi aplicațiile la momentul constituirii containerului prin rularea lui `docker compose run`.

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

Aceste instrucțiuni îi spun lui `docker-compose` să caute fișierul `Dockerfile` în directorul `app`. Apoi se va monta directorul mașinii gazdă `app` în container într-un director `app`.

La rețele, au fost menționate două. Cea de `front-end`, care va expune porturile către mașina gazdă și `back-end`, care va rula izolat fără a expune nimic.

## Versiunea 3 a fișierului compose

Versiunea de lucru care trebuie specificată pentru fișierul `docker-compose.yml` este importantă pentru că sunt diferite interpretări ale directivelor de pe fiecare linie în funcție de versiunea de `docker-compose` care este instalată odată cu Docker. Începând cu Docker 18.06.0+ este indicat ca versiunea folosită să fie 3.7.

## docker-compose build

Este comanda care va construi întreg eșafodajul de imagini cu sau fără particularizări, volume, driverele de rețea și rețelele folosite de viitoarele containere.
Uneori este nevoie de reconstruirea unui singur serviciu, de exemplu în cazul în care dorești o imagine actualizată de pe Docker Hub. În acest caz poți aplica `docker-compose build nume_serviciu` pentru a reconstrui unul singur.

## docker-compose up

Este comanda care pornește containerele. Util ar fi să rulezi comanda `detached`: `docker-compose up -d`. Mai sunt cazuri în care poate dorești pornirea unui singur serviciu din toate cele pe care le-ai menționat în `docker-compose.yml`.

```bash
docker-compose up --no-deps node
```

Pentru această comandă, nu este nevoie să modifici celelalte componente ale mediului. Pentru a specifica acest lucru, se introduce opțiunea `--no-deps`. Acest lucru va conduce la oprirea și reconfigurarea doar a imaginii de nod cu repornirea acestuia fără a afecta celelalte componente.

## docker-compose down

Oprești containerele din construcția `docker-compose.yml`. Este folosită pentru momentul în care ai nevoie de a opri toate containerele din varii motive. Dacă vrei să oprești containerele și să distrugi și imaginile, poți apela la opțiunea `--rmi all`. Dacă nici volumele în care persiști datele nu mai dorești să le păstrezi, vei menționa și opțiunea `--volumes`.

```bash
docker-compose down --rmi all --volumes
```

## docker-compose logs

Oferă accesul la istoric.

## docker-compose ps

## docker-compose stop

## docker-compose start

## docker-compose rm
