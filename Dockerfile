# Build Stage for Client
FROM node:18-alpine as client-build
WORKDIR /app/client
COPY chat-app/client/package*.json ./
RUN npm install
COPY chat-app/client/ ./
RUN npm run build

# Production Stage
FROM node:18-alpine
WORKDIR /app
COPY chat-app/server/package*.json ./
RUN npm install --production

# Copy server code
COPY chat-app/server/ ./

# Copy built client from build stage
COPY --from=client-build /app/client/dist ../client/dist

EXPOSE 3001
CMD ["node", "index.js"]
