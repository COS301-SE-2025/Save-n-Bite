#!/usr/bin/env python
"""
Simple Integration Test Runner for Save-n-Bite Backend

This is a simplified version that uses Django's built-in test runner
with proper test database configuration.
"""

import os
import sys
import subprocess
import argparse

def run_tests(test_type='all', verbose=False):
    """Run tests using Django's test command with proper settings"""
    
    # Set test-specific environment
    env = os.environ.copy()
    env['DJANGO_SETTINGS_MODULE'] = 'backend.settings'
    
    # Base command
    cmd = [sys.executable, 'manage.py', 'test']
    
    # Add verbosity
    if verbose:
        cmd.extend(['--verbosity', '2'])
    else:
        cmd.extend(['--verbosity', '1'])
    
    # Add specific test modules based on type
    if test_type == 'integration':
        cmd.append('tests.test_integration_simple')
    elif test_type == 'e2e':
        cmd.append('tests.test_end_to_end')
    elif test_type == 'nfr':
        cmd.append('tests.test_non_functional')
    elif test_type == 'performance':
        cmd.append('tests.test_non_functional.PerformanceTest')
    elif test_type == 'security':
        cmd.append('tests.test_non_functional.SecurityTest')
    elif test_type == 'all':
        cmd.extend(['tests.test_integration_simple', 'tests.test_end_to_end', 'tests.test_non_functional'])
    
    # Add additional test options
    cmd.extend(['--noinput', '--parallel=1', '--debug-mode'])  # Removed --keepdb to ensure clean database
    
    print(f"Running {test_type} tests...")
    print(f"Command: {' '.join(cmd)}")
    print("=" * 50)
    
    # Run the tests
    try:
        result = subprocess.run(cmd, env=env, cwd=os.path.dirname(os.path.abspath(__file__)))
        return result.returncode == 0
    except Exception as e:
        print(f"Error running tests: {e}")
        return False

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Run Save-n-Bite Integration Tests (Simple)')
    parser.add_argument('--integration', action='store_true', help='Run integration tests only')
    parser.add_argument('--e2e', action='store_true', help='Run end-to-end tests only')
    parser.add_argument('--nfr', action='store_true', help='Run non-functional requirements tests only')
    parser.add_argument('--performance', action='store_true', help='Run performance tests only')
    parser.add_argument('--security', action='store_true', help='Run security tests only')
    parser.add_argument('--all', action='store_true', help='Run all tests (default)')
    parser.add_argument('--verbose', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    # Determine test type
    if args.integration:
        test_type = 'integration'
    elif args.e2e:
        test_type = 'e2e'
    elif args.nfr:
        test_type = 'nfr'
    elif args.performance:
        test_type = 'performance'
    elif args.security:
        test_type = 'security'
    else:
        test_type = 'all'
    
    # Run tests
    success = run_tests(test_type, args.verbose)
    
    # Print result
    print("\n" + "=" * 50)
    if success:
        print("🎉 TESTS PASSED!")
    else:
        print("❌ TESTS FAILED!")
    print("=" * 50)
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
