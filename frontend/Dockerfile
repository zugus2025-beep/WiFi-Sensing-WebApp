FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install

COPY . .

EXPOSE 3000

ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0

CMD ["pnpm", "dev"]
