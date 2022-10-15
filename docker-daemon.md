# Daemonul docker

Acest daemon este managerul containerelor. Acest daemon are nevoie de privilegii de root pentru a rula și din acest motiv, atunci când inițiezi containere, ai nevoie să adaugi utilizatorul sub care operezi la grupul `docker`. Altfel, ar trebui ca fiecare comandă să fie precedată cu `sudo`.

Pentru a verifica versiunea `docker` pe care o avem la îndemână, avem la dispoziție comanda `docker version` și `docker info`.