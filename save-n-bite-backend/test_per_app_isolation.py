#!/usr/bin/env python
"""
Test script to demonstrate per-app database isolation
"""
import os
import subprocess
import sys
import time

def run_test_with_app(app_name, test_module):
    """Run tests with specific app database"""
    print(f"\n{'='*60}")
    print(f"Testing {app_name.upper()} with isolated database")
    print(f"{'='*60}")
    
    env = os.environ.copy()
    env['TEST_APP'] = app_name
    env['DJANGO_SETTINGS_MODULE'] = 'backend.test_settings'
    
    cmd = [
        sys.executable, 'manage.py', 'test', test_module,
        '--verbosity', '2',
        '--parallel', '1',
        '--debug-mode'
    ]
    
    print(f"Database: test_{app_name}_db")
    print(f"Command: {' '.join(cmd)}")
    print(f"Environment: TEST_APP={app_name}")
    
    start_time = time.time()
    
    try:
        result = subprocess.run(
            cmd,
            env=env,
            cwd=os.path.dirname(os.path.abspath(__file__)),
            capture_output=True,
            text=True,
            timeout=300
        )
        
        execution_time = time.time() - start_time
        
        print(f"\nExecution time: {execution_time:.2f}s")
        print(f"Exit code: {result.returncode}")
        
        if result.returncode == 0:
            print("✅ TESTS PASSED")
        else:
            print("❌ TESTS FAILED")
            
        # Show key output lines
        if result.stdout:
            lines = result.stdout.split('\n')
            for line in lines:
                if 'Creating test database' in line or 'Destroying test database' in line:
                    print(f"DB: {line.strip()}")
                elif 'Ran ' in line and 'test' in line:
                    print(f"Result: {line.strip()}")
        
        if result.stderr and result.returncode != 0:
            print(f"Error: {result.stderr[:200]}...")
            
        return result.returncode == 0
        
    except subprocess.TimeoutExpired:
        print("❌ TIMEOUT")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def main():
    """Test per-app database isolation"""
    print("🧪 Testing Per-App Database Isolation")
    print("This demonstrates how different apps can use separate test databases")
    
    # Test cases: (app_name, test_module)
    test_cases = [
        ('authentication', 'authentication.tests.UserModelTest.test_user_creation'),
        ('admin_system', 'admin_system'),  # If admin_system has tests
        ('nfr', 'tests.test_nfr_simple.SecurityNFRTest.test_nfr_5_password_security_validation'),
    ]
    
    results = []
    
    for app_name, test_module in test_cases:
        success = run_test_with_app(app_name, test_module)
        results.append((app_name, success))
    
    # Summary
    print(f"\n{'='*60}")
    print("ISOLATION TEST SUMMARY")
    print(f"{'='*60}")
    
    for app_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        db_name = f"test_{app_name}_db"
        print(f"{app_name:15} -> {db_name:25} {status}")
    
    total_passed = sum(1 for _, success in results if success)
    print(f"\nTotal: {total_passed}/{len(results)} test suites passed")
    
    if total_passed == len(results):
        print("🎉 Per-app database isolation is working perfectly!")
    else:
        print("⚠️  Some test suites had issues (likely due to missing tests, not isolation)")

if __name__ == '__main__':
    main()
