# Imagini Docker

Imaginile sunt folosite pentru a *împacheta* baza necesară pentru rularea codului propriu într-un container sau mai multe. Tot ceea ce conține o imagine `docker` este un set de layere de fișiere care sunt read-only. Aceste straturi software sunt binarele, bibliotecile de cod și aplicațiile care împreună alcătuiesc propria implementare software. Nu există kernel sau module de kernel. O imagine poate fi chiar un singur fișier sau poate fi un întreg sistem de operare. Singura modalitate de a modifica o imagine este să adaugi un nivel (layer) suplimentar la momentul în care constitui containerul. Imaginile se folosesc de caracteristicile funcționale ale lui Union Filesystem, fapt ce permite realizarea unei stive de niveluri necesare construcției finale.

Toate imaginile care au fost create local, stau într-un registru local din care pot fi accesate.

Pentru că tot am menționat layerele, pentru oricare imagine există un nivel de bază pe care se adaugă celelalte layere pentru a modela un scenariu cerut. Imaginile docker sunt statice după momentul în care au fost constituite prin îmbogățirea uneia de bază. Asta înseamnă că de vei dori modificarea imaginii pentru a oferi servicii suplimentare sau pentru a reconfigura anumite servicii, va trebui să reconstruiești imaginea sau imaginile. Spun acest lucru pentru că în anumite cazuri o imagine se construiește pe baza altor imagini. Spunem despre imaginea originală că este o imagine părinte, iar despre cea care a fost generată că este una copil.

Poți să-ți creezi propriile imagini sau să le folosești pe cele create de ceilalți aflate într-un registru online. Pentru a *trage* o imagine de la Docker Hub, un depozit de imagini, vei folosi comanda `docker pull nume_imagini` și pentru a construi propria stivă, care servește unei anumite aplicații. Poți folosi `docker commit` pentru a actualiza imaginea online cu cele mai noi modificări, dar de cele mai multe ori vei folosi `docker build` în tandem cu directivele dintr-un `Dockerfile`. Folosirea unui `Dockerfile` permite modificarea unei imagini și rularea acesteia. Fiecare instrucțiune din `Dockerfile` creează un nou layer al imaginii. Atunci când ai nevoie de o mică modificare, o aduci fișierului `Dockerfile` și reconstruiești imaginea. În momentul în care rulezi o instanță a imaginii, spui că ai constituit un container. Acel container poate fi creat, șters, mutat sau șters.
Pentru a investiga modificările aduse unei imagini, vei folosi `docker history`.

## Manipularea imaginilor existente

### Investigarea istoricului de construcție

Comanda `docker history nume_imagine` permite vizualizarea istoricului care indică cum s-au construit nivelurile. Fiecare layer este identificat printr-un SHA unic. O comandă care afișează toate detaliile de construcție la nivel de metadate este `docker image inspect nume_imagine`.

### Registrul imaginilor

Imagini Docker pot fi găsite în registre online cum este cel de la hub.docker.com. Pentru a aduce o imagine pe mașina locală vei executa `sudo docker pull numeimagine`. Dacă nu menționezi versiunea de imagine, va fi adusă cea care poartă eticheta `latest`. Acest lucru implică și faptul că poți construi imagini pe care să le versionezi. Pentru a aduce o anumită versiune, trebuie să menționezi numărul versiunii: `sudo docker pull busybox:1.24`.

Dacă ai construit o imagine, poți să o încarci online folosind `sudo docker push imagine`.

Poți descărca imagini și de la terți dacă menționezi id-ul utilizatorului și numele depozitului de pe hub.docker.com: `sudo docker pull idutilizator/numedepozit`. Poți trage o imagine și de pe un depozit privat dacă știi rădăcina în care se află acestea.

```bash
$ sudo docker pull depozit.kosson.ro/numeaplicatie
```

Dacă ai nevoie să cauți o anumită imagine, poți folosi `sudo docker search numeimagine`. Dacă vrei să limitezi numărul căutărilor, poți adăuga un pipe: `| head -3`. În exemplu îți vor fi aduse primele trei.

### Listarea și aducerea imaginilor disponibile

Poți în oricare moment să afli care sunt imaginile care sunt disponibile în cache.

```bash
docker image ls
```

Pentru a aduce o imagine în cache, trebuie să o aduci. Poți să interoghezi depozitul de imagini pentru a vedea ce este disponibil: `docker search nume_imagine_dorită`.

```bash
docker pull nume_imagine:1.12
```

Dacă nu menționezi versiunea imaginii, subcomanda `pull` va aduce imaginea cu tag-ul `latest`. Pentru a transforma imaginea într-un container pe care să-l folosești, vei iniția generarea unui container cu `docker run nume_imagine`.

## Crearea unei imagini

### Crearea imaginilor din containere

La imaginea de bază pe care o rulezi drept container, poți adăuga software suplimentar și apoi poți converti acel container într-o imagine pe care să o folosești mai departe.

După ce ai modificat imaginea pentru a conserva aceste modificări într-o nouă versiune, trebuie să faci un `docker commit`.  Modificările pot fi investigate cu un `docker diff identificatorcontainer`. Subcomanda `commit` se poate aplica pe un container care rulează sau pe unul oprit. Motorul Docker va opri containerul în momentul în care se face commit-ul pentru a nu corupe datele interne.

Imediat după commit, imaginea va apărea printre cele deja existente și este gata să fie folosită. Acestă modalitate de a crea imagini nu este recomandată decât pentru a face câteva teste. Cea mai elegantă metodă este de a crea imagini folosind un fișier dedicat `Dockerfile`.

### Crearea imaginilor cu Dockerfile

În acest sens, vei crea un fișier `Dockerfile` care conține instrucțiuni necesare realizării operațiunilor necesare creării. Comanda de lucru este `docker build`.

#### Pasul 1 - scrierea fișierului Dockerfile

Acest fișier este responsabil de construcția imaginii. Fiecare linie dintr-un fișier `Dockerfile` este constituit din instrucțiuni urmate de câte o declarație.
Fiecare instrucțiune creează câte un nivel (*layer*) al imaginii atunci când este generată imaginea. Docker va face ceva foarte interesant cu fiecare nivel. Pur și simplu va face un caching (scrie un fișier pe disc pentru fiecare modificare pe care o aduce instrucțiunea). Acest *caching* evită scrierea unui alt fișier dacă respectiva linie a instrucțiunii nu s-a modificat. Reține faptul că în cazul unei modificări, începând cu acea linie, se vor rescrie toate fișirele pe disc. Din acest motiv, o bună strategie ar fi să pui cât mai spre final liniile care au potențial să se modifice mai des.

Un exemplu foarte simplu este:

```yaml
FROM node
MAINTAINER kosson <nume.prenume@undeva.com>
LABEL author="Ionuț Alexandru"
RUN npm i express
RUN touch index.js > "console.log('BAU, BAU!')"
EXPOSE 3000
```

Instrucțiunea `FROM` este prima din fișier. Comunici daemonului `docker` ce imagine de bază să folosească pentru construirea noii imagini. Instrucțiunea `MAINTAINER` indică utilizatorul care se ocupă de imagine. Instrucțiunea `RUN` comunică `docker build`-erului ce aplicații trebuie instalate și ce scripturi trebuie rulate pentru a crea suportul de rulare al aplicației. Subcomanda `build` construiește imagini dintr-un fișier `Dockerfile` și un *context*.

Fiecare instrucțiune are drept efect construirea unui nivel intermediar atunci când imaginea este constituită.

O mențiune privind volumele. Dacă specifici în `Dockerfile` necesită ca viitorul container generat în baza imaginii să constituie un director în care să persiste datele pe mașina gazdă, dacă vei avea instrucțiuni care ar trebui să pună ceva în director, la momentul creării legăturilor cu directorul de pe mașina gazdă, se vor pierde toate fișierele generate prin execuția unui `RUN`. Ar fi de preferat, ca directoarele de persistență să fie declarate la rularea containerului cu `docker run`.

Variabilele de mediu le introduci folosind `ENV` precum în `ENV NGINX_VERSION 1.14`.

Pentru a rula diferite comenzi, acestea vor fi rulate la momentul creării imaginii dacă sunt menționate prin `RUN`. În exemplul de mai jos, luând drept bază un Debian Bullseye, vom instala nginx.

```yml
FROM debian:bullseye
ENV NGINX_VERSION 1.11
RUN apt-get update \
    && apt-get install --no-install-recommends --no-install-suggests -y \
                        ca-certificates \
                        nginx=${NGINX_VERSION} \
                        nginx-module-xslt \
                        nginx-module-geoip \
                        nginx-module-image-filter \
                        nginx-module-perl \
                        nginx-module-njx \
                        gettext-base \
    && rm -rf /var/lib/apt/lists/*
RUN ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log
EXPOSE 80 443
CMD["nginx", "-g", "daemon off;"]
```

Observă faptul că în a doua comandă facem o redirectare a rezultatelor afișate în terminal către fișierele de logging cu care deja suntem familiari. Comanda `CMD` este necesară pentru a menționa care este comanda care va fi rulată la momentul în care containerul începe să ruleze, fie că este pornit prima dată sau este repornit. În cazul în care extinzi o imagine existentă este posibil ca aceasta să aibă deja comanda CMD și tu doar să menționezi eventual directorul de lucru și ce copiezi acolo de la mașina gazdă a containerului.

```yaml
FROM nginx:latest
WORKDIR /usr/share/nginx/html
# pentru a evita cd nume_director, folosește WORKDIR
COPY index.html index.html
```

Observă faptul că nu am CMD în exemplu și nici EXPOSE. Acestea sunt *moștenite* din imaginea de la care facem FROM. Un amănunt legat de EXPOSE. Chiar dacă expui porturile pe care în container se ascultă cereri, trebuie să le menționezi cu `-p` la momentul rulării containerului pentru a face forwarding-ul.

Reține faptul că fiecare comandă din fișierul `Dockerfile` este un layer nou care va fi identificat printr-un hash unic. Un alt reper de construcție este acela privind menționarea layerelor care nu se modifică frecvent la începutul fișierelor, iar cele care sunt mai dinamica la final. Astfel, va fi asigurat un timp foarte redus de reconstrucție în cazul în care ai părți care se modifică.

#### Pasul 2 - construirea imaginii

După ce ai elaborat fișierul pe baza căruia se va construi imaginea, vei apela sub-comanda `build` pentru a genera noua imagine. Dacă fișierul `Dockerfile` se află în același director în care te afli deja, nu mai este necesară specificarea lui folosind opțiunea `--file` (pe scurt `-f`). Se înțelege că există deja acolo.

```bash
sudo docker build -f Dockerfile -t nicolaie/node_test:v1 .
```

Opțiunea `-t`, prescurtare de la `--tag`, este utilizată pentru a identifica imaginea printr-o etichetă. În cazul în care folosești un alt fișier de construcție, care nu este cel canonic (`Dockerfile`), numit altfel, poți specifica numele fișierului care trebuie folosit prin opțiunea `-f cale/NumeFisier`.
Opțiunea punct `.` comunică builder-ului că fișierul **Dockerfile** este chiar în acest director de unde se face build-ul. Punctul are același rol ca în Bash - indică directorul curent. Dacă fișierul nu este în directorul curent, se poate menționa calea.

```bash
Sending build context to Docker daemon  266.9MB
Step 1/6 : FROM node
latest: Pulling from library/node
d660b1f15b9b: Pull complete
46dde23c37b3: Pull complete
6ebaeb074589: Pull complete
e7428f935583: Pull complete
eda527043444: Pull complete
f3088daa8887: Pull complete
80d986fe44e3: Pull complete
d05590b5f646: Pull complete
Digest: sha256:8a701e577d896c7595ad12d5cafaf895d76a840086e85f86379f47b30768b254
Status: Downloaded newer image for node:latest
 ---> 745543c62d8d
Step 2/6 : MAINTAINER kosson  <kosson@gmail.com>
 ---> Using cache
 ---> bc2af9bfb0ff
Step 3/6 : LABEL author="Nicolaie Constantinescu"
 ---> Using cache
 ---> 30f781663e55
Step 4/6 : RUN npm i express
 ---> Using cache
 ---> 2ce1fd74b7cf
Step 5/6 : RUN touch index.js > "console.log('BAU, BAU!')"
 ---> Running in bed4315a65f0
Removing intermediate container bed4315a65f0
 ---> 16e4ae4a3512
Step 6/6 : EXPOSE 3000
 ---> Running in bf26d6e02eef
Removing intermediate container bf26d6e02eef
 ---> bdfaec48fd25
Successfully built bdfaec48fd25
Successfully tagged nicolaie/node_test:v1
```

Ceea ce se va putea observa este faptul că `docker` va construi un context în care să construiască imaginea. Astfel, va proceda la aducerea imaginii necesare din hub și apoi va parcurge toate etapele menționate prin instrucțiunile `RUN`. La fiecare pas care a reușit se constituie un nou container intermediar identificat prin hash distinct. La final s-a creat imaginea cu id-ul `bdfaec48fd25`.

Dacă ai să arunci o privire pe lista imaginilor, o vei vedea pe cea nou constituită.

```bash
docker image ls
REPOSITORY           TAG                 IMAGE ID            CREATED             SIZE
nicolaie/node_test   v1                  bdfaec48fd25        10 minutes ago      677MB
node                 latest              745543c62d8d        7 hours ago         674MB
```

O imagine docker poate avea maxim 147 niveluri.

#### Pasul 3 - rularea imaginii

După ce ai construit imaginea, vei dori să o rulezi.

```bash
sudo docker run -it nicolaie/node_test:v1 node index.js
```

## Tehnici de construcție

Atunci când ai de rulat mai multe comenzi `RUN`, fiecare dintre acestea vor forma un nou layer în imagine. Este de preferat să fie folosite comenzile de shell care concatenează operațiunile.

```yaml
RUN apt -y update
RUN apt i -y python
```

Poate fi concatenat în:

```yaml
RUN apt -y update && apt i -y python
```

### Multiple imagini

Când vei construi o imagine pe care să o consideri fiind cea de bază, adică una care să ofere funcționalități aplicațiilor și dacă este posibil și altor containere, trebuie să urmezi o politică de setare a tag-urilor care să reflecte intențiile de exploatare. De exemplu, poți avea imaginea de bază cu tag-ul `base`, iar cea de `debugging` notată cu un tag `devel`. Tag-urile trebuie înțelese drept etichete care trimit la o anumită imagine. Poți avea mai multe tag-uri diferite care să fie atribuite aceleiași imagini. Pentru a atribui un nou tag unei imagini pe care ai creat-o sau ai descărcat-o prin `pull`, vei folosi opțiunea `tag`, precum în următoarea comandă.

```bash
docker image tag mongodb kosson/mongodb
```

Dacă nu dai un tag la imagine, aceasta va apărea ca `<none>` la momentul listării imaginilor. Dacă ai uitat, poți folosi sub-comanda `tag` pentru a da un nume imaginii. Numele se dă la momentul construcției imaginii adăugând opțiunea `-t numeimaginenoua`.

```bash
docker build -t numeimaginenoua .
```

Dacă nu-i dai nicio etichetă, motorul `docker` va da automat eticheta `latest`. Dacă este menționat punctul la finalul sub-comenzii `build`, motorul Docker va căuta fișierul `Dockerfile ` în rădăcina din care se dă comanda. Dacă fișierul nu este în locația de unde este rulată comanda, poți preciza calea în locul punctului.

Pentru a încărca imaginea în contul Docker hub, va trebuie să te autentifici din linia de comandă mai întâi cu `docker login`. Dacă mașina de pe care lucrezi nu-ți aparține, vei da un `docker logout`.


### Eliminarea imaginilor neutilizate

Pentru a șterge imaginile care nu mai sunt utile, există comanda `docker image prune`. Este vorba despre nivelurile ale imaginilor pe care nu le mai folosești, dar care au fost descărcate, nu mai au conexiuni cu imaginile existent și acum ocupă spațiu inutil. Pentru cele pentru care nu ai asociat cel puțin un container: `docker image prune -a`. O comandă care va elimina toate imaginile și alte resurse Docker care nu sunt folosite de containerele care rulează curent este `docker system prune`. Folosiți `docker system prune -a` doar în cazul în care doriți să o luați de la zero sau să faceți curat din rațiuni de spațiu ș.a.m.d. Poți să obții un raport privind spațiul folosit prin execuția comenzii `docker system df`. Un posibil raport poate să semene cu următorul.

```text
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          19        6         10.58GB   3.913GB (36%)
Containers      55        0         4.51GB    4.51GB (100%)
Local Volumes   0         0         0B        0B
Build Cache     0         0         0B        0B
```

În cazul exemplului de mai sus, prin aplicarea lui `docker image prune -a` putem vedea noul raport obținut prin `docker system df` care indică un câștig de spațiu.

```text
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          6         6         6.723GB   0B (0%)
Containers      55        0         4.51GB    4.51GB (100%)
Local Volumes   0         0         0B        0B
Build Cache     0         0         0B        0B
```

Subcomanda `prune` poate fi folosită pe `system`, `image` și pe `container`.

### Ștergerea imaginilor

Acest lucru se face apelând comanda

```bash
docker rmi -f identificator_imagine
```

Ștergerea imaginilor care nu sunt valide (au tag-ul `none`).

```bash
docker images | grep none | tr -s ' ' | cut -d ' ' -f 3 | xargs -I {} docker rmi -f {}
```

- `grep none` va filtra toate imaginile care au tag-ul `none`;
- `tr -s ' '` - comanda *transliterate* permite introducere unui caracter la alegere într-un șir de caractere dat. În cazul nostru, comanda comprimă o serie de spații într-unul singur. Acest lucru este necesar pentru a elimina multiplele spații generate în rezultatul lui `docker images`;
- `cut -d ' ' -f 3` taie al treilea șir de caractere dintr-o serie delimitată de spații: `alpine latest 389fef711851 10 days ago 5.58MB`. Ajungem la identificator, de fapt;
- `xargs -I {} docker rmi -f {}` preia inputul oferit de celelalte comenzi și îl trimite următoarei. Adică, ID-ul va fi pasat lui `docker rmi -f`.

## Resurse

- [Handle Docker Images Like A Pro | Mohammad Faisal](https://medium.com/javascript-in-plain-english/delete-docker-images-like-a-pro-a8fece854ec8)
- [Dockerfile reference](https://docs.docker.com/engine/reference/builder/)
- [Top 8 Docker Best Practices for using Docker in Production](https://youtu.be/8vXoMqWgbQQ)
