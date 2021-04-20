# Managementul rețelei

Arhitectura de rețea Docker se construiește pe un set de interfețe numite *Container Network Model* (CNM).

## Aspecte practice

Atunci când un container este pornit, ceea ce se întâmplă este o cuplare la o rețea care se stabilește în subsidiar. Această rețea este una virtualizată de tip *bridge*. Toate containerele din rețeaua virtuală se văd unele cu celelalte fără a expune direct portul către mașina gazdă. Practica indică faptul că ar trebui ca fiecare aplicație realizată folosind containere Docker să aibă propria rețea virtuală. Această rețea care se stabilește se va conecta la adaptorul ethernet al mașinii.

```bash
docker container run -p 80:80 --name webserver -d nginx
```

Pentru a realiza un port forwarding între mașină și container, se apelează la `-p` (`-publish`) urmat de menționarea portului pe care mașina trebuie să-l deschidă pentru a trimite pachete, urmat de două puncte și IP-ul pe care container-ul să asculte pachetele. Pentru a vedea pe ce se forwardează pachetele poți interoga docker folosind următoarea comandă:

```bash
docker container port webserver
```

Răspunsul este `80/tcp -> 0.0.0.0:80`. La nivelul unei mașini poți avea mai multe containere care să stabilească fiecare câte o rețea virtuală. Dar în acest caz trebuie ținută evidența porturilor expuse în mașină. Să nu expui același port din mai multe containere.

Opțiunea de publicare a porturilor (`-p`) are drept mecanism subsidiar manipularea `iptables`. Astfel, se pot folosi mai multe opțiuni de publicare:

- portMașinăGazdă:portContainer
- portContainer
- ipMașinăGazdă:portMașinăGazdă:portContainer
- ipMașinăGazdă::portContainer

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

## Bridge networks

Rețeaua `bridge` este cea care este oferită din oficiu pentru containere cu singura condiție să nu fie specificată alta prin opțiunea `--net` la momentul rulării unui container cu `docker run`. Ai putea rula un container specificând această opțiune: `docker run --network="bridge"`. Numele acestui bridge este `docker0`. Și gazda și containerul au o adresă în acel bridge.

Pentru a vedea configurarea unei astfel de rețele, se poate invoca rapid un `docker network inspect bridge`. Vei primi drept răspuns un JSON asemănător cu următorul.

```json
[
    {
        "Name": "bridge",
        "Id": "7d30d1c92334025eb8e87aa4acdf5b5c85b0ab96392721931107bb3a300ea6a0",
        "Created": "2018-10-25T08:37:02.27686629+03:00",
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
        "Containers": {},
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

Ceea ce spune acest calup de informație este că la nivelul kernelului Linux al mașinii gazdă a fost creată o interfață nouă cu numele `docker0`. Această interfață se va comporta ca o punte de trecere a pachetelor între containere și între containere și exterior. Mai aflăm că este creată o subrețea dedicată containerelor având drept gateway chiar interfața `docker0`. La verificarea inversă din mașina gazdă: `ip addr show docker0`. Răspunsul va fi similar.

```text
6: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN group default
    link/ether 02:42:08:ca:fe:1c brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0
       valid_lft forever preferred_lft forever
```

Această tehnică este folosită pentru a realiza rețele izolate, care oferă un nivel mai mare de siguranță prin gruparea containerelor. Un container poare rula în mai multe rețele dacă acest lucru este necesar. Pentru a realiza o astfel de rețea izolată, vom constitui o rețea `bridge`. Atenție, se pot folosi mai multe drivere pentru crearea rețelelor. Dar cel mai adesea va fi folosit `bridge`.

```bash
docker network create --driver bridge retea_izolata
```

Pasul următor este specificarea rețelei în care dorești să rulezi un container.

```bash
docker run -d --net=retea_izolata --name mongodb mongo
```

Opțiunea necesară este `--net=retea_izolata`. Ca să legi celelalte containere, vei folosi opțiunea `--name numeParticularizant`. În cazul folosirii unui server de MongoDB, chiar este nevoie ca numele de `mongodb` să fie utilizat pentru a se putea face legăturile cu celelalte servere.

### Anatomia unui bridge

Docker Engine atunci când folosește modul bridge, creează o stivă de rețea cu o interfață loopback (`lo`) și una ethernet (`eth0`) chiar în momentul în care pornește containerul. Poți vedea asta rulând repede un container busybox: `docker run --rm busybox ip addr`. Interfața loopback este folosită de un container pentru comunicarea sa internă. Pentru cazul în care o imagine nu are suport pentru `ip addr`, folosește mai bine `docker network inspect` pentru a afla informații despre container.

Interfața `docker0` se va comporta ca un sistem circulatoriu pentru pachete între toate containerele Docker. Aceasta este și interfața care comunică cu exteriorul rețelei containerelor, adică cu interfața `eth0` a mașinii gazdă. Întrebarea este cum se conectează containerele la `docker0`, în cazul nostru. Fiecare container, la rândul lui are o interfață ethernet (`eth0`). Abia această interfață se va conecta la `docker0` apelând la o virtualizarea numită `veth` - Virtual Ethernet. Deci, vei avea un flux de date `container eth0`->`veth`->`docker0` și vice versa. Docker Engine va aloca un ip lui `eth0` și apoi va conecta `veth` la `docker0`. Poți să te gândești la `veth` ca la o mufă rapidă de conectare la țeava `docker0`. Adresele atribuite containerelor nu pot fi atinse din afară, dar este util să le cunoști (`docker inspect`) pentru a face un debugging eficient chiar din interiorul containerului.

## Comenzi de manipulare a rețelei

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

### Vizualizarea rețelelor deja create

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

## Rețele custom

Atunci când ridici mai multe servicii folosind un fișier `docker-compose.yml`, se va crea automat o rețea disponibilă tuturor componentelor/serviciilor. Această rețea se bazează pe un serviciu DNS și astfel este posibilă apelarea unei mașini în cazul stabilirii unei conexiuni, chiar cu numele serviciului respectiv. Reține faptul că toate containerele implicate într-o rețea de servicii, se pot apela cu numele serviciului.

```yaml
mongo:
    image: mongo:4.4.5-bionic
    env_file:
        - ./.env
    environment:
        - MONGO_INITDB_ROOT_USERNAME=$MONGO_USER
        - MONGO_INITDB_ROOT_PASSWORD=$MONGO_PASSWD
    volumes:
        - mongo-db:/data/db
    healthcheck:
        test: echo 'db.runCommand("ping").ok' | mongo localhost:27017/test --quiet
```

Pentru un serviciu denumit `mongo`, vom putea stabili o conexiune dintr-un alt container ce conține o aplicație Node.js, folosind numele acestuia.

```javascript
mongoose.connect("mongodb://mongo:27017/redcolector", {
    auth: { "authSource": "admin" },
    user: process.env.MONGO_USER,
    pass: process.env.MONGO_PASSWD,
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Conectare la serviciul MongoDB din container cu succes");
}).catch((error) => {
    console.log(error);
    logger.error(error);
});
```

Reține faptul că acest lucru nu funcționează cu rețelele bridge to network. Doar în cazul rețeleor formate de servicii.

## Ping la un container

Uneori este foarte rapid să vezi care este IP-ul unui container prin executarea unui ping pe container.

```bash
docker container exec ceva.sh ping -c 3 node_server
```

## Resurse

- [From inside of a Docker container, how do I connect to the localhost of the machine?](https://stackoverflow.com/questions/24319662/from-inside-of-a-docker-container-how-do-i-connect-to-the-localhost-of-the-mach)
- [Networking features in Docker Desktop for Windows](https://docs.docker.com/docker-for-windows/networking/)
