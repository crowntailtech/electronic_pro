# Use a lightweight Node.js image to build and serve the frontend
FROM node:16-alpine as build

# Set the working directory in the container
WORKDIR /app

# Copy frontend files to the container
COPY . /app

# Install a simple HTTP server to serve the frontend
RUN npm install -g http-server

# Expose the port to be used by the frontend
EXPOSE 3000

# Command to start the HTTP server with home.html as the default file
CMD ["http-server", "-p", "3000", "--entry-file", "home.html"]
