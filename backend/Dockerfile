FROM node:20-bullseye-slim

RUN apt-get update -y && apt-get install -y openssl bash && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

RUN chmod +x entrypoint.sh

EXPOSE 3001

CMD ["bash", "entrypoint.sh"]