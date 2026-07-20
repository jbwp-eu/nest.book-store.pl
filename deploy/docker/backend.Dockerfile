# Nest API — production image for EC2 Docker Compose (Etap 7a)
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY config.schema.ts ./
COPY src ./src

RUN npm run build && npm prune --omit=dev




FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3004

RUN addgroup -S nest && adduser -S nest -G nest

COPY --from=build --chown=nest:nest /app/package.json /app/package-lock.json ./
COPY --from=build --chown=nest:nest /app/node_modules ./node_modules
COPY --from=build --chown=nest:nest /app/dist ./dist

USER nest

EXPOSE 3004

CMD ["node", "dist/src/main.js"]
