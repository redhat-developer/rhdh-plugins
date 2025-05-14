FROM node:20-bookworm-slim

USER node
WORKDIR /app

COPY --chown=node:node --chmod=444 ./httpServer.dynamic.course.select.js ./
COPY --chown=node:node --chmod=555 ./node_modules ./node_modules

CMD ["node", "./httpServer.dynamic.course.select.js"]
