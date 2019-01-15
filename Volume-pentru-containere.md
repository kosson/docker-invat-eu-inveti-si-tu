# Volume

Este un director asociat unui container în care se pot introduce date. Toate containerele pot folosi același volum. Volumele sunt păstrate chiar și în cazul în care containerul este șters.

Volumele, indiferent unde le specifici în container, de fapt vor fi montate în `/mnt`-ul gazdei. De exemplu, pentru a avea un director în care să dezvolți o aplicație pentru Node, va trebui să folosești un director în care codul tău să persiste. Pentru a porni un server de Node care să aibă un volum, poți să-l specifici în linia de comandă care pornește containerul.

```bash
docker run -p 8080:3000 -v /var/www node
```

Docker va crea volumul menționat de opțiunea `-v` prin alias-ul `/var/www`.

## Creare volume particularizate

Uneori este nevoie să creezi un volum pe care să-l atașezi unui container. Pentru crearea volumelor vei folosi sub-comanda `volume create`.

```bash
docker volume create redis_date
```

Atașarea volumului nou creat se face la momentul `run`.

```bash
docker container run -d --name redis -v redis_date:/data --network reteaua_containerelor redis:alpine
```

## Listarea volumelor

Pentru a avea o perspectivă privind volumele folosite de containere, se poate apela la comanda `docker volume ls`.

## Configurarea volumelor

Să presupunem că tot o aplicație web folosind Node dorim să dezvoltăm. Asta, de regulă necesită un director `/var/www` în care pui sursele.

```bash
docker run -p 8080:3000 -v $(pwd):/var/www node
```

Unde `-v` specifică necesitarea configurării unui volum, `$(pwd):` specifică folosirea directorului de lucru în care se află consola în care va sta codul sursă și închei specificând volumul așa cum are nevoie containerului pentru a lucra cu sursele.

![Mounts](/images/2018/10/MountsVolume.png)

Fii foarte atent la faptul că este de o importanță crucială unde te afli în structura directoarelor mașinii gazdă la momentul în care scrii comanda.
Un alt lucru pe care trebuie să-l ții în minte este acela că poți șterge volumele folosite. Acest pas îl faci înainte de a șterge containerul.

```bash
docker rm -v nume_container_sau_id
```

În cazul folosirii node, ai nevoie să execuți comenzile de pornire a serverului. Pentru a seta contextul de execuție, vei folosi opțiunea `-w "/var/www"`, care este urmată de directorul din container.

```bash
docker run -p 8080:3000 -v $(pwd):/var/wwww -w "/var/www" node npm start
```
