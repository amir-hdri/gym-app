# Next.js standalone image. Build from the repo root: docker build -f apps/web/Dockerfile .
FROM node:20-alpine AS deps
WORKDIR /srv
COPY package.json package-lock.json turbo.json ./
COPY apps/web/package.json apps/web/
RUN npm ci --workspace=apps/web

FROM node:20-alpine AS builder
WORKDIR /srv
COPY --from=deps /srv/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=apps/web

FROM node:20-alpine AS runner
WORKDIR /srv
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /srv/apps/web/.next/standalone ./
COPY --from=builder /srv/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /srv/apps/web/public ./apps/web/public
USER app
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
