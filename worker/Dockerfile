# Dockerfile for the Python worker
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the worker code
COPY . .

# Default command to run the worker
CMD ["python", "main.py", "start"]
