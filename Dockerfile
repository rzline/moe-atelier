FROM node:20-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5173

COPY --from=build /app ./

RUN npm ci --omit=dev
RUN mkdir -p saved-images server-data
EXPOSE 5173

CMD ["node", "server.mjs", "--prod"]
