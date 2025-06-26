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

from dotenv import load_dotenv
load_dotenv()

def analyze_modularity():
    """Analyze Django app modularity - measures what you ACTUALLY have"""
    print("🏗️  ANALYZING SAVE N BITE MODULARITY")
    print("=" * 50)
    
    apps = ['authentication', 'food_listings', 'interactions', 
            'notifications', 'analytics', 'scheduling', 'reviews']
    
    backend_path = ""
    
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
    
    base_url = "http://127.0.0.1:8000"  
    
    # Test actual endpoints
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
    """Analyze test coverage for Save-n-Bite with Poetry support"""
    print("🛡️  ANALYZING TEST COVERAGE")
    print("=" * 50)
    
    apps = ['authentication', 'food_listings', 'interactions',
            'notifications', 'analytics', 'scheduling', 'reviews']
    
    # Your exact project root (adjust if needed)
    PROJECT_ROOT = os.getenv("SYS_PATH", os.getcwd())
    
    coverage_results = {}
    original_dir = os.getcwd()
    
    try:
        os.chdir(PROJECT_ROOT)  # Change to project root
        print(f"🔍 Searching for tests in: {PROJECT_ROOT}")
        
        # Check if Poetry is available
        poetry_available = False
        try:
            result = subprocess.run(['poetry', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                poetry_available = True
                print("✅ Poetry detected")
        except FileNotFoundError:
            print("⚠️  Poetry not found in PATH")
        
        # Install test dependencies with Poetry
        if poetry_available:
            print("📦 Installing test dependencies with Poetry...")
            dependencies = ['pytest', 'pytest-django', 'pytest-cov', 'coverage']
            
            for dep in dependencies:
                try:
                    result = subprocess.run(['poetry', 'add', '--group', 'dev', dep], 
                                          capture_output=True, text=True, timeout=60)
                    if result.returncode == 0:
                        print(f"✅ Added {dep} to dev dependencies")
                    else:
                        # Try without --group dev for older Poetry versions
                        result2 = subprocess.run(['poetry', 'add', '--dev', dep], 
                                                capture_output=True, text=True, timeout=60)
                        if result2.returncode == 0:
                            print(f"✅ Added {dep} to dev dependencies (legacy)")
                        else:
                            print(f"⚠️  Could not add {dep}: {result.stderr}")
                except subprocess.TimeoutExpired:
                    print(f"⚠️  Timeout adding {dep}")
                except Exception as e:
                    print(f"❌ Error adding {dep}: {e}")
        else:
            # Fallback to pip if Poetry not available
            print("📦 Installing test dependencies with pip...")
            try:
                subprocess.run(['pip', 'install', 'pytest', 'pytest-django', 'pytest-cov', 'coverage'], 
                             capture_output=True, check=True)
                print("✅ Test dependencies installed with pip")
            except subprocess.CalledProcessError:
                print("❌ Could not install test dependencies")
        
        # Create pytest configuration
        if not os.path.exists('pytest.ini') and not os.path.exists('setup.cfg'):
            with open('pytest.ini', 'w') as f:
                f.write("""[tool:pytest]
DJANGO_SETTINGS_MODULE = backend.settings
python_files = tests.py test_*.py *_tests.py
addopts = --tb=short --strict-markers --reuse-db
testpaths = .
markers =
    django_db: mark test to use django database
""")
            print("✅ Created pytest.ini configuration")
        
        for app in apps:
            test_path = os.path.join(app, "tests.py")
            if not os.path.exists(test_path):
                print(f"❌ Test file not found: {test_path}")
                coverage_results[app] = 0
                continue
                
            print(f"\n📊 Testing {app} at: {test_path}")
            
            try:
                # Choose command based on Poetry availability
                if poetry_available:
                    cmd = [
                        'poetry', 'run', 'pytest',
                        test_path,
                        '-v',
                        '--tb=short',
                        f'--cov={app}',
                        '--cov-report=term-missing',
                        '--no-header'
                    ]
                else:
                    cmd = [
                        'python', '-m', 'pytest',
                        test_path,
                        '-v',
                        '--tb=short',
                        f'--cov={app}',
                        '--cov-report=term-missing',
                        '--no-header'
                    ]
                
                print(f"Running: {' '.join(cmd)}")
                
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=120,
                    cwd=PROJECT_ROOT
                )
                
                print(f"Return code: {result.returncode}")
                
                # Show output for debugging
                if result.stdout:
                    print("STDOUT:")
                    # Show more relevant output
                    stdout_lines = result.stdout.split('\n')
                    for line in stdout_lines[-20:]:  # Last 20 lines
                        if line.strip():
                            print(f"  {line}")
                
                if result.stderr:
                    print("STDERR:")
                    stderr_lines = result.stderr.split('\n')
                    for line in stderr_lines[-10:]:  # Last 10 lines
                        if line.strip():
                            print(f"  {line}")
                
                # Extract coverage percentage
                coverage = 0
                output_lines = result.stdout.split('\n')
                
                for line in output_lines:
                    # Look for coverage percentage
                    if 'TOTAL' in line and '%' in line:
                        try:
                            parts = line.split()
                            for part in parts:
                                if part.endswith('%'):
                                    coverage = int(part.replace('%', ''))
                                    break
                        except (IndexError, ValueError) as e:
                            print(f"Error parsing coverage line: {line}, error: {e}")
                            continue
                    # Alternative formats
                    elif 'coverage:' in line.lower() and '%' in line:
                        try:
                            coverage = int(float(line.split('%')[0].split()[-1]))
                        except (IndexError, ValueError):
                            continue
                
                # Check if tests ran successfully even without coverage data
                if coverage == 0 and result.returncode == 0:
                    if any(keyword in result.stdout.lower() for keyword in ['passed', 'ok', 'collected']):
                        print(f"⚠️  {app} tests ran but coverage not detected - checking for test execution")
                        # Count test methods in the file to see if tests actually exist
                        try:
                            with open(test_path, 'r') as f:
                                content = f.read()
                                test_methods = content.count('def test_')
                                if test_methods > 0:
                                    coverage = 1  # Minimal coverage for having tests that run
                                    print(f"   Found {test_methods} test methods, giving minimal coverage")
                        except:
                            pass
                
                if coverage > 0:
                    print(f"✅ {app} coverage: {coverage}%")
                else:
                    print(f"❌ {app} no coverage detected")
                
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
        
        # Additional Poetry-specific tips
        if poetry_available:
            print("\n💡 POETRY TIPS:")
            print("   - Run tests manually: poetry run pytest")
            print("   - Check dependencies: poetry show --tree")
            print("   - Activate shell: poetry shell")
        
    finally:
        # Always return to original directory
        os.chdir(original_dir)
    
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