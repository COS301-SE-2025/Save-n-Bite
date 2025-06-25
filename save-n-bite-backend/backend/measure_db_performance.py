import time
import requests
import statistics

def measure_db_performance():
    """Measure database performance - tests your ACTUAL API endpoints"""
    print("⚡ MEASURING DATABASE PERFORMANCE")
    print("=" * 50)
    
    base_url = "http://127.0.0.1:8000"  # Your Django server
    
    # Test YOUR actual endpoints (from your urls.py files)
    test_endpoints = [
        "/api/listings/",           # food_listings app
        "/cart/",                   # interactions app  
        "/api/notifications/",      # notifications app
        "/api/analytics/",          # analytics app
        "/admin/",                  # Django admin
    ]
    
    response_times = []
    successful_requests = 0
    total_requests = 0
    
    print("Testing API Response Times...")
    print("-" * 30)
    
    for endpoint in test_endpoints:
        print(f"\n📊 Testing: {endpoint}")
        
        # Test each endpoint 5 times to get average
        endpoint_times = []
        
        for attempt in range(5):
            try:
                start_time = time.time()
                response = requests.get(f"{base_url}{endpoint}", timeout=10)
                end_time = time.time()
                
                response_time_ms = (end_time - start_time) * 1000
                endpoint_times.append(response_time_ms)
                total_requests += 1
                
                if response.status_code < 500:  # Not a server error
                    successful_requests += 1
                
                print(f"   Attempt {attempt + 1}: {response_time_ms:.2f}ms (Status: {response.status_code})")
                
            except requests.exceptions.RequestException as e:
                print(f"   Attempt {attempt + 1}: FAILED - {e}")
                total_requests += 1
        
        if endpoint_times:
            avg_time = statistics.mean(endpoint_times)
            response_times.extend(endpoint_times)
            print(f"   Average: {avg_time:.2f}ms")
    
    # Calculate overall performance metrics
    if response_times:
        overall_avg = statistics.mean(response_times)
        fastest = min(response_times)
        slowest = max(response_times)
        
        # Check how many requests are under 500ms (your target)
        fast_requests = sum(1 for t in response_times if t < 500)
        fast_percentage = (fast_requests / len(response_times)) * 100
        
        success_rate = (successful_requests / total_requests) * 100
        
        print("\n" + "=" * 50)
        print("🎯 PERFORMANCE RESULTS:")
        print(f"   Average Response Time: {overall_avg:.2f}ms")
        print(f"   Fastest Response: {fastest:.2f}ms")
        print(f"   Slowest Response: {slowest:.2f}ms")
        print(f"   Requests Under 500ms: {fast_requests}/{len(response_times)} ({fast_percentage:.1f}%)")
        print(f"   Success Rate: {success_rate:.1f}%")
        
        # This validates your "response times under 500ms for 95% of requests" claim
        if fast_percentage >= 95:
            print("✅ PERFORMANCE REQUIREMENT MET!")
        elif fast_percentage >= 80:
            print("⚠️  Good performance, but optimize for 95% target")
        else:
            print("❌ Performance needs improvement")
    
    return {
        'average_response_time': overall_avg,
        'fast_percentage': fast_percentage,
        'success_rate': success_rate,
        'total_tests': len(response_times)
    }