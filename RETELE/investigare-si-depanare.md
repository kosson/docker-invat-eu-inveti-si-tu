# Comenzi de manipulare și investigare a rețelei

Docker pune la dispoziție o subcomandă cu care vei putea realiza rețelele de care ai nevoie: `docker network`.

De fiecare dată când Docker pornește un container, creează o stivă de rețea pentru acel container și îl atașează automat la rețeaua `bridge`. Opțional, la momentul rulării cu `docker run`, poți specifica prin `--net` opțiunea pentru `local`, ceea ce va conduce la atașarea containerului la stiva de rețea a mașinii gazdă, ceea ce va însemna că vei putea accesa direct de pe IP-ul și portul mașinii. Dacă dorești atașarea containerului doar la loopback-ul mașinii (`lo`), folosești rețeaua `none`.

Poți experimenta acest lucru cu un container pe bază de `busybox`. Rulează un container doar pentru a extrage această informație și oprește containerul imediat.

```bash
docker run --rm --net=none busybox ip addr
```

Vei obține aceste date privitor la rețeaua folosită:

```text
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
```

Reține un singur aspect important atunci când folosești loopback-ul. Nu poți comunica cu alte containere și nici cu exteriorul mașinii.

## Ping la un container

Uneori este foarte rapid să vezi care este IP-ul unui container prin executarea unui ping pe container.

```bash
docker container exec ceva.sh ping -c 3 node_server
```

## Vizualizarea rețelelor deja create

Folosind această comandă obții informații privind care containere aparține cărei rețele existente.

```bash
docker network ls
```

De la bun început, Docker creează trei rețele gata de a fi utilizate: `bridge`, `host` și `none` cu driver (`null`).

### Obținerea de informații despre o rețea

Folosirea comenzii `inspect` este necesară atunci când dorești să obții informații privind containerele dintr-o anumită rețea.

```bash
docker network inspect nume_rețea
```

Este returnat un volum important de informații în format JSON. Folosind opțiunea `--format`, vei putea obține informația pentru un anumit câmp.

```bash
docker inspect --format='{{.NetworkSettings.Networks.nume_retea.IPAddress}}' 8a6
172.20.0.2
```

### Crearea unei rețele

```bash
docker network create nume_ceva --driver
```

### Atașarea unei rețele la un container

```bash
docker network connect
```

### Desprinderea unei rețele de un container

```bash
docker network disconnect
```

### Eliminarea driverului

```bash
docker network prune
```
