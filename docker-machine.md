# Docker Machine

Acesta este un mecanism prin care este oferită o interfață către câțiva provideri de servicii cloud.

Pentru a experimenta această interfață, vom folosi VirtualBox pentru mediul care ar simula cloud-ul.

```bash
docker-machine create --driver virtualbox docker-local
```

Răsunsul va fi crearea unei mașini dedicate Docker.

```text
Creating CA: /home/user1/.docker/machine/certs/ca.pem
Creating client certificate: /home/user1/.docker/machine/certs/cert.pem
Running pre-create checks...
(docker-local) Image cache directory does not exist, creating it at /home/user1/.docker/machine/cache...
(docker-local) No default Boot2Docker ISO found locally, downloading the latest release...
(docker-local) Latest release for github.com/boot2docker/boot2docker is v18.06.1-ce
(docker-local) Downloading /home/user1/.docker/machine/cache/boot2docker.iso from https://github.com/boot2docker/boot2docker/releases/download/v18.06.1-ce/boot2docker.iso...
(docker-local) 0%....10%....20%....30%....40%....50%....60%....70%....80%....90%....100%
Creating machine...
(docker-local) Copying /home/user1/.docker/machine/cache/boot2docker.iso to /home/user1/.docker/machine/machines/docker-local/boot2docker.iso...
(docker-local) Creating VirtualBox VM...
(docker-local) Creating SSH key...
(docker-local) Starting the VM...
(docker-local) Check network to re-create if needed...
(docker-local) Found a new host-only adapter: "vboxnet0"
(docker-local) Waiting for an IP...
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
To see how to connect your Docker Client to the Docker Engine running on this virtual machine, run: docker-machine env docker-local
```

Pentru a vedea detaliile vom rula `docker-machine enc docker-local`.

```text
export DOCKER_TLS_VERIFY="1"
export DOCKER_HOST="tcp://192.168.99.100:2376"
export DOCKER_CERT_PATH="/home/user1/.docker/machine/machines/docker-local"
export DOCKER_MACHINE_NAME="docker-local"
# Run this command to configure your shell:
# eval $(docker-machine env docker-local)

```

La instalarea Docker vei putea vedea ce mașini docker sunt instalate local:

```bash
$ docker-machine ls
```

Vor fi oferite detaliile mașinilor virtuale care vor găzdui containerele de lucru.

```text
NAME           ACTIVE   DRIVER       STATE     URL                         SWARM   DOCKER        ERRORS
docker-local   -        virtualbox   Running   tcp://192.168.99.100:2376           v18.06.1-ce  
```

Pentru că s-au creat chei de securitate, va fi posibilă comunicarea pe SSH.

```bash
docker-machine ssh docker-local
```

Și avem în acest moment acces la mașina virtuală.

```text
                 ##         .
           ## ## ##        ==
        ## ## ## ## ##    ===
       /"""""""""""""""""\___/ ===
  ~~~ {~~ ~~~~ ~~~ ~~~~ ~~~ ~ /  ===- ~~~
       \______ o           __/
        \    \         __/
         \____\_______/
_                 _   ____     _            _
| |__   ___   ___ | |_|___ \ __| | ___   ___| | _____ _ __
| '_ \ / _ \ / _ \| __| __) / _` |/ _ \ / __| |/ / _ \ '__|
| |_) | (_) | (_) | |_ / __/ (_| | (_) | (__|   <  __/ |
|_.__/ \___/ \___/ \__|_____\__,_|\___/ \___|_|\_\___|_|
Boot2Docker version 18.06.1-ce, build HEAD : c7e5c3e - Wed Aug 22 16:27:42 UTC 2018
Docker version 18.06.1-ce, build e68fc7a
docker@docker-local:~$  
```

Toți marii provideri de servicii de cloud permit instanțierea de mașini virtuale gata de a rula containere Docker.

## Pornirea unei mașini docker

```bash
$ docker-machine start nume_masina
```

## Oprirea unei mașini

```bash
$ docker-machine stop nume_masina
```

## Restart

```bash
docker-machine restart nume_masina
```

## Eliminarea unei mașini

```bash
docker-machine rm nume_masina
```

## Configurarea mediului de rulare

```bash
$ docker-machine env nume_masina
```

## Obține IP-ul unei anumite mașini

```bash
$ docker-machine ip nume_masina
```

## Comenzi de investigare a mașinii gazdă

### inspect

### config

### status

### url
