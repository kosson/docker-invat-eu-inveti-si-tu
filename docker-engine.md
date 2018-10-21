# Docker engine

Motorul Docker este o aplicație client-server care are în componență următoarele componente:

- un server care este este un daemon - comanda `dockerd`;
- un API REST care specifică interfețele pe care le folosesc programele pentru a vorbi cu daemonul și pentru a-i spune ce să facă;
- o linie de comandă, un CLI care este expusă utilizatorului numită `docker`.

Daemonul creează și gestionează obiecte Docker: imagini, containere, rețele și volume.

## Arhitectura Docker

Docker este scris în limbajul de programare Go și folosește diferite caracteristici ale kernelului Linux pentru a pune în uz diferite funcționalități.

Docker folosește o arhitectură client-server. Clientul Docker indică daemonului ce trebuie să facă, fie că ambii sunt pe o mașină locală, fie că sunt la distanță. Comunicarea se realizează printr-un API bazat pe REST.

Motorul Docker folosește UnionFS pentru a oferi blocurile constructive ale containerelor, dar include variante precum AUFS, btrfs, vfs și DeviceMapper.
Pe sistemul de operare Linux, Docker engine se bazează pe o tehnologie numită `control groups` - `cgroups`. Un cgroups limitează o aplicație la un set specific de resurse. Aceste control groups permit Docker engine să distribuie resursele hardware disponibile containerelor și la nevoie să stabilească limite și constrângeri.
