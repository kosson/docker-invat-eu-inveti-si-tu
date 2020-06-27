# Stacks - servicii stratificate

Un stack este un grup de servicii inter-relaționate care au dependințe comune și care pot fi orchestrate și scalate împreună. Ceea ce reușești cu un stack poți defini și coordona funcționalitatea unei aplicații întregi (chiar dacă aplicațiile foarte complexe vor dori să folosească stack-uri multiple).

Uneori ai nevoie să adaugi noi servicii în fișierul `docker-compose.yml`.

```yaml
version: "3"
services:
  web:
    image: kosson/numeImagine:0.1
    deploy:
      replicas: 5
      resources:
        limits:
          cpus: "0.1"
          memory: 50M
      restart_policy:
        condition: on-failure
    ports:
      - "4000:80"
    networks:
      - webnet
  visualizer:
    image: dockersamples/visualizer:stable
    ports:
      - "8080:8080"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"
    deploy:
      placement:
        constraints: [node.role == manager]
    networks:
      - webnet
networks:
  webnet:
```

Acestui fișier, i s-a adăugat un servici de vizualizare numit `visualizer` care este un pachet software oferit chiar de Docker (https://github.com/ManoMarks/docker-swarm-visualizer). Volumul menționat va oferi acces containerului la fișierul de socket al lui Docker. Cheia `placement` menționează faptul că serviciul nu va funcționa decât pe managerul de swarm și niciodată pe un worker.

Pentru a realiza un astfel de serviciu de vizualizare, trebuie să conectezi o consolă la mașina virtuală cu rol de manager.

Faci un deployment cu `docker stack deploy -c docker-compose.yml testApp`. Accesănd portul 8080 menționat pentru vizualizator, vei putea accesa vizualizatorul de pe IP-ul mașinii virtuale cu rol de manager. Imaginea oferită este a 6 containere care rulează: 5 sunt aplicația și unul este un manager.

Aceleași informații le-am putea obține și din consola conectată executând `docker stack ps numeApp`.

## Date de sesiune

Pentru a păstra un set de date, putem angaja o instanță de Redis.

```yaml
version: "3"
services:
  web:
    image: kosson/numeImagine:0.1
    deploy:
      replicas: 5
      resources:
        limits:
          cpus: "0.1"
          memory: 50M
      restart_policy:
        condition: on-failure
    ports:
      - "4000:80"
    networks:
      - webnet
  visualizer:
    image: dockersamples/visualizer:stable
    ports:
      - "8080:8080"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"
    deploy:
      placement:
        constraints: [node.role == manager]
    networks:
      - webnet
  redis:
    image: redis
    ports:
      - "6379:6379"
    volumes:
      - "/home/docker/data:/data"
    deploy:
      placement:
        constraints: [node.role == manager]
    command: redis-server --appendonly yes
    networks:
      - webnet
networks:
  webnet:
```

Ceea ce este observabil din prima este că Redis montează în containerul în care va rula un director `/data`, care mapează pe directorul `/home/docker/data`. Reține faptul că datele care vor fi puse în `/home/docker/data` vor fi cele care vor fi persistate între sesiunile de lucru ale stack-ului. Datele din directorul `/data` din containerul Redis, vor fi distruse dacă se face un redeployment.

Pentru a împlini cerințele, mai întâi va trebui să creăm directorul `data` pe mașina cu rol de manager: `docker-machine ssh virtuala1 "mkdir ./data"`. În acest moment, va trebui să conectezi consola la daemonul Docker al mașinii virtuale (vezi swarm clusters). Pentru a scurta timpii, aplică cele două comenzi rapid.

```bash
docker-machine env virtuala1
eval $(docker-machine env virtuala1)
```

Faci imediat un redeployment cu `docker stack deploy -c docker-compose.yml testApp`.
Verifici imediat pentru a vedea dacă serviciul redis a fost adăugat cu succes: `docker service ls`. Apelând la vizualizator, serviciul ar trebui să apară.

## Docker services

Serviciile Docker sunt un plan de construcție al tuturor containerelor care vor fi folosite. În cazul unei aplicații distribuite, componentele se numesc *servicii*. Aceste servicii nu sunt nimic altceva decât containere. Un singur serviciu este constituit de o singură imagine.

Aceste servicii sunt definite prin construirea unui fișier `docker-compose.yml`.

```yaml
version: "3"
services:
  web:
    image: kosson/numeImagine:0.1
    deploy:
      replicas: 5
      resources:
        limits:
          cpus: "0.1"
          memory: 50M
      restart_policy:
        condition: on-failure
    ports:
      - "4000:80"
    networks:
      - webnet
networks:
  webnet:
```

Exemplul instruiește motorul `docker` să descarce de pe web imaginea `numeImagine` cu versiunea `0.1` din depozitul online al utilizatorului kosson de la Docker Hub. Apoi fă un deployment care să genereze 5 containere ale aceleiași imagini. Cele cinci instanțe vor constitui un singur serviciu care va purta numele generic de `web`. Ceea ce tocmai s-a realizat poate fi privit ca o stivă de servicii, în engleză, un `stack`.

Dacă în timpul exploatării vei modifica numărul de replici sau alte modificări, trebuie să inițiezi din nou comanda `docker stack deploy -c docker-compose.yml testApp` fără a reporni containerele. pentru că aplicația noastră trebuie să aibă un nume, o vom denumi `testApp`.

Resursele pe care fiecare container le va consuma sunt 10% din toată puterea de calcul pe care o oferă procesoarele mașinii. Fiecare instanță nu trebuie să depășească mai mult de 50M. Dacă unul din containere cade, repornește-l imediat.
Apoi leagă portul 4000 al serviciului cu portul 80 al mașinii.
În cadrul acestui serviciu, se va construi rețeaua `webnet` care va beneficia de un mecanism de balansare.

În final, vei declara rețeaua `webnet` pentru a fi inițiată de motor.

## Rularea aplicației într-un swarm

Pentru a rula aplicația, mai întâi trebuie pornit roiul cu `docker swarm init`. Conectează shell-ul curent la mașina virtuală care joacă rol de manager de swarm `docker-machine env virtuala1` urmat de `eval $(docker-machine env virtuala1)`. Întreaga aplicație trebuie să poarte un nume, de exemplu `testApp`. Acum poți rula comanda care va porni această aplicație: `docker stack deploy -c docker-complose.yml testApp`.

Pentru a lista serviciile care au pornit, poți folosi comanda `docker service ls`.

Un singur container care rulează într-un serviciu se numește `task`. Task-urile primesc ID-uri unice care se incrementează până la valoarea delarată la `replicas` în `docker-compose.yml`.

Pentru a lista serviciile aferente unei aplicații rulezi `docker service ps numeAplicatie`.

Pentru a opri aplicația, vei iniția comanda `docker stack rm restApp` și vei dezactiva roiul - swarm-ul cu `docker swarm leave --force`.
