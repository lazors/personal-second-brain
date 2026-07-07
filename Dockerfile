# --- Build stage: compile the Vite frontend into dist/ ----------------------
FROM node:20-alpine AS build
WORKDIR /app

# Install deps against the lockfile for reproducible builds.
COPY package.json package-lock.json ./
RUN npm ci

# Build the static frontend.
COPY . .
RUN npm run build

# --- Runtime stage: serve dist/ + API from the dependency-free Node server ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=6767
ENV BRAIN_DIR=/app/brain

# The server uses only Node built-ins, so no npm install at runtime.
COPY package.json ./
COPY server ./server
COPY --from=build /app/dist ./dist

EXPOSE 6767
CMD ["node", "server/index.js"]
