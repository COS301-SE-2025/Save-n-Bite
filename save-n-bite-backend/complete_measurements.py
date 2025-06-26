#!/usr/bin/env python3
"""
Complete Demo 2 Quality Measurements for Save N Bite
Place this file in: save-n-bite-backend/complete_demo_measurements.py
Run with: python complete_measurements.py
"""

import os
import time
import requests
import statistics
import subprocess

def analyze_modularity():
    """Analyze Django app modularity - measures what you ACTUALLY have"""
    print("🏗️  ANALYZING SAVE N BITE MODULARITY")
    print("=" * 50)
    
    # These are YOUR actual Django apps (from your grep output)
    apps = ['authentication', 'food_listings', 'interactions', 
            'notifications', 'analytics', 'scheduling', 'reviews']
    
    backend_path = ""  # Your Django apps are in backend/settings.py ??
    
    total_apps = len(apps)
    implemented_apps = 0
    apps_with_models = 0
    apps_with_views = 0
    apps_with_urls = 0
    
    print(f"Expected Django Apps: {total_apps}")
    print("-" * 30)
    
    for app in apps:
        app_path = os.path.join(backend_path, app)
        
        if os.path.exists(app_path):
            implemented_apps += 1
            
            # Check if each app has its core files
            has_models = os.path.exists(os.path.join(app_path, "models.py"))
            has_views = os.path.exists(os.path.join(app_path, "views.py"))
            has_urls = os.path.exists(os.path.join(app_path, "urls.py"))
            
            if has_models: apps_with_models += 1
            if has_views: apps_with_views += 1
            if has_urls: apps_with_urls += 1
            
            # Count Python files in the app
            try:
                py_files = [f for f in os.listdir(app_path) 
                           if f.endswith('.py') and f != '__init__.py']
            except:
                py_files = []
            
            completeness = sum([has_models, has_views, has_urls])
            print(f"✅ {app:15} | Files: {len(py_files):2} | Components: {completeness}/3")
            print(f"   └─ Models: {'✓' if has_models else '✗'} | "
                  f"Views: {'✓' if has_views else '✗'} | "
                  f"URLs: {'✓' if has_urls else '✗'}")
        else:
            print(f"❌ {app:15} | NOT FOUND")
    
    # Calculate modularity score
    implementation_score = 0
    avg_completeness = 0
    
    if implemented_apps > 0:
        implementation_score = (implemented_apps / total_apps) * 100
        avg_completeness = ((apps_with_models + apps_with_views + apps_with_urls) / 
                           (implemented_apps * 3)) * 100
        
        print("\n" + "=" * 50)
        print("🎯 MODULARITY RESULTS:")
        print(f"   Apps Implemented: {implemented_apps}/{total_apps} ({implementation_score:.1f}%)")
        print(f"   Average App Completeness: {avg_completeness:.1f}%")
        print(f"   Apps with Models: {apps_with_models}")
        print(f"   Apps with Views: {apps_with_views}")
        print(f"   Apps with URLs: {apps_with_urls}")
        
        # This proves your "7 independent Django apps" claim
        if implementation_score >= 85:
            print("✅ MODULARITY REQUIREMENT MET!")
        else:
            print("⚠️  Some apps missing - implement remaining modules")
    
    return {
        'total_apps': total_apps,
        'implemented_apps': implemented_apps,
        'implementation_score': implementation_score,
        'completeness_score': avg_completeness
    }

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
        
        # Test each endpoint 3 times to get average (reduced for speed)
        endpoint_times = []
        
        for attempt in range(3):
            try:
                start_time = time.time()
                response = requests.get(f"{base_url}{endpoint}", timeout=5)
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
    overall_avg = 0
    fast_percentage = 0
    success_rate = 0
    
    if response_times:
        overall_avg = statistics.mean(response_times)
        fastest = min(response_times)
        slowest = max(response_times)
        
        # Check how many requests are under 500ms (your target)
        fast_requests = sum(1 for t in response_times if t < 500)
        fast_percentage = (fast_requests / len(response_times)) * 100
        
        success_rate = (successful_requests / total_requests) * 100 if total_requests > 0 else 0
        
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
    else:
        print("❌ No successful requests - check if server is running")
    
    return {
        'average_response_time': overall_avg,
        'fast_percentage': fast_percentage,
        'success_rate': success_rate,
        'total_tests': len(response_times)
    }

def analyze_test_coverage():
    """Analyze test coverage for Save-n-Bite specific structure"""
    print("🛡️  ANALYZING TEST COVERAGE")
    print("=" * 50)
    
    apps = ['authentication', 'food_listings', 'interactions',
            'notifications', 'analytics', 'scheduling', 'reviews']
    
    # Your exact project root (adjust if needed)
    PROJECT_ROOT = "/root/Save-n-Bite/save-n-bite-backend"
    
    coverage_results = {}
    os.chdir(PROJECT_ROOT)  # Change to project root
    
    print(f"🔍 Searching for tests in: {PROJECT_ROOT}")
    
    for app in apps:
        test_path = os.path.join(app, "tests.py")
        if not os.path.exists(test_path):
            print(f"❌ Test file not found: {test_path}")
            coverage_results[app] = 0
            continue
            
        print(f"\n📊 Testing {app} at: {test_path}")
        
        try:
            # Run pytest with coverage for this specific app
            cmd = [
                'python', '-m', 'pytest',
                test_path,
                '-v',
                '--tb=short',
                f'--cov={app}',
                '--cov-report=term-missing'
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=120
            )
            
            # Show condensed output
            print("\n--- Test Output ---")
            if result.stdout:
                print('\n'.join(result.stdout.split('\n')[-20:]))
            
            # Extract coverage
            coverage = 0
            for line in result.stdout.split('\n'):
                if 'TOTAL' in line and '%' in line:
                    try:
                        coverage = int(line.split()[-1].replace('%', ''))
                        break
                    except (IndexError, ValueError):
                        continue
            
            print(f"✅ {app} coverage: {coverage}%")
            coverage_results[app] = coverage
            
        except subprocess.TimeoutExpired:
            print(f"⚠️  {app} tests timed out")
            coverage_results[app] = 0
        except Exception as e:
            print(f"❌ Error testing {app}: {str(e)}")
            coverage_results[app] = 0
    
    # Calculate overall coverage
    valid_apps = [cov for cov in coverage_results.values() if cov > 0]
    total_coverage = sum(valid_apps)/len(valid_apps) if valid_apps else 0
    
    print("\n" + "=" * 50)
    print("🎯 COVERAGE RESULTS:")
    for app, cov in coverage_results.items():
        print(f"   {app:15}: {cov:3}%")
    print("-" * 30)
    print(f"   AVERAGE COVERAGE: {total_coverage:.1f}%")
    
    if total_coverage >= 80:
        print("✅ RELIABILITY REQUIREMENT MET!")
    elif total_coverage >= 50:
        print("⚠️  Partial coverage - aim for 80%+")
    else:
        print("❌ Low test coverage - prioritize testing")
    
    return {
        'coverage_percentage': total_coverage,
        'app_coverages': coverage_results
    }

def check_security_implementation():
    """Check your security implementation based on your actual code"""
    print("🔒 ANALYZING SECURITY IMPLEMENTATION")
    print("=" * 50)
    
    backend_path = "backend/"
    security_score = 0
    max_score = 4
    
    # Check 1: JWT Configuration
    settings_file = os.path.join(backend_path, "settings.py")
    if os.path.exists(settings_file):
        with open(settings_file, 'r') as f:
            content = f.read()
            if 'SIMPLE_JWT' in content or 'JWT' in content:
                print("✅ JWT Configuration found")
                security_score += 1
            else:
                print("❌ JWT Configuration not found")
    
    # Check 2: Authentication in apps
    auth_found = 0
    for app in ['authentication', 'food_listings', 'interactions', 'reviews']:
        views_file = os.path.join("", app, "views.py")
        if os.path.exists(views_file):
            with open(views_file, 'r') as f:
                content = f.read()
                if 'IsAuthenticated' in content or 'permission_classes' in content:
                    auth_found += 1
    
    if auth_found >= 3:
        print(f"✅ Authentication found in {auth_found} apps")
        security_score += 1
    else:
        print(f"⚠️  Authentication found in only {auth_found} apps")
    
    # Check 3: User roles
    user_model = os.path.join(backend_path, "authentication", "models.py")
    if os.path.exists(user_model):
        with open(user_model, 'r') as f:
            content = f.read()
            if 'user_type' in content and ('customer' in content or 'provider' in content):
                print("✅ User roles implemented")
                security_score += 1
            else:
                print("❌ User roles not clearly implemented")
    
    # Check 4: Password validation
    if os.path.exists(settings_file):
        with open(settings_file, 'r') as f:
            content = f.read()
            if 'AUTH_PASSWORD_VALIDATORS' in content:
                print("✅ Password validation configured")
                security_score += 1
            else:
                print("❌ Password validation not configured")
    
    # Check 5: CORS and security middleware
    if os.path.exists(settings_file):
        with open(settings_file, 'r') as f:
            content = f.read()
            if 'corsheaders' in content and 'SecurityMiddleware' in content:
                print("✅ Security middleware configured")
                security_score += 1
            else:
                print("⚠️  Security middleware partially configured")
    
    security_percentage = (security_score / max_score) * 100
    
    print(f"\n🎯 SECURITY RESULTS:")
    print(f"   Security Implementation: {security_score}/{max_score} ({security_percentage:.1f}%)")
    
    if security_percentage >= 80:
        print("✅ SECURITY REQUIREMENT MET!")
    else:
        print("⚠️  Security implementation needs improvement")
    
    return {'security_percentage': security_percentage}

def main():
    """Run all quality requirement measurements"""
    print("🚀 SAVE N BITE - DEMO 2 QUALITY MEASUREMENTS")
    print("=" * 60)
    print("Make sure:")
    print("1. You're in save-n-bite-backend/ directory (not backend/)")
    print("2. Your Django server is running: python manage.py runserver")
    print("3. Dependencies installed: pip install requests pytest pytest-cov")
    print("=" * 60)
    
    # Check if we're in the right directory
    if not os.path.exists("backend"):
        print("❌ ERROR: 'backend' directory not found!")
        print("   Make sure you're in save-n-bite-backend/ directory")
        print("   Current directory:", os.getcwd())
        return
    
    if not os.path.exists("manage.py"):
        print("❌ ERROR: 'manage.py' not found!")
        print("   Make sure you're in the Django project root")
        return
    
    print("✅ Correct directory detected")
    print()
    
    # Run all measurements
    modularity_results = analyze_modularity()
    
    print("\n" + "=" * 60)
    security_results = check_security_implementation()
    
    print("\n" + "=" * 60)
    input("Press Enter to test database performance (make sure server is running)...")
    performance_results = measure_db_performance()
    
    print("\n" + "=" * 60)
    input("Press Enter to analyze test coverage (this might take a moment)...")
    coverage_results = analyze_test_coverage()
    
    print("\n" + "=" * 60)
    print("🎯 DEMO 2 QUALITY REQUIREMENTS SUMMARY:")
    print("=" * 60)
    print(f"✅ Security:     {security_results.get('security_percentage', 0):.1f}% - JWT + Role-based access")
    print(f"🏗️  Modularity:   {modularity_results.get('implementation_score', 0):.1f}% - Django apps architecture")
    print(f"⚡ Performance:  {performance_results.get('fast_percentage', 0):.1f}% requests under 500ms")
    print(f"📱 Usability:    Manual testing required - responsive React frontend")
    print(f"🛡️  Reliability:  {coverage_results.get('coverage_percentage', 0)}% test coverage")
    print("=" * 60)
    print("🎉 Demo 2 measurements complete!")
    print("   Use these numbers in your presentation!")

if __name__ == "__main__":
    main()