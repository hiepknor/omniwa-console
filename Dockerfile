FROM node:22.17-alpine AS build

ARG VITE_CONSOLE_UI_GENERATION=legacy
ENV VITE_CONSOLE_UI_GENERATION=$VITE_CONSOLE_UI_GENERATION

WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@10.12.4 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm check && pnpm test

FROM nginxinc/nginx-unprivileged:1.29-alpine

ARG OCI_REVISION=unknown
ARG OCI_VERSION=dev
LABEL org.opencontainers.image.title="OmniWA Console" \
      org.opencontainers.image.description="Operations console for OmniWA GO" \
      org.opencontainers.image.revision="$OCI_REVISION" \
      org.opencontainers.image.version="$OCI_VERSION" \
      org.opencontainers.image.source="https://github.com/hiepknor/omniwa-console"

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
