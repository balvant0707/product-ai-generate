FROM node:20-alpine
RUN apk add --no-cache openssl

EXPOSE 3000

WORKDIR /app

COPY package.json package-lock.json* ./

# prisma/ must exist before install: the postinstall hook runs `prisma generate`
COPY prisma ./prisma

# Full install — the build needs devDependencies (vite, typescript)
RUN npm ci

COPY . .

RUN npm run build

ENV NODE_ENV=production

CMD ["npm", "run", "docker-start"]
