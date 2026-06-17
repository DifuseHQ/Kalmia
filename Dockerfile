# Build stage for web assets
FROM node:24 AS web-builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app/web
COPY web/package.json web/pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --no-verify-store
COPY web ./
RUN pnpm run build

# Build stage for Go application
FROM golang:1.25-bookworm AS go-builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
COPY --from=web-builder /app/web/build ./web/build
RUN CGO_ENABLED=0 go build -ldflags "-s -w" -o kalmia .

# Final stage
FROM node:24-slim
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10 --activate

COPY --from=go-builder /app/kalmia .
COPY --from=web-builder /app/web/build ./web/build

USER node
EXPOSE 2727
CMD ["./kalmia"]
