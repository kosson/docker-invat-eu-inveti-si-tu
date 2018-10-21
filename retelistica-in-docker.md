# Managementul rețelei

Arhitectura de rețea Docker se construiește pe un set de interfețe numite *Container Network Model* (CNM).

## Aspecte practice

Atunci când un container este pornit, ceea ce se întâmplă este o cuplare la o rețea care se stabilește în subsidiar. Această rețea este una virtualizată de tip *bridge*. Toate containerele din rețeaua virtuală se văd unele cu celelalte fără a expune direct portul către mașina gazdă. Practica indică faptul că ar trebui ca fiecare aplicație realizată folosind containere docker să aibă propria rețea virtuală. Această rețea care se stabilește se va conecta la adaptorul ethernet al mașinii.

```bash
docker container run -p 80:80 --name webserver -d nginx
```

Pentru a realiza un port forwarding între mașină și container, se apelează la `-p` (`-publish`) urmat de menționarea portului pe care mașina trebuie să-l deschidă pentru a trimite pachete, urmat de două puncte și IP-ul pe care container-ul să asculte pachetele. Pentru a vedea pe ce se forwardează pachetele poți interoga docker folosind următoarea comandă:

```bash
docker container port webserver
```

Răspunsul este `80/tcp -> 0.0.0.0:80`. La nivelul unei mașini poți avea mai multe containere care să stabilească fiecare câte o rețea virtuală. Dar în acest caz trebuie ținută evidența porturilor expuse în mașină. Să nu expui același port din mai multe containere.

Pentru a afla IP-ul containerului poți face o interogare cu `inspect`.

```bash
docker container inspect --format '{{ .NetworkSettings.IPAddress }}' nume_container
```

## Comenzi de manipulare a rețelei

### Vizualizarea rețelelor deja create

```bash
docket network ls
```

### Obținerea de informații despre o rețea

```bash
docker network inspect nume_rețea
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
