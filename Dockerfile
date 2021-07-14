FROM node
WORKDIR /home/node/reddit
COPY ./.env ./
COPY ./*.js* ./
RUN npm install
CMD gunicorn --bind 0.0.0.0:$PORT wsgi
CMD [ "npm", "start" ]
