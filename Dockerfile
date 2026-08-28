# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies required for building
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Vite client and the Express backend
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the built assets from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
