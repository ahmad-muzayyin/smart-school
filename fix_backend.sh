#!/bin/bash

# Configuration
DB_USER="root"
DB_PASS="EnterYourDBPasswordHere" # You will be asked to enter this manually or replace it
DB_NAME="attendance_hub"

echo "=== 1. RENAMING TABLES TO LOWERCASE (LINUX STANDARD) ==="
# We use mysql command to execute renaming. 
# Prompting password safely.
echo "Enter MySQL Root Password:"
read -s DB_PASS

mysql -u $DB_USER -p$DB_PASS -D $DB_NAME <<EOF
RENAME TABLE User TO user;
RENAME TABLE Tenant TO tenant;
RENAME TABLE Class TO class;
RENAME TABLE Subject TO subject;
RENAME TABLE Schedule TO schedule;
RENAME TABLE Attendance TO attendance;
RENAME TABLE Grade TO grade;
RENAME TABLE TeachingMaterial TO teachingmaterial;
RENAME TABLE _SubjectToUser TO _subjecttouser;
EOF

echo "Table renaming executed (errors expected if tables are already lowercase)."

echo "=== 2. MAPPING PRISMA SCHEMA TO LOWERCASE TABLES ==="
# Using sed to inject @@map into schema.prisma if not exists
# We backup original schema first
cp prisma/schema.prisma prisma/schema.prisma.bak

# Function to add map if not present
add_map() {
    MODEL=$1
    TABLE=$2
    # Check if map already exists
    if ! grep -q "@@map(\"$TABLE\")" prisma/schema.prisma; then
        echo "Mapping $MODEL to $TABLE..."
        sed -i "s/model $MODEL {/model $MODEL {\n  @@map(\"$TABLE\")/" prisma/schema.prisma
    fi
}

add_map "User" "user"
add_map "Tenant" "tenant"
add_map "Class" "class"
add_map "Subject" "subject"
add_map "Schedule" "schedule"
add_map "Attendance" "attendance"
add_map "Grade" "grade"
add_map "TeachingMaterial" "teachingmaterial"

echo "Schema mapping complete."

echo "=== 3. REGENERATING PRISMA CLIENT ==="
rm -rf node_modules/.prisma
npx prisma generate

echo "=== 4. BUILDING BACKEND ==="
npm run build

echo "=== 5. RESTARTING SERVER ==="
pm2 restart all

echo "=== DONE! BACKEND SHOULD BE HEALTHY NOW ==="
pm2 list
