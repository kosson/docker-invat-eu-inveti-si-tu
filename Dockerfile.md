# Dockerfile

Este un fișier text pe baza căruia se va genera o imagine.

Dacă nu dai un tag la imagine, aceasta va apărea ca `<none>` la momentul listării imaginilor. Dacă ai uitat, poți folosi sub-comanda `tag` pentru a da un nume imaginii. Numele se dă la momentul construcției imaginii adăugând opțiunea `-t numeimaginenoua`.

```bash
docker build -t numeimaginenoua .
```

Dacă nu-i dai nicio etichetă, motorul `docker` va da automat eticheta `latest`. Dacă este menționat punctul la finalul sub-comenzii `build`, motorul Docker va căuta fișierul `Dockerfile ` în rădăcina din care se dă comanda. Dacă fișierul nu este în locația de unde este rulată comanda, poți preciza calea în locul punctului.

## Sintaxa instrucțiunilor

În cazul fișierului `Dockerfile`, este foarte important de unde începe instrucțiunea pe o linie pentru că spațiile au importanță. Urmează instrucțiune care prin convenție este redactată cu majuscule pentru a diferenția instrucțiunile de argumente. Apoi urmează toate argumentele. Liniile de comentariu sunt declarate folosind un diez (`#`).

În deschiderea fișierului poți menționa directive pentru parser-ul fișierului. Cel mai adesea vei vedea directiva ca menționează ce caracter trebuie să fie considerat a fi cel de escape.

```yaml
# escape=`
```

## Instrucțiunea FROM

Este una dintre cele mai importante instrucțiuni și setează imaginea de la care se va porni construcția imaginii personalizate. Dacă imaginea nu există deja pe computerul gazdă, aceasta va fi trasă de pe hub.

Semnătura este `FROM <image>[:tag|@<digest>]`.

La `<image>` va fi precizat numele imaginii care va fi utilizată ca cea de bază. Atributele `tag` și `digest` sunt opționale. Cu ajutorul acestora poți descărca o anumită imagine. Dacă nu precizezi atributul, motorul Docker va aducea cea mai recentă imagine asumând că tag-ul este `latest`. Ceva mai complex este cazul în care dorești să folosești alfanumericul `digest`.

```yaml
FROM jessie:sha256:0b0043fe043....
```

## Instrucțiunea MAINTAINER

Această instrucțiune este una care aduce lămuriri în ceea ce privește fișierul `Dockerfile` și implicit despre imagine. Buna practică spune ca această instrucțiune să fie plasată după `FROM`.

```yaml
MAINTAINER Bibi Sandu <bibi.sandu@gica.ro>
```

## Instrucțiunea COPY

Această instrucțiune permite copierea de fișiere din sistemul de operare gazdă în sistemul de fișiere al noii imagini.

```yaml
COPY /calea/sursă ... /cale/destinație
```

Calea sursă specifică de unde vor fi copiate resursele sau poate fi chiar directorul din care a fost invocată subcomanda `docker build`. Cele trei puncte indică faptul că fișierele pot fi specificate în clar sau cu ajutorul unor wildcards. Calea destinație din viitoarea structură a imaginii, unde vor fi copiate fișierele. Dacă se copiază mai multe fișiere, calea de destinație trebuie să fie un director și să se încheie cu un slash (`/`). Pentru copierea fișierelor se vor specifica căi absolute, dar dacă nu se introduc acestea, docker va presupune că are de a face cu o cale de destinație care pornește de la root (`/`).

Dacă ai stabilit directorul destinație prin comanda `WORKDIR`, atunci poți menționa destinația prin `./`.

```yaml
WORKDIR /usr/src/app

COPY package*.json ./
```

La nevoie această instrucțiune va putea crea directoare sau va putea suprascrie resursele deja existente ale unei imagini. Să presupunem că ne aflăm într-un directer de unde emitem comanda de `build`. Copierea se va face pornind cu resursele specificate din acel director țintind calea din imagine.

```yaml
COPY app HELP.md /home/gigi
```

Se observă din comadă că pot fi copiate mai multe resurse specificate una după alta separate prin spațiu.

Un alt exemplu ar fi copierea fișierelor `package.json` și `package-lock.json` atunci când construim un container pentru o aplicație Node.js.

```yaml
COPY package*.json ./
```

## Instrucțiunea ADD

Această instrucțiune prezintă similarități cu cea de copiere, dar ceea ce o face deosebit de puternică este posibilitatea de a lucra cu arhive `tar` și cu resurse de pe Internet.

Această instrucțiune este perfectă pentru a face un adevărat deployment al unor resurse care trebuie să ajungă fiecare pe anumite căi.

```yaml
ADD http://www.myremotesource.com/files/html.tar.gz /usr/share/nginx/
```

## Instrucțiunea ENV

Folosește această instrucțiune pentru a seta o variabilă de mediu în noua imagine. Această variabilă de mediu va putea fi accesată de toate scripturile și aplicațiile.

```yaml
ENV O_CHEIE o/valoare/cale_de_ex
```

Această instrucțiune se dovedește a fi foarte utilă atunci când aplicația noastră rulează într-un mediu care accesează rețelele exterioare printr-un server proxy.

```yaml
ENV http_proxy host:port
ENV https_proxy host:port
```

În cazul în care folosești `ENV cheie valoare`, poți preciza o singură pereche pe linie. Dacă folosești `ENV cheie01=val01 cheie02=val02`, poți preciza mai multe valori pe o singură linie.

În `ENV` poți preciza și un anumit utilizator.

```yaml
ENV username=kosson
```

Poți vedea care sunt variabilele de mediu folosind `docker image inspect id_img`.

## Instrucțiunea ARG

Folosind `ARG`, la momentul constituirii imaginii, vei putea pasa argumente. Dar nu uita că și subcomanda `--build-arg` permite pasarea unei valori variabilelor definite cu această instrucțiune. Fii foarte atent că imaginea nu va putea fi creată dacă argumentele necesare nu vor fi specificate în `Dockerfile`. Deci, tot ce pasezi cu `--build-arg` trebuie să aibă un receptor cu `ARG` în `Dockerfile`.

```yaml
ARG home
```

și la creare

```bash
docker build --build-arg home=nico .
```

## Instrucțiunea USER

Folosește această instrucțiune atunci când dorești să setezi utilizatorul pentru comenzile specificate cu `CMD`, `RUN` și `ENTRYPOINT`. Containerele vin din start cu utilizatorul `root`, dar dacă folosești `USER`, contul de `root` va fi numele specificat de `USER`. Poți seta dacă dorești și identificatorul numeric.

```yaml
USER 10
# sau
USER gigel
```

Ține minte că utilizatorul menționat trebuie să existe neapărat. Cu ajutorul acestei instrucțiuni poți menționa și permisiunile.

## Instrucțiunea RUN

Această instrucțiune permite instalarea de aplicații care vor rula la momentul constituirii containerului.

Permite rularea de comenzi la momentul constituirii de noi imagini. Rezultatul fiecărei comenzi rulate cu `RUN` creează tot atâtea niveluri ale imaginii. `RUN` are două forme. Una care rulează o singură comandă simplă la nivel de shell, dar poate rula și o instrucțiune care are parametri - `RUN ["executabil", "param1", "param2"]` (exec form).

Poți folosi o singură instrucțiune `RUN` pentru a reduce numărul de layere care se vor constitui. Aceasta este forma proprie shell-ului.

```yaml
version: "3"
    FROM python:3.5
    RUN apt-get update -y && apt-get upgrade -y
```

sau

```yaml
RUN apt-get update && \
    apt-get install -y apache && \
    apt-get clean
```

Ține minte faptul că pentru fiecare instrucțiune `RUN`, se va constitui un nou layer. De regulă, comenzile de shell vor fi executate prin invocarea `.bin/sh -c`.

Un alt exemplu este instalarea dependințelor pentru o aplicație Python.

```yaml
# instalează pachetele necesare specificate în requirements.txt
RUN pip install --trusted-host pypi.python.org -r requirements.txt
```

Un alt bun exemplu este instalarea mediului pentru Node.js.

```yaml
RUN npm install
RUN npm install -g pm2
```

Dacă `RUN` este o comandă care primește mai mulți parametri, mai întâi este menționată comanda și apoi sunt trecuți toți parametrii.

```yaml
RUN ["apt-get", "install", "python3"]
```

## Instrucțiunea CMD

Instrucțiunea `CMD` permite setarea unei comenzi care va fi lansată din oficiu la momentul în care pornește containerul. În cazul în care containerul rulează cu o comandă, cea setată din oficiu cu `CMD`, va fi ignorată. Forme posibile:

- `CMD ["executabil","param1","param2"]`, fiind forma executabilă și cea care este preferabilă;
- `CMD ["param1","param2"]`, care va seta parametri suplimentari pentru forma de executabil setată prin `ENTRYPOINT`;
- și o formă simplă de shell: `CMD command param1 param2`.

Această instrucțiune poate iniția execuția oricărei comenzi, dar spre deosebire de `RUN`, rularea comenzii se va face la momentul inițierii containerului, nu la momentul constituirii imaginii.

```yaml
CMD npm run start
```

În exemplul nostru, dacă vom rula containerul fără a indica o comandă, se va executa ce este menționat de `CMD`. Dacă menționăm o comandă, de exemplu `docker run -it <image> /bin/bash`, se va intra într-un shell de Bash (`root@7de4bed89922:/#`), fiind ignorat `npm run start`.

Aceste execuții pot fi suprascrise dacă se folosesc argumente ale sub-comenzii `run` (`docker run`).

```yaml
CMD ["npm", "start"]
CMD ["python", "app.py"]
```

## Instrucțiunea ENTRYPOINT

Această instrucțiune este folosită atunci când dorești să folosești un container ca mediu pentru a executa o singură instrucțiune. Transformă întreg containerul într-un executabil. Această comandă este preferabilă lui `CMD` pentru că la rularea cu parametri a containerului, ceea ce era menționat la `CMD` va fi suprascris prin menționarea instrucțiunii de rulare a containerului (`docker run -it <image> Ceva`).

Sunt acceptate două forme:

- forma de shell: `ENTRYPOINT command param1 param2` și
- forma de executabil, care este preferabilă: `ENTRYPOINT ["executabil", "param1", "param2"]`.

Spre deosebire de cazul instrucțiunii `CMD`, această instruțiune nu poate fi suprascrisă prin folosirea unui `docker run`. Trebuie să ai o singură instrucțiune `ENTRYPOINT` pentru un singur container.

```yaml
ENV nume Ionică Fără-Frică
ENTRYPOINT echo "Salutare, $nume"
```

Construiești imaginea:

```bash
$ sudo docker build -t ceva-demo .
```

La rularea imaginii cu `docker run -it ceva-demo`, rezultatul afișat va fi `Salutare, Ionică Fără-Frică`. În exemplu, am folosit o variabilă de mediu pentru a indica și aceste posibilități.

În cazul în care ai nevoie de interacțiune cu mediul intern al imaginii, poți rula oricând în terminal.

```bash
sudo docker run -it --entrypoint="/bin/sh" ceva-demo
```

Dacă ai nevoie să rulezi Bash, poți opta pentru folosirea acestui executabil.

```yaml
ENV nume Ionică Fără-Frică
ENTRYPOINT ["/bin/bash", "-c", "echo "Salutare, $nume"]
```

## Instrucțiunea HEALTHCHECK

În cazul în care o aplicație dintr-un container funcționează prost, este nevoie ca starea să fie comunicată în extern. În acest sens poate fi emisă o comandă la un anumit interval de timp care va returna 0, dacă procesul este în bună stare sau 1 în caz contrar.

```yaml
HEALTHCHECK --interval=5m --timeout=3s CMD curl -f http://localhost/ || exit 1
```

O singură instrucțiune `HEALTHCHECK` este luată în considerare, ultima.

## Instrucțiunea VOLUME

Această instrucțiune creează un director în sistemul de fișiere al imaginii. În acest director se pot atașa căi din gazdă sau din alte containere.

Existâ două posibile sintaxe ale instrucțiunilor. Prima este un array JSON în care toate valorile sunt menționate între ghilimele duble.

```yaml
VOLUME ["director01"]
```

Cea de-a doua sintaxă este cea asemănătoare shell-ului.

```yaml
VOLUME calea/director01
```

## Instrucțiunea WORKDIR

Inițial, directorul de lucru al imaginii este rădăcina `/`. Folosind această instrucțiune, vei schimba directorul de lucru la cel specificat de aplicația pe care dorești să o introduci ca nivel suplimentar într-o imagine personalizată. Instrucțiunile care vor urma acesteia, vor folosi directorul de lucru nou (`RUN`, `CMD` și `ENTRYPOINT`). Un exemplu ar fi constituirea unei imagini chiar din directorul în care se află aplicația dezvoltată.

```yaml
version: "3"
    FROM    node:latest
    MAINTAINER Nico Dandana
    ENV     NODE_ENV=developement
    ENV     PORT=3000
    COPY    . /var/www
    WORKDIR /var/www
    VOLUME  ["/logs"]
    RUN     npm install
    EXPOSE  $PORT
    ENTRYPOINT ["npm","start"]
```

## Instrucțiunea EXPOSE

Această instrucțiune va fi utilizată atunci când trebuie deschisă comunicarea containerului pe rețea.

```yaml
EXPOSE numarPort/numeProtocol altPortDacaENevoie
EXPOSE 80/tcp
```

Dacă ai nevoie poți menționa mai multe porturi deodată.

```yaml
EXPOSE 3000
EXPOSE 9200
```

## Instrucțiunea LABEL

Această instrucțiune permite menționarea de `chei=valori` cu rol de metadate ale imaginii Docker.

```yaml
LABEL cheie01=valoare01 cheie02=valoare02
```

Perechile `cheie=valoare` pot fi câte sunt nevoie pentru o descriere detaliată.

```yaml
LABEL autor="Nicolae Olaru"
      versiune="1.1"
```

Dacă descrierile sunt simple, pot intra în conflict cu altele. Din acest motiv a apărut o formalizare pentru aceste etichete numită `Label Schema`.

```yaml
LABEL org.label-schema.schema-version="1.0"
      org.label-schema.version="1.1"
      org.label-schema.description="Primul meu proiect Docker"
```

## Instrucțiunea ENTRYPOINT

Poți menționa care este punctul de intrare, adică rularea procesului care inițiază aplicația. `ENTRYPOINT` poate lucra în tandem cu `CMD`.

```yaml
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
```

Acest exemplu este perfect identic cu apelul din linia de comandă `nginx -g daemon off`.

Pentru o aplicație Node, punctul de intrare este `node nume_index.js`.

```yaml
ENTRYPOINT ["npm", "start"]
```

## Instrucțiunea ONBUILD

Aceasta intruduce în imagine o instrucțiune care va fi declanșată la momentul când este construită altă imagine având-o pe aceasta ca bază. Aceste instrucțiuni vor fi declanșate imediat după `FROM`.

Poți să te gândești că acestă instrucțiune introduce un declanșator la momentul când o altă imagine este construită. Instrucțiunea care va fi declanșată este tot una `Dockerfile`.

```yaml
ONBUILD ADD configurare /var/www/app
```

## Instrucțiunea STOPSIGNAL

Poți folosi această instrucțiune pentru a seta un mesaj la ieșirea din execuție a containerului.

```yaml
STOPSIGNAL SIGKILL
```

## Instrucțiunea SHELL

Această instrucțiune permite folosirea unui alt shell pentru executarea comenzilor în container. În cazul Linux-ului, se folosește `sh`, iar pentru Windows, bine-cunoscutul `cmd`.

```yaml
SHELL ["bash","argumentDeShel1"]
```

## Exemplu Node.js cu Elasticsearch

```yaml
FROM node:10.15.3-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
RUN npm install -g pm2

COPY . ./

EXPOSE 3000
EXPOSE 9200

CMD npm run start
```
