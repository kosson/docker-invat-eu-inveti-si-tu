# Instalarea serverelor de SQL

## MySQL

```bash
docker container run -d -p 3306:3306 --name db -e MYSQL_RANDOM_ROOT_PASSWORD=yes mysql
```

Este generată o parolă aleatorie care trebuie recuperată din loguri.

```bash
docker container logs db
```

Caută în log ceva de forma `GENERATED ROOT PASSWORD: iem3Ahl1wiey6thingeiLiehieth1ung`.
