# Docker compose

Docker Compose este un instrument pentru definirea și rularea unei aplicații care folosește mai multe containere. Petru a reuși acest lucru este folosit un fișier YAML în care sunt precizate toate serviciile și modul cum se configurează.

## docker-compose.yml

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
      dockerfile: dockerfilenode
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

În cazul serviciului de baze de date Postgres, ceea ce este vizibil în plus este secțiunea dedicată variabilelor de mediu pentru imaginea repectivă. Setarea de parolă este necesară accesului din celelalte containere.

## docker-compose build

Este comanda care va construi întreg eșafodajul de imagini cu sau fără particularizări, volume, driverele de rețea și rețelele folosite de viitoarele containere.
Uneori este nevoie de reconstruirea unui singur serviciu, de exemplu în cazul în care dorești o imagine actualizată de pe Docker Hub. În acest caz poți aplica `docker-compose build nume_serviciu` pentru a reconstrui unul singur.

## docker-compose up

Este comanda care pornește containerele. Util ar fi să rulezi comanda `detached`: `docker-compose up -d`. Mai sunt cazuri în care poate dorești pornirea unui singur serviciu din toate cele pe care le-ai menționat în `docker-compose.yml`.

```bash
docker-compose up --no-deps node
```

Pentru această comandă, nu este nevoie să modifici celelate componente ale mediului. Pentru a specifica acest lucru, se introduce opțiunea `--no-deps`. Acest lucru va conduce la oprirea și reconfigurarea doar a imaginii de nod cu repornirea acestuia fără a afecta celelalte componente.

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
