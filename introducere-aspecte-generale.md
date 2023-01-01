# Introducere

Docker este o platformă deschisă pentru dezvoltarea, livrarea și rularea de aplicații. Docker permite desprinderea aplicației create de infrastructura de care are nevoie să ruleze. Docker este scris în limbajul de programare Go și se bazează pe anumite caracteristici ale kernelului Linux.

Această tehnologie permite împachetarea și rularea unei aplicații într-un mediu izolat numit *container*. Aceste containere conțin tot ceea ce este necesar pentru a rula aplicația fără a-ți pune problema dacă pe host există stivele tehnologiilor necesare. Începând cu anul 2015, Docker este parte a [Open Container Initiative (OCI)](https://opencontainers.org/) o structură care sub auspiciile organizației Linux Foundation asigură standardizarea formatelor și a mediilor de rulare pentru containere.

Containerele pot fi folosite pentru distribuirea și testarea aplicației. Tot containerele permit *continuous integration* și *continuous delivery* (CI/CD).

Containerele nu sunt niște mașini virtuale. Acestea se vor folosi de resursele mașinii gazde pentru a crea contextul de rulare a aplicațiilor.

## Arhitectura Docker

Motorul Docker este constituit din trei componente mari:

- Daemonul Docker (`dockered`), acesta fiind un proces care așteaptă în fundal vreo comandă de la client,
- Clientul Docker (`docker`), fiind o interfață în linia de comandă și
- un REST API care se comportă ca o punte dintre daemon și client.

![](img/architecture.svg)

## Rularea unei aplicații reale

Atunci când vei dori să rulezi o aplicație pe un server real ai opțiunea să introduci aplicația într-un container sau să pornești containerul focalizat pe un director al aplicației.

Pentru a realiza acest lucru, deschizi un terminal în directorul aplicației, unde vei porni containerul

```bash
docker run -d -p 8080:80 -v $(pwd)/subdirector_de_build:/usr/share/nginx/html nginx:alpine
```

În cazul în care aplicația este împachetată într-un director de build, vei menționa acest director imediat după variabila de system `$(pwd)`. Fanionul `-d` (detach) va returna identificatorul containerului care tocmai a pornit să ruleze și va face disponibilă consola pentru alte comenzi.

Ceea ce se află după două puncte este rădăcina fișierelor statice pe care nginx o va servi. În cazul nostru mesajul este ca pentru toate cererile care în mod normal ar ateriza pe `/usr/share/nginx/html`, să le trimiți la `$(pwd)/subdirector_de_build`. Această apelare permite rularea unui server real pentru aplicația dezvoltată.

Niciodată nu injecta codul propriu într-un container. Creează imagini!

## Resurse

- [The Docker platform | docs.docker.com](https://docs.docker.com/get-started/overview/)
