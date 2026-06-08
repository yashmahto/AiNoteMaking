# Base stage for dependencies and generating Prisma client
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate

# Development stage
FROM base AS development
COPY . .
EXPOSE 4001
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS build
COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=build /app/dist ./dist
# We also copy the prisma folder as migrations might be run from it
COPY prisma ./prisma
EXPOSE 4001
CMD ["npm", "start"]
