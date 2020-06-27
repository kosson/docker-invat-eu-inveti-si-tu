# Persistența datelor

Toate datele care sunt create într-un container, sunt stocate într-un layer writable. Pe cale de consecință, atunci când containerul nu mai există, nici datele scrise în acesta, nu vor mai fi. Din nefericire, datele din container nu pot fi mutate în alte locații ale sistemului de fișiere gazdă.
Pentru a scrie datele în layerul writable, este nevoie ca sistemul de fișiere să fie gestionat de un driver specializat - driver storage.

Atunci când un container este oprit, datele din sistemul de fișiere generat intern, vor dispărea (comportamentul din oficiu - OverlayFS).

Pentru că de cele mai multe ori vei avea nevoie de date persistente, cum ar fi loguri sau chiar bazele de date în anumite cazuri, Docker oferă volume care au un ciclu de viață separat de cel al containerelor și *bind mounts*. În cazul în care Docker funcționează pe o mașină Linux, poți folosi și `tmpfs mount` care vor rula în memorie.

Din punctul de vedere al unui container, datele sunt văzute fie ca un director, fie ca un fișier mare în structura de fișiere proprie.

## Volume

Un volum este un director asociat unui container în care se pot introduce date. Toate containerele pot folosi același volum. Volumele sunt păstrate chiar și în cazul în care containerul este șters.
Volumele se crează în structura de directoare a locului unde este instalat Docker pe mașină: `/var/lib/docker/volumes/`. Volumele sunt cea mai bună opțiune pentru a realiza un mecanism de persistență a datelor. Ca administrator trebuie să te asiguri de faptul că niciun proces în afară de Docker nu va modifica această zonă a sistemului de operare.

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

## Bind mounts

Aceste puncte de stocare a datelor se pot seta oriunde pe sistemul de operare gazdă. Au funcționalități reduse.
Folosirea unui *bind mount* se va solda cu montarea unui director specificat în container. Ceea ce permite un *bind mount* este modificarea sistemului de fișiere al mașinii gazdă chiar din container.

Astfel de tip de storage poate fi folosit pentru a face schimb de fișiere de configurare între gazdă și containere. Acesta este și mecanismul prin care Docker rezolvă rezoluția DNS prin montarea fișierului `/etc/resolv.conf` în fiecare container.

Sharing source code or build artifacts between a development environment on the Docker host and a container. For instance, you may mount a Maven target/ directory into a container, and each time you build the Maven project on the Docker host, the container gets access to the rebuilt artifacts.

If you use Docker for development this way, your production Dockerfile would copy the production-ready artifacts directly into the image, rather than relying on a bind mount.

## tmpfs

Această zonă de stocare a datelor se formează strict în memoria mașinii gazdă.
Swarm-urile Docker folosesc tmpfs.

## Comportamente

Dacă montezi un volum gol într-un director al containerului care este populat, fișierele și directoarele existente în acel director vor fi copiate în volumul gol. Pur și simplu se vor propaga și acolo.

Dacă pornești un container care menționează un volum care nu există, va fi creat acel volum. Această metodă este bună și pentru a pre-popula cu datele de care alt container are nevoie.

Dacă montezi un *bind mount* sau un volum care nu este gol într-un director al unui container, dar care nici acesta nu este gol, ceea ce exista va fi ignorat și ascuns. De îndată ce se face unmount, resursele preexistente sunt disponibile din nou.

## Montarea volumelor la run

Volumele, indiferent unde le specifici în container, de fapt vor fi montate în `/mnt`-ul gazdei. De exemplu, pentru a avea un director în care să dezvolți o aplicație pentru Node, va trebui să folosești un director în care codul tău să persiste. Pentru a porni un server de Node care să aibă un volum, poți să-l specifici în linia de comandă care pornește containerul.

```bash
docker run -p 8080:3000 -v ./calea/pe/host:/cale/din/container
```

Docker va crea volumul menționat de opțiunea `-v` prin alias-ul `./calea/pe/host`.

Întotdeauna menționează o cale relativă pe gazdă pentru că vei crește portabilitatea și gradul de reutilizare al aplicației. Același lucru se aplică și pentru crearea fișierelor `docker-compose.yml` cum ar fi în exemplul de mai jos.

```yaml
volumes:
  - ./cale/pe/host:/cale/din/container
```

Căile trebuie să fie mereu relative la directorul din care se ridică construcția docker-compose. În cazul în care folosești Linux, poți folosi utilitare precum `pwd` pentru a seta punctul de referință de la care se pornește.

## Montarea volumelor în docker-compose

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

Uneori este nevoie să creezi un volum pe care să-l atașezi unui container. Pentru crearea volumelor vei folosi sub-comanda `volume create`.

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

În cazul folosirii node, ai nevoie să execuți comenzile de pornire a serverului. Pentru a seta contextul de execuție, vei folosi opțiunea `-w "/var/www"`, care este urmată de directorul din container.

```bash
docker run -p 8080:3000 -v $(pwd):/var/wwww -w "/var/www" node npm start
```
