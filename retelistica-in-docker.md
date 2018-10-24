# Managementul rețelei

Arhitectura de rețea Docker se construiește pe un set de interfețe numite *Container Network Model* (CNM).

## Aspecte practice

Atunci când un container este pornit, ceea ce se întâmplă este o cuplare la o rețea care se stabilește în subsidiar. Această rețea este una virtualizată de tip *bridge*. Toate containerele din rețeaua virtuală se văd unele cu celelalte fără a expune direct portul către mașina gazdă. Practica indică faptul că ar trebui ca fiecare aplicație realizată folosind containere docker să aibă propria rețea virtuală. Această rețea care se stabilește se va conecta la adaptorul ethernet al mașinii.

```bash
docker container run -p 80:80 --name webserver -d nginx
```

Pentru a realiza un port forwarding între mașină și container, se apelează la `-p` (`-publish`) urmat de menționarea portului pe care mașina trebuie să-l deschidă pentru a trimite pachete, urmat de două puncte și IP-ul pe care container-ul să asculte pachetele. Pentru a vedea pe ce se forwardează pachetele poți interoga docker folosind următoarea comandă:

```bash
docker container port webserver
```

Răspunsul este `80/tcp -> 0.0.0.0:80`. La nivelul unei mașini poți avea mai multe containere care să stabilească fiecare câte o rețea virtuală. Dar în acest caz trebuie ținută evidența porturilor expuse în mașină. Să nu expui același port din mai multe containere.

Pentru a afla IP-ul containerului poți face o interogare cu `inspect`.

```bash
docker container inspect --format '{{ .NetworkSettings.IPAddress }}' nume_container
```

## Legacy linking

Această tehnică de conectare se bazează pe numele containerelor. Pentru a realiza această conectare, trebuie să rulezi un container cu un nume la care un alt container se va lega.

```bash
docker run -d --name server_db postgres
```

Pentru a lega serverul de Postgres din exemplu de containerul care rulează un server de web, de exemplu, se va introduce în comanda de rulare a serverului web opțiunea `--link server_db:postgres`. Ceea ce se menționează după două puncte este un alias care poate fi folosit în interiorul rețelei nou formate între cele două containere.

```bash
docker run -d -p 80:80 --link server_db:postgres kosson/webnode
```

De cele mai multe ori, atunci când lucrezi un proiect în Node, ai nevoie și de MongoDB. Mai întâi de toate, te poziționezi în directorul unde este aplicația. Vei redacta un `Dockerfile`, iar dacă ai nevoie să-l denumești diferit de numele canonic, nu uita că la faza de `build`, trebuie să menționezi care fișier poartă informațiile privind constituirea imaginii particularizate. Să presupunem că avem `Dockerfile`-ul cu informațiile de construcție și că l-am redenumit `node.dockerfile`.

```yaml
# Construiește imaginea de node
# docker build -f node.dockerfile -t kosson/node_ca .
# Pornește MongoDB
# docker run -d --name bazaMongo mongo
# Pornește Node și leagă containerul de Mongo
# docker run -d -p 3000:3000 --link bazaMongo:mongodb kosson/node_ca

FROM node:latest
MAINTAINER Constantinescu Nicolaie
ENV NODE_ENV=development
ENV PORT=3000
WORKDIR /var/www
COPY    . /var/www
RUN npm install
EXPOSE $PORT
ENTRYPOINT ["npm","start"]
```

Vom genera imaginea care va copia codul sursă din directorul curent în directorul `/var/www` al imaginii.

```bash
docker build -f node.dockerfile -t kosson/node_ca .
```

Apoi vom porni un container MongoDB a cărui nume i l-am dat noi pentru a putea crea rețeaua de conectare a aplicației cu baza de date.

```bash
docker run -d --name bazaMongo mongo
```

Urmează pornirea containerului care are la bază serverul Node și aplicația ca nivel suplimentar. Vom folosi imaginea pe care abia am creat-o.

```bash
docker run -d -p 3000:3000 --link bazaMongo:mongodb kosson/node_ca
```

## Bridge networks

Această tehnică este folosită pentru a realiza rețele izolate, care oferă un nivel mai mare de siguranță prin gruparea containerelor. Un container poare rula în mai multe rețele dacă acest lucru este necesar. Pentru a realiza o astfel de rețea izolată, vom constitui o rețea `bridge`. Atenție, se pot folosi mai multe drivere pentru crearea rețelelor. Dar cel mai adesea va fi folosit `bridge`.

```bash
docker network create --driver bridge retea_izolata
```

Pasul următor este specificarea rețelei în care dorești să rulezi un container.

```bash
docker run -d --net=retea_izolata --name mongodb mongo
```

Opțiunea necesară este `--net=retea_izolata`. Ca să legi celelalte containere, vei folosi opțiunea `--name numeParticularizant`. În cazul folosirii unui server de MongoDB, chiar este nevoie ca numele de `mongodb` să fie utilizat pentru a se putea face legăturile cu celelalte servere.

## Comenzi de manipulare a rețelei

### Vizualizarea rețelelor deja create

Folosind această comandă obții informații privind care containere aparține cărei rețele existente.

```bash
docket network ls
```

### Obținerea de informații despre o rețea

Folosirea comenzii `inspect` este necesară atunci când dorești să obții informații privind containerele dintr-o anumită rețea.

```bash
docker network inspect nume_rețea
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
