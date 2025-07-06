#!/bin/bash

# Create new directory structure
mkdir -p frontend/src/{api,assets,components/{common,features},features/{auth,email,newsletter,dashboard},hooks,layouts,lib,store,types,utils}

# Move existing files to new structure

# Move assets
if [ -d "frontend/src/assets" ]; then
  mv frontend/src/assets/* frontend/src/assets/
fi

# Move components
if [ -d "frontend/src/components" ]; then
  # Move common components
  for comp in Button Input Modal Card; do
    if [ -d "frontend/src/components/$comp" ]; then
      mv "frontend/src/components/$comp" "frontend/src/components/common/"
    fi
  done
  
  # Move feature-specific components to their respective feature folders
  for feature in auth email newsletter dashboard; do
    if [ -d "frontend/src/components/$feature" ]; then
      mv "frontend/src/components/$feature" "frontend/src/components/features/"
    fi
  done
fi

# Move containers to features
if [ -d "frontend/src/containers" ]; then
  for container in $(ls frontend/src/containers/); do
    feature=$(echo $container | tr '[:upper:]' '[:lower:]')
    mkdir -p "frontend/src/features/$feature"
    mv "frontend/src/containers/$container" "frontend/src/features/$feature/container"
  done
fi

# Move pages to features
if [ -d "frontend/src/pages" ]; then
  for page in $(ls frontend/src/pages/); do
    feature=$(echo $page | tr '[:upper:]' '[:lower:]')
    mkdir -p "frontend/src/features/$feature/pages"
    mv "frontend/src/pages/$page" "frontend/src/features/$feature/pages/"
  done
fi

# Move routes
if [ -d "frontend/src/routes" ]; then
  mv frontend/src/routes frontend/src/
fi

# Move store
if [ -d "frontend/src/store" ]; then
  mv frontend/src/store frontend/src/
fi

# Move types
if [ -d "frontend/src/types" ]; then
  mv frontend/src/types frontend/src/
fi

# Move utils
if [ -d "frontend/src/utils" ]; then
  mv frontend/src/utils frontend/src/
fi

# Move root files
mv frontend/src/app.tsx frontend/src/App.tsx
mv frontend/src/layout.tsx frontend/src/layouts/MainLayout.tsx

# Create a README for the frontend
echo "# Frontend

## Project Structure

- `src/` - Source code
  - `api/` - API service layer
  - `assets/` - Static assets
  - `components/` - Reusable UI components
    - `common/` - Common components (buttons, inputs, etc.)
    - `features/` - Feature-specific components
  - `features/` - Feature modules
    - `auth/` - Authentication feature
    - `email/` - Email feature
    - `newsletter/` - Newsletter feature
    - `dashboard/` - Dashboard feature
  - `hooks/` - Custom React hooks
  - `layouts/` - Layout components
  - `lib/` - Third-party library configurations
  - `store/` - State management
  - `types/` - TypeScript type definitions
  - `utils/` - Utility functions

## Setup

1. Copy `.env.example` to `.env` and update the values
2. Run `npm install`
3. Run `npm start` to start the development server" > frontend/README.md

echo "Frontend restructuring complete. Please review the changes and update any remaining import paths."
