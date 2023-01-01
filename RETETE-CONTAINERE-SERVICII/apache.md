# Server Apache

Pentru a instala Apache.

```bash
docker container run --name webserver -d -p 80:80 httpd
```

O altă construcție ceva mai elaborată în combinație cu o versiune de PHP, dar de această dată construind o nouă imagine.

```yaml
FROM alpine:latest
LABEL maintainer="Nicolaus <ni@ceva.ro>"
LABEL description="Se va instala Apache2 și PHP7"
ENV PHPVERSION 7
RUN apk add --update apache2 php${PHPVERSION}-apache2 php${PHPVERSION} && \
    rm -rf /var/cache/apk/* && \
    mkdir /run/apache2/ && \
    rm -rf /var/www/localhost/htdocs/index.html && \
    echo "<?php phpinfo(); ?>" > /var/www/localhost/htdocs/index.php && \
    chmod 755 /var/www/localhost/htdocs/index.php
EXPOSE 80/tcp
ENTRYPOINT ["httpd"]
CMD ["-D", "FOREGROUND"]
```

Construiești imaginea cu `build`.

```bash
docker build --tag nicolaus/apache-php:7 .
```

Și o rulezi cu `run`.

```bash
docker container run -d -p 8080:80 --name apachephp7 nicolaus/apache-php:7
```
