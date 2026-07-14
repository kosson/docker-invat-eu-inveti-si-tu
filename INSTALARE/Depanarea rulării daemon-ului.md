# Depanarea rulării daemon-ului

Verifică contextul în care rulează `docker`:

```bash
docker context ls
```

Poți verifica direct care este endpoint-ul:

```bash
docker context inspect --format '{{ .Endpoints.docker.Host }}'
```

Verifică dacă nu cumva serviciul a fost dezactivat. Se poate întâmpla atunci când dorești să rulezi Docker Desktop:

```bash
sudo systemctl status docker
```

Dacă e rootless Docker (vezi https://docs.docker.com/engine/security/rootless/):

```bash
systemctl --user status docker
```

Verifică să nu fie cumva instalat din snap:

```bash
snap services
```

și 

```bash
snap services docker.dockerd
```

## Vezi dacă ai socketul

Mai întâi verifică cu

```bash
docker context inspect --format '{{ .Endpoints.docker.Host }}'
```

Apoi verifică dacă fișierul chiar există cu 

```bash
file /var/run/docker.sock
```

În cazul în care folosești Docker Desktop, daemonul `docker` trebuie dezactivat ca serviciu. La investigarea contextului vei avea un răspuns similar cu `unix:///home/nicolaie/.docker/desktop/docker.sock`. Verifică-l pe acesta:

```bash
file /home/nicolaie/.docker/desktop/docker.sock
```

Răspuns: `socket`.

### Check if you have permission to the socket

Maybe it is an existing socket, but you don’t have permission to access it. The following command can reveal that:

`ls -l /var/run/docker.sock`

Output:

`srw-rw---- 1 root docker 0 Jan  3 12:49 /var/run/docker.sock`

It shows that the socket is owned by root, and it is assigned to the “docker” group. `rw-rw----` means that only the owner (root) or a user in the group (docker) can read and write the file. so you are either using

`sudo docker ps`

to list containers, or you add your user to the Docker group:

`sudo usermod -aG docker USERNAME`

There is actually a third option that I sort of “invented”, since I have never seen this anywhere else, but you can read about it in “[Allow non-root users to use the docker commands](https://dev.to/rimelek/install-docker-and-portainer-in-a-vm-using-ansible-21ib#allow-nonroot-users-to-use-the-docker-commands)”.

## Resurse

https://dev.to/rimelek/error-message-is-the-docker-daemon-running-3l7c
https://docs.docker.com/engine/install/linux-postinstall/