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

Răspunsul va fi un set de informații privind amble mașini și rolul lor.

```text
ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS      ENGINE VERSION
khobcw34hyvt5i6jdz2m0rruz *   virtuala1           Ready               Active              Leader              18.09.1
ojtfxmkklegyc0f254d5f6a5a     virtuala2           Ready               Active                                  18.09.1
```

Pentru a părăsi swarm-ul va trebui rulată următoarea comandă pe SSH în fiecare mașină: `docker swarm leave`.

Reține faptul că doar mașina care are rolul de manager poate executa comenzi. Restul mașinilor sunt doar pentru a crește capacitatea.

## Rulează aplicația pe swarm

