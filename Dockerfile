# Stage 1: Build server
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# Stage 2: Build client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 3: Production runtime
FROM node:20-alpine AS production
WORKDIR /app

# Copy server dist and dependencies
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/package.json ./server/
RUN cd server && npm install --omit=dev

# Copy client build output
COPY --from=client-builder /app/client/dist ./client/dist

WORKDIR /app/server

EXPOSE 5001

CMD ["node", "-r", "dotenv/config", "dist/index.js"]
