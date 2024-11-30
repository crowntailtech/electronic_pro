# Use the official Python image as the base
FROM python:3.9-slim

# Set environment variables for Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies required for mysqlclient
RUN apt-get update && apt-get install -y
RUN apt-get install gcc -y
RUN apt-get install default-libmysqlclient-dev -y
RUN apt-get install build-essential -y
RUN apt-get install python3-dev -y
RUN apt-get install pkg-config -y

# Copy requirements file to the working directory
COPY requirements.txt /app/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code to the working directory
COPY ./electronic/ /app/

# Expose the application port
EXPOSE 8000

WORKDIR /app/electronic

# Command to run the application
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "electronic.wsgi:application"]
