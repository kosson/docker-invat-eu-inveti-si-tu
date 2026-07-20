# Secrete în swarm

În contextul rulării serviciilor în Swarm, un secret este un blob de date. Acesta poate conține o parolă, o cheie privată de SSH sau un certificat SSL. Documentația spune că într-un secret sunt date care nu ar trebui să fie vehiculate pe rețea sau care să fie menționat în Dockerfile în clar sau în oricare parte a codului sursă a aplicației care va rula într-un container.

Mecanismul din spatele secretelor Docker este creat pentru a face disponibile date confidențiale containerelor care au nevoie de ele. Gestionarea tuturor acestor secrete se face într-un mod centralizat, iar în momentul în care sunt vehiculate pe rețea, sunt criptate. Dacă ai niște configurări care nu necesită criptare, poți folosi un mecanism similar secretelor numit configs - https://docs.docker.com/engine/swarm/configs/.

Un alt motiv este că vei dori ca secretele să fie folosite de containere, nu să ajungă și în imagini care pot fi distribuite public.

Secretele sunt gestionate în Swarm, nu și în containere simple.

Secretele pe care swarm-ul le gestionează sunt legate de parole, certificate TLS, chei de criptare și orice altceva care se dorește a fi criptat pe disc și în transferuri.

Destionarea secretelor se face cu ajutorul unei baze de date numită Raft DB care este criptată pe disc și se află doar pe nodul cu rol de manager. Transferul datelor de la manager către workeri se face prin canalele de comunicare (*control plane*) care deja sunt criptate TLS. Pentru a introduce secretele în baza de date, se va folosi comanda `docker secrets`.

Acestea sunt simple fișiere care for fi montate ca read-only în sistemul de subdirectoare al containerului în `/run/secrets/nume_secret`. Fiecare secret este un fișier în interiorul căruia este valoarea. Fiecare secret poate beneficia de alias-uri.

## Crearea unui secret în servicii

Pentru a introduce un secret, se poate folosi și introducerea acestuia în linia de comandă. Pentru cazul introducerii unui secret prin intermediul unui fișier, avem la îndemână `docker secret create`, precum în exemplul de mai jos.

```bash
docker secret create nume_mariadb nume_mariadb.txt
```

Rezutatul returnat va fi un identificator. Pentru a introduce de la linia de comandă `echo "oParol4" | docker secret create user_mariadb -`.

Secretele pot fi introduse și la momentul în care se creează serviciul:

```bash
docker service create --name psql --secret psql_user --secret psql_pass \
                    -e POSTGRES_PASSWORD_FILE=/run/secrets/psql_pass \
                    -e POSTGRES_USER_FILE=/run/secrets/psql_user \
                    postgres
```

Pentru a șterge secretele ai la îndemână comanda `docker service update --secret-rm`. Dacă ștergi vreun secret, se va fac automat un redeployment de container. Reține faptul că eliminarea unui secret conduce la oprirea containerului urmată de crearea și pornirea unuia nou.

Secretele pot fi create și în swarm stacks. Observă faptul că toate secretele au fost definite la finalul fișierului și apoi atribuite serviciilor care au nevoie de acestea.

```yml
services:
  psql:
    image: postgres
    secrets:
      - psql_user
      - psql_password
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/psql_password
      POSTGRES_USER_FILE: /run/secrets/psql_user
secrets:
  psql_user:
    file: ./psql_user.txt
  psql_password:
    file: ./psql_password.txt
```

Apoi folosești `docker stack deploy -c docker-compose.yml nume_stack`. După crearea containerelor poți investiga secretele create cu `docker secret ls`. La momentul în care se elimină stiva cu `docker stack rm nume_stack` vor fi eliminate și secretele.

## Comenzile disponibile

Accesul rapid la documentație este oferit de următorul link: https://docs.docker.com/engine/swarm/secrets/#read-more-about-docker-secret-commands.

## Resurse

- [Manage sensitive data with Docker secrets](https://docs.docker.com/engine/swarm/secrets/)
