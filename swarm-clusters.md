# Swarm clusters

Un cluster este o aplicație care rulează pe mai multe mașini. Aplicațiile care rulează folosind mai multe containere care folosesc mai multe mașini constituie ceea ce se numește `swarm` - roi. Docker poate rula individual pe o mașină, dar și folosind puterea de calcul a mai multor mașini dacă este trecută în modul **swarm**.

Un **swarm** este un grup de mașini care rulează Docker unite în ceea ce se numește **cluster**. Din moment ce clusterul s-a constituit, poți rula aceleași comenzi obișnuite folosind un **swarm manager**. Mașinile din **swarm** pot fi fizice sau virtuale. Când o mașină se adaugă unui **swarm**, aceasta devine un nod. Mașinile dintr-un **swarm** sunt noduri.

Managerii de swarm sunt singurele mașini care pot executa comenzi sau pot permite altor mașini să se alăture swarm-ului ca **workeri**. Din moment ce pornești docker-ul în modul **swarm** transformă mașina de pe care s-a inițiat comanda în manager de swarm.

## Inițierea swarm-ului

Pentru a iniția swarm-ul emiți comanda `docker swarm init`. Aceasta va transforma mașina curentă în manager de swarm.
Pentru a adăuga alte mașini ca workeri, de pe acestea se va lansa comanda `docker swarm join`.

Folosind comanda `docker-machine` și având deja Virtualbox instalat, putem crea câteva mașini. Pentru a urma îndrumările manualului, vom crea două mașini virtuale.

```bash
docker-machine create --driver virtualbox virtuala1
```

Operațiunile prin care trece ca efect al comenzii.

```text
Running pre-create checks...
(virtuala1) Default Boot2Docker ISO is out-of-date, downloading the latest release...
(virtuala1) Latest release for github.com/boot2docker/boot2docker is v18.09.1
(virtuala1) Downloading /home/nicolaie/.docker/machine/cache/boot2docker.iso from https://github.com/boot2docker/boot2docker/releases/download/v18.09.1/boot2docker.iso...
(virtuala1) 0%....10%....20%....30%....40%....50%....60%....70%....80%....90%....100%
Creating machine...
(virtuala1) Copying /home/nicolaie/.docker/machine/cache/boot2docker.iso to /home/nicolaie/.docker/machine/machines/virtuala1/boot2docker.iso...
(virtuala1) Creating VirtualBox VM...
(virtuala1) Creating SSH key...
(virtuala1) Starting the VM...
(virtuala1) Check network to re-create if needed...
(virtuala1) Found a new host-only adapter: "vboxnet1"
(virtuala1) Waiting for an IP...
Waiting for machine to be running, this may take a few minutes...
Detecting operating system of created instance...
Waiting for SSH to be available...
Detecting the provisioner...
Provisioning with boot2docker...
Copying certs to the local machine directory...
Copying certs to the remote machine...
Setting Docker configuration on the remote daemon...
Checking connection to Docker...
Docker is up and running!
To see how to connect your Docker Client to the Docker Engine running on this virtual machine, run: docker-machine env virtuala1
```

Acum vom crea cea de-a doua mașină.

```bash
docker-machine create --driver virtualbox virtuala2
```

Efectul este crearea celei de-a doua mașini.

```text
nico@masina-locala:~$ docker-machine create --driver virtualbox virtuala2
Running pre-create checks...
Creating machine...
(virtuala2) Copying /home/nicolaie/.docker/machine/cache/boot2docker.iso to /home/nicolaie/.docker/machine/machines/virtuala2/boot2docker.iso...
(virtuala2) Creating VirtualBox VM...
(virtuala2) Creating SSH key...
(virtuala2) Starting the VM...
(virtuala2) Check network to re-create if needed...
(virtuala2) Waiting for an IP...
Waiting for machine to be running, this may take a few minutes...
Detecting operating system of created instance...
Waiting for SSH to be available...
Detecting the provisioner...
Provisioning with boot2docker...
Copying certs to the local machine directory...
Copying certs to the remote machine...
Setting Docker configuration on the remote daemon...
Checking connection to Docker...
Docker is up and running!
To see how to connect your Docker Client to the Docker Engine running on this virtual machine, run: docker-machine env virtuala2
```

Pentru a obține informații despre aceste mașini, se poate lansa comanda `docker-machine ls`.

```txt
NAME           ACTIVE   DRIVER       STATE     URL                         SWARM   DOCKER     ERRORS
docker-local   -        virtualbox   Error                                         Unknown    machine does not exist
virtuala1      -        virtualbox   Running   tcp://192.168.99.100:2376           v18.09.1   
virtuala2      -        virtualbox   Running   tcp://192.168.99.101:2376           v18.09.1   
```

În cazul nostru, prima mașină este managerul iar cea-a de-a doua un worker. Comunicarea cu mașinile virtuale se poate face prin SSH. Pentru a face din prima mașină un manager, trebuie lansată comanda `docker swarm init` chiar în interiorul ei.

```bash
docker-machine ssh virtuala1 "docker swarm init --advertise-addr 192.168.99.100"
```

Răspunsul este că swarm manager-ul a fost inițializat.

```txt
Swarm initialized: current node (khobcw34hyvt5i6jdz2m0rruz) is now a manager.

To add a worker to this swarm, run the following command:

    docker swarm join --token SWMTKN-1-52lzic58po4rff0nu5bzv1kztecy6sjpgy6xc5ou5gs0jah9x4-7y3t7jjwoshcwar6i96jntgrl 192.168.99.100:2377

To add a manager to this swarm, run 'docker swarm join-token manager' and follow the instructions.
```

Acum vom adăuga cea de-a doua mașină virtuală ca worker.

```bash
docker-machine ssh virtuala2 "docker swarm join --token SWMTKN-1-52lzic58po4rff0nu5bzv1kztecy6sjpgy6xc5ou5gs0jah9x4-7y3t7jjwoshcwar6i96jntgrl 192.168.99.100:2377"
```

Dacă totul este în regulă, răspunsul returnat va fi `This node joined a swarm as a worker.`

Pentru a vedea ce am realizat, va trebui să facem o interogare pe SSH primei mașini.

```bash
docker-machine ssh virtuala1 "docker node ls"
```

Răspunsul va fi un set de informații privind ambele mașini și rolul lor.

```text
ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS      ENGINE VERSION
khobcw34hyvt5i6jdz2m0rruz *   virtuala1           Ready               Active              Leader              18.09.1
ojtfxmkklegyc0f254d5f6a5a     virtuala2           Ready               Active                                  18.09.1
```

Pentru a părăsi swarm-ul va trebui rulată următoarea comandă pe SSH în fiecare mașină: `docker swarm leave`. Reține faptul că doar mașina care are rolul de manager poate executa comenzi. Restul mașinilor sunt doar pentru a crește capacitatea.

## Realizarea comunicării directe cu daemonul Docker

Pentru a rula comenzi pe mașina cu rol de manager există comanda `docker-machine ssh "comanda"`. Pentru a lucra cu daemonul Docker de pe mașina virtuală, mai există comanda `docker-machine env <numelemașinii>`. În cazul exercițiului desfășurat ar fi `docker-machine env virtuala1`. Răspunsul venit înapoi poate fi ceva similar cu următorul.

```txt
export DOCKER_TLS_VERIFY="1"
export DOCKER_HOST="tcp://192.168.99.100:2376"
export DOCKER_CERT_PATH="/home/nico/.docker/machine/machines/virtuala1"
export DOCKER_MACHINE_NAME="virtuala1"
# Run this command to configure your shell: 
# eval $(docker-machine env virtuala1)
```

Pentru a configura shell-ul în scopul stabilirii unui canal de comunicare cu mașina virtuală, vom rula următoarea comandă: `eval $(docker-machine env virtuala1)`. În acest moment shell-ul prezent va fi conectat direct la daemonul Docker de pe mașina virtuală. Putem rula comenzi directe acestuia cu scopul de a gestiona swarm-ul.

```bash
docker-machine ls
```

Comanda va afișa informații foarte utile despre mașinile care se află în swarm și starea acestora. Dacă nu mai dorești să ai consola conectată la managerul de swarm, poți să o decuplezi cu `eval $(docker-machine env -u)`.

De fiecare dată când deschizi un shell nou, trebuie să treci prin aceiași pași. Folosind această procedură te poți conecta la toate mașinile din swarm.

## Repornirea mașinilor

În cazul în care la o investigare cu `docker-machine ls` dintr-o consolă conectată se constată faptul că o mașină s-a oprit, o poți reporni cu `docker-machine start <machine-name>`.

## Rulează aplicația pe swarm

Pentru a rula aplicația pe swarm trebuie să faci un așa-zis deployment. Aflat în shell-ul care este conectat la daemonul Docker de pe mașina virtuală cu rol de manager, vei rula comanda de deployment (vezi și exemplul explicat la docker services).

```bash
docker stack deploy -c docker-compose.yml testApp
```

În acest moment aplicația va fi instalată în swarm. Pentru a vedea cum s-a distribuit efortul pe swarm, poți face o interogare din consola conectată cu `docker stack ps numeApp`. Accesarea aplicației se poate face de pe IP-urile ambelor mașini virtuale. Reține faptul că între mașinile virtuale participante este creată o rețea care este balansată. Folosind o consolă conectată la managerul de swarm, poți afla IP-urile acestor mașii cu `docker-machine ls`.

Dacă în `docker-compose.yml` ai specificat cinci instanțe ale aplicației, vei vedea cu `docker-machine ls` cum aceste containre beneficiază de mecanismul de load-balancing.

```yml
version: "3"
services:
  web:
    image: kosson/numeImagine:0.1
    deploy:
      replicas: 5
      resources:
        limits:
          cpus: "0.1"
          memory: 50M
      restart_policy:
        condition: on-failure
    ports:
      - "4000:80"
    networks:
      - webnet
networks:
  webnet:
```

Motivul pentru care ambele IP-uri funcționează deschizînd aplicația este pentru că toate nodurile sunt prinse într-o rețea de routare - ingress routing mesh. Acest lucru înseamnă că în cazul unei aplicații care răspunde pe un anumit port, acel port este rezervat indiferent de nodul care rulează containerul.

![](img/ingress-routing-mesh.png)

## Iterare și scalare

Pentru a opera orice modificări asupra aplicației care rulează pe swarm, vei urma aceiași pași de la momentul constituirii fișierului `docker-compose.yml`, pe care poate că vei dori să-l modifici, urmat apoi de reconstruirea imaginii căreia îi faci push în Docker Hub. Pentru a opera modificările și în swarm, va trebui să faci un `docker stack deploy`.
Dacă mărești capacitatea swarm-ului printr-un `docker join swarm` va trebui să faci din nou un deployment cu `docker stack deploy`.

## Imagini stocate privat

Dacă imaginile necesare construirii containerelor se află într-o zonă privată, mai întâi va trebui să te loghezi la acel registry privat `docker login registry.example.com`. La momentul în care faci deployment-ul, va trebui să pasezi opțiunea `--with-registry-auth`, precum în `docker stack deploy --with-registry-auth -c docker-compose.yml testApp`.

Ceea ce se petrece este că token-ul de login va trece de pe clientul local către nodurile swarm-ului în care serviciul face deploy.

## Copierea fișierelor pe cluster

```bash
docker-machine scp <file> <machine>:~
```

## Demontarea suitei de servicii

Pentru a desface literalmente suita de servicii (*stack*) existentă în swarm, va trebui să inițiezi o comandă `docker stack rm testApp`.

Dacă este necesar, după ce ai demontat suita de servicii, poți renunța la swarm. Pentru workeri va trebui să inițiezi individual din shell `docker-machine ssh virtuala2 "docker swarm leave"`, iar pentru manager poți executa `docker-machine ssh virtuala1 "docker swarm leave --force"`.

Pentru că uneori rămâne agățat în rulare `docker-proxy` blocând portul 443, va trebui să te asiguri că ai închis cu adevărat procesul.

```bash
sudo service docker stop
sudo rm -f /var/lib/docker/network/files/local-kv.db
```

Urmat de o repornire a daemonului.

```bash
sudo service docker start
```