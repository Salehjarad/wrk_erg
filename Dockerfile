FROM node:12.19.0
# ARG DATABASE_URL
# ENV DATABASE_URL=${DATABASE_URL}
ENV NODE_ENV production
WORKDIR /usr/app
COPY package*.json ./
RUN npm install
COPY . .

RUN apt-get update -y && apt-get upgrade -y && apt-get install git -y \
    && npm set progress=false \
    && chmod +x /usr/app/wait-for-it.sh \
    && chmod +x /usr/app/run-it.sh

EXPOSE 9090

CMD [ "./run-it.sh" ]