#!/bin/bash
set -e

# Install pnpm globally
npm install -g pnpm

# Go to project root
cd ../..

# Install all dependencies (including dev)
pnpm install

# Build shared package first
cd packages/shared
pnpm build
cd ../..

# Build API
cd apps/api
pnpm build
cd ../..

# Generate Prisma client
npx prisma generate --schema=./prisma/schema.prisma

echo "Build complete!"
