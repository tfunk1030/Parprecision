FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04

# Install Node.js, Python and other dependencies
RUN apt-get update && apt-get install -y \
    curl \
    python3 \
    python3-pip \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser -m appuser

# Install TensorFlow with GPU support
RUN pip3 install tensorflow==2.15.*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy only necessary source files and configurations
COPY tsconfig.json ./
COPY jest.config.js ./
COPY src/ ./src/
COPY docs/ ./docs/
COPY research/ ./research/

# Set correct permissions
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Build TypeScript code
RUN npm run build

# Set CUDA environment variables
ENV LD_LIBRARY_PATH=/usr/local/cuda/lib64:${LD_LIBRARY_PATH}
ENV CUDA_HOME=/usr/local/cuda

# Default command to run tests
CMD ["npm", "run", "test:all"]
