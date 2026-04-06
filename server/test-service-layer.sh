#!/bin/bash

echo "==================================="
echo "Testing Service Layer Implementation"
echo "==================================="

# Start server in background
echo "Starting server..."
npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test 1: Invalid registration (validation)
echo ""
echo "Test 1: Testing validation with invalid data..."
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "weak",
    "name": "J"
  }' \
  -s | jq '.'

# Test 2: Valid registration
echo ""
echo "Test 2: Testing valid registration..."
REGISTER_RESPONSE=$(curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "Password123",
    "name": "Test User",
    "phone": "+251911234567"
  }' \
  -s)

echo "$REGISTER_RESPONSE" | jq '.'

# Extract token
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.token')

# Test 3: Get profile with token
echo ""
echo "Test 3: Testing get profile with authentication..."
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -s | jq '.'

# Test 4: Update profile
echo ""
echo "Test 4: Testing update profile..."
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "phone": "+251922334455"
  }' \
  -s | jq '.'

# Cleanup
echo ""
echo "Stopping server..."
kill $SERVER_PID

echo ""
echo "==================================="
echo "Tests completed!"
echo "==================================="
