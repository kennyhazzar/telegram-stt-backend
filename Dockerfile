FROM node:20

WORKDIR /app

COPY package.json yarn.lock ./
COPY .env ./

RUN yarn

COPY . .

RUN yarn build

EXPOSE ${PORT}

CMD ["yarn", "start:prod"]
