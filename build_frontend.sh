#!/usr/bin/env bash

# This script prepares the frontend files for Netlify deployment.

# 1. Create a clean directory to put our published files in.
#    The 'mkdir -p' command creates the directory and won't fail if it already exists.
echo "Creating public directory..."
mkdir -p public/static

# 2. Copy the HTML files from the 'templates' folder to the root of the 'public' folder.
echo "Copying HTML files..."
cp templates/index.html public/
cp templates/admin.html public/

# 3. Copy all the assets from the 'static' folder into the 'public/static' folder.
echo "Copying static assets..."
cp -r static/* public/static/

echo "Build finished successfully!"