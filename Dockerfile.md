# Dockerfile

Este un fișier text pe baza căruia se va genera imaginea.

Dacă nu dai un tag la imagine, aceasta va apărea ca `<none>` la momentul listării imaginilor. Dacă ai uitat, poți folosi subcomanda `tag` pentru a da un nume imaginii. Numele se dă la momentul construcției imaginii adăugând opțiunea `-t numeimaginenoua`.

```bash
docker build -t numeimaginenoua .
```

Dacă nu-i dai nicio etichetă, motorul docker va da automat eticheta `latest`. Dacă este menționat punctul la finalul subcomenzii `build`, motorul Docker va căuta fișierul `Dockerfile ` în rădăcina din care se dă comanda. Dacă fișierul nu este în locația de unde este rulată comanda, poți preciza calea în locul punctului.

## Sintaxa instrucțiunilor

În cazul fișierului `Dockerfile`, este foate important de unde începe instrucțiunea pe o linie pentru că spațiile au importanță. Urmează instrucțiune care prin convenție este redactată cu majuscule pentru a diferenția instrucțiunile de argumente. Apoi urmează toate argumentele. Liniile de comentariu sunt declarate folosind un diez (`#`).

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

La nevoie această instrucțiune va putea crea directoare sau va putea suprascrie resursele deja existente ale unei imagini. Să presupunem că ne aflăm într-un directer de unde emitem comanda de `build`. Copierea se va face pornind cu resursele specificate din acel director țintind calea din imagine.

```yaml
COPY app HELP.md /home/gigi
```

Se observă din comadă că pot fi copiate mai multe resurse specificate una după alta separate prin spațiu.

## Instrucțiunea ADD

Această instrucțiune prezintă similarități cu cea de copiere, dar ceea ce o face deosebit de puternică este posibilitatea de a lucra cu arhive `tar` și cu resurse de pe Internet.

Această instrucțiune este perfectă pentru a face un adevărat deployment al unor resurse care trebuie să ajungă fiecare pe anumite căi.

## Instrucțiunea ENV

Folosește această instrucțiune pentru a seta o variabilă de mediu în noua imagine. Această variabilă de mediu va putea fi accesată de toate scripturile și aplicațiile.

```yaml
ENV O_CHEIE o/valoare/cale_de_ex
```

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

Folosește această instrucțiune atunci când dorești să setezi utilizatorul noii imagini. Containerele vin din start cu utilizatorul root, dar dacă folosești USER, contul de root va fi numele specificat de `USER`. Poți seta dacă dorești și identificatorul numeric.

```yaml
USER 10
# sau
USER gigel
```

## Instrucțiunea RUN

Permite rularea de comenzi la momentul constituirii noii imagini.

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
```

Dacă ai nevoie poți menționa mai multe porturi deodată.

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

Poți menționa care este punctul de intrare în aplicația pe care dorești să o impingi în imagine.
Pentru o aplicație Node, punctul de intrare este `node nume_index.js`.

```yaml
ENTRYPOINT ["npm", "start"]
```
