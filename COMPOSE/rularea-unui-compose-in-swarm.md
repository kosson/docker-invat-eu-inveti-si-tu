# Rularea în Swarm

Buna practică spune că Docker Compose ar trebui folosit doar pentru a crea resursele într-un mediu de test, unde ai posibilitatea să ajustezi diferite caracteristici tehnice ale serviciilor menționate în fișierul `docker-compose.yaml`. Mediul de rulare în producție ar trebui să fie cel puțin un Swarm.

Pentru a rula stiva de sercicii pe care ai creat-o într-un mediu cât mai apropiat de cel de producție, poți rula stiva serviciilor folosind comanda `docker stack deploy`, precum în exemplul acesta: `docker stack deploy -c docker-compose.yml stiva_servicii`.

Toate serviciile vor fi pornite conform succesiunii menționate în fișier. Pentru o investigație sumară, vei rula `docker stack ls`.

Rularea cu `docker stack` nu oferă posibilitatea de a opri stiva așa cum ești obișnuit(ă) cu `docker compose down`. În schimb, ai la dispoziție o comandă care șterge stiva din runtime-ul Swarm-ului: `docker stack rm`. De exemplu, `docker stack rm stiva_servicii`. Volumele create vor fi păstrate. La momentul în care vei invoca comanda `docker stack deploy -c docker-compose.yml stiva_servicii` din nou, totul va fi la fel ca în momentul în care ai eliminat stiva din Swarm.

În cazul în care dorești să ștergi și volumele pentru a curăța după un expriment, poți rula comanda `docker volume rm` pentru volumele care au fost folosite. De exemplu: `docker volume rm vol1 vol2`. Nu uita de faptul că mai întâi trebuie să oprești stiva din rularea în Swarm cu `docker stack rm nume_stivă`.