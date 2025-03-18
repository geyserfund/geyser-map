FROM node:18-alpine

WORKDIR /usr/app

RUN yarn set version berry

COPY package.json yarn.lock* ./

RUN yarn install

RUN corepack enable

COPY . .

EXPOSE 3001

CMD ["yarn", "dev"] 