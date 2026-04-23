FROM apify/actor-node-playwright-chrome:20

COPY --chown=myuser package*.json ./
RUN npm --quiet set progress=false && npm install --only=prod

COPY --chown=myuser . ./
RUN npm run build

CMD npm start --silent
