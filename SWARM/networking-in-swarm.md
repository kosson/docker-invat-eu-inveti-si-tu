# Networking in swarm

Când creezi rețele într-un swarm, vei folosi un driver specific care este `overlay` (`--driver overlay`). Reține faptul că un container poate sta în mai multe rețele.

```bash
docker network create --driver overlay aplicatie
```

Acest driver permite serviciilor care rulează să se vadă unele cu celelalte de parcă ar fi în același subnet.

Dacă investighezi ce rețele sunt create folosind `docker network ls`, vei observa că din oficiu este creată pentru swarm cea cu numele `ingress`, dar și una de tip bridge cu numele `docker_gwbridge`.

În cazul în care dorești să criptezi comunicarea în swarm, poți folosi criptare IPSec. Din oficiu este dezactivată din motive legate de performanță.

## Routing mesh

Dacă într-o configurație de swarm ai trei workeri pentru o aplicație web, de exemplu, vei putea accesa aplicația aplelând-o din browser cu oricare dintre IP-urile pe care le au workerii. Acest lucru este posibil pentru că routarea pachetelor se face printr-un mecanism de load balancing care folosește niște primitive ale kernelui de Linux numite IPVS (IP Virtual Server).

În cazul în care ai avea două servere de baze de date în rețeaua virtuală a unui serviciu (deci două replici), comunicarea între containerul aplicației care are nevoie de date din acestea, le-ar obține prin intermediul rutării cererii printr-un Virtual IP (pe care îl pune swarm-ul) ca punct de acces în rețeaua virtuală a serviciului și apoi printr-un load balancing ar trimite cererea către o instanță (un worker poate avea mai multe containere). Este cazul comunicării unui serviciu din rețeaua virtuală cu un altul (comunicarea între noduri).

Acest tip de routing nu persistă starea unui nod dacă acesta este inactivat din diferite motive. Este stateless (OSI Layer 3).

## Resurse

- [IPVS-Based In-Cluster Load Balancing Deep Dive](https://kubernetes.io/blog/2018/07/09/ipvs-based-in-cluster-load-balancing-deep-dive/)
