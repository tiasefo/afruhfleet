# 🐳 Docker Containerization Guide

## 📋 Overview

The Afruheritage platform has been fully containerized for easy deployment and migration. Each application runs in its own container with proper isolation and configuration.

## 🏗️ **Container Architecture**

### **Applications Containerized**
- **Frontend** (Next.js) - Port 3000
- **Backend API** (FastAPI) - Port 8000  
- **Admin Console** (FastAPI) - Port 4000
- **PostgreSQL** - Port 5433
- **Redis** - Port 6380
- **Nginx** (Production) - Ports 80/443

## 🚀 **Quick Start**

### **Development Environment**
```bash
# Start all services with direct port access
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### **Production Environment**
```bash
# Start with Nginx reverse proxy
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

## 🔧 **Configuration**

### **Environment Files**
- `.env.docker` - Backend configuration
- `frontend/.env.docker` - Frontend configuration  
- `admin-console/.env.docker` - Admin panel configuration

### **Key Environment Variables**
```bash
# Database
DATABASE_URL=postgresql+psycopg://afruheritage:afruheritage@postgres:5432/afruheritage

# Redis
CELERY_BROKER_URL=redis://redis:6379/0

# Frontend
NEXT_PUBLIC_API_BASE_URL=http://api:8000
NEXT_PUBLIC_TENANT_ID=demo
```

## 📁 **Dockerfiles**

### **Frontend (Next.js)**
- Multi-stage build for optimization
- Non-root user for security
- Standalone output for production
- Health checks included

### **Backend (FastAPI)**
- Multi-stage build with development/production targets
- Virtual environment isolation
- Gunicorn for production serving
- Health checks and graceful shutdown

### **Admin Console**
- Similar to backend but separate container
- Independent database connections
- Own environment configuration

## 🌐 **Network Configuration**

### **Development**
- Direct port access to each service
- No reverse proxy
- Easy debugging and testing

### **Production**
- Nginx reverse proxy on ports 80/443
- Internal container networking
- SSL termination (when configured)
- Rate limiting and security headers

## 🔍 **Service URLs**

### **Development**
- Frontend: http://localhost:3000
- API: http://localhost:8100
- Admin: http://localhost:4000
- Database: localhost:5433
- Redis: localhost:6380

### **Production**
- Frontend: http://localhost (via Nginx)
- API: http://localhost/api (via Nginx)
- Admin: http://localhost/admin (via Nginx)

## 🗂️ **Volume Management**

### **Persistent Data**
- `postgres_data` - Database storage
- `redis_data` - Cache storage
- `./logs` - Application logs
- `./secrets` - SSH keys and certificates

### **Development Volumes**
- Source code mounted for live reloading
- Database initialization scripts
- Configuration files

## 🏥 **Health Checks**

All containers include health checks:
```bash
# Check container health
docker ps

# View health status
docker inspect afruheritage-api | grep Health -A 10
```

## 🔐 **Security Features**

- Non-root users in containers
- Read-only file system where possible
- Limited resource usage
- Network isolation
- Environment variable encryption

## 📊 **Monitoring**

### **Logs**
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs api

# Follow logs in real-time
docker-compose logs -f frontend
```

### **Metrics**
- Container resource usage
- Application performance metrics
- Database connection status
- Redis memory usage

## 🚀 **Deployment Commands**

### **Build Images**
```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build frontend

# Build without cache
docker-compose build --no-cache
```

### **Run Services**
```bash
# Start in background
docker-compose up -d

# Start with rebuild
docker-compose up -d --build

# Start specific service
docker-compose up -d api
```

### **Maintenance**
```bash
# Update images
docker-compose pull

# Recreate services
docker-compose up -d --force-recreate

# Clean up
docker-compose down -v
docker system prune -f
```

## 🔧 **Troubleshooting**

### **Common Issues**

1. **Port Conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :3000
   
   # Change ports in docker-compose.yml
   ```

2. **Database Connection**
   ```bash
   # Check database health
   docker-compose exec postgres pg_isready
   
   # View database logs
   docker-compose logs postgres
   ```

3. **Frontend Build Issues**
   ```bash
   # Rebuild frontend
   docker-compose build --no-cache frontend
   
   # Check build logs
   docker-compose logs frontend
   ```

### **Debug Mode**
```bash
# Run with shell access
docker-compose run --rm api /bin/bash

# View container internals
docker exec -it afruheritage-api /bin/bash
```

## 📦 **Migration Guide**

### **Export Data**
```bash
# Export database
docker-compose exec postgres pg_dump -U afruheritage afruheritage > backup.sql

# Export volumes
docker run --rm -v postgres_data:/data -v $(pwd):/backup ubuntu tar czf /backup/postgres_backup.tar.gz /data
```

### **Import Data**
```bash
# Import database
docker-compose exec -T postgres psql -U afruheritage afruheritage < backup.sql

# Import volumes
docker run --rm -v postgres_data:/data -v $(pwd):/backup ubuntu tar xzf /backup/postgres_backup.tar.gz -C /
```

## 🌍 **Production Considerations**

1. **SSL Configuration**
   - Add certificates to `nginx/ssl/`
   - Uncomment HTTPS blocks in nginx.conf
   - Update environment variables

2. **Environment Security**
   - Use secure secrets
   - Rotate keys regularly
   - Limit container permissions

3. **Resource Limits**
   - Set memory limits in docker-compose
   - Configure CPU constraints
   - Monitor disk usage

4. **Backup Strategy**
   - Regular database backups
   - Volume snapshots
   - Configuration backups

## 📞 **Support**

For issues with Docker setup:
1. Check container logs
2. Verify network connectivity
3. Validate environment configuration
4. Review health check status

## 🔄 **Version History**

- v1.0.0 - Initial containerization
- v1.1.0 - Added health checks
- v1.2.0 - Production Nginx proxy
- v1.3.0 - Multi-environment support
