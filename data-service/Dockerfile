FROM node:25-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

USER node
ENTRYPOINT ["node", "dist/queryMeasurements.js"]
