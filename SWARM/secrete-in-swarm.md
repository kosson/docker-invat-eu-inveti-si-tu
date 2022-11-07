# Secrete în swarm

Secretele pe care swarm-ul le gestionează sunt legate de parole, certificate TLS, chei de criptare și orice altceva care se dorește a fi criptat pe disc și în transferuri.

Destionarea secretelor se face cu ajutorul unei baze de date numită Raft DB care este criptată pe disc și se află doar pe nodul cu rol de manager. Transferul datelor de la manager către workeri se face prin canalele de comunicare (*control plane*) care deja sunt criptate TLS. Pentru a introduce secretele în baza de date, se va folosi comanda `docker secrets`.

Secretele sunt ținute în `/run/secrets/nume_secret`. Fiecare secret este un fișier în interiorul căruia este valoarea. Fiecare secret poate beneficia de alias-uri.

## Crearea unui secret în servicii

Pentru a introduce un secret, se poate folosi și introducerea acestuia în linia de comandă. Pentru cazul introducerii unui secret prin intermediul unui fișier, avem la îndemână `docker secret create`, precum în exemplul de mai jos.

```bash
docker secret create nume_mariadb nume_mariadb.txt
```

Rezutatul returnat va fi un identificator.

Pentru a introduce de la linia de comandă `echo "oParol4" | docker secret create user_mariadb -`.

Secretele pot fi introduse și la momentul în care se creează serviciul:

```bash
docker service create --name psql --secret psql_user --secret psql_pass \
                    -e POSTGRES_PASSWORD_FILE=/run/secrets/psql_pass \
                    -e POSTGRES_USER_FILE=/run/secrets/psql_user \
                    postgres
```

Pentru a șterge secretele ai la îndemână comanda `docker service update --secret-rm`. Dacă ștergi creun secret, se va fac automat une redeplyment de container. Reține faptul că eliminarea unui secret conduce la oprirea containerului urmată de crearea și pornirea unuia nou.