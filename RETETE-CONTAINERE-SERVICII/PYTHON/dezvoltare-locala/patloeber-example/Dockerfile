FROM python:3.10-slim

WORKDIR /code

COPY ./requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
# --no-cache-dir pentru că Docker are propriul nivel de caching pentru fiecare nivel
# requirements.txt nu se modifică des așa cum am menționat și în materiale urmând
# buna practică care spune că acele niveluri care nu se modifică des să fie puse primele

COPY ./src ./src
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "80", "--reload"]