ARG MAINTAINER
FROM node:18
MAINTAINER $MAINTAINER

WORKDIR /root/app

COPY . /root/app/

RUN npm install --registry=https://registry.npmmirror.com
RUN npm run build


ENV PORT=7020
ENV NODE_ENV=production

EXPOSE 7020

# CMD [ "pm2-runtime", "start", "npm", "--", "start" ]
CMD [ "npm", "start" ]