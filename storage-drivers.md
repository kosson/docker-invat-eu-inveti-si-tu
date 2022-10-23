# Storage drivers

Pentru a înțelege modul în care funcționează driverele de stocare, trebuie înțeles foarte bine cum sunt construite imaginile și modul în care Docker folosește imaginile pentru a crea containere.

Aceste drivere sunt cele care permit scrierea datelor într-un layer writable. Această soluție nu este cea mai bună pentru că scierea și citirea datelor se face la o viteză redusă, iar în momentul în care containerul dispare, dispar și datele.

Știm deja că o imagine este construită din mai multe layere. Fiecare layer reprezintă câte o comandă din fișierul `Dockerfile`. Cu excepția ultimului nivel, toate celelalte sunt read-only.

```yaml
FROM ubuntu:18.04
COPY . /aplicatia_mea
RUN make /aplicatia_mea
CMD python /aplicatia_mea/start.py
```

Prima instrucțiunea stabilește baza pe care va fi construită imaginea.
Cea de-a doua copiază toate fișierele și directoarele din directorul menționat în structura de fișiere a imaginii care va fi contruită.
Cea de-a treia construiește aplicația folosind comanda `make`.
Cea de-a patra menționează ce comandă să fie rulată atunci când este pornit containerul.

```text
    ----------------------------------------
    |      container APP01 ubuntu:18.04    |
    ----------------------------------------
    |       layer [container layer r/w]    |
    |--------------------------------------|
                       |
                       V
      ------------------------------------
      | imaginea 03fe2032022v     0 B    |  
      |          54ir03fasald 10.23 MB   |
      |          543jasa0443k 123.1 KB   |
      |          432f9dsfs89f   512 MB   |
      ------------------------------------
```

În momentul în care se pornește un container, peste toate layerele care au fost folosite la construcția imaginii, se mai adaugă unul care poate fi scris și citit. Acesta este numit *container layer*.

Interacțiunea dintre toate layerele unei imagini este asigurată de aceste drivere de storage. Aceleași drivere de storage gestionează și layerul writable al containerului. Pe baza unei imagini se pot inițializa mai multe containere. Toate aceste containere, pot avea date și stări diferite pentru că acest ultim nivel permite scrierea și citirea la nivel de container.

```text
    ----------------------------------------  --------------------------------
    |             container APP01          |  |       container APP02        |
    ----------------------------------------  --------------------------------
    |       layer [container layer r/w]    |  | layer [container layer r/w]  |
    |--------------------------------------|  |------------------------------|
                                |                    |
                                V                    V
                         ------------------------------------
                         | imaginea 03fe2032022v     0 B    |  
                         |          54ir03fasald 10.23 MB   |
                         |          543jasa0443k 123.1 KB   |
                         |          432f9dsfs89f   512 MB   |
                         ------------------------------------
```

În cazul în care ai nevoie ca mai multe imagini să aibă acces la aceleași date, se vor stoca datele într-un volum Docker, care va trebui montat în fiecare container.

Folosind comanda `docker ps -s` poți afla câteva informații foarte utile privind spațiul. Pe coloana `SIZE` avem o valoare urmată de o alta virtuală în paranteze. Valoarea afișată este cea a layer-ului read-write a containerului respectiv. Dimensiunea virtuală se referă la datele read-only ale imaginii utilizate de container la care se adaugă dimensiunea layerului writable. 

Când sunt generate mai multe containere, unele pot să folosească aceleași date read-only ale imaginii în baza cărora au fost create. Dacă avem cazul a două sau mai multe containere care au layere în comun, dar au fost create în baza unor imagini distincte, doar layerele comune vor fi folosite în comun, nu si cele ale imaginilor respective.

Întregul spațiu ocupat pe disc de mai multe containere pornite de la aceeași imagine, va fi suma spațiului individual plus cel al imaginii. Fii foarte atentă că spațiul pentru log-uri nu este contabilizat. Dacă nu faci o rotație judicioasă a log-urilor, spațiul ocupat de containere va crește pe nesimțite. Memoria scrisă pe disk așa cum este mecanismul de swapping ocupă spațiu la rândul său și chiar volumele și *bind mounts*.

## Strategia CoW

Toate driverele de storage folosesc o strategie numită copy-on-write (CoW). Această strategie poate fi caracterizată prin faptul că are drept țintă copierea și distribuirea fișierelor cu un maxim de eficiență.

În cazul în care un fișier există deja într-un nivel mai adânc la imaginii și un nivel, chiar și cel writable, are nevoie să-l citească, acestea vor citi direct fișierul. Prima dată când un alt nivel are nevoie să modifice fișierul (momentul creării imaginii sau cel al generării containerului), fișierul este copiat încă o dată peste cel existent în layer fiind cel modificat. Această strategie restrânge numărul operațiunilor de I/O menținând dimensiunea redusă a celorlalte layere.

Când execuți un `docker pull` pentru o imagine din depozit sau atunci când creezi un container dintr-o imagine, care încă nu există local, fiecare layer al imaginii este descărcat și stocat în zona de stocare locală a lui Docker: `/var/lib/docker`. Fiecare layer este pus în propriul său director pe sitemul local al lui Docker.

În cazul în care Docker este folosit pentru a crea o imagine a cărei bază este o altă imagini care se află deja în local, cea nouă va folosi toate layere-le existente peste care le va adăuga pe cele care-i sunt specifice. 

De exemplu, poți crea o imagine proprie bazată pe Ubuntu. Aceasta va fi încărcată în depozitul Docker online a unui utilizator pentru a putea fi descărcată mai târziu.

```yaml
# kosson/de-test:0.1
FROM ubuntu:18.04
COPY . /aplicatie
```

Următoarea imagine se va construi pe anterioara.

```yaml
FROM kosson/de-test:0.1
CMD /aplicatie/executabil.sh
```

Pentru cea de-a doua imagine se vor folosi layerele primei peste care se adaugă cel suplimentar cu `CMD`. Dar, trebuie ținut minte faptul că ambele vor folosi layerele care le sunt comune. Folosind cele două fișiere `Dockerfile` se vor construi două imagini. Pentru a le vedea folosește `docker image ls` și pentru a vedea istoricul, felul în care a fost construită cea de-a doua, folosești `docker history hash-ul-imaginii-derivate`. Vei observa că semnăturile criptografice ale layerelor comune sunt identice. Dacă apare `<missing>`, înseamnă ca layerele s-au constituit pe o altă mașină.

## Mecanismul de copiere

În momentul constituirii unui container, este adăugat un nou layer peste toate celelalte care există. Modificările aduse oricăror fișiere ale unui container care pot fi modificate, se fac aici. Fișierele care nu pot fi modificate, nu vor fi copiate în acest layer writable.

Containerele care scriu o mulțime de date, consumă mai mult spațiu decât cele care nu fac acest lucru. Reține faptul că orice operațiune write care se petrece în layerul write va consuma spațiu. În cazul aplicațiilor care scriu date intensiv, cel mai bine este să se configureze utilizarea unui volum și evitarea acestor operațiuni în layerul mic al containerului. Volumele sunt independente de containere și sunt gândite pentru I/O intensiv. Mai mult, volumele pot fi gestionate de mai multe containere odată.

### Aufs, overlay și overlay2

Pentru driverele `aufs`, `overlay`, și `overlay2`, procedura de modificare a unui fișier al containerului implică căutarea din layer în layer până când este găsit. Fișierul este pus apoi într-un cache și apoi în layerul writable al containerului. Ridicarea fișierului în layerul writable al containerului se numește `copy_up`. Din nefericire, acest operațiuni taxează resursele de procesare mai ales dacă fișierele sunt de mare dimensiuni sau se află pe diferite adâncimi. Norocul este că aceste taxări se întâmplă până când fișierul este pus în cache.

## Docker storage drivers

Treaba unui storage driver este să gestioneze cum sunt gestionate imainile și containerele pe discul mașinii gazdă.
Docker oferă o arhitectură flexibilă punând la dispoziție drivere care se pot conecta la kermenul mașinii gazdă pentru modulele activate dedicate gestionării spațiului pe disk.

### overlay2

Este driverul la care se apelează din oficiu, fiind cel care oferă suport pentru majoritatea distribuțiilor de Linux. Nu necesită nicio configurare specială. Acest driver se bazează pe driverul de stocare OverlayFS.

OverlayFS folosește două directoare pe mașina Linux și le prezintă ca fiind unul singur. Aceste două fișiere trebuie înțelese ca layers iar procesul de unificare este referit ca `union mount`. Aceste două directoare sunt numite de OverlayFS *lowerdir* și *upperdir*. Versiunea unificată a celor două este expusă printr-un director numit de OverlayFS `merged`.

Dacă ești curios să vezi layerele unei imagini descărcate, poți lista ce este în directorul dedicat driver-ului: `ls -l /var/lib/docker/overlay2`. În directorul `l` sunt symlinkuri pentru a nu avea problemele legate de dimensiune în momentul când folosești comanda `mount`.


### aufs

Este driverul care a fost utilizat implicit de versiunile 18.06 și cele anterioare acesteia. Motivul este că mașinile Ubuntu mai vechi nu aveau suport pentru `overlay2`.

### devicemapper

Este drivelul care a fost utilizat de distribuțiile CentOS și RHEL ceva mai vechi. În acest moment și acestea au suport pentru `overlay2`.

### btrfs și zfs

Vor fi utilizate dacă sistemul de operare este instalat pe aceste standarde.

### vfs

Este folosit în scop de testare și pentru situațiile în care nu este folosit mecanismul de copy-on-write. Nu este recomadat pentru folosirea în producție.