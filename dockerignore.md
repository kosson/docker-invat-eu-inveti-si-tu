# dockerignore

Contextul pentru comanda `doker build` cuprinde fișiere și directoare de lucru care nu vor fi introduse în imagine.

Pentru a evita includerea acestora au proiectat un mecanism simplu prin prezența unui fișier `.dockerignore`.

Acest fișier este unul text în care pe fiecare linie poți preciza care fișiere și care directoare trebuie excluse la momentul construcției imaginii. Acest lucru poate fi util în cazul în care ai un proiect `Node` pe care dorești să-l incluzi în imagine, mai puțin directorul modulelor `node_modules`.

```yaml
.git
node_modules
*.tmp
```
