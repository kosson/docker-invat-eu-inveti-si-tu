# Containere

Sunt blocurile constructive. Acestea sunt simple procese pe mașina locală. Un container nu este o mașină virtuală. Dacă inițiezi o interogare a proceselor care rulează pe mașină, vei vedea și imaginile care rulează în containere apărând printre ele. Containerele nu sunt *găzduite* în mașini virtuale. Pur și simplu sunt integrate cu restul proceselor care rulează pe mașină.

Lucrul care individualizează Docker de restul tehnologiilor de virtualizare este că poți constitui containere care se comportă identic și în momentul în care le introduci în producție.

Docker ia o aplicație pe care o ambalează într-un sistem de fișiere. Acesta conține tot ce este necesar rulării aplicației. Containerele oferă și posibilitatea de a izola aplicațiile între ele oferindu-le și un nivel de protecție. Aceste aspecte oferă aspectul de container. Un container este o instanță a unei imagini care rulează. Un container poate fi conectat la una sau mai multe rețele, i se poate atașa un mediu de stocare sau se poate crea o nouă imagine pe baza stării sale curente. Funcționarea containerelor se leagă de tehnologia prin care se realizează `namespaces`. Acestea oferă spațiile de lucru protejate care sunt, de fapt folosite la rularea containerelor. Fiecare container creează un set de `namespaces`. Aceste namespaces oferă niveluri de izolare pentru diferitele componente care rulează în container. Docker engine combină namespace-urile, control group-urile și UnionFS într-o unitate numită *format de container*.

Tehnologia containerelor din Docker izolează un proces căruia îi oferă din resursele mașinii gazdă. Docker folosește pentru a realiza această izolare un sistem de fișiere numit *Another Unionfs* (AUFS) care poate distribui resursele mașinii gazdă între diferitele containere.

Mai întâi de orice, cel mai bine este să te asiguri că poți vorbi cu serviciul `docker` interogând consola cu `docker version`. Dacă totul este în regulă și nu ai erori, poți afla mai multe despre instalarea docker: `docker info`.

O imagine este aplicația pe care dorești să o rulezi. Un container este procesul în care rulează instanța imaginii. Poți rula mai multe containere care să ruleze aceeași imagine. Imaginile se obțin din *registries*, care sunt depozite digitale de imagini - hub.docker.com. Pentru a ține evidența imaginilor, Docker a dezvoltat un sistem similar Git.

Imaginile Docker sunt template-uri read-only și nu au nicio stare asociată. Pur și simplu sunt niveluri de fișiere hard-coded care pot fi citite și atât. O imagine ar fi destul de limitată dacă nu am putea interacționa cu ea pe un nivel care să permită și scrierea. Rolul containerelor este acela de a asigura un nivel de interacțiune read-write. În acest caz, dacă se va distruge containerul, conținutul care a fost pus pe nivelul read-write, va fi pierdut. Pentru a păstra ceea ce s-a făcut, se vor crea volume.

Containerele pot fi oprite, pornite și repornite cu `start`, `stop` și `restart`. La un stop ceea ce se întâmplă este trimiterea unui SIGTERM (-15) procesului intern principal al containerului. Motorul Docker așteaptă o închiderea a procesului intern după perioada de grație, iar dacă acest lucru nu se petrece, va fi emis un SIGKILL (-9), ceea ce va conduce la o încheiere abruptă a execuției procesului intern, dar fără o curățare corespunzătoare.

Buna practică spune că un container ar trebui să ruleze doar un singur proces/aplicație/serviciu. Este vorba despre realizarea unei arhitecturi de microservicii - MSA (Microservices Architecture). Din aceste considerente, viața unui container este strâns legată de procesul/serviciul/aplicația care-l rulează. Atunci când procesul care rulează în container se oprește din diferite motive, containerul este oprit și el. 

## Numirea containerelor

Putem numi noi containerele cum dorim. În momentul rulării subcomenzii `run`, containerul va fi pornit, dar i se va da un nume arbitrar. Folosirea opțiunii `--name nume_container` va denumi containerul care tocmai rulează.

```bash
docker container run --publish 80:80 --detach --name kosson-starter-kick nginx
```

Resultatul va fi că în listă va apărea containerul numit înadins.

```bash
$ docker container ls
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                NAMES
c6e614f7c8ad        nginx               "nginx -g 'daemon of…"   9 seconds ago       Up 8 seconds        0.0.0.0:80->80/tcp   kosson-starter-kick
```

Numirea containerelor este foarte importantă pentru că are urmări în ceea ce privește stabilirea unei rețele între mai multe posibile containere.

## Rularea unui container

Atunci când dorim rularea unui container, se va folosi comanda `docker container run`. Acestă comandă va căuta imaginea căreia devine gazdă și dacă nu găsește acea imagine într-un `cache` dedicat de pe mașina locală, va proceda la descărcarea acesteia de pe net (Docker Hub). Acest lucru este echivalentul unei comenzi separate `docker pull ubuntu`.

Imaginea va fi descărcată și plasată în cache-ul de imagini de pe mașina locală. Dacă nu specifici o versiune a imaginii, va fi descărcată cea mai nouă. Imaginea va beneficia de un IP generat intern de rețeaua pe care `docker` o stabilește în spatele cortinei și va deschide portul specificat. Dacă nu este specificat `--publish`, portul nu va fi deschis. O formulare `80:80` va lua portul de pe mașina gazdă și va forwarda traficul pe portul 80 al containerului.

Pentru a rula o imagine funcțională, vom rula:

```bash
docker container run --publish 80:80 nginx
```

Această comandă va descărca și instanția un server nginx care va fi activat pe porturile specificate de îndată ce este descărcat.

![InstalareNginx.png](/media/nicolaie/DATA/DEVELOPMENT/DOCKER/InstalareNginx.png)

În acest moment ai acces la server. Dacă portul pe care activezi serverul este deja luat, poți specifica în stânga celor două puncte un port liber pe care să se facă cererile.

```bash
docker container run --publish 8080:80 nginx
```

Ceea ce tocmai ai realizat este să asculți cererile care vin pe 8080 de la mașina locală și să le forwardezi pe portul intern 80 al containerului. La nevoie poți specifica ce versiune a imaginii trebuie să folosești și dacă este necesar ce comandă de inițializare a respectivului serviciu.

```bash
docker container run --publish 8080:80 nginx:1.11 nginx -T
```

Lucrând cu serverul proaspăt instalat vei vedea toate apelurile în consolă ca loguri. Din nefericire, aplicația va ține o consolă ocupată. Pentru a rezolva acest lucru, va trebui pornit dokerul cu directiva `detach` activată.

```bash
docker container run --publish 80:80 --detach nginx
```

Va fi returnat un identificator unic pentru containerul care rulează nginx. De fiecare dată când vei rula câte un container, va fi returnat un id unic pentru acel container.

### Lansarea unui container ca daemon

La momentul rulării unei imagini, dacă nu adaugi `--detach` sau mai simplu `-d`, terminalul sau consola vor fi blocate. Folosirea lui detach va debloca consola pentru a putea fi utilizată și pentru alte operațiuni. Pentru a rula un container ca un daemon, trebuie să-l detașăm de terminalul care l-a pornit. Pentru aceasta avem subcomanda `detach`, care poate fi pasat subcomenzii `run` drept opțiune.

```bash
docker run -d busybox
```

### Rularea în mod interactiv

Ceea ce se întâmplă atunci cănd rulezi un container este că o imagine este luată drept input și este lansată ca un container. Un container poate rula în modul interactiv dacă comenzii `run` îi sunt adăugate fanioanele `-t` și `-i`. Fanionul `-i` este cel care face rularea containerului în mod interactiv. Ceea ce se petrece în spate este o capturare a input-ului standard al acelui container (STDIN-ul). Fanionul `-t` alocă un pseudo-terminal (TTY) pe care îl atribuie containerului tocmai pornit.

```bash
$ sudo docker run -i -t ubuntu:18.04 /bin/bash
```

Să analizăm comanda de mai sus. Dacă imaginea de ubuntu nu există, va fi descărcată automat, fiind echivalentul unei comenzi `docker pull ubuntu`. Imediat ce a fost descărcată, se va crea automat containerul prin instanțierea sa. Acest pas este echivalentul comenzii CLI `docker container create`. Este adăugat un layer final read-write ceea ce permite operațiuni cu sistemul său local de fișiere. Următorul pas este să creeze o interfață de rețea pentru a conecta containerul la rețeaua default. Privind la comandă, nu a fost specificată nicio opțiune privind rețeaua. Acest pas implică și alocarea unei adrese IP containerului. Containerele se pot conecta la rețele externe folosind conectarea la rețeaua gazdei. În acest moment `docker` pornește containerele și execută comanda specificată `/bin/bash`. Dacă termini sesiunea de bash, containerul va fi oprit, dar nu va fi scos din lucru.

Putem să închidem sesiunea interactivă fără a opri funcționarea containerului prin combinațiile succesive `CTRL + P` urmat de `CTRL + Q`. TTY-ul va fi deconectat de la container. Atenție, containerul va continua să funcționeze.

De exemplu:

```bash
sudo docker run -i -t busybox
# urmat de o detașare CTRL + P plus CTRL + Q
sudo docker ps
#CONTAINER ID IMAGE      COMMAND  ... NAMES
#028ea693bcc2 busybox   "sh"     peaceful_goldwasser
```

La nevoie poți să reatașezi containerul de la care te-ai deconectat cu `sudo docker attach numeledinps`.

```bash
$ sudo docker attach peaceful_goldwasser
```

### Obținerea unui shell în container

```bash
docker container run -it
```

Opțiunea `-t` îți oferă un pseudo TTY. Opțiunea `-i` permite menținerea deschisă a unei sesiuni.

```bash
docker container run -it --name webserv nginx bash
```

Vei obține un acces root în container. Pentru a ieși din shell, dai `exit`. Fii foarte atent că rularea containerului este legată de rularea comenzii. Dacă ai ieșit din shell, de exemplu, și containerul se va opri din rulare. Pentru a reporni un container în care ai făcut deja modificări folosind shell-ul, vei apela la comanda `docker container start -ai nume_container`.

### Obținerea unui shell într-un container care rulează deja

```bash
docker container exec -it mysql bash
# alt exemplu:
docker container exec -it vigorous_poitras sh
# CTRL+P plus CTRL+Q ca sa detașezi terminalul
```

Același lucru poate fi obținut folosind subcomanda `attach`.

## Obținerea de informații despre containere

### Listarea containerelor create

Pentru a vedea câte containere sunt pornite, poți folosi `docker container ls`.

```bash
$ docker container ls
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                NAMES
ec44ed53308c        nginx               "nginx -g 'daemon of…"   2 minutes ago       Up 2 minutes        0.0.0.0:80->80/tcp   loving_allen
```

Rularea aceleiași comenzi încheiată cu parametrul `-a` va indica un istoric al containerelor rulate. Ceea ce este interesant este că toate containerele au un nume generat automat dacă nu este pasat unul la pornire.

### Afișarea detaliilor unui container

Se face rulând `docker container inspect nume_container`. Va fi returnat un obiect JSON cu toate caracteristicile imaginii rulate.
Pentru o comadă mai scurtă poți folosi direct:

```bash
docker inspect nume_container_sau_id
```

### Identificarea proceselor care rulează într-un container

Poți vedea și procesele care rulează în interiorul unui container rulând comanda `docker container top nume_container`.

```bash
docker container top kosson-starter-kick
UID       PID   PPID  C   STIME  TTY   TIME    CMD
root     11653 11635  0   16:44   ?  00:00:00 nginx: master process nginx -g daemon off;
systemd+ 11713 11653  0   16:44   ?  00:00:00 nginx: worker process
```

Poți afla în oricare moment care sunt procesele care rulează într-un container folosind și subcomanda `ps`.

```bash
docker container ps
```

### Verificarea logurilor generate

Putem verifica și logurile care se generează rulând comanda `docker container logs nume_dat_sau_aflat`.

```bash
$ docker container logs kosson-starter-kick
172.17.0.1 - - [28/May/2018:13:46:30 +0000] "GET / HTTP/1.1" 304 0 "-" "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:60.0) Gecko/20100101 Firefox/60.0" "-"
172.17.0.1 - - [28/May/2018:13:46:30 +0000] "GET / HTTP/1.1" 304 0 "-" "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:60.0) Gecko/20100101 Firefox/60.0" "-"
```

În cazul în care nu ai dat o denumire containerului, pentru a-l afla, vei rula comanda `docker container ls -a`.

### Afișarea statisticilor

```bash
docker container stats
```

Această comandă va permite vizualizarea live a containerelor.

## Pauze în rularea containerelor

Containerele pot fi înghețate în execuția lor folosindu-se comanda `pause`. Pentru a relua execuția de unde a fost lăsată se va folosi subcomanda `unpause`.

## Oprirea rulării unui container

Pentru a opri rularea containerelor, se va folosi subcomanda `stop` după care se vor introduce primele caractere din identificatorul unic returnat la momentul pornirii.

```bash
docker container stop ec44e
```

În acest moment containerul își încheie rularea și este returnat partea de id folosită în comanda de oprire. Pentru a reporni un container, pur și simplu rulezi `docker run nume_container`.

Dacă nu știi cum ai numit containerele, introduci `docker container stop ` urmat de un TAB imediat după spațiul de după stop.

Oprirea unui container nu se va solda și cu ștergerea acestuia. Atunci când nu se intenționează modificarea containerelor create, cel mai bine este să le ștergem pentru a evita ocuparea inutilă a spațiului pe disc.

## Ștergerea containerelor

După ce am folosit containerele, docker oferă posibilitatea de a șterge din ele. Poți să le ștergi pe toate sau doar cele dorite la un moment dat menționând după subcomanda `rm` mai multe id-uri aparținând containerelor care trebuie eliminate. Mai întâi vizualizează containerele existente.

```bash
docker container ls -a
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS                      PORTS                NAMES
c6e614f7c8ad        nginx               "nginx -g 'daemon of…"   12 minutes ago      Up 12 minutes               0.0.0.0:80->80/tcp   kosson-starter-kick
89fcdc7a99d3        nginx               "--name kosson-start…"   13 minutes ago      Created                     0.0.0.0:80->80/tcp   loving_shannon
ec44ed53308c        nginx               "nginx -g 'daemon of…"   29 minutes ago      Exited (0) 22 minutes ago                        loving_allen
ee53263ee08e        nginx               "nginx -g 'daemon of…"   39 minutes ago      Exited (0) 30 minutes ago                        relaxed_bardeen
8b275fa969c9        hello-world         "/hello"                 2 months ago        Exited (0) 2 months ago                          elated_kirch
```

Acum vom proceda la ștergerea unora. Pentru acest lucru vei menționa fragmentele de identificare ale containerelor în succesiune simplă fără virgulă.

```bash
docker container rm c6e ec4 ee5 8b2
```

În cazul în care un container este în execuție, dacă dorești să-l elimini se va solda cu o eroare de următoarea formă: `Error response from daemon: You cannot remove a running container c6e614f7c8adb25631a5dc1cbe3d3201f1e1257516f2a314b2b7d681543e8d10. Stop the container before attempting removal or force remove`. Dar vor fi șterse cele inactive dintre id-urile pe care le-ai introdus ca opțiune în subcomanda `rm`. Poți forța ștergerea unui container în execuție prin menționarea opțiunii `-f` în comandă înaintea identificatorilor: `docker container rm -f c6e`.

Mai este posibilă instruirea motorului Docker ca atunci când un container a fost oprit, acesta să fie șters. Pentru acest lucru, chiar de la momentul inițierii comenzii de rulare, se va atașa fanionul `--rm`.

```bash
docker run -it --rm busybox
```

Poți combina subcomenzile `rm` și `ps` pentru a șterge toate containerele care nu rulează.

```bash
docker rm $(docker ps -aq)
```

 Pentru containerele care rulează va fi generată o eroare. Pentru a evita aparția erorii se poate filtra.

```bash
docker rm $(docker ps -aq -f state=exited)
```

Dar pentru a evita toate aceastea există o comandă concisă:

```bash
docker container prune
```

## Modificări interne aduse containerului

Atunci când aduci orice modificare, oricât de mică unui container, acestea pot fi aduse la lumină pentru o examinare folosind subcomanda `diff` a lui `docker`.

```bash
sudo docker diff hashcontainer
```

## Volume

Este un director asociat unui container în care se pot introduce date. Toate containerele pot folosi același volum. Volumele sunt păstrate chiar și în cazul în care containerul este șters.

Volumele, indiferent unde le specifici în container, de fapt vor fi montate în `/mnt`-ul gazdei. De exemplu, pentru a avea un director în care să dezvolți o aplicație pentru Node, va trebui să folosești un director în care codul tău să persiste. Pentru a porni un server de Node care să aibă un volum, poți să-l specifici în linia de comandă care pornește containerul.

```bash
docker run -p 8080:3000 -v /var/www node
```

Docker va crea volumul menționat de opțiunea `-v` prin alias-ul `/var/www`.

### Configurarea volumelor

Să presupunem că tot o aplicație web folosind Node dorim să dezvoltăm. Asta, de regulă necesită un director `/var/www` în care pui sursele.

```bash
docker run -p 8080:3000 -v $(pwd):/var/www node
```

Unde `-v` specifică necesitarea configurării unui volum, `$(pwd):` specifică folosirea directorului de lucru în care se află consola în care va sta codul sursă și închei specificând volumul așa cum are nevoie containerului pentru a lucra cu sursele.

![Mounts](/images/2018/10/MountsVolume.png)

Fii foarte atent la faptul că este de o importanță crucială unde te afli în structura directoarelor mașinii gazdă la momentul în care scrii comanda.
Un alt lucru pe care trebuie să-l ții în minte este acela că poți șterge volumele folosite. Acest pas îl faci înainte de a șterge containerul.

```bash
docker rm -v nume_container_sau_id
```

În cazul folosirii node, ai nevoie să execuți comenzile de pornire a serverului. Pentru a seta contextul de execuție, vei folosi opțiunea `-w "/var/www"`, care este urmată de directorul din container.

```bash
docker run -p 8080:3000 -v $(pwd):/var/wwww -w "/var/www" node npm start
```
