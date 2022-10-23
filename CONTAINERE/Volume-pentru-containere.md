# Persistența datelor

Toate datele care sunt create într-un container, sunt stocate într-un layer writable. Adu-ți mereu aminte de faptul că un container, de regulă, nu poate fi modificat în ceea ce privește datele (*immutable*), fiind efemer. Pe cale de consecință, atunci când containerul nu mai există, nici datele scrise în acesta, nu vor mai fi. Atunci când un container este oprit, datele din sistemul de fișiere generat intern, vor dispărea (comportamentul din oficiu - OverlayFS). 

Din nefericire, datele din container nu pot fi mutate în alte locații ale sistemului de fișiere gazdă. Vorbim despre necesitatea de a beneficia de un mecanism care să asigure persistența datelor. Pentru că de cele mai multe ori vei avea nevoie de date persistente, cum ar fi loguri sau chiar bazele de date în anumite cazuri, Docker oferă *volume* care au un ciclu de viață separat de cel al containerelor și *bind mounts*. În cazul în care Docker funcționează pe o mașină Linux, poți folosi și `tmpfs mount` care vor rula în memorie. Pentru a scrie datele în layer-ul writable, este nevoie ca sistemul de fișiere să fie gestionat de un driver specializat - driver storage.

Din punctul de vedere al unui container, datele sunt văzute, fie ca un director, fie ca un fișier mare în structura de fișiere proprie.

## tmpfs

Această zonă de stocare a datelor se formează strict în memoria mașinii gazdă. Swarm-urile Docker folosesc tmpfs.
## Volume

Un volum este un director asociat unui container în care se pot introduce date. Toate containerele pot folosi același volum. Volumele sunt păstrate chiar și în cazul în care containerul este șters din motive evidente de salvgardare a datelor. Volumele se creează în structura de directoare a locului unde este instalat Docker pe mașină: `/var/lib/docker/volumes/`. Volumele sunt cea mai bună opțiune pentru a realiza un mecanism de persistență a datelor. Ca administrator trebuie să te asiguri de faptul că niciun proces în afară de Docker nu va modifica această zonă a sistemului de operare.

Pentru a vedea cum sunt gestionate volumele în imaginile oficiale, am ales [MariaDB latest](https://hub.docker.com/_/mariadb/tags) din Docker Hub. Unul din layere este dedicat: `VOLUME [/var/lib/mysql]`. În cazul în care vei rula acest container sau oricare altul care creează un volum, poți inspecta ce volume au fost create prin `docker volume ls`. De altfel, volumele apar și în momentul în care investighezi cum a fost configurat containerul folosind `docker container inspect`. În JSON-ul returnat vei vedea chiar unde este mapat volumul pe hard disk-ul mașinii gazdă. Dacă ai aflat care este hash-ul unui volum prin rularea lui `docker volume ls`, poți inspecta acel volum direct `docker volume inspect <hash>`. Reține faptul că volumele persistă după oprirea containerelor. Încă un lucru important este acela că în sistemele NIX (Linux/GNU și MacOS), de fapt containerele rulează într-o mașină virtuală rudimentară, ceea ce nu permite accesul direct la conținutul volumelor.

Pentru crearea unui volum există o comandă specifică: `docker volume create`. Cel mai adesea aceste volume de vor crea atunci când sunt lansate containerele sau atunci când sunt create serviciile.

Crearea unui volum atrage după sine crearea unui director pe mașina gazdă. Pentru a avea acces la ele, aceste volume sunt montate de containere. Un anumit container poate fi montat de mai multe containere. În momentul în care containerele și-au încheiat activitatea, directorul nu se va șterge. Volumele care nu mai sunt folosite, pot fi șterse folosind comanda `docker volume prune`.

Aceste volume pot fi specificate în fișierele `Dockerfile` prin instrucțiunea `VOLUME` sau la momentul rulării imaginii, se poate specifica folosind opțiunea `-v`.

```bash
docker run -v /date -it busybox
```

O comandă `docker run -v $(pwd)/nume_dir:/director_de_lucru/nume_dir -v $(pwd)/alt_dir:/director_de_lucru/alt_dir nume_container` va copia rezultatele din directoarele din container în directoarele din gazdă.

Astfel, vei crea un director nou montat în container. Driverele pentru volume permit stocarea volumelor la distanță dacă acest lucru este dorit și pot oferi și criptare. Noile volume au conținutul pre-populat de un container, de regulă.

În momentul în care nu mai ai nevoie de un container la care dorești să renunți, ai posibilitatea de a elimina și volumul creat pentru acesta. Tot ceea ce trebuie să faci este să adaugi opțiunea `-v`.

```bash
docker rm -v 03fr44343
```

Volumele nu măresc dimensiunea containerelor care le folosesc pentru că pur și simplu, nu sunt legat organic de containere.

Volumele pot fi numite sau anonime. Cele anonime sunt montate primele de container și li se dau un nume aleatoriu. Nu există nicio diferență de comportament între cele două. Volumele mai permit stocarea datelor pe mașini la distanță sau în cloud. Volumele sunt șterse numai când acest lucru este dorit înadins.

Atunci când este nevoie să muți datele de pe o mașină gazdă pe alta, directorul în care se află volumele este cel care va fi mutat: `/var/lib/docker/volumes`.
## Comportamente ale volumelor

Dacă montezi un volum gol într-un director al containerului care este populat, fișierele și directoarele existente în acel director vor fi copiate în volumul gol. Pur și simplu se vor propaga și acolo.

Dacă pornești un container care menționează un volum care nu există, va fi creat acel volum. Această metodă este bună și pentru a pre-popula cu datele de care alt container are nevoie.

Dacă montezi un *bind mount* sau un volum care nu este gol într-un director al unui container, dar care nici acesta nu este gol, ceea ce exista va fi ignorat și ascuns. De îndată ce se face unmount, resursele preexistente sunt disponibile din nou.

## Montarea volumelor la run

Volumele, indiferent unde le specifici în container, de fapt vor fi montate în `/mnt`-ul gazdei. De exemplu, pentru a avea un director în care să dezvolți o aplicație pentru Node.js, va trebui să folosești un director în care codul tău să persiste. Pentru a porni un server de Node.js care să aibă un volum, poți să-l specifici în linia de comandă care pornește containerul.

```bash
docker container run -d --name aplicatie -p 8080:3000 -v ./calea/pe/host:/cale/din/container nume_imagine
```

Docker va crea volumul menționat de opțiunea `-v` prin alias-ul `./calea/pe/host`.

Întotdeauna menționează o cale relativă pe gazdă pentru că vei crește portabilitatea și gradul de reutilizare al aplicației. Același lucru se aplică și pentru crearea fișierelor `docker-compose.yml` cum ar fi în exemplul de mai jos.

```yaml
volumes:
  - ./cale/pe/host:/cale/din/container
```

Căile trebuie să fie mereu relative la directorul din care se ridică construcția docker-compose. În cazul în care folosești Linux, poți folosi utilitare precum `pwd` pentru a seta punctul de referință de la care se pornește.

### Volume cu nume

În cazul în care este necesar, la momentul pornirii containerelor cu `run`, se pot crea volume care poartă nume: `docker container run -d --name aplicatie -p 8080:3000 -v nume_volum:/cale/din/container nume_imagine`. Făcând acest lucru, la o investigare cu `docker volume ls`, volumul nou creat va avea un nume, nu un hash care este generat automat. Să aruncăm o privere la MariaDB.

```bash
docker container run -d --name mariadb -e MYSQL_ALLOW_EMPTY_PASSWORD=True -v mariadb_vol1:/var/lib/mysql mariadb
Unable to find image 'mariadb:latest' locally
latest: Pulling from library/mariadb
cf92e523b49e: Pull complete 
11a7b642a1b0: Pull complete 
d05db1f7ddc9: Pull complete 
043662c3afa1: Pull complete 
de48eea20795: Pull complete 
1a40b9e7476d: Pull complete 
d053ff7fa7cc: Pull complete 
f4459f17c9a8: Pull complete 
05ae67b7d96a: Pull complete 
9bd55ebdb8b3: Pull complete 
baf1cda74ce3: Pull complete 
Digest: sha256:59ef1139afa1ec26f98e316a8dbef657daf9f64f84e9378b190d1d7557ad2feb
Status: Downloaded newer image for mariadb:latest
4e58571c0d09a4b701fcea4a5e74fe3fda52d8f5be24b25280b86185fb3397d6

docker container ls
CONTAINER ID   IMAGE     COMMAND                  CREATED         STATUS         PORTS      NAMES
4e58571c0d09   mariadb   "docker-entrypoint.s…"   9 seconds ago   Up 6 seconds   3306/tcp   mariadb

docker volume ls
DRIVER    VOLUME NAME
local     mariadb_vol1

docker volume inspect mariadb_vol1 
[
    {
        "CreatedAt": "2022-10-23T13:47:40+03:00",
        "Driver": "local",
        "Labels": null,
        "Mountpoint": "/var/lib/docker/volumes/mariadb_vol1/_data",
        "Name": "mariadb_vol1",
        "Options": null,
        "Scope": "local"
    }
]
```

## Montarea volumelor în docker compose

Nu monta în serviciile pe care le creezi căi către bazele de date din container. Performanțele vor fi oribile dacă vor funcționa astfel de legături. În astfel de cazuri, cel mai bine ar fi să fie folosite volume denumite (named volumes).

```yaml
volumes:
  - ./database:/var/lib/mysql
```

O astfel de definire funcționează pe sistemele Linux fără a întâmpina nicio problemă. Totuși, folosirea unui asfel de *bind-mount* și inițierea infrastructurii pe un sistem Windows sau MacOS, nu va funcționa. Portabilitatea nu se va putea realiza.

În cazul [MacOS](https://docs.docker.com/docker-for-mac/osxfs-caching/), fanionul pentru delegarea scrierilor este poziționat cu scopul de a-i spune lui Docker că în cazul în care apare scriere de fișiere în container, mecanismele de gestiune a fișierelor din container li se permite să se miște mai repede decât cele ale mașinii host. Mașina host, va ține pasul mai târziu. Gândește-te la operațiuni consumatoare de astfel de resurse cum ar fi instalările pachetelor cu npm sau faci o transformare de fișiere.

```yaml
volumes:
  - ./database:/var/lib/mysql:delegated
```

Crearea unui volum denumit este necesară dacă dorești persistența datelor între sesiuni (`docker-compose up` / `down`).

```yaml
db:
  image: mysql:5
  volumes:
    - db:/var/lib/mysql
  environment:
    MYSQL_ROOT_PASSWORD: parola_serverului

volumes:
  db:
```

Nu uita faptul că montarea de căi către baze de date generează probleme la un moment dat. Ar fi bine să fie evitată o astfel de practică.

În cazul [Windows](https://www.reddit.com/r/docker/comments/8hp6v7/setting_up_docker_for_windows_and_wsl_to_work/), pentru a ține în sincronizare fișierele de pe mașină cu cele din container, ai nevoie de instrumente suplimentare cum ar fi [docker-bg-sync](https://github.com/cweagans/docker-bg-sync), care să țină această sincronizare. Se poate folosi și WSL.

Nu crea un volum numit `local`. Acesta este creat din oficiu.

```yaml
volumes:
  db:
    driver: local
```

## Creare volume particularizate

Uneori este nevoie să creezi un volum pe care să-l atașezi unui container. Pentru crearea volumelor vei folosi sub-comanda `volume create` înainte de a crea containerul propriu-zis. Crearea volumelor în acest mod permite specificarea driverelor în cazul în care acest lucru este necesar.

```bash
docker volume create redis_date
```

Atașarea volumului nou creat se face la momentul `run`.

```bash
docker container run -d --name redis -v redis_date:/data --network reteaua_containerelor redis:alpine
```

## Listarea volumelor

Pentru a avea o perspectivă privind volumele folosite de containere, se poate apela la comanda `docker volume ls`.

## Configurarea volumelor

Să presupunem că tot o aplicație web folosind Node dorim să dezvoltăm. Asta, de regulă necesită un director `/var/www` în care pui sursele.

```bash
docker run -p 8080:3000 -v $(pwd):/var/www node
```

Unde `-v` specifică necesitarea configurării unui volum, `$(pwd):` specifică folosirea directorului de lucru în care se află consola în care va sta codul sursă și închei specificând volumul așa cum are nevoie containerului pentru a lucra cu sursele.

![Mounts](/images/2018/10/MountsVolume.png)

Fii foarte atent la faptul că este de o importanță crucială unde te afli în structura directoarelor mașinii gazdă la momentul în care scrii comanda.
Un alt lucru pe care trebuie să-l ții în minte este acela că poți șterge volumele folosite. Acest pas îl faci înainte de a șterge containerul.

```bash
docker rm -v nume_container_sau_id
```

În cazul folosirii Node.js, ai nevoie să execuți comenzile de pornire a serverului. Pentru a seta contextul de execuție, vei folosi opțiunea `-w "/var/www"`, care este urmată de directorul din container.

```bash
docker run -p 8080:3000 -v $(pwd):/var/wwww -w "/var/www" node npm start
```

## Bind mounts

Aceste puncte de stocare a datelor se pot seta oriunde pe sistemul de operare gazdă. Au funcționalități reduse.
Folosirea unui *bind mount* va monta un director sau un fișier specificat în containerul ales. Pe scurt, folosești locația unui fișier sau a unui director de pe mașina gazdă în container. *Bind mount* permite modificarea sistemului de fișiere al mașinii gazdă chiar din container.

```bash
## Sincronizeaza directoarele de lucru folosind un volum bind mount
## docker run -v pathonlocal:pathoncontainer -p 8080:8080 -d name nume_container nume_imagine
docker run -v /home/nicolaie/Desktop/DEVELOPMENT/redcolectorcolab/redcolector:/var/www/redcolector -p 8080:8080 -d name nume_container nume_imagine
# sau poți folosi variabile de sistem. Ptr. Linux:
docker run -v $(pwd):/var/www/redcolector -p 8080:8080 -d name nume_container nume_imagine
## Windows command
docker run -v %cd%:/var/www/redcolector -p 8080:8080 -d name nume_container nume_imagine
## Windows PowerShell
docker run -v ${pwd}:/var/www/redcolector -p 8080:8080 -d name nume_container nume_imagine
```

Fii foarte atent, pentru că în cazul în care ai o aplicație Node.js și de pe mașina locală ai șters directorul `node_modules`, acest lucru va fi reflectat fidel și in directorul de lucru al containerului chiar dacă la momentul constituirii imaginii ai instalat `node_modules` pentru a fi disponibile viitoarei aplicații copiate în directorul de lucru. Pentru a rezolva acest aspect, vom crea un volum.

```bash
## La crearea imaginii adaugă volumul
docker run -v $(pwd):/var/www/redcolector -v /var/www/redcolector/node_modules -p 8080:8080 -d name nume_container nume_imagine
```

Acest al doilea *bind mount* se bazează pe faptul că aceste volume sunt montate în funcție de specificitatea lor. Al doilea va preveni suprascrierea directorului `node_modules` pentru că are o cale specifică acestuia. În continuare, vor fi sincronizate toate celelalte fișiere, dar nu și acest director. Putem spune că `-v /var/www/redcolector/node_modules` este un volum *anonim*.

Atenție, *bind mount*-ul este doar pentru procesul de development. Deci, copierea fișierelor în imagine este obligatorie, chiar dacă se face această oglindire la momentul în care containerul rulează. În cazul în care sunt create resurse (directoare, fișiere) în timp ce containerul rulează, acestea vor apărea automat și pe mașina gazdă. Deci, un *bind mount* este bidirecțional.

În cazul în care nu dorești ca modificările făcute pe mașina locală să nu se reflecte și pe container, va trebui să facem legătura *bind mount*-ului read-only. Acest lucru înseamnă că la rularea containerului, codul existent și structura acestuia nu va putea fi modificată.

```bash
## Declararea volumului ca fiind read-only (:ro)
docker run -v $(pwd):/var/www/redcolector:ro -v /var/www/redcolector/node_modules -p 8080:8080 -d name nume_container nume_imagine
```

Astfel de tip de storage poate fi folosit pentru a face schimb de fișiere de configurare între gazdă și containere. Acesta este și mecanismul prin care Docker rezolvă rezoluția DNS prin montarea fișierului `/etc/resolv.conf` în fiecare container.

## Probleme legate de permisiuni

Ce se întâmplă atunci când mai multe containere accesează același volum sau bind-mount? Ownership-ul este definit de numere. O privire la `/etc/passwd` și la `/etc/goup` este edificatoare în acest sens. În marea lor majoritate containerele au și ele la rândul lor aceste fișiere care pot fi inspectate.
O problemă care poate apărea este faptul că `/etc/passwd` este diferit pentru fiecare dintre containere. În acest caz regula spune că două procese care accesează același fișier trebuie să aibă același ID de user sau de grup.
Pentru a depana, mai întâi obține un tty în containere, rulează un `ps aux` (dacă nu e instalat: `apt-get update && apt-get install procps`) și vezi care sunt procesele care rulează, apoi identifică UID/GID-ul din `/etc/passwd` și `/etc/goup`. Este posibil să observi faptul că userul unui container creează un fișier, dar procesul unui alt container care ar trebui să folosească fișierul are un alt UID/GID. Rezolvarea este să te asiguri că ambele containere, în cazul că vorbim de minim două, rulează fie având user id-ul identic (creezi user în Dockerfile), fie id-ul grupului identic. Observă cum creatorii imaginii de Node.js hardcodează crearea userului în https://github.com/nodejs/docker-node/blob/main/19/alpine3.16/Dockerfile.

```yaml
FROM alpine:3.16

ENV NODE_VERSION 19.0.0

RUN addgroup -g 1000 node \
    && adduser -u 1000 -G node -s /bin/sh -D node 
```

Și cazul Nginx - https://github.com/nginxinc/docker-nginx/blob/master/mainline/debian/Dockerfile:

```yaml
FROM debian:bullseye-slim

LABEL maintainer="NGINX Docker Maintainers <docker-maint@nginx.com>"

ENV NGINX_VERSION   1.23.2
ENV NJS_VERSION     0.7.7
ENV PKG_RELEASE     1~bullseye

RUN set -x \
# create nginx user/group first, to be consistent throughout docker variants
    && addgroup --system --gid 101 nginx \
    && adduser --system --disabled-login --ingroup nginx --no-create-home --home /nonexistent --gecos "nginx user" --shell /bin/false --uid 101 nginx
```

Recomandabil este setarea de numere pentru USER în loc de nume.