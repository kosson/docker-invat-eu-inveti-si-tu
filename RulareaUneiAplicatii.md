# Rularea unei aplicații reale

Atunci când vei dori să rulezi o aplicație pe un server real ai opțiunea să introduci aplicația într-un container sau să pornești containerul focalizat pe un director al aplicației.

Pentru a realiza acest lucru, deschizi un terminal în directorul aplicației, unde vei porni containerul

```bash
docker run -d -p 8080:80 -v $(pwd)/subdirector_de_build:/usr/share/nginx/html nginx:alpine
```

În cazul în care aplicația este împachetată într-un director de build, vei menționa acest director imediat după variabila de system `$(pwd)`. Fanionul `-d` (detach) va returna identificatorul containerului care tocmai a purnit să ruleze și va face disponibilă consola pentru alte comenzi.

Ceea ce se află după două puncte este rădăcina fișierelor statice pe care nginx o va servi. În cazul nostru mesajul este ca pentru toate cererile care în mod normal ar ateriza pe `/usr/share/nginx/html`, să le trimiți la `$(pwd)/subdirector_de_build`. Această apelare permite rularea unui server real pentru aplicația dezvoltată.

Niciodată nu injecta codul propriu într-un container. Creează imagini!