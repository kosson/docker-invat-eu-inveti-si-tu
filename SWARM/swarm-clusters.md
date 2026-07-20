# Swarm clusters

Un cluster este o aplicație care rulează pe mai multe mașini. Aplicațiile care rulează folosind mai multe containere care folosesc mai multe mașini constituie ceea ce se numește `swarm` - *roi*. Docker poate rula individual pe o mașină, dar și prin cumularea puterii de calcul a mai multor mașini dacă este trecută în modul **swarm**. Din oficiu, Docker nu va inițializa vreun swarm. Poți interoga cu `docker info` și vei observa `Swarm: inactive`.

Un **swarm** este un grup de mașini care rulează Docker unite în ceea ce se numește **cluster**. Din moment ce clusterul s-a constituit, poți rula aceleași comenzi obișnuite folosind un **swarm manager**. Mașinile din **swarm** pot fi fizice sau virtuale. Când o mașină se adaugă unui **swarm**, aceasta devine un nod. Mașinile dintr-un **swarm** sunt noduri.

Managerii de swarm sunt singurele mașini care pot executa comenzi sau pot permite altor mașini să se alăture swarm-ului ca **workeri**. Un worker poate fi promovat la rang de manager. Un manager poate fi la rândul său un worker. Din moment ce pornești Docker-ul în modul **swarm** transformă mașina de pe care s-a inițiat comanda în manager de swarm.

## Inițierea swarm-ului

Pentru a iniția swarm-ul emiți comanda `docker swarm init`. Aceasta va transforma mașina curentă în manager de swarm.
Pentru a adăuga alte mașini ca workeri, de pe acestea se va lansa comanda `docker swarm join`.

```log
docker swarm init
Error response from daemon: could not choose an IP address to advertise since this system has multiple addresses on interface wlp3s0 (2a02:2f00:e101:7b33:46ee:e75:4088:fd5b and 2a02:245f:e101:7b00:8100:5bff:8a3a:2c8) - specify one with --advertise-addr

docker swarm init --advertise-addr 2a02:2f00:e101:7b33:46ee:e75:4088:fd5b
Swarm initialized: current node (ismq8sbihwl7e0o6sedtcgc6n) is now a manager.

To add a worker to this swarm, run the following command:

    docker swarm join --token SWMTKN-1-20srkflldevxc44ftp16edij8deo40khc9c0zqcg76kbnifhr-5bctgvplo725rtsnjgsolb92x [2a02:2f00:e101:7b33:46ee:e75:4088:fd5b]:2377

To add a manager to this swarm, run 'docker swarm join-token manager' and follow the instructions.

docker node ls

ID                            HOSTNAME          STATUS    AVAILABILITY   MANAGER STATUS   ENGINE VERSION
ismq8sbihwl7e0o6sedtcgc6n *   nico              Ready     Active         Leader           20.10.14
```

Observă faptul că starea managerului care a fost creat este de *Leader*. Nu poate exista decât un singurul lider între toți managerii.
## Resurse

- [Deploy services to a swarm](https://docs.docker.com/engine/swarm/services/)
- [Multipass for Fast Linux VM's!](https://www.pscp.tv/BretFisher/1mrGmQvNEWBGy)
- [Ubuntu VMs on demand for any workstation](https://multipass.run/)
- [cloud-init Documentation](https://cloudinit.readthedocs.io/en/latest/)
- [Only one host for production environment. What to use: docker-compose or single node swarm?](https://github.com/BretFisher/ama/discussions/146)
- [Docker Swarm Mode: EASY Tutorial, Christian Lempa](https://www.youtube.com/watch?v=_YsPt7dIvqU)