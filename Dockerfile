FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.12.1

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Install turbo and prisma, then build
RUN npm install -g turbo prisma
RUN prisma generate --schema=./prisma/schema.prisma
RUN turbo build --filter=@integrasaude/api...

# Runtime
ENV PORT=10000
EXPOSE 10000
CMD ["node", "apps/api/dist/index.mjs"]
