FROM apify/actor-node-playwright-chrome:20

COPY --chown=myuser package*.json ./
RUN npm --quiet set progress=false && npm install --include=dev

COPY --chown=myuser . ./
RUN npm run build && npm prune --production

CMD npm start --silent
