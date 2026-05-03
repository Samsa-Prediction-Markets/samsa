# ============================================================
# Stage 1: Build Rust engine (Linux x86_64)
# ============================================================
FROM rust:1.78-slim AS rust-builder

WORKDIR /engine
COPY backend/engine/ .

RUN cargo build --release

# ============================================================
# Stage 2: Build React frontend
# ============================================================
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .

# VITE_ vars must be present at build time — set these in Railway
ARG VITE_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# ============================================================
# Stage 3: Production Node.js server
# ============================================================
FROM node:20-slim AS production

WORKDIR /app

# Install only production Node deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy backend source and root server
COPY backend/ ./backend/
COPY server.js ./

# Place the React build where backend/server.js expects it:
# path.join(__dirname, '..', 'frontend', 'dist')
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy compiled Rust binary and make it executable
COPY --from=rust-builder /engine/target/release/samsa-engine \
     ./backend/engine/target/release/samsa-engine
RUN chmod +x ./backend/engine/target/release/samsa-engine

ENV NODE_ENV=production
# PORT is intentionally NOT hardcoded here — Railway injects its own PORT env
# var at runtime, and the server already reads process.env.PORT || 3001.
# Hardcoding EXPOSE 3001 causes Railway's health check to probe the wrong port.
EXPOSE 3001

CMD ["node", "backend/server.js"]
