# ONRC Import
Aplicația rulează complet în Docker, fără a necesita instalarea locală a Node.js, npm sau PostgreSQL.

## Cerințe

Ai nevoie doar de:

- Docker Desktop (instalat și pornit)
- Git

> 

---

## 1. Clonează repository-ul

```bash
git clone https://gitlab.com/mmonor/onrc-app.git
cd onrc
```

---

## 2. Configurează variabilele de mediu

Copiază fișierul de configurare:

```bash
cp .env.example .env
```

Deschide fișierul `.env` și modifică următoarele valori:

```env
POSTGRES_USER=onrc
POSTGRES_PASSWORD=parola
POSTGRES_DB=onrc_db
```

Toate celelalte variabile pot rămâne identice cu cele din `.env.example`.

---

## 3. Pornește aplicația

Construiește și pornește toate serviciile:

```bash
docker compose up --build
```

La prima pornire, Docker va descărca imaginile și va construi containerele. Acest proces poate dura între **3 și 5 minute**.



Aplicația este disponibilă la:

**http://localhost**

---

# Importul datelor ONRC

Descarcă seturile de date de pe **data.gov.ro** (caută **"firme"**).

## Pasul 1 – Import principal

Accesează:

```
http://localhost/import
```

Încarcă:

- `OD_FIRME.CSV`

---

## Pasul 2 – Îmbogățire stare firmă

Accesează:

```
http://localhost/enrich
```

Încarcă:

- `OD_STARE_FIRMA.CSV`
- [`n_stare_firma.csv`](https://link-catre-n_stare_firma.csv) *(descarcă de aici)*

---

## Pasul 3 – Îmbogățire coduri CAEN

Accesează:

```
http://localhost/enrich
```

Încarcă:

- `OD_CAEN_AUTORIZAT.CSV`
- [`n_caen.csv`](https://link-catre-n_caen.csv) *(descarcă de aici)*

## Ordinea importului

Este important să importi mai intai od_firme.csv si apoi codurile si starile firmelor.


# Oprirea aplicației

Pentru a opri containerele:

```bash
docker compose down
```



# Ștergerea completă a datelor

Dacă dorești să elimini și baza de date (volumele Docker):

```bash
docker compose down -v
```



