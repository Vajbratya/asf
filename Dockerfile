FROM node:20

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@8.12.1 --activate

WORKDIR /app

# Copy everything
COPY . .

# Install all dependencies
RUN pnpm install

# Generate Prisma client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Build shared and API
RUN npx turbo build --filter=@integrasaude/api...

# Expose port
ENV PORT=10000
EXPOSE 10000

# Start the API
CMD ["node", "apps/api/dist/index.mjs"]
