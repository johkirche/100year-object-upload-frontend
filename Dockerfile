# Build env
FROM node:20-alpine as build-npm-stage

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json ./
COPY pnpm-lock.yaml ./

RUN pnpm install

COPY . .

RUN pnpm run build

#RUN npm install -g lite-server
#EXPOSE 80
#CMD ["lite-server", "--baseDir", "/app/dist", "--port", "80"]


# Run env
FROM nginx:stable-alpine
COPY --from=build-npm-stage /app/dist /usr/share/nginx/html
COPY nginx.template.conf /etc/nginx/templates/default.conf.template

EXPOSE 80
CMD ["/bin/sh", "-c", "envsubst '${NGINX_SERVER_NAME}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]