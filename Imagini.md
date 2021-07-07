# Imagini Docker

Imaginile sunt folosite pentru a *împacheta* baza necesară pentru rularea codului propriu într-un container sau mai multe. Tot ceea ce conține o imagine `docker` este un set de layere de fișiere, dar care sunt read-only. Singura modalitate de a modifica o imagine este să adaugi un nivel (layer) suplimentar la momentul în care constitui containerul.

Toate imaginile care au fost create local, stau într-un registru local din care pot fi accesate.

Pentru că tot am menționat layerele, pentru oricare imagine există un nivel de bază pe care se adaugă celelalte layere pentru a modela un scenariu cerut. Imaginile docker sunt statice după momentul în care au fost constituite prin îmbogățirea uneia de bază. Asta înseamnă că de vei dori modificarea imaginii pentru a oferi servicii suplimentare sau pentru a reconfigura anumite servicii, va trebui să reconstruiești imaginea sau imaginile. Spun acest lucru pentru că în anumite cazuri o imagine se construiește pe baza altor imagini. Spunem despre imaginea originală că este o imagine părinte, iar despre cea care a fost generată că este una copil.

Poți să-ți creezi propriile imagini sau să le folosești pe cele create de ceilalți aflate într-un registru online. Pentru a *trage* o imagine de la Docker Hub, un depozit de imagini, vei folosi comanda `docker pull nume_imagini` și pentru a construi propria stivă, care servește unei anumite aplicații. Poți folosi `docker commit` pentru a actualiza imaginea online cu cele mai noi modificări, dar de cele mai multe ori vei folosi `docker build` în tandem cu directivele dintr-un `Dockerfile`. Folosirea unui `Dockerfile` permite modificarea unei imagini și rularea acesteia. Fiecare instrucțiune din `Dockerfile` creează un nou layer al imaginii. Atunci când ai nevoie de o mică modificare, o aduci fișierului `Dockerfile` și reconstruiești imaginea. În momentul în care rulezi o instanță a imaginii, spui că ai constituit un container. Acel container poate fi creat, șters, mutat sau distrus.
Pentru a investiga modificările aduse unei imagini, vei folosi `docker history`.

## Manipularea imaginilor existente

### Registrul imaginilor

Imagini Docker pot fi găsite în registre online cum este cel de la hub.docker.com. Pentru a aduce o imagine pe mașina locală vei executa `sudo docker pull numeimagine`. Dacă nu menționezi versiunea de imagine, va fi adusă cea care poartă eticheta `latest`. Acest lucru implică și faptul că poți construi imagini pe care să le versionezi. Pentru a aduce o anumită versiune, trebuie să menționezi numărul versiunii: `sudo docker pull busybox:1.24`.

Dacă ai construit o imagine, poți să o încarci online folosind `sudo docker push imagine`.

Poți descărca imagini și de la terți dacă menționezi id-ul utilizatorului și numele depozitului de pe hub.docker.com: `sudo docker pull idutilizator/numedepozit`. Poți trage o imagine și de pe un depozit privat dacă știi rădăcina în care se află acestea.

```bash
$ sudo docker pull depozit.kosson.ro/numeaplicatie
```

Dacă ai nevoie să cauți o anumită imagine, poți folosi `sudo docker search numeimagine`. Dacă vrei să limitezi numărul căutărilor, poți adăuga un pipe`| head -3`, de exemplu îți vor fi aduse primele trei.

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
Fiecare instrucțiune creează câte un nivel al imaginii atunci când este generată imaginea.

Un exemplu foarte simplu este:

```yaml
FROM node
MAINTAINER kosson  <nume.prenume@undeva.com>
LABEL author="Ionuț Alexandru"
RUN npm i express
RUN touch index.js > "console.log('BAU, BAU!')"
EXPOSE 3000
```

Instrucțiunea `FROM` îi comunică daemonului `docker` ce imagine de bază să folosească pentru construirea noii imagini. Instrucțiunea `MAINTAINER` indică utilizatorul care se ocupă de imagine. Instrucțiunea `RUN` comunică `docker build`-erului ce aplicații trebuie instalate și ce scripturi trebuie rulate pentru a crea suportul de rulare al aplicației. Subcomanda `build` construiește imagini dintr-un fișier `Dockerfile` și un *context*.

Fiecare instrucțiune are drept efect construirea unui nivel intermediar atunci când imaginea este constituită.

O mențiune privind volumele. Dacă specifici în `Dockerfile` necesită ca viitorul container generat în baza imaginii să constituie un director în care să persiste datele pe mașina gazdă, dacă vei avea instrucțiuni care ar trebui să pună ceva în director, la momentul creării legăturilor cu directorul de pe mașina gazdă, se vor pierde toate fișierele generate prin execuția unui `RUN`. Ar fi de preferat, ca directoarele de persistență să fie declarate la rularea containerului cu `docker run`.

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

Când vei construi o imagine pe care să o consideri fiind cea de bază, adică una care să ofere funcționalități aplicațiilor și dacă este posibil și altor containere, trebuie să urmezi o politică de setare a tag-urilor care să reflecte intențiile de exploatare. De exemplu, poți avea imaginea de bază cu tag-ul `base`, iar cea de `debugging` notată cu un tag `devel`.

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
