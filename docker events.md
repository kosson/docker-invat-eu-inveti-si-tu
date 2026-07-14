# Docker events

Docker oferă o comandă prin care poți supraveghea ceea ce se petrece la pornirea sau la oprirea unui container sau mai multe.

Commanda este `docker events`. Adu-ți aminte că poți folosi și `docker ps` pentru a investiga amănuntele de rulare ale unui container: `docker ps --filter "name=web_server" --format "{{.ID}}: {{.Status}}"`.

Evenimentele pof fi filtrate folosind opțiunea `--filter` precum în `docker events --filter type=container`.

## Evenimentele generate de containere

Containerele vor raporta următoarele evenimente:

- `attach`
- `commit`
- `copy`
- `create`
- `destroy`
- `detach`
- `die`
- `exec_create`
- `exec_detach`
- `exec_die`
- `exec_start`
- `export`
- `health_status`
- `kill`
- `oom`
- `pause`
- `rename`
- `resize`
- `restart`
- `start`
- `stop`
- `top`
- `unpause`
- `update`

## Imaginile docker

Evenimentele raportate de imaginile Docker:
`
- `delete`
- `import`
- `load`
- `pull`
- `push`
- `save`
- `tag`
- `untag`

## Pluginuri Docker

Evenimentele raportate de lucrul cu pluginurile:
`
- `enable`
- `disable`
- `install`
- `remove`

## Volumele Docker

Evenimentele:
`
- `create`
- `destroy`
- `mount`
- `unmount`

## Rețelele Docker

Rețelele vor rapota următoarele evenimente
`
- `create`
- `connect`
- `destroy`
- `disconnect`
- `remove`

## Docker daemons

Evenimentele raportate: `reload`.

## Serviciile Docker

Evenimentele:
`
- `create`
- `remove`
- `update`

## Nodurile Docker

Evenimentele generate de noduri:
`
- `create`
- `remove`
- `update`

## Docker secrets

Evenimentele generate
`
- `create`
- `remove`
- `update`

## Docker configs

Configurările Docker generează următoarele evenimente:
`
- `create`
- `remove`
- `update`

## Utilizarea API-ului

Poți utiliza API-ul Docker pentru a asculta evenimente care ar putea apărea.

```bash
curl --unix-socket /var/run/docker.sock http://localhost/events
```