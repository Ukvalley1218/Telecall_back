#!/bin/bash

# HRMS Backend API Test Script
# Tests all endpoints with seed data

BASE_URL="http://localhost:5000/api"
ADMIN_TOKEN=""
HR_TOKEN=""
EMPLOYEE_TOKEN=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
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
        echo "   Response: $body"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Test function for file uploads
test_upload() {
    local name="$1"
    local endpoint="$2"
    local file_path="$3"
    local token="$4"
    local expected_status="$5"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -n "Testing: $name ... "

    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
        -H "Authorization: Bearer $token" \
        -F "resume=@$file_path")

    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $http_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $http_code)"
        echo "   Response: $body"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

echo ""
echo "=========================================="
echo "       HRMS Backend API Test Suite        "
echo "=========================================="
echo ""

# ==================== AUTH TESTS ====================
echo -e "${YELLOW}=== AUTHENTICATION TESTS ===${NC}"

# Login as Admin
echo -n "Logging in as Admin... "
login_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@techcorp.com","password":"admin123"}')

# Extract token from JSON response using sed
ADMIN_TOKEN=$(echo "$login_response" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
if [ -n "$ADMIN_TOKEN" ]; then
    echo -e "${GREEN}✓ Success${NC}"
    echo "   Token: ${ADMIN_TOKEN:0:50}..."
else
    echo -e "${RED}✗ Failed${NC}"
    echo "Response: $login_response"
fi

# Login as HR
echo -n "Logging in as HR... "
hr_login_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"hr1@techcorp.com","password":"hr123456"}')

HR_TOKEN=$(echo "$hr_login_response" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
if [ -n "$HR_TOKEN" ]; then
    echo -e "${GREEN}✓ Success${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
    echo "Response: $hr_login_response"
fi

# Test auth endpoints
test_api "Get current user (Admin)" "GET" "/auth/me" "" "$ADMIN_TOKEN" 200
test_api "Invalid login" "POST" "/auth/login" '{"email":"wrong@test.com","password":"wrong"}' "" 401
test_api "Login validation - missing email" "POST" "/auth/login" '{"password":"test123"}' "" 400

echo ""

# ==================== ORGANIZATION TESTS ====================
echo -e "${YELLOW}=== ORGANIZATION TESTS ===${NC}"

test_api "Get organization" "GET" "/organization" "" "$ADMIN_TOKEN" 200
test_api "Update organization" "PUT" "/organization" '{"name":"TechCorp Updated"}' "$ADMIN_TOKEN" 200
test_api "Check can add employee" "GET" "/organization/can-add-employee" "" "$ADMIN_TOKEN" 200

echo ""

# ==================== EMPLOYEE TESTS ====================
echo -e "${YELLOW}=== EMPLOYEE TESTS ===${NC}"

test_api "Get all employees" "GET" "/employees" "" "$ADMIN_TOKEN" 200
test_api "Get employee by ID" "GET" "/employees/EMP001" "" "$ADMIN_TOKEN" 200
test_api "Create new employee" "POST" "/employees" '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test.employee@techcorp.com",
    "phone": "9876543219",
    "department": "Engineering",
    "designation": "Software Engineer",
    "joiningDate": "2024-01-15",
    "employmentType": "full-time",
    "salary": {"basic": 50000, "allowances": 10000}
}' "$ADMIN_TOKEN" 201

test_api "Update employee" "PUT" "/employees/EMP001" '{"firstName":"John Updated"}' "$ADMIN_TOKEN" 200
test_api "Get employee attendance" "GET" "/employees/EMP001/attendance" "" "$ADMIN_TOKEN" 200
test_api "Get employee incentives" "GET" "/employees/EMP001/incentives" "" "$ADMIN_TOKEN" 200

# Get shift ID for assignment
shift_id=$(curl -s "$BASE_URL/shifts" -H "Authorization: Bearer $ADMIN_TOKEN" | grep -o '"_id":"[^"]*"' | head -1 | sed 's/"_id":"//;s/"//')
if [ -n "$shift_id" ]; then
    test_api "Assign shift to employee" "PUT" "/employees/EMP001/assign-shift" "{\"shiftId\":\"$shift_id\"}" "$ADMIN_TOKEN" 200
fi

test_api "Toggle overtime eligibility" "PUT" "/employees/EMP001/overtime" '{"overtimeAllowed":true}' "$ADMIN_TOKEN" 200

echo ""

# ==================== SHIFT TESTS ====================
echo -e "${YELLOW}=== SHIFT TESTS ===${NC}"

test_api "Get all shifts" "GET" "/shifts" "" "$ADMIN_TOKEN" 200
test_api "Create new shift" "POST" "/shifts" '{
    "name": "Test Shift",
    "code": "TST",
    "timings": {
        "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
        "startTime": "10:00",
        "endTime": "19:00"
    },
    "gracePeriodMinutes": 15,
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
test_api "Check-in" "POST" "/attendance/checkin" '{}' "$ADMIN_TOKEN" 201
test_api "Check-out" "POST" "/attendance/checkout" '{}' "$ADMIN_TOKEN" 200

echo ""

# ==================== INCENTIVE TESTS ====================
echo -e "${YELLOW}=== INCENTIVE TESTS ===${NC}"

test_api "Get all incentives" "GET" "/incentives" "" "$ADMIN_TOKEN" 200
test_api "Get payable incentives" "GET" "/incentives/payable" "" "$ADMIN_TOKEN" 200

# Create incentive
test_api "Create incentive" "POST" "/incentives" '{
    "employeeId": "EMP001",
    "salesAmount": 100000,
    "incentivePercentage": 5,
    "reason": "sales_completion",
    "salesDate": "2026-03-09",
    "payableDate": "2026-04-15"
}' "$ADMIN_TOKEN" 201

echo ""

# ==================== SANDWICH LEAVE TESTS ====================
echo -e "${YELLOW}=== SANDWICH LEAVE TESTS ===${NC}"

test_api "Get all sandwich leaves" "GET" "/sandwich-leaves" "" "$ADMIN_TOKEN" 200

test_api "Create sandwich leave" "POST" "/sandwich-leaves" '{
    "employeeId": "EMP001",
    "leaveDates": ["2026-03-10", "2026-03-12"],
    "sandwichDates": ["2026-03-11"],
    "deductionType": "2x",
    "reason": "Test sandwich leave"
}' "$ADMIN_TOKEN" 201

echo ""

# ==================== JOB OPENING TESTS ====================
echo -e "${YELLOW}=== JOB OPENING TESTS ===${NC}"

test_api "Get public job openings" "GET" "/job-openings/public" "" "" 200
test_api "Get all job openings (Admin)" "GET" "/job-openings" "" "$ADMIN_TOKEN" 200
test_api "Get job opening statistics" "GET" "/job-openings/statistics" "" "$ADMIN_TOKEN" 200
test_api "Create job opening" "POST" "/job-openings" '{
    "title": "Test Engineer",
    "description": "Test position",
    "department": "Engineering",
    "location": "Remote",
    "employmentType": "full-time",
    "experienceRequired": "2-4 years",
    "skills": ["Testing", "Automation"],
    "salaryRange": {"min": 50000, "max": 80000}
}' "$ADMIN_TOKEN" 201

echo ""

# ==================== CANDIDATE TESTS ====================
echo -e "${YELLOW}=== CANDIDATE/RECRUITMENT TESTS ===${NC}"

test_api "Get all candidates" "GET" "/candidates" "" "$ADMIN_TOKEN" 200
test_api "Get recruitment pipeline" "GET" "/candidates/pipeline" "" "$ADMIN_TOKEN" 200

# Get a job opening ID for candidate application
job_id=$(curl -s "$BASE_URL/job-openings" -H "Authorization: Bearer $ADMIN_TOKEN" | grep -o '"_id":"[^"]*"' | head -1 | sed 's/"_id":"//;s/"//')

# Create test resume file
echo "John Doe - Resume
Software Engineer with 5 years experience
Skills: JavaScript, Node.js, React" > /tmp/test_resume.txt

if [ -n "$job_id" ]; then
    test_upload "Apply for job" "/candidates/apply" "/tmp/test_resume.txt" "" 201
fi

# Get candidate ID for status updates
candidate_id=$(curl -s "$BASE_URL/candidates" -H "Authorization: Bearer $ADMIN_TOKEN" | grep -o '"_id":"[^"]*"' | head -1 | sed 's/"_id":"//;s/"//')

if [ -n "$candidate_id" ]; then
    test_api "Get candidate by ID" "GET" "/candidates/$candidate_id" "" "$ADMIN_TOKEN" 200
    test_api "Shortlist candidate" "PUT" "/candidates/$candidate_id/shortlist" '{}' "$ADMIN_TOKEN" 200
    test_api "Screen candidate" "PUT" "/candidates/$candidate_id/screen" '{"screeningNotes":"Good candidate"}' "$ADMIN_TOKEN" 200
fi

echo ""

# ==================== ERROR HANDLING TESTS ====================
echo -e "${YELLOW}=== ERROR HANDLING TESTS ===${NC}"

test_api "Unauthorized access" "GET" "/employees" "" "" 401
test_api "Invalid employee ID" "GET" "/employees/INVALID" "" "$ADMIN_TOKEN" 404
test_api "Invalid data - create employee" "POST" "/employees" '{"firstName":""}' "$ADMIN_TOKEN" 400

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