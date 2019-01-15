# Persistența datelor

Toate datele care sunt create într-un container, sunt stocate într-un layer writable. Pe cale de consecință, atunci când containerul nu mai există, nici datele scrise în acesta, nu vor mai fi. Din nefericire, datele din container nu pot fi mutate în alte locații ale sistemului de fișiere gazdă.
Pentru a scrie datele în layerul writable, este nevoie ca sistemul de fișiere să fie gestionat de un driver specializat - driver storage.

Atunci când un container este oprit, datele din sistemul de fișiere generat intern, vor dispărea (comportamentul din oficiu - OverlayFS).

Pentru că de cele mai multe ori vei avea nevoie de date persistente, cum ar fi loguri sau chiar bazele de date în anumite cazuri, Docker oferă volume care au un ciclu de viață separat de cel al containerelor și *bind mounts*. În cazul în care Docker funcționează pe o mașină Linux, poți folosi și `tmpfs mount` care vor rula în memorie.

Din punctul de vedere al unui container, datele sunt văzute fie ca un director, fie ca un fișier mare în structura de fișiere proprie.

## Volume

Volumele se crează în structura de directoare a locului unde este instalat Docker pe mașină: `/var/lib/docker/volumes/`. Volumele sunt cea mai bună opțiune pentru a realiza un mecanism de persistență a datelor. Ca administrator trebuie să te asiguri de faptul că niciun proces în afară de Docker nu va modifica această zonă a sistemului de operare.

Pentru crearea unui volum există o comandă specifică: `docker volume create`. Cel mai adesea aceste volume de vor crea atunci când sunt lansate containerele sau atunci când sunt create serviciile.

Crearea unui volum atrage după sine crearea unui director pe mașina gazdă. Pentru a avea acces la ele, aceste volume sunt montate de containere. Un anumit container poate fi montat de mai multe containere. În momentul în care containerele și-au încheiat activitatea, directorul nu se va șterge. Volumele care nu mai sunt folosite, pot fi șterse folosind comanda `docker volume prune`.

Aceste volume pot fi specificate în fișierele `Dockerfile` prin instrucțiunea `VOLUME` sau la momentul rulării imaginii, se poate specifica folosind opțiunea `-v`.

```bash
docker run -v /date -it busybox
```

Astfel, vei crea un director nou montat în container. Driverele pentru volume permit stocarea volumelor la distanță dacă acest lucru este dorit și pot oferi și criptare. Noile volume au conținutul pre-populat de un container, de regulă.

Volumele nu măresc dimensiunea containerelor care le folosesc pentru că pur și simplu, nu sunt legat organic de containere.

Volumele pot fi numite sau anonime. Cele anonime sunt montate primele de container și li se dau un nume aleatoriu. Nu există nicio diferență de comportament între cele două. Volumele mai permit stocarea datelor pe mașini la distanță sau în cloud. Volumele sunt șterse numai când acest lucru este dorit înadins.

Atunci când este nevoie să muți datele de pe o mașină gazdă pe alta, directorul în care se află volumele este cel care va fi mutat: `/var/lib/docker/volumes`.

## Bind mounts

Aceste puncte de stocare a datelor se pot seta oriunde pe sistemul de operare gazdă. Au funcționalități reduse.
Folosirea unui *bind mount* se va solda cu montarea unui director specificat în container. Ceea ce permite un *bind mount* este modificarea sistemului de fișiere al mașinii gazdă chiar din container.

Astfel de tip de storage poate fi folosit pentru a face schimb de fișiere de configurare între gazdă și containere. Acesta este și mecanismul prin care Docker rezolvă rezoluția DNS prin montarea fișierului `/etc/resolv.conf` în fiecare container.

Sharing source code or build artifacts between a development environment on the Docker host and a container. For instance, you may mount a Maven target/ directory into a container, and each time you build the Maven project on the Docker host, the container gets access to the rebuilt artifacts.

If you use Docker for development this way, your production Dockerfile would copy the production-ready artifacts directly into the image, rather than relying on a bind mount.

When the file or directory structure of the Docker host is guaranteed to be consistent with the bind mounts the containers require.

## tmpfs

Această zonă de stocare a datelor se formează strict în memoria mașinii gazdă.
Swarm-urile Docker folosesc tmpfs.

## Comportamente

Dacă montezi un volum gol într-un director al containerului care este populat, fișierele și directoarele existente în acel director vor fi copiate în volumul gol. Pur și simplu se vor propaga și acolo.

Dacă pornești un container care menționează un volum care nu există, va fi creat acel volum. Această metodă este bună și pentru a pre-popula cu datele de care alt container are nevoie.

Dacă montezi un *bind mount* sau un volum care nu este gol într-un director al unui container, dar care nici acesta nu este gol, ceea ce exista va fi ignorat și ascuns. De îndată ce se face unmount, resursele preexistente sunt disponibile din nou. 