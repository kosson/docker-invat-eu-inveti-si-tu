# Managementul rețelei

Arhitectura de rețea Docker se construiește pe un set de interfețe numite *Container Network Model* (CNM).

## Aspecte practice

Atunci când un container este pornit, ceea ce se întâmplă este o cuplare la o rețea care se stabilește în subsidiar. Din oficiu, această rețea este una virtualizată de tip *bridge* (sau *docker0*). În concluzie, fiecare container se conectează la o rețea virtuală privată *bridge*. Toate containerele dintr-o rețea virtuală creată specific pentru acestea, se văd unele cu celelalte fără a expune direct portul către mașina gazdă, adică fără a fi necesar să declari vreun port forwarding cu `-p`. Buna practică spune ca oricărui container Docker să-i fie creată propria rețea virtuală (`network web-app` pentru serverul Apache cu Mysql-ul și PHP-ul, de exemplu). Ideea ar fi să grupezi containerele în rețele după necesitatea acestora de a se „vedea” unele cu celelalte și să expui un port către serviciul care are este interogat sau este necesar a fi accesat (opțiunea `-p`). Trebuie reținut faptul că pentru a conecta rețelele declarate în Docker, trebuie să expui public cel puțin unul din serviciile care sunt în acele rețele. Această rețele se vor conecta la adaptorul ethernet al mașinii gazdă. Două containere nu pot asculta pe același port. Un container poate fi atașat la mai multe rețele sau la niciuna. În cazul în care este necesar, se poate renunța cu totul la rețeaua virtuală prin opțiunea `--net=host`. 

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

## Evidența rețelelor create

Pentru a investiga care sunt rețelele care au fost create, se va folosi comanda `docker network ls`. Răspunsul este similar cu următorul:

```text
NETWORK ID     NAME                   DRIVER    SCOPE
f3389fe8a3b6   anaonda3-cpu_default   bridge    local
76a7d05de304   bridge                 bridge    local
0819bcd56eff   conda-vanila_default   bridge    local
9c51efacaedf   host                   host      local
b0cb911491d7   kanaconda_default      bridge    local
7b0199458361   none                   null      local
```

Pentru a investiga una dintre rețelele create, se poate folosi comanda `docker network inspect bridge`, unde `bridge` poate fi numele oricărei rețele existente. Răspunsul returnat va fi unul similar cu următorul JSON.

```json
[
    {
        "Name": "bridge",
        "Id": "76a7d05de304631321c9dd1f961ccfac894a933ba571f848e176e0f2a5be6ea1",
        "Created": "2022-10-16T14:44:30.405497922+03:00",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": [
                {
                    "Subnet": "172.17.0.0/16",
                    "Gateway": "172.17.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": false,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {
            "b254d3dbf4339cf37b530dd54dda92b49b8805f9ad70af19c5a6057cb0d1271b": {
                "Name": "proxyn",
                "EndpointID": "7c8ef64dba278df7e1412f28d0c2cbef7b6ef418d8ea5e37dcba0a77d1c5f43b",
                "MacAddress": "02:42:ac:11:00:02",
                "IPv4Address": "172.17.0.2/16",
                "IPv6Address": ""
            }
        },
        "Options": {
            "com.docker.network.bridge.default_bridge": "true",
            "com.docker.network.bridge.enable_icc": "true",
            "com.docker.network.bridge.enable_ip_masquerade": "true",
            "com.docker.network.bridge.host_binding_ipv4": "0.0.0.0",
            "com.docker.network.bridge.name": "docker0",
            "com.docker.network.driver.mtu": "1500"
        },
        "Labels": {}
    }
]
```

Observă faptul că în secțiunea `Containers` sunt menționate cele care sunt conectate la rețeaua virtuală investigată.

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

Containerele care rulează într-o rețea virtuală se „văd” unele pe celelalte după nume pentru că rețeaua virtuală beneficiază de un serviciu DNS local. Dacă ai avea un container din care dorești să dai un ping la un altul din aceeași rețea virtuală, ai folosi o comandă similară cu următoarea: `docker container exec -it nume_container1 ping nume_container0`.

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
