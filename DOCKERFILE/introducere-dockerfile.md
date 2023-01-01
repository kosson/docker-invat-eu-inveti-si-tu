# Introducere Dockerfile

Acesta este un fișier yml care precizează pașii necesare pe care daemonul `docker` trebuie să-i parcurgă pentru a crea un container. Acești pași sunt tot atâtea comenzi care sunt scrise cu majuscule. Fiecare instrucțiune va avea drept efect crearea unui nivel, a unui *layer* suplimentar care se adaugă imaginii de bază care stă drept fundament al întregii construcții.

## Instrucțiune FROM

Această instrucțiune precizează care este imaginea *părinte* care va sta la baza imaginii finale care se dorește a fi creată.

```yml
FROM node:latest
```

Numele care însoțește instrucțiunea este cel al unei imagini care este descărcată de la Docker Hub. Fii foarte atentă la eticheta pe care o precizezi după numele imaginii. În cazul în care îți dorești să realizezi construcții foarte stabile, este recomandat să alegi un nume de versiune. Reține că în spatele `latest` se poate afla o imagine care să nu funcționeze prea bine cu aplicația care are nevoie de aceasta.

## Instrucțiune RUN

Această comandă permite rularea de comenzi în contextul sistemului virtual pe care containerul îl creează. Poți avea mai multe comenzi `RUN` într-un `Dockerfile`.

```yml
# Comentariu
RUN echo 'Urmează instrucțiuni utile'
RUN mkdir -p /var/www/app
```

## Instrucțiune CMD

Această comandă pare asemănătoare cu `RUN`, dar este diferită în sensul că oferă un punct de intrare (*entrypoint*) pentru a porni o aplicație în container. Spre deosebire de `RUN`, această comandă poate fi menționată o singură dată.

```yml
CMD["node","app.js"]
```

## Resurse

- [Dockerfile reference](https://docs.docker.com/engine/reference/builder/)
- [docker docs](https://docs.docker.com/)
