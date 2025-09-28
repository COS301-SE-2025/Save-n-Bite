#!/usr/bin/env python
"""
App-Specific Test Runner for Save-n-Bite Backend

This script runs tests for individual Django apps to avoid database conflicts.
Each app gets its own isolated test database.
"""

import os
import sys
import subprocess
import time
import argparse

def run_app_tests(app_name, verbose=False, timeout=300):
    """Run tests for a specific Django app"""
    print(f"Running tests for {app_name} app...")
    
    # Create a unique test database name for this app
    test_db_name = f"test_{app_name}_db"
    
    cmd = [
        sys.executable, 'manage.py', 'test', app_name,
        '--verbosity', '2' if verbose else '1',
        '--parallel', '1',  # Single process to avoid conflicts
        '--debug-mode'
    ]
    
    # Set environment variable for unique test database
    env = os.environ.copy()
    env['TEST_DB_NAME'] = test_db_name
    
    start_time = time.time()
    
    try:
        result = subprocess.run(
            cmd,
            cwd=os.path.dirname(os.path.abspath(__file__)),
            timeout=timeout,
            capture_output=not verbose,  # Show output in real-time if verbose
            text=True,
            env=env
        )
        
        end_time = time.time()
        duration = end_time - start_time
        
        if result.returncode == 0:
            print(f"✅ {app_name} tests PASSED in {duration:.2f}s")
            return True, duration
        else:
            print(f"❌ {app_name} tests FAILED in {duration:.2f}s")
            if not verbose and result.stderr:
                print(f"Error: {result.stderr}")
            return False, duration
            
    except subprocess.TimeoutExpired:
        print(f"⏰ {app_name} tests TIMED OUT after {timeout}s")
        return False, timeout
    except KeyboardInterrupt:
        print(f"🛑 {app_name} tests INTERRUPTED by user")
        return False, 0
    except Exception as e:
        print(f"💥 {app_name} tests ERROR: {e}")
        return False, 0

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Run Save-n-Bite App Tests')
    parser.add_argument('--app', help='Run tests for specific app only')
    parser.add_argument('--all', action='store_true', help='Run tests for all apps')
    parser.add_argument('--verbose', action='store_true', help='Verbose output')
    parser.add_argument('--timeout', type=int, default=300, help='Timeout per app in seconds')
    
    args = parser.parse_args()
    
    # Django apps to test
    django_apps = [
        'authentication',
        'interactions', 
        'food_listings',
        'notifications',
        'analytics',
        'scheduling',
        'reviews',
        'admin_system',
        'digital_garden',
        'badges'
    ]
    
    if args.app:
        if args.app not in django_apps:
            print(f"Error: Unknown app '{args.app}'. Available apps: {', '.join(django_apps)}")
            return 1
        apps_to_test = [args.app]
    elif args.all:
        apps_to_test = django_apps
    else:
        print("Please specify --app <app_name> or --all")
        print(f"Available apps: {', '.join(django_apps)}")
        return 1
    
    print("App-Specific Test Runner for Save-n-Bite Backend")
    print("=" * 60)
    
    results = {}
    total_time = 0
    
    for app in apps_to_test:
        print(f"\n{'='*20} {app.upper()} {'='*20}")
        success, duration = run_app_tests(app, verbose=args.verbose, timeout=args.timeout)
        results[app] = success
        total_time += duration
        
        if not success and not args.all:
            print(f"❌ Stopping due to failure in {app}")
            break
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY:")
    passed = 0
    failed = 0
    
    for app, success in results.items():
        if success:
            print(f"  ✅ {app}: PASSED")
            passed += 1
        else:
            print(f"  ❌ {app}: FAILED")
            failed += 1
    
    print(f"\nResults: {passed} passed, {failed} failed")
    print(f"Total time: {total_time:.2f}s")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED!")
        return 0
    else:
        print(f"\n💥 {failed} APP(S) FAILED!")
        return 1

if __name__ == '__main__':
    sys.exit(main())
