FROM node:18-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./

RUN npm install

COPY frontend/ .

RUN npm run build

# Production Stage

FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/build ./build

ENV NODE_ENV=production

EXPOSE 3001

CMD ["serve", "-s", "build", "-l", "3001"]