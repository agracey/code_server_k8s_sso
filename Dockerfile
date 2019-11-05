FROM node:10

WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm install @kubernetes/client-node
EXPOSE 8080
COPY . .

CMD [ "node", "src/server.js" ]