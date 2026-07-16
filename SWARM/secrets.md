# Secrets

În contextul rulării serviciilor în Swarm, un secret este un blob de date. Acesta poate conține o parolă, o cheie privată de SSH sau un certificat SSL. Documentația spune că într-un secret sunt date care nu ar trebui să fie vehiculate pe rețea sau care să fie menționat în Dockerfile în clar sau în oricare parte a codului sursă a aplicației care va rula într-un container.

Mecanismul din spatele secretelor Docker este creat pentru a face disponibile date confidențiale containerelor care au nevoie de ele. Gestionarea tuturor acestor secrete se face într-un mod centralizat, iar în momentul în care sunt vehiculate pe rețea, sunt criptate. Dacă ai niște configurări care nu necesită criptare, poți folosi un mecanism similar secretelor numit configs - https://docs.docker.com/engine/swarm/configs/.

Un alt motiv este că vei dori ca secretele să fie folosite de containere, nu să ajungă și în imagini care pot fi distribuite public.

Secretele sunt gestionate în Swarm, nu și în containere simple.

## Comenzile disponibile

Accesul rapid la documentație este oferit de următorul link: https://docs.docker.com/engine/swarm/secrets/#read-more-about-docker-secret-commands.

## Resurse

- [Manage sensitive data with Docker secrets](https://docs.docker.com/engine/swarm/secrets/)