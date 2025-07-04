# Build frontend
FROM node:18 AS build-web
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client .
RUN npm run build

# Install server dependencies
FROM node:18 AS build-server
WORKDIR /app
COPY server/package*.json ./
RUN npm install --production
COPY server ./


# Final image
FROM node:18-slim
WORKDIR /app
COPY --from=build-server /app ./
COPY --from=build-web /app/client/dist ./public
ENV NODE_ENV=production
ARG FRONT_PORT=3001
ENV FRONT_PORT=$FRONT_PORT
EXPOSE ${FRONT_PORT}
CMD ["node", "index.js"]
