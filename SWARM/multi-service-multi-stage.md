# Crearea unei aplicații cu servicii multiple - staks

Un aspect foarte util pentru lucrul cu Docker este acela că poți folosi un fișier `docker-compose.yml` fie pentru a lucra cu `docker compose`, fie pentru a lucra cu `docker stack deploy`. În primul caz, `docker compose` nu va ști ce să facă cu declarațiile `deploy`, iar în cel de-al doilea `docker stack deploy` nu va ști ce să facă cu declarațiile `build`.

Motorul Docker când este folosit pentru a realiza un swarm, poate citi fișiere docker compose fără a implica utilitarul pe cere îl folosim doar pentru dezvoltare. Un astfel de fișier definește un *stack*. Fiecarea serviciu poate avea mai multe replici. Stack-ul poate avea rețele și poate gestiona informație secretă (chei de criptare, variabile de mediu, etc.). Bret Fisher ne oferă un exemplu care țintește agregarea mai multor servicii într-un swarm - [BretFisher moving back from java workers to latest](https://github.com/BretFisher/udemy-docker-mastery/blob/main/swarm-stack-4/answer/voting-app-placement.yml).

```yaml
services:
    redis:
        image: redis:alpine
        ports:
            - "6379"    
        networks:
            - frontend
        deploy:
            replicas: 2
            update_config:
                parallelism: 2
                delay: 10s
            restart_policy:
                condition: on-failure
    db:
        image: postgres:9.6
        volumes:
            - 'db-data:/var/lib/postgresql/data'
        networks:
            - backend
        environment:
            - POSTGRES_HOST_AUTH_METHOD=trust
        deploy:
            placement:
                constraints:
                    - node.labels.ssd == true
    vote:
        image: bretfisher/examplevotingapp_vote
        ports:
            - '5000:80'
        networks:
            - frontend
        deploy:
            replicas: 2
            update_config:
                parallelism: 2
            restart_policy:
                condition: on-failure
            placement:
                constraints:
                    - node.role == worker
    result:
        image: bretfisher/examplevotingapp_result
        ports:
            - '5001:80'
        networks:
            - backend
        depends_on:
            - db
        deploy:
            replicas: 1
            update_config:
                parallelism: 2
                delay: 10s
            restart_policy:
                condition: on-failure
    worker:
        image: bretfisher/examplevotingapp_worker
        networks:
            - frontend
            - backend
        deploy:
            mode: replicated
            replicas: 1
            labels: [APP=VOTING]
            restart_policy:
                condition: on-failure
                delay: 10s
                max-attempts: 3
                window: 120s
            placement:
                constraints:
                    - node.role == worker
networks:
    frontend: null
    backend: null
volumes:
    db-data: null
```

Se observă faptul că suplimentar instrucțiunilor pe care le găsim în fișierele pe care le folosim în `docker compose` avem unele `deploy` care dau detalii privind pe care nod să se instanțieze containerele.

Pentru deployment se va folosi comanda `docker stack deploy -c nume_fisier.yml nume_app`. Pentru a investiga ceea ce s-a creat ai la îndemână comanda `docker stack ps nume_aplicatie`. Pentru a vedea informații privind replicile, poți folosi comanda `docker stack service nume_applicatie`. Dacă ai modificat fișierul poți face un deploy cu `docker stack deploy -c nume_fisier.yml nume_aplicatie`.