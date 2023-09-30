---
tags:
 - 'local development'
---
# Dezvoltare locală folosind containere

Să presupunem că scrii un mic script de python sau de Javascript. Pentru a-l rula ai nevoie de o imagine de Python sau de Node.js pentru a evita orice complicație care ar implica modificarea mașinii locale pe care faci development. De exemplu, pentru un script de Python (`test.py`), pentru a-l rula, cel mai simplu ar fi să aduci o imagine Docker de Python:

```bash
docker pull python
docker run -v $(pwd):/app -it python
```

Ceea ce se va petrece este aducerea imaginii Python, crearea unui container, a unui volum pentru că a fost specificată opțiunea `-v` (persistența datelor) și în interiorul containerului, în rădăcină se va crea automat un director numit `app`.
În acest moment, dacă modificăm fișierul, se vor repercuta și în container.

Același lucru îl putem realiza prin crearea fișierului `Dockerfile`.

```yaml
FROM python
WORKDIR /app
COPY . .
CMD ["python", "test.py"]
```

Poți porni un container cu `docker build -t exemplu-python .`.