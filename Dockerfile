# Stage 1: Set up the final image
FROM python:3.9-slim

# Set environment variables for Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies required for mysqlclient and supervisor
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    build-essential \
    python3-dev \
    pkg-config \
    supervisor

# Set up Supervisor
RUN mkdir -p /var/log/supervisor
COPY supervisord.conf /etc/supervisor/supervisord.conf

# Set the working directory for the backend
WORKDIR /app

# Copy backend requirements and install Python dependencies
COPY ./backend/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY ./backend/ /app/backend

# Copy frontend static files
COPY ./frontend/ /app/frontend/

# Expose ports for backend and frontend
EXPOSE 8000
EXPOSE 3000

# Command to run Supervisor (managing backend and frontend)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]
