FROM node:latest

WORKDIR /app

# Install PNPM globally
RUN npm install -g pnpm

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies using PNPM without lock file
RUN pnpm install --no-lockfile

# Copy the rest of the application code
COPY . .

# Build the application
RUN pnpm run build

# Expose the application port
EXPOSE 3001

# Start the application using PNPM
CMD ["pnpm", "start"]
