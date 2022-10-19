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

## Resurse

- [Networking with standalone containers | docker docs](https://docs.docker.com/network/network-tutorial-standalone/)