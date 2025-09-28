#!/usr/bin/env python
"""
Quick Test Runner for Save-n-Bite Backend

This is a simplified test runner to help debug integration test issues.
"""

import os
import sys
import subprocess
import time

def run_test_with_timeout(test_module, timeout=300):
    """Run a single test module with timeout"""
    print(f"Running {test_module}...")
    
    cmd = [
        sys.executable, 'manage.py', 'test', test_module,
        '--verbosity=2',
        '--settings=backend.test_settings',
        '--parallel=1',
        '--debug-mode'
    ]
    
    start_time = time.time()
    
    try:
        result = subprocess.run(
            cmd,
            cwd=os.path.dirname(os.path.abspath(__file__)),
            timeout=timeout,
            capture_output=False,  # Show output in real-time
            text=True
        )
        
        end_time = time.time()
        duration = end_time - start_time
        
        if result.returncode == 0:
            print(f"✅ {test_module} PASSED in {duration:.2f}s")
            return True
        else:
            print(f"❌ {test_module} FAILED in {duration:.2f}s")
            return False
            
    except subprocess.TimeoutExpired:
        print(f"⏰ {test_module} TIMED OUT after {timeout}s")
        return False
    except KeyboardInterrupt:
        print(f"🛑 {test_module} INTERRUPTED by user")
        return False
    except Exception as e:
        print(f"💥 {test_module} ERROR: {e}")
        return False

def main():
    """Main function"""
    print("Quick Test Runner for Save-n-Bite Backend")
    print("=" * 50)
    
    # Test modules to run
    test_modules = [
        'tests.test_integration_simple',
        'tests.test_end_to_end',
        'tests.test_nfr_simple',
    ]
    
    results = {}
    
    for module in test_modules:
        print(f"\n{'='*20} {module} {'='*20}")
        success = run_test_with_timeout(module, timeout=300)  # 5 minute timeout
        results[module] = success
        
        if not success:
            print(f"❌ Stopping due to failure in {module}")
            break
    
    # Summary
    print("\n" + "="*50)
    print("SUMMARY:")
    for module, success in results.items():
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"  {module}: {status}")
    
    all_passed = all(results.values())
    if all_passed:
        print("\n🎉 ALL TESTS PASSED!")
        return 0
    else:
        print("\n💥 SOME TESTS FAILED!")
        return 1

if __name__ == '__main__':
    sys.exit(main())
