# Persistența datelor

Atunci când un container este oprit, datele din sistemul de fișiere generat intern, vor dispărea (UnionFS).

Pentru că de cele mai multe ori vei avea nevoie de date persistente, cum ar fi loguri sau chiar bazele de date în anumite cazuri, Docker oferă posibilitatea de a oferi volume, care au un ciclu de viață separat de cel al containerelor.

Aceste volume sunt specificare în `Dockerfile` prin instrucțiunea `VOLUME` sau la momentul rulării imaginii, se poate specifica folosind opțiunea `-v`.

```bash
docker run -v /date -it busybox
```

Astfel, vei crea un director nou montat în container.
