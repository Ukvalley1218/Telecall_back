#!/bin/bash

# HRMS Backend API Test Script v2
# Uses correct MongoDB ObjectIds from seed data

BASE_URL="http://localhost:5000/api"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
        echo "$body" | head -c 200
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $http_code)"
        echo "   Response: $body"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

echo ""
echo "=========================================="
echo "     HRMS Backend API Test Suite v2     "
echo "=========================================="
echo ""

# ==================== LOGIN ====================
echo -e "${YELLOW}=== STEP 1: AUTHENTICATION ===${NC}"

echo -n "Logging in as Admin... "
login_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@techcorp.com","password":"admin123"}')

ADMIN_TOKEN=$(echo "$login_response" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
ORG_ID=$(echo "$login_response" | sed -n 's/.*"_id":"\([^"]*\)".*/\1/p' | head -1)

if [ -n "$ADMIN_TOKEN" ]; then
    echo -e "${GREEN}✓ Success${NC}"
    echo "   Token: ${ADMIN_TOKEN:0:30}..."
else
    echo -e "${RED}✗ Failed${NC}"
    echo "Response: $login_response"
    exit 1
fi

# Get employee and shift IDs
echo -n "Fetching employee data... "
emp_response=$(curl -s "$BASE_URL/employees" -H "Authorization: Bearer $ADMIN_TOKEN")
FIRST_EMP_ID=$(echo "$emp_response" | sed -n 's/.*employeeId":"\([^"]*\)".*/\1/p' | head -1)
EMP_MONGO_ID=$(echo "$emp_response" | sed -n 's/.*"_id":"\([a-f0-9]*\)".*/\1/p' | head -1)
echo -e "${GREEN}✓ Done${NC}"
echo "   Employee ID: $FIRST_EMP_ID, MongoDB ID: $EMP_MONGO_ID"

shift_response=$(curl -s "$BASE_URL/shifts" -H "Authorization: Bearer $ADMIN_TOKEN")
SHIFT_ID=$(echo "$shift_response" | sed -n 's/.*"_id":"\([a-f0-9]*\)".*/\1/p' | head -1)
echo "   Shift ID: $SHIFT_ID"

job_response=$(curl -s "$BASE_URL/job-openings" -H "Authorization: Bearer $ADMIN_TOKEN")
JOB_ID=$(echo "$job_response" | sed -n 's/.*"_id":"\([a-f0-9]*\)".*/\1/p' | head -1)
echo "   Job ID: $JOB_ID"

candidate_response=$(curl -s "$BASE_URL/candidates" -H "Authorization: Bearer $ADMIN_TOKEN")
CANDIDATE_ID=$(echo "$candidate_response" | sed -n 's/.*"_id":"\([a-f0-9]*\)".*/\1/p' | head -1)
echo "   Candidate ID: $CANDIDATE_ID"

echo ""

# ==================== AUTH TESTS ====================
echo -e "${YELLOW}=== AUTH TESTS ===${NC}"

test_api "Get current user" "GET" "/auth/me" "" "$ADMIN_TOKEN" 200
test_api "Invalid login" "POST" "/auth/login" '{"email":"wrong@test.com","password":"wrong"}' "" 401
test_api "Missing credentials" "POST" "/auth/login" '{}' "" 400

echo ""

# ==================== ORGANIZATION TESTS ====================
echo -e "${YELLOW}=== ORGANIZATION TESTS ===${NC}"

test_api "Get organization" "GET" "/organization" "" "$ADMIN_TOKEN" 200
test_api "Update organization" "PUT" "/organization" '{"name":"TechCorp Solutions Updated"}' "$ADMIN_TOKEN" 200
test_api "Check can add employee" "GET" "/organization/can-add-employee" "" "$ADMIN_TOKEN" 200

echo ""

# ==================== EMPLOYEE TESTS ====================
echo -e "${YELLOW}=== EMPLOYEE TESTS ===${NC}"

test_api "Get all employees" "GET" "/employees" "" "$ADMIN_TOKEN" 200
test_api "Get employee by ID" "GET" "/employees/$EMP_MONGO_ID" "" "$ADMIN_TOKEN" 200
test_api "Create new employee" "POST" "/employees" '{
    "personalInfo": {
        "firstName": "Test",
        "lastName": "User",
        "email": "test.user@techcorp.com",
        "phone": "+1-555-999-9999",
        "dateOfBirth": "1995-05-15",
        "gender": "male"
    },
    "employment": {
        "department": "Engineering",
        "designation": "Software Engineer",
        "joiningDate": "2024-01-15",
        "employmentType": "full_time"
    }
}' "$ADMIN_TOKEN" 201

test_api "Update employee" "PUT" "/employees/$EMP_MONGO_ID" '{"personalInfo":{"firstName":"Updated"}}' "$ADMIN_TOKEN" 200
test_api "Get employee attendance" "GET" "/employees/$EMP_MONGO_ID/attendance" "" "$ADMIN_TOKEN" 200
test_api "Get employee incentives" "GET" "/employees/$EMP_MONGO_ID/incentives" "" "$ADMIN_TOKEN" 200
test_api "Assign shift" "PUT" "/employees/$EMP_MONGO_ID/assign-shift" "{\"shiftId\":\"$SHIFT_ID\"}" "$ADMIN_TOKEN" 200
test_api "Toggle overtime" "PUT" "/employees/$EMP_MONGO_ID/overtime" '{"overtimeAllowed":true}' "$ADMIN_TOKEN" 200

echo ""

# ==================== SHIFT TESTS ====================
echo -e "${YELLOW}=== SHIFT TESTS ===${NC}"

test_api "Get all shifts" "GET" "/shifts" "" "$ADMIN_TOKEN" 200
test_api "Create new shift" "POST" "/shifts" '{
    "name": "Evening Shift",
    "code": "EVE001",
    "timings": [{
        "days": [1, 2, 3, 4, 5],
        "startTime": "14:00",
        "endTime": "22:00"
    }],
    "gracePeriodMinutes": 10,
    "halfDayHours": 4,
    "fullDayHours": 8
}' "$ADMIN_TOKEN" 201

echo ""

# ==================== KPI TESTS ====================
echo -e "${YELLOW}=== KPI TESTS ===${NC}"

test_api "Get all KPIs" "GET" "/kpi" "" "$ADMIN_TOKEN" 200
test_api "Get KPI groups" "GET" "/kpi/groups/list" "" "$ADMIN_TOKEN" 200
test_api "Create new KPI" "POST" "/kpi" '{
    "name": "Test KPI",
    "description": "Test KPI Description",
    "unit": "Count",
    "group": "Operations",
    "targetValue": 100,
    "maxValue": 150,
    "weightage": 10,
    "frequency": "monthly"
}' "$ADMIN_TOKEN" 201

echo ""

# ==================== ATTENDANCE TESTS ====================
echo -e "${YELLOW}=== ATTENDANCE TESTS ===${NC}"

test_api "Get attendance records" "GET" "/attendance" "" "$ADMIN_TOKEN" 200
test_api "Get today attendance" "GET" "/attendance/today" "" "$ADMIN_TOKEN" 200
test_api "Get late marks summary" "GET" "/attendance/late-marks?month=3&year=2026" "" "$ADMIN_TOKEN" 200
test_api "Check-in" "POST" "/attendance/checkin" "{\"shiftId\":\"$SHIFT_ID\"}" "$ADMIN_TOKEN" 201

echo ""

# ==================== INCENTIVE TESTS ====================
echo -e "${YELLOW}=== INCENTIVE TESTS ===${NC}"

test_api "Get all incentives" "GET" "/incentives" "" "$ADMIN_TOKEN" 200
test_api "Get payable incentives" "GET" "/incentives/payable" "" "$ADMIN_TOKEN" 200
test_api "Create incentive" "POST" "/incentives" "{
    \"employeeId\": \"$EMP_MONGO_ID\",
    \"salesAmount\": 100000,
    \"incentivePercentage\": 5,
    \"incentiveAmount\": 5000,
    \"reason\": \"sales_completion\",
    \"salesDate\": \"2026-03-09\",
    \"payableDate\": \"2026-04-15\"
}" "$ADMIN_TOKEN" 201

echo ""

# ==================== SANDWICH LEAVE TESTS ====================
echo -e "${YELLOW}=== SANDWICH LEAVE TESTS ===${NC}"

test_api "Get all sandwich leaves" "GET" "/sandwich-leaves" "" "$ADMIN_TOKEN" 200
test_api "Create sandwich leave" "POST" "/sandwich-leaves" "{
    \"employeeId\": \"$EMP_MONGO_ID\",
    \"leaveDates\": [\"2026-03-10\", \"2026-03-12\"],
    \"sandwichDates\": [\"2026-03-11\"],
    \"deductionType\": \"2x\",
    \"reason\": \"Test sandwich leave\"
}" "$ADMIN_TOKEN" 201

echo ""

# ==================== JOB OPENING TESTS ====================
echo -e "${YELLOW}=== JOB OPENING TESTS ===${NC}"

# Public routes (no auth)
test_api "Get public job openings" "GET" "/job-openings/public?organizationId=$ORG_ID" "" "" 200

# Protected routes (with auth)
test_api "Get all job openings" "GET" "/job-openings" "" "$ADMIN_TOKEN" 200
test_api "Get job opening statistics" "GET" "/job-openings/statistics" "" "$ADMIN_TOKEN" 200
test_api "Create job opening" "POST" "/job-openings" '{
    "title": "Senior Developer",
    "description": "Senior Software Developer position",
    "department": "Engineering",
    "location": "Remote",
    "employmentType": "full_time",
    "experienceRequired": {"min": 3, "max": 5},
    "skills": ["JavaScript", "Node.js", "React"],
    "salaryRange": {"min": 80000, "max": 120000}
}' "$ADMIN_TOKEN" 201

echo ""

# ==================== CANDIDATE TESTS ====================
echo -e "${YELLOW}=== CANDIDATE/RECRUITMENT TESTS ===${NC}"

test_api "Get all candidates" "GET" "/candidates" "" "$ADMIN_TOKEN" 200
test_api "Get recruitment pipeline" "GET" "/candidates/pipeline" "" "$ADMIN_TOKEN" 200
test_api "Get candidate by ID" "GET" "/candidates/$CANDIDATE_ID" "" "$ADMIN_TOKEN" 200
test_api "Shortlist candidate" "PUT" "/candidates/$CANDIDATE_ID/shortlist" '{}' "$ADMIN_TOKEN" 200
test_api "Screen candidate" "PUT" "/candidates/$CANDIDATE_ID/screen" '{"note":"Excellent candidate"}' "$ADMIN_TOKEN" 200
test_api "Schedule interview" "PUT" "/candidates/$CANDIDATE_ID/schedule-interview" '{"scheduledAt":"2026-03-15T10:00:00Z","interviewer":"John Smith"}' "$ADMIN_TOKEN" 200

echo ""

# ==================== ERROR HANDLING TESTS ====================
echo -e "${YELLOW}=== ERROR HANDLING TESTS ===${NC}"

test_api "Unauthorized access" "GET" "/employees" "" "" 401
test_api "Invalid Mongo ID" "GET" "/employees/invalid123" "" "$ADMIN_TOKEN" 400
test_api "Missing required fields" "POST" "/employees" '{}' "$ADMIN_TOKEN" 400

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
    echo -e "${RED}Some tests failed. Please review above. ✗${NC}"
fi

echo ""