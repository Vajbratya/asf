FROM node:20-slim

# Install pnpm
RUN npm install -g pnpm turbo

WORKDIR /app

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Build
RUN turbo build --filter=@integrasaude/api...

# Expose port
EXPOSE 10000

# Start the API
CMD ["node", "apps/api/dist/index.mjs"]
