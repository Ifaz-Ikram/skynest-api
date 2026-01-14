#!/bin/bash
# Script to reset demo passwords directly in PostgreSQL

# User credentials to reset
declare -A USERS=(
  ["manager_col"]="manager123"
  ["manager_gal"]="manager123"
  ["manager_kan"]="manager123"
  ["manager_neg"]="manager123"
  ["receptionist1"]="reception123"
  ["receptionist2"]="reception123"
  ["receptionist3"]="reception123"
  ["receptionist4"]="reception123"
  ["accountant1"]="accountant123"
  ["accountant2"]="accountant123"
)

echo "🔄 Resetting demo user passwords..."
echo ""

for username in "${!USERS[@]}"; do
  password="${USERS[$username]}"
  
  # Generate bcrypt hash using node
  hash=$(node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('$password', 10).then(h => console.log(h));")
  
  # Update in database
  docker exec -i skynest-api-db-1 psql -U postgres -d skynest -c \
    "UPDATE user_account SET password_hash = '$hash' WHERE username = '$username';"
  
  echo "✅ Updated: $username (password: $password)"
done

echo ""
echo "✅ All demo passwords have been reset successfully!"
echo ""
echo "📋 Demo Login Credentials:"
echo "========================"
echo "Managers:      username: manager_col/gal/kan/neg  password: manager123"
echo "Receptionists: username: receptionist1/2/3/4      password: reception123"
echo "Accountants:   username: accountant1/2            password: accountant123"
