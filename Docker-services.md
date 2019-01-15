# Docker services

Serviciile Docker sunt un plan de construcție al tuturor containerelor care vor fi folosite. În cazul unei aplicații distribuite, componentele se numesc *servicii*. Aceste servicii nu sunt nimic altceva decât containere. Un singur serviciu este constituit de o singură imagine.

Aceste servicii sunt definite prin construirea unui fișier `docker-compose.yml`.

```yml
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

Exemplul instruiește motorul docker să descarce de pe web imaginea `numeImagine` cu versiunea `0.1` din depozitul online al lui Docker. Apoi fă un deployment care să genereze 5 containere ale aceleiași imagini. Cele cinci instanțe vor constitui un singur serviciu care va purta numele generic de `web`. Dacă în timpul exploatării vei modifica numărul de replici, trebuie să inițiezi din nou comanda `docker stack deploy -c docker-compose.yml testApp` fără a reporni containerele.

 Resursele pe care fiecare container le va consuma sunt 10% din toată puterea de calcul pe care o oferă procesoarele mașinii. Fiecare instanță nu trebuie să depășească mai mult de 50M. Dacă unul din containere cade, repornește-l imediat.
Apoi leagă portul 4000 al serviciului cu portul 80 al mașinii.
În cadrul acestui serviciu, se va construi rețeaua `webnet` care va beneficia de un mecanism de balansare.

În final, vei declara rețeaua `webnet` pentru a fi inițiată de motor.

Pentru a rula aplicația, mai întâi trebuie pornit roiul cu `docker swarm init`. Întreaga aplicație trebuie să poarte un nume, de exemplu `testApp`. Acum poți rula comanda care va porni această aplicație: `docker stack deploy -c docker-complose.yml testApp`.

Pentru a lista serviciile care au pornit, poți folosi comanda `docker service ls`.

Un singur container care rulează într-un serviciu se numește `task`. Task-urile primesc ID-uri unice care se incrementează până la valoarea delarată la `replicas` în `docker-compose.yml`.

Pentru a lista serviciile aferente unei aplicații rulezi `docker service ps numeAplicatie`.

Pentru a opri aplicația, vei inișia comanda `docker stack rm restApp` și vei dezactiva roiul - swarm-ul cu `docker swarm leave --force`.