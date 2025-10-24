#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

# Use a context manager to run db.create_all()
python -c "from app import app, db; app.app_context().push(); db.create_all()"