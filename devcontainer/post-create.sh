#!/bin/bash
set -e

cd /workspaces/mvips

echo "Installing backend dependencies..."

if [ -f backend/composer.json ]; then
    cd backend
    composer install
    cd ..
fi

echo "Installing frontend dependencies..."

if [ -f mvips/package.json ]; then
    cd mvips
    npm install
    cd ..
fi

echo "Development environment ready."
