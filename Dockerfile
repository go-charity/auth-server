FROM node:gallium

WORKDIR /app

COPY package.json /app

RUN npm install -f

COPY . .

CMD ["node", "./dev/index.js"]