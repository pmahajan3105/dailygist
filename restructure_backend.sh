#!/bin/bash

# Create necessary directories
mkdir -p backend/src/{config,controllers,middleware,models,routes,services,utils} backend/scripts backend/tests

# Move shared database files
mv dailygist-backend/shared/database backend/src/models/
mv dailygist-backend/shared/middlewares/* backend/src/middleware/
mv dailygist-backend/shared/cron.js backend/src/utils/

# Move utility files
mv dailygist-backend/util/* backend/src/utils/

# Move services to their new locations
for service in auth email newsletter categories task home notes llm; do
  mkdir -p "backend/src/features/$service"
  
  # Move service files
  if [ -d "dailygist-backend/services/$service" ]; then
    # Move routes
    if [ -d "dailygist-backend/services/$service/routes" ]; then
      mv "dailygist-backend/services/$service/routes" "backend/src/routes/$service"
    fi
    
    # Move controllers
    if [ -d "dailygist-backend/services/$service/controllers" ]; then
      mv "dailygist-backend/services/$service/controllers" "backend/src/features/$service/controllers"
    fi
    
    # Move services
    if [ -d "dailygist-backend/services/$service/services" ]; then
      mv "dailygist-backend/services/$service/services" "backend/src/features/$service/services"
    fi
    
    # Move models
    if [ -d "dailygist-backend/services/$service/models" ]; then
      mv "dailygist-backend/services/$service/models" "backend/src/features/$service/models"
    fi
  fi
done

# Move root files
mv dailygist-backend/index.ts backend/src/
mv dailygist-backend/tsconfig.json backend/
mv dailygist-backend/package.json backend/
mv dailygist-backend/package-lock.json backend/
mv dailygist-backend/.env* backend/

# Create a README for the backend
echo "# Backend

## Project Structure

- `src/` - Source code
  - `config/` - Configuration files
  - `controllers/` - Request handlers
  - `middleware/` - Express middleware
  - `models/` - Database models
  - `routes/` - API routes
  - `services/` - Business logic
  - `utils/` - Utility functions
- `scripts/` - Database and deployment scripts
- `tests/` - Test files

## Setup

1. Copy `.env.example` to `.env` and update the values
2. Run `npm install`
3. Run `npm run dev` to start the development server" > backend/README.md

echo "Backend restructuring complete. Please review the changes and update any remaining import paths."
