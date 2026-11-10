FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY api/package.json api/
COPY web/package.json web/
RUN npm ci

FROM deps AS api
COPY api api
RUN npm run typecheck --workspace api
WORKDIR /app/api
EXPOSE 3000
CMD ["npm", "start"]

FROM deps AS web-build
COPY web web
RUN npm run build --workspace web

FROM nginx:1.29-alpine AS web
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /app/web/dist /usr/share/nginx/html
EXPOSE 80
