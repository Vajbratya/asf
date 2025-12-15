FROM node:20-slim

# Install pnpm 8 (matches lockfile v6.0) and turbo
RUN npm install -g pnpm@8 turbo

WORKDIR /app

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY prisma ./prisma/

# Install dependencies (ignore scripts for initial install)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm add -g prisma && prisma generate --schema=./prisma/schema.prisma

# Build shared package first, then API
RUN pnpm --filter @integrasaude/shared build && pnpm --filter @integrasaude/api build

# Expose port
ENV PORT=10000
EXPOSE 10000

# Start the API
CMD ["node", "apps/api/dist/index.mjs"]
