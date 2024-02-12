FROM node:18

WORKDIR /app

COPY package.json .

RUN yarn

RUN yarn

COPY . .

EXPOSE 3000

ENV ADDRESS=0.0.0.0 PORT=3000

CMD ["yarn", "start"]
