# Managementul rețelei

Crearea de rețele este dictată de necesitatea de a pune limite de vizibilitate privind comunicare între containere. În cazul în care nu se definesc rețele, containerele vor putea comunica liber unele cu celelalte, fapt care nu este ceea ce ne-am dori în multe scenarii. De fapt, ceea ce se realizează prin crearea rețelelor este o izolare a anumitor containere în grupuri, fiind permisă comunicarea între acestea doar în acel grup, iar cu cele din afară prin expunerea de porturi.

Arhitectura de rețea Docker se construiește pe un set de interfețe numite *Container Network Model* (CNM).

## Aspecte practice

Atunci când un container este pornit, ceea ce se întâmplă este o cuplare la o rețea care se stabilește în subsidiar. Din oficiu, această rețea este una virtualizată de tip *bridge* (sau *docker0*). În concluzie, fiecare container se conectează la o rețea virtuală privată *bridge*. Toate containerele dintr-o rețea virtuală creată specific pentru acestea, se văd unele cu celelalte fără a expune direct portul către mașina gazdă, adică fără a fi necesar să declari vreun port forwarding cu `-p`. Buna practică spune ca oricărui container Docker să-i fie creată propria rețea virtuală (`network web-app` pentru serverul Apache cu Mysql-ul și PHP-ul, de exemplu). Ideea ar fi să grupezi containerele în rețele după necesitatea acestora de a se *vedea* unele cu celelalte și să expui un port către serviciul care are este interogat sau este necesar a fi accesat (opțiunea `-p`). Trebuie reținut faptul că pentru a conecta rețelele declarate în Docker, trebuie să expui public cel puțin unul din serviciile care sunt în acele rețele. Această rețele se vor conecta la adaptorul ethernet al mașinii gazdă. Două containere nu pot asculta pe același port. Un container poate fi atașat la mai multe rețele sau la niciuna. În cazul în care este necesar, se poate renunța cu totul la rețeaua virtuală prin opțiunea `--net=host`.

Pentru a realiza un port forwarding între mașină și container, se apelează la `-p` (`-publish`) urmat de menționarea portului pe care mașina trebuie să-l deschidă pentru a trimite pachete, urmat de două puncte și IP-ul pe care container-ul să asculte pachetele.

```bash
docker container run -p 80:80 --name webserver -d nginx
```

 Pentru a vedea pe ce se forwardează pachetele poți interoga docker folosind următoarea comandă:

```bash
docker container port webserver
```

Răspunsul este `80/tcp -> 0.0.0.0:80`. La nivelul unei mașini poți avea mai multe containere care să stabilească fiecare câte o rețea virtuală. Dar în acest caz trebuie ținută evidența porturilor expuse în mașină. Să nu expui același port din mai multe containere.

Opțiunea de publicare a porturilor (`-p`) are drept mecanism subsidiar manipularea `iptables`. Astfel, se pot folosi mai multe opțiuni de publicare:

- portMașinăGazdă:portContainer
- portContainer
- ipMașinăGazdă:portMașinăGazdă:portContainer
- ipMașinăGazdă::portContainer

## Crearea unei rețele din CLI

Pentru a crea arbitrar o rețea poți folosi comanda `docker network create --driver`, unde `driver` este unul specific dintre cele posibile pentru a realiza o rețea virtuală în Docker.

```bash
docker network create retea_containere_01
```

Comanda de mai sus creează o rețea nouă cu un driver de tip `bridge`. La momentul creării unui container, poți să creezi și rețeaua virtuală pe care o dorești: `docker container run -d -p 8081:80 --name proxy_local --network retea_locala nginx`. Investigând cu `docker inspect retea_locala` vom descoperi că noul container este menționat în secțiunea `Containers` din JSON-ul returnat.

## Conectarea și deconectarea de la o rețea

Pentru a te conecta la o rețea ai la dispoziție comanda `docker nerwork connect` cu opusul `docker nerwork disconnect`. La momentul conectării vom avea containerul care rulează deja. Pentru acesta se va crea ad-hoc un NIC care va fi conectat la o rețea virtuală.

```bash
docker network connect hash-ul-rețelei-la-care-doresti-conectarea hash-ul-containerului-care-doresti-sa-l-adaugi-retelei-create-ulterior
```

Un `docker inspect hash-container-adaugat` va releva faptul că se află în două rețele. În cea `bridge` creată la momentul inițializării și în cea la care a fost adăugat ulterior prin `connect`. Ceea ce s-a petrecut este echivalent creării din zbor a unei plăci de rețea pe care am adăugat-o în containerul existent. Aceast nou NIC are IP oferit prin DHCP de rețeaua a doua în care a fost conectat.

Containerele care rulează într-o rețea virtuală se *văd* unele pe celelalte după nume pentru că rețeaua virtuală beneficiază de un serviciu DNS local. Dacă ai avea un container din care dorești să dai un ping la un altul din aceeași rețea virtuală, ai folosi o comandă similară cu următoarea: `docker container exec -it nume_container1 ping nume_container0`.

## DNS round robin

Uneori ai nevoie de mai multe nume după care se să denumești containerul pentru a-l apela din rețeaua virtuală. În acest scop, la momentul rulării containerului poți adăuga opțiunea `--network-alias nume_alias`. Reține aspectul cel mai important în acest context: nu poți adăuga mai multe containere care au acelați nume. Denumirea folosind alias-uri permite utilizarea unui container în două scenarii ale unei aplicații. De exemplu, poți folosi același serviciu de căutare în două instanțe ale unei aplicații - una de test și una pentru dezvoltare. Astfel, alias-urile date unui container au același comportament cu cel al unui Round Robin DNS. Folosesc același nume pentru container, dar apelarea se poate face folosindu-se alias-urile. Are un mod de funcționare similar load balacer-urilor.

Mai întâi creezi o rețea.

```bash
docker network create test
```

Acum, pentru a testa rețeaua creată, vom atașa două containere. Containerele vor fi create cu `run`. Vei folosi opțiunea `--net` pentru a specifica la care rețea atașezi containerul.

```bash
docker container run -e "discovery.type=single-node" -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" -e "xpack.security.enabled=false" --network test -d --net-alias esearch elasticsearch:8.4.3
```

Observă în comandă că `--network` are valoarea arbitrar aleasă `test`, iar pentru `--net-alias` este tot o valoare aleasă arbitrar `esearch`. Odată pornite, containerele vor prelua cereri care vin pe alias-ul comun ales.

Rulează de două ori comanda pentru a avea două containere la îndemână. Pentru a face verificări, vei folosi un alpine.

```bash
docker container run --rm --network test alpine nslookup esearch
```

Rezultatul va fi similar cu următorul răspuns:

```text
Server:		127.0.0.11
Address:	127.0.0.11:53

Non-authoritative answer:

Non-authoritative answer:
Name:	esearch
Address: 172.20.0.3
Name:	esearch
Address: 172.20.0.2
```

Introducând `exit` ieși din linia de comandă și datorită lui --rm și containerul va fi eliminat.

Poți interoga folosind și `curl` dacă îl instalezi.

```bash
docker run --rm -it --network test alpine
# folosești nslookup pentru a vedea IP-urile pentru același DNS A record
nslookup esearch
# install curl and run it
apk add curl

fetch https://dl-cdn.alpinelinux.org/alpine/v3.16/main/x86_64/APKINDEX.tar.gz
fetch https://dl-cdn.alpinelinux.org/alpine/v3.16/community/x86_64/APKINDEX.tar.gz
(1/5) Installing ca-certificates (20220614-r0)
(2/5) Installing brotli-libs (1.0.9-r6)
(3/5) Installing nghttp2-libs (1.47.0-r0)
(4/5) Installing libcurl (7.83.1-r3)
(5/5) Installing curl (7.83.1-r3)
Executing busybox-1.35.0-r17.trigger
Executing ca-certificates-20220614-r0.trigger
OK: 8 MiB in 19 packages

curl -s esearch:9200
{
  "name" : "b72d8dfdc026",
  "cluster_name" : "docker-cluster",
  "cluster_uuid" : "yzJFxzdqRh2T-0-a4ouexg",
  "version" : {
    "number" : "8.4.3",
    "build_flavor" : "default",
    "build_type" : "docker",
    "build_hash" : "42f05b9372a9a4a470db3b52817899b99a76ee73",
    "build_date" : "2022-10-04T07:17:24.662462378Z",
    "build_snapshot" : false,
    "lucene_version" : "9.3.0",
    "minimum_wire_compatibility_version" : "7.17.0",
    "minimum_index_compatibility_version" : "7.0.0"
  },
  "tagline" : "You Know, for Search"
}
/ # curl -s esearch:9200
{
  "name" : "e2762c90c305",
  "cluster_name" : "docker-cluster",
  "cluster_uuid" : "JVTXeMUPSC67jHPv3aUxGw",
  "version" : {
    "number" : "8.4.3",
    "build_flavor" : "default",
    "build_type" : "docker",
    "build_hash" : "42f05b9372a9a4a470db3b52817899b99a76ee73",
    "build_date" : "2022-10-04T07:17:24.662462378Z",
    "build_snapshot" : false,
    "lucene_version" : "9.3.0",
    "minimum_wire_compatibility_version" : "7.17.0",
    "minimum_index_compatibility_version" : "7.0.0"
  },
  "tagline" : "You Know, for Search"
}
```

În cazul Elasticsearch, identificarea fiecărui container se va face pe baza lui `cluster_uuid`.

## Legacy linking

Această tehnică de conectare se bazează pe numele containerelor. Pentru a realiza această conectare, trebuie să rulezi un container cu un nume la care un alt container se va lega.

```bash
docker run -d --name server_db postgres
```

Pentru a lega serverul de Postgres din exemplu de containerul care rulează un server de web, de exemplu, se va introduce în comanda de rulare a serverului web opțiunea `--link server_db:postgres`. Ceea ce se menționează după două puncte este un alias care poate fi folosit în interiorul rețelei nou formate între cele două containere.

```bash
docker run -d -p 80:80 --link server_db:postgres kosson/webnode
```

De cele mai multe ori, atunci când lucrezi un proiect în Node.js, ai nevoie și de MongoDB. Mai întâi de toate, te poziționezi în directorul unde este aplicația. Vei redacta un `Dockerfile`, iar dacă ai nevoie să-l denumești diferit de numele canonic, nu uita că la faza de `build`, trebuie să menționezi care fișier poartă informațiile privind constituirea imaginii particularizate. Să presupunem că avem `Dockerfile`-ul cu informațiile de construcție și că l-am redenumit `node.dockerfile`.

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
COPY . /var/www
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

## Driveri de rețele

Subsistemul de rețea a lui Docker are o caracteristică ce permite interconectarea folosind driveri. Din oficiu, sunt puși spre utilizare câțiva driveri ce oferă posibilitatea de a realiza rețele.

### bridge

Acesta este driverul din oficiu care va fi folosit de Docker în cazul în care nu specifici unul. Acest driver este folosit atunci când aplicațiile stau fiecare în containerul propriu și au nevoie să comunice.

### host

Acest driver elimină barierele de comunicare dintre container și sistemul de operare gazdă. Acest lucru înseamnă că se folosește rețeaua computerului gazdă.

### overlay

Rețelele overlay conectează daemonii Docker, permițând comunicare între servicii în cazul în care se folosește un swarm. Poți folosi rețele overlay pentru a ușura comunicarea dintre un serviciu swarm și un container de sine stătător sau între două containere dar care rulează pe doi daemoni Docker diferiți. Această strategie elemină necesitatea de a folosi rutarea între containere, care se realizează la nivel de OS.

### macvlan

Aceste rețele permit atribuirea unei adrese MAC unui container. Ca urmare, containerul va apărea ca dispozitiv fizic în rețea. Daemonul Docker va ruta traficul către containere folosind adrese MAC. Acest driver este cea mai bună alegere atunci când ai aplicații legacy care așteaptă să fie conectate direct la rețeaua fizică și nu rutate prin stiva de rețea a lui Docker.

### none

Pentru containerul curent, dezactivează rețeaua.

## Resurse

- [From inside of a Docker container, how do I connect to the localhost of the machine?](https://stackoverflow.com/questions/24319662/from-inside-of-a-docker-container-how-do-i-connect-to-the-localhost-of-the-mach)
- [Networking features in Docker Desktop for Windows](https://docs.docker.com/docker-for-windows/networking/)
- [Networking with standalone containers | docker docs](https://docs.docker.com/network/network-tutorial-standalone/)
