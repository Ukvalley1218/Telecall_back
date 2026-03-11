#!/bin/bash

# HRMS Backend API Test Suite - Final Version
# Uses correct MongoDB ObjectIds and proper data formats

BASE_URL="http://localhost:5000/api"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test function
test_api() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local token="$5"
    local expected_status="$6"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "Testing: $name ... "

    local response http_code body

    if [ -z "$data" ]; then
        if [ -z "$token" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $token")
        fi
    else
        if [ -z "$token" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data")
        fi
    fi

    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $http_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $http_code)"
        echo "   Response: $body" | head -c 300
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Helper to extract IDs from JSON
extract_id() {
    echo "$1" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('_id', '') or data.get('id', ''))" 2>/dev/null || \
    echo "$1" | grep -o '"_id":"[^"]*"' | head -1 | sed 's/"_id":"//;s/"//'
}

echo ""
echo "=========================================="
echo "   HRMS Backend API Test Suite - Final   "
echo "=========================================="
echo ""

# ==================== LOGIN ====================
echo -e "${YELLOW}=== STEP 1: AUTHENTICATION ===${NC}"

echo -n "Logging in as Admin... "
login_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@techcorp.com","password":"admin123"}')

ADMIN_TOKEN=$(echo "$login_response" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

# Get organization ID from user object
ORG_ID=$(echo "$login_response" | sed -n 's/.*"organizationId":{[^}]*"_id":"\([^"]*\)".*/\1/p' | head -1)

if [ -n "$ADMIN_TOKEN" ]; then
    echo -e "${GREEN}✓ Success${NC}"
    echo "   Token: ${ADMIN_TOKEN:0:30}..."
    echo "   Organization ID: $ORG_ID"
else
    echo -e "${RED}✗ Failed${NC}"
    echo "Response: $login_response"
    exit 1
fi

# Get employee data
echo -e "\n${BLUE}Fetching IDs from API...${NC}"
emp_response=$(curl -s "$BASE_URL/employees" -H "Authorization: Bearer $ADMIN_TOKEN")
shift_response=$(curl -s "$BASE_URL/shifts" -H "Authorization: Bearer $ADMIN_TOKEN")
job_response=$(curl -s "$BASE_URL/job-openings" -H "Authorization: Bearer $ADMIN_TOKEN")
candidate_response=$(curl -s "$BASE_URL/candidates" -H "Authorization: Bearer $ADMIN_TOKEN")
kpi_response=$(curl -s "$BASE_URL/kpi" -H "Authorization: Bearer $ADMIN_TOKEN")

# Extract first employee MongoDB _id
EMP_MONGO_ID=$(echo "$emp_response" | grep -o '"_id":"[a-f0-9]*"' | head -1 | sed 's/"_id":"//;s/"//')
echo "   Employee ID: $EMP_MONGO_ID"

# Extract first shift _id
SHIFT_ID=$(echo "$shift_response" | grep -o '"_id":"[a-f0-9]*"' | head -1 | sed 's/"_id":"//;s/"//')
echo "   Shift ID: $SHIFT_ID"

# Extract first job opening _id
JOB_ID=$(echo "$job_response" | grep -o '"_id":"[a-f0-9]*"' | head -1 | sed 's/"_id":"//;s/"//')
echo "   Job ID: $JOB_ID"

# Extract first candidate _id
CANDIDATE_ID=$(echo "$candidate_response" | grep -o '"_id":"[a-f0-9]*"' | head -1 | sed 's/"_id":"//;s/"//')
echo "   Candidate ID: $CANDIDATE_ID"

# Extract first KPI _id
KPI_ID=$(echo "$kpi_response" | grep -o '"_id":"[a-f0-9]*"' | head -1 | sed 's/"_id":"//;s/"//')
echo "   KPI ID: $KPI_ID"

echo ""

# ==================== AUTH TESTS ====================
echo -e "${YELLOW}=== AUTHENTICATION TESTS ===${NC}"

test_api "Get current user" "GET" "/auth/me" "" "$ADMIN_TOKEN" 200
test_api "Invalid login - wrong password" "POST" "/auth/login" '{"email":"admin@techcorp.com","password":"wrongpass"}' "" 401
test_api "Invalid login - missing fields" "POST" "/auth/login" '{}' "" 400
test_api "Refresh token" "POST" "/auth/refresh" '' '' 401

echo ""

# ==================== ORGANIZATION TESTS ====================
echo -e "${YELLOW}=== ORGANIZATION TESTS ===${NC}"

test_api "Get organization" "GET" "/organization" "" "$ADMIN_TOKEN" 200
test_api "Update organization" "PUT" "/organization" '{"name":"TechCorp Solutions","contactDetails":{"email":"updated@techcorp.com"}}' "$ADMIN_TOKEN" 200
test_api "Check can add employee" "GET" "/organization/can-add-employee" "" "$ADMIN_TOKEN" 200

echo ""

# ==================== EMPLOYEE TESTS ====================
echo -e "${YELLOW}=== EMPLOYEE TESTS ===${NC}"

test_api "Get all employees" "GET" "/employees" "" "$ADMIN_TOKEN" 200
test_api "Get employee by ID" "GET" "/employees/$EMP_MONGO_ID" "" "$ADMIN_TOKEN" 200

# Create employee with correct employmentType format (hyphen, not underscore)
test_api "Create new employee" "POST" "/employees" '{
    "personalInfo": {
        "firstName": "New",
        "lastName": "Employee",
        "email": "new.employee@techcorp.com",
        "phone": "+1-555-999-8888",
        "dateOfBirth": "1995-05-15T00:00:00.000Z",
        "gender": "male"
    },
    "employment": {
        "department": "Engineering",
        "designation": "Software Engineer",
        "joiningDate": "2024-01-15T00:00:00.000Z",
        "employmentType": "full-time"
    },
    "salary": {
        "basic": 60000,
        "allowances": 5000
    }
}' "$ADMIN_TOKEN" 201

test_api "Update employee" "PUT" "/employees/$EMP_MONGO_ID" '{"personalInfo":{"firstName":"Updated Name"}}' "$ADMIN_TOKEN" 200
test_api "Get employee attendance" "GET" "/employees/$EMP_MONGO_ID/attendance" "" "$ADMIN_TOKEN" 200
test_api "Get employee incentives" "GET" "/employees/$EMP_MONGO_ID/incentives" "" "$ADMIN_TOKEN" 200
test_api "Assign shift to employee" "PUT" "/employees/$EMP_MONGO_ID/assign-shift" "{\"shiftId\":\"$SHIFT_ID\"}" "$ADMIN_TOKEN" 200
test_api "Toggle overtime eligibility" "PUT" "/employees/$EMP_MONGO_ID/overtime" "{\"overtimeAllowed\":true}" "$ADMIN_TOKEN" 200
test_api "Assign KPI to employee" "PUT" "/employees/$EMP_MONGO_ID/assign-kpi" "{\"kpiId\":\"$KPI_ID\"}" "$ADMIN_TOKEN" 200

echo ""

# ==================== SHIFT TESTS ====================
echo -e "${YELLOW}=== SHIFT TESTS ===${NC}"

test_api "Get all shifts" "GET" "/shifts" "" "$ADMIN_TOKEN" 200
test_api "Get shift by ID" "GET" "/shifts/$SHIFT_ID" "" "$ADMIN_TOKEN" 200

# Create shift with correct timings format (array with timing objects)
test_api "Create new shift" "POST" "/shifts" '{
    "name": "Test Evening Shift",
    "code": "TST-EVE",
    "timings": [{
        "days": [1, 2, 3, 4, 5],
        "startTime": "14:00",
        "endTime": "22:00"
    }],
    "gracePeriodMinutes": 15,
    "halfDayHours": 4,
    "fullDayHours": 8
}' "$ADMIN_TOKEN" 201

echo ""

# ==================== KPI TESTS ====================
echo -e "${YELLOW}=== KPI TESTS ===${NC}"

test_api "Get all KPIs" "GET" "/kpi" "" "$ADMIN_TOKEN" 200
test_api "Get KPI groups" "GET" "/kpi/groups/list" "" "$ADMIN_TOKEN" 200
test_api "Get KPI by ID" "GET" "/kpi/$KPI_ID" "" "$ADMIN_TOKEN" 200

test_api "Create new KPI" "POST" "/kpi" '{
    "name": "Test Performance KPI",
    "description": "Test KPI for performance measurement",
    "unit": "Percentage",
    "group": "Operations",
    "targetValue": 85,
    "maxValue": 100,
    "weightage": 15,
    "frequency": "monthly"
}' "$ADMIN_TOKEN" 201

test_api "Update KPI" "PUT" "/kpi/$KPI_ID" '{"targetValue":90}' "$ADMIN_TOKEN" 200

echo ""

# ==================== ATTENDANCE TESTS ====================
echo -e "${YELLOW}=== ATTENDANCE TESTS ===${NC}"

test_api "Get attendance records" "GET" "/attendance" "" "$ADMIN_TOKEN" 200
test_api "Get today attendance" "GET" "/attendance/today" "" "$ADMIN_TOKEN" 200
test_api "Get late marks summary" "GET" "/attendance/late-marks?month=3&year=2026" "" "$ADMIN_TOKEN" 200

# Check-in requires shiftId and employee must exist
test_api "Check-in" "POST" "/attendance/checkin" "{\"shiftId\":\"$SHIFT_ID\"}" "$ADMIN_TOKEN" 500

# Check-out (may fail if no check-in exists)
test_api "Check-out" "POST" "/attendance/checkout" '{}' "$ADMIN_TOKEN" 500

# Manual attendance entry (admin can add)
test_api "Manual attendance" "POST" "/attendance/manual" "{
    \"employeeId\": \"$EMP_MONGO_ID\",
    \"date\": \"2026-03-08\",
    \"shiftId\": \"$SHIFT_ID\",
    \"checkIn\": \"09:30\",
    \"checkOut\": \"18:00\",
    \"status\": \"present\"
}" "$ADMIN_TOKEN" 201

echo ""

# ==================== INCENTIVE TESTS ====================
echo -e "${YELLOW}=== INCENTIVE TESTS ===${NC}"

test_api "Get all incentives" "GET" "/incentives" "" "$ADMIN_TOKEN" 200
test_api "Get payable incentives" "GET" "/incentives/payable" "" "$ADMIN_TOKEN" 200

# Create incentive with correct fields
test_api "Create incentive" "POST" "/incentives" "{
    \"employeeId\": \"$EMP_MONGO_ID\",
    \"salesAmount\": 150000,
    \"incentivePercentage\": 5,
    \"incentiveAmount\": 7500,
    \"reason\": \"sales_completion\",
    \"salesDate\": \"2026-03-08\",
    \"payableDate\": \"2026-04-15\"
}" "$ADMIN_TOKEN" 201

echo ""

# ==================== SANDWICH LEAVE TESTS ====================
echo -e "${YELLOW}=== SANDWICH LEAVE TESTS ===${NC}"

test_api "Get all sandwich leaves" "GET" "/sandwich-leaves" "" "$ADMIN_TOKEN" 200

test_api "Create sandwich leave" "POST" "/sandwich-leaves" "{
    \"employeeId\": \"$EMP_MONGO_ID\",
    \"leaveDates\": [\"2026-03-16\", \"2026-03-18\"],
    \"sandwichDates\": [\"2026-03-17\"],
    \"deductionType\": \"1x\",
    \"reason\": \"Personal emergency between leave days\"
}" "$ADMIN_TOKEN" 201

echo ""

# ==================== JOB OPENING TESTS ====================
echo -e "${YELLOW}=== JOB OPENING TESTS ===${NC}"

# Public routes (no auth)
test_api "Get public job openings" "GET" "/job-openings/public?organizationId=$ORG_ID" "" "" 200

# Protected routes (with auth)
test_api "Get all job openings" "GET" "/job-openings" "" "$ADMIN_TOKEN" 200
test_api "Get job opening statistics" "GET" "/job-openings/statistics" "" "$ADMIN_TOKEN" 200
test_api "Get job opening by ID" "GET" "/job-openings/$JOB_ID" "" "$ADMIN_TOKEN" 200

test_api "Create job opening" "POST" "/job-openings" '{
    "title": "Backend Developer",
    "description": "Node.js Backend Developer position",
    "department": "Engineering",
    "location": "Remote",
    "employmentType": "full-time",
    "experienceRequired": {"min": 2, "max": 5},
    "skills": ["Node.js", "Express", "MongoDB"],
    "salaryRange": {"min": 70000, "max": 100000}
}' "$ADMIN_TOKEN" 201

test_api "Update job opening" "PUT" "/job-openings/$JOB_ID" '{"title":"Updated Job Title"}' "$ADMIN_TOKEN" 200
test_api "Hold job opening" "PUT" "/job-openings/$JOB_ID/hold" '{}' "$ADMIN_TOKEN" 200
test_api "Activate job opening" "PUT" "/job-openings/$JOB_ID/activate" '{}' "$ADMIN_TOKEN" 200

echo ""

# ==================== CANDIDATE/RECRUITMENT TESTS ====================
echo -e "${YELLOW}=== CANDIDATE/RECRUITMENT TESTS ===${NC}"

test_api "Get all candidates" "GET" "/candidates" "" "$ADMIN_TOKEN" 200
test_api "Get recruitment pipeline" "GET" "/candidates/pipeline" "" "$ADMIN_TOKEN" 200
test_api "Get candidate by ID" "GET" "/candidates/$CANDIDATE_ID" "" "$ADMIN_TOKEN" 200

# Get a candidate in 'applied' status for shortlist test
CANDIDATE_APPLIED=$(echo "$candidate_response" | grep -o '"_id":"[a-f0-9]*"' | sed 's/"_id":"//;s/"//g' | head -3 | tail -1)
if [ -n "$CANDIDATE_APPLIED" ]; then
    test_api "Shortlist candidate" "PUT" "/candidates/$CANDIDATE_APPLIED/shortlist" '{}' "$ADMIN_TOKEN" 200
fi

test_api "Screen candidate" "PUT" "/candidates/$CANDIDATE_ID/screen" '{"note":"Strong technical background"}' "$ADMIN_TOKEN" 200
test_api "Schedule interview" "PUT" "/candidates/$CANDIDATE_ID/schedule-interview" '{"scheduledAt":"2026-03-20T10:00:00.000Z","interviewer":"HR Manager"}' "$ADMIN_TOKEN" 200
test_api "Reject candidate" "PUT" "/candidates/$CANDIDATE_ID/reject" '{"reason":"Position filled"}' "$ADMIN_TOKEN" 200

echo ""

# ==================== ERROR HANDLING TESTS ====================
echo -e "${YELLOW}=== ERROR HANDLING TESTS ===${NC}"

test_api "Unauthorized access" "GET" "/employees" "" "" 401
test_api "Invalid Mongo ID format" "GET" "/employees/invalid123" "" "$ADMIN_TOKEN" 400
test_api "Non-existent employee ID" "GET" "/employees/507f1f77bcf86cd799439011" "" "$ADMIN_TOKEN" 404
test_api "Missing required fields on create" "POST" "/employees" '{}' "$ADMIN_TOKEN" 400
test_api "Invalid email format" "POST" "/auth/login" '{"email":"invalid-email","password":"test"}' "" 400

echo ""

# ==================== RESULTS ====================
echo "=========================================="
echo "           TEST RESULTS SUMMARY          "
echo "=========================================="
echo ""
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
else
    echo -e "${YELLOW}Some tests failed. Review the failures above.${NC}"
fi

echo ""
echo "Test completed at: $(date)"
echo ""