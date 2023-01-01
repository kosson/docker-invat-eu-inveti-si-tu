// https://nodejs.org/en/docs/guides/getting-started-guide/
const http = require('http');

const port = 3000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Salutare, lume!');
});

server.listen(port, () => {
  console.log(`Portul este ${port}`);
});