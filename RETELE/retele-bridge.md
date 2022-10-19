# Bridge networks

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

Ceea ce spune acest calup de informație este că la nivelul kernelului Linux al mașinii gazdă a fost creată o interfață nouă cu numele `docker0`. Această interfață se va comporta ca o punte de trecere a pachetelor între containere și între containere și exterior. Mai aflăm că este creată o subrețea dedicată containerelor având drept gateway chiar interfața `docker0`. La verificarea inversă din mașina gazdă: `ip addr show docker0`. Răspunsul va fi similar cu următorul.

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

### Rețele custom

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

Reține faptul că acest lucru nu funcționează cu rețelele bridge to network. Doar în cazul rețelelor formate de servicii.
