FROM ruby:2.7-alpine

RUN apk update && \
    apk add --no-cache build-base nodejs tzdata sqlite-dev autoconf pkgconfig automake

RUN gem install bundler

RUN mkdir /app

WORKDIR /app

COPY . /app

RUN bundle install

RUN yarn install --check-files

EXPOSE 3000
