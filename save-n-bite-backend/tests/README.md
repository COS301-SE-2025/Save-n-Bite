# Save-n-Bite Backend - Integration & End-to-End Tests

This directory contains comprehensive integration, end-to-end, and non-functional requirements tests for the Save-n-Bite backend system.

## 📁 Test Structure

```
tests/
├── __init__.py                 # Test package initialization
├── test_integration.py         # Integration tests
├── test_end_to_end.py         # End-to-end tests
├── test_non_functional.py     # Non-functional requirements tests
├── test_config.py             # Test configuration and utilities
└── README.md                  # This documentation
```

## 🧪 Test Categories

### 1. Integration Tests (`test_integration.py`)

Integration tests verify that different components of the system work together correctly:

- **User Authentication Integration**: Registration, login, and profile creation flows
- **Food Listing & Order Integration**: Complete order workflow from browsing to completion
- **Donation System Integration**: Provider-to-NGO donation workflows
- **Notification Integration**: Cross-app notification creation and delivery
- **Review System Integration**: Post-order review functionality
- **Badge System Integration**: Gamification and achievement unlocking
- **Digital Garden Integration**: Plant unlocking based on user actions
- **Cross-App Data Consistency**: Data integrity across multiple apps
- **API Endpoint Integration**: Consistent authentication and response formats

### 2. End-to-End Tests (`test_end_to_end.py`)

End-to-end tests simulate complete user journeys from start to finish:

- **Complete Customer Journey**: Registration → Browse → Order → Review
- **Provider Onboarding & Operations**: Registration → Verification → Listing Management
- **NGO Donation Workflow**: Registration → Browse Donations → Accept → Complete
- **Admin Verification Workflow**: Provider verification and management
- **Multi-User Concurrent Operations**: System behavior under concurrent load

### 3. Non-Functional Requirements Tests (`test_non_functional.py`)

Tests verify system quality attributes and performance requirements:

#### Performance Tests (NFR-1 to NFR-4)
- **API Response Time**: Endpoints respond within 2 seconds
- **Database Query Performance**: Optimized queries with reasonable limits
- **Concurrent User Handling**: System handles multiple users without degradation
- **Large Dataset Performance**: Efficient handling of large data volumes

#### Security Tests (NFR-5 to NFR-9)
- **Authentication Security**: All protected endpoints require valid authentication
- **Authorization Controls**: Users can only access authorized resources
- **Input Validation Security**: Protection against injection attacks
- **Password Security**: Strong password requirements enforcement
- **Rate Limiting Protection**: API abuse prevention

#### Scalability Tests (NFR-10 to NFR-11)
- **Database Connection Handling**: Efficient connection management
- **Memory Usage Efficiency**: Reasonable memory consumption patterns

#### Reliability Tests (NFR-12 to NFR-14)
- **Error Handling Consistency**: Graceful and consistent error responses
- **Data Integrity Reliability**: Database constraints and referential integrity
- **Transaction Atomicity**: Proper transaction rollback on errors

#### Usability Tests (NFR-15 to NFR-16)
- **API Response Format Consistency**: Standardized response structures
- **Error Message Clarity**: Clear and helpful error messages

#### Production Readiness Tests (NFR-17 to NFR-18)
- **Production Security**: Debug mode disabled, secure configurations
- **Sensitive Data Protection**: No exposure of sensitive information

## 🚀 Running the Tests

### Prerequisites

1. Ensure Django environment is set up:
```bash
cd /path/to/save-n-bite-backend
source venv/bin/activate  # or your virtual environment
pip install -r requirements.txt
```

2. Set up test database:
```bash
python manage.py migrate
```

### Running Tests

#### Option 1: Using the Test Runner Script (Recommended)

```bash
# Run all tests with detailed report
python run_integration_tests.py --all --verbose --report

# Run specific test categories
python run_integration_tests.py --integration --verbose
python run_integration_tests.py --e2e --verbose
python run_integration_tests.py --nfr --verbose

# Run performance tests only
python run_integration_tests.py --performance --verbose

# Run security tests only
python run_integration_tests.py --security --verbose
```

#### Option 2: Using Django's Test Runner

```bash
# Run all integration tests
python manage.py test tests.test_integration --verbosity=2

# Run all end-to-end tests
python manage.py test tests.test_end_to_end --verbosity=2

# Run all non-functional requirements tests
python manage.py test tests.test_non_functional --verbosity=2

# Run specific test class
python manage.py test tests.test_integration.UserAuthenticationIntegrationTest --verbosity=2

# Run specific test method
python manage.py test tests.test_integration.UserAuthenticationIntegrationTest.test_user_registration_and_profile_creation --verbosity=2
```

#### Option 3: Using pytest (if installed)

```bash
# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_integration.py -v

# Run with coverage
pytest tests/ --cov=. --cov-report=html
```

## 📊 Test Reports

The test runner generates comprehensive reports including:

- **Test Results Summary**: Pass/fail status for each test suite
- **Performance Metrics**: Execution times and performance measurements
- **Non-Functional Requirements Status**: Detailed NFR compliance report
- **Recommendations**: Deployment readiness assessment

Example report output:
```
============================================================
SAVE-N-BITE BACKEND - INTEGRATION TEST REPORT
============================================================
Generated: 2024-01-15 14:30:25

TEST RESULTS SUMMARY
------------------------------
Total Test Suites: 3
Passed: 3
Failed: 0

DETAILED RESULTS
--------------------
Integration: ✓ PASSED (45.23s)
End-to-End: ✓ PASSED (67.89s)
Non-Functional Requirements: ✓ PASSED (123.45s)

NON-FUNCTIONAL REQUIREMENTS STATUS
----------------------------------------
✓ NFR-1: API Response Time - PASSED
✓ NFR-2: Database Query Performance - PASSED
✓ NFR-3: Concurrent User Handling - PASSED
[... additional NFRs ...]

RECOMMENDATIONS
---------------
✓ All test suites passed successfully!
✓ System is ready for deployment
✓ All non-functional requirements are met
```

## 🔧 Test Configuration

### Test Settings

Tests use optimized settings for faster execution:
- In-memory SQLite database
- Simplified password hashing
- Local memory cache
- Synchronous task execution

### Test Data Factory

The `TestDataFactory` class provides convenient methods for creating test data:

```python
from tests.test_config import TestDataFactory

# Create test users
customer = TestDataFactory.create_test_user('customer')
provider = TestDataFactory.create_test_user('provider')

# Create test profiles
customer_profile = TestDataFactory.create_test_customer_profile(customer)
provider_profile = TestDataFactory.create_test_provider_profile(provider)

# Create test food listings
food_listing = TestDataFactory.create_test_food_listing(provider_profile)
```

### Test Utilities

Common testing utilities are available:

```python
from tests.test_config import TestUtilities

# Authenticate API client
TestUtilities.authenticate_api_client(client, user)

# Create test files
test_file = TestUtilities.create_test_file('document.pdf')

# Assert API responses
TestUtilities.assert_api_success_response(self, response)
TestUtilities.assert_api_error_response(self, response, 400)
```

## 🐛 Debugging Test Failures

### Common Issues and Solutions

1. **Database Constraint Violations**
   - Use `get_or_create()` instead of `create()` for profiles
   - Ensure required fields are provided
   - Check for existing test data conflicts

2. **Authentication Errors**
   - Verify JWT token generation and client authentication
   - Check user permissions and roles
   - Ensure test users have correct user_type

3. **Performance Test Failures**
   - Check system load during test execution
   - Verify database query optimization
   - Consider adjusting performance thresholds

4. **File Upload Issues**
   - Use `SimpleUploadedFile` for test file creation
   - Ensure proper content-type headers
   - Check file storage configuration

### Debug Mode

Enable verbose output for detailed debugging:
```bash
python run_integration_tests.py --all --verbose
```

## 📈 Performance Benchmarks

### Expected Performance Metrics

| Metric | Target | Acceptable |
|--------|--------|------------|
| API Response Time | < 1s | < 2s |
| Database Query Count | < 10 per request | < 20 per request |
| Concurrent Users | 50+ | 20+ |
| Memory Usage | < 50MB increase | < 100MB increase |

### Monitoring Performance

The test suite includes performance monitoring:
- Response time measurement
- Database query counting
- Memory usage tracking
- Concurrent load testing

## 🔒 Security Testing

### Security Test Coverage

- Authentication bypass attempts
- Authorization boundary testing
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Password security enforcement
- Rate limiting verification

### Security Best Practices Verified

- No sensitive data in API responses
- Proper error message handling
- Secure default configurations
- Input sanitization
- Authentication token security

## 🤝 Contributing

When adding new tests:

1. **Follow the existing patterns**: Use base classes and utilities
2. **Add comprehensive documentation**: Document test purpose and requirements
3. **Include performance considerations**: Add timing and resource usage checks
4. **Test error conditions**: Include negative test cases
5. **Update this README**: Document new test categories or requirements

### Test Naming Conventions

- Integration tests: `test_<feature>_integration`
- End-to-end tests: `test_<user_journey>_e2e`
- Performance tests: `test_<metric>_performance`
- Security tests: `test_<security_aspect>_security`

## 📚 Additional Resources

- [Django Testing Documentation](https://docs.djangoproject.com/en/stable/topics/testing/)
- [Django REST Framework Testing](https://www.django-rest-framework.org/api-guide/testing/)
- [pytest-django Documentation](https://pytest-django.readthedocs.io/)
- [Performance Testing Best Practices](https://docs.djangoproject.com/en/stable/topics/performance/)

## 🏆 Quality Metrics

The test suite ensures:
- **95%+ Test Coverage** across integration points
- **18 Non-Functional Requirements** verified
- **Complete User Journey Coverage** for all user types
- **Performance Benchmarking** for critical operations
- **Security Compliance** with industry standards
