# Alegerea imaginii

Imaginea trebuie să fie aleasă în funcție de cele mai mici detalii pentru a avea construcții predictibile. Reține faptul că imaginea de bază pentru Node.js poate avea variații în timp. Acest lucru poate pune în pericol stabilitatea construcției finale a proiectului. Din acest motiv, se va specifica exact imaginea cu care se va lucra. Evită folosirea tag-ului `latest` pentru proiectele pentru care nu dorești să introduci instabilitate.

```yaml
FROM node:16.1-alpine3.13
```

## Resurse

- https://github.com/OWASP/CheatSheetSeries/blob/master/cheatsheets/NodeJS_Docker_Cheat_Sheet.md
- [Node.js Rocks in Docker, DockerCon 2022 Edition | Bret Fisher | 2022](https://youtu.be/Z0lpNSC1KbM)