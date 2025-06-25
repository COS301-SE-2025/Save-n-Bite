# test_error_handling.py
import requests

def test_error_handling():
    """Test how the system handles various error scenarios"""
    base_url = "http://127.0.0.1:8000"
    
    print("=== Error Handling Demo ===")
    
    # Test 1: Invalid endpoint
    response = requests.get(f"{base_url}/api/nonexistent/")
    print(f"Invalid endpoint: {response.status_code} (should be 404)")
    
    # Test 2: Invalid data
    response = requests.post(f"{base_url}/auth/register/", json={"invalid": "data"})
    print(f"Invalid registration data: {response.status_code} (should be 400)")
    
    # Test 3: Invalid authentication
    headers = {"Authorization": "Bearer invalid_token"}
    response = requests.get(f"{base_url}/api/listings/", headers=headers)
    print(f"Invalid token: {response.status_code} (should be 401)")

if __name__ == "__main__":
    test_error_handling()