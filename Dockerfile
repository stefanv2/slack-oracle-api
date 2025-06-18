FROM node:18

# Install dependencies needed for Oracle Instant Client
RUN apt-get update && apt-get install -y \
    libaio1 \
    unzip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for Oracle Instant Client
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient

# Download Oracle Instant Client basic & SDK
COPY software/instantclient-basiclite-linux.x64-19.27.0.0.0dbru.zip /tmp/
COPY software/instantclient-sdk-linux.x64-19.27.0.0.0dbru.zip /tmp/

RUN mkdir -p /opt/oracle && \
    unzip -o /tmp/instantclient-basiclite-linux.x64-19.27.0.0.0dbru.zip -d /opt/oracle/ && \
    unzip -o /tmp/instantclient-sdk-linux.x64-19.27.0.0.0dbru.zip -d /opt/oracle/ && \
    mv /opt/oracle/instantclient_19_27 /opt/oracle/instantclient && \
    rm /tmp/instantclient-basiclite-linux.x64-19.27.0.0.0dbru.zip /tmp/instantclient-sdk-linux.x64-19.27.0.0.0dbru.zip

# Install app dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install

# Copy app source code
COPY . .

# Oracle wallet if applicable
#COPY oracle_wallet_client ./oracle_wallet_client

# Optional environment file
COPY .env .env

# 🔥 Maak de poort dynamisch via ENV
ARG PORT=3000
ENV PORT=${PORT}
EXPOSE ${PORT}

# Start de app
CMD [ "node", "index.js" ]

