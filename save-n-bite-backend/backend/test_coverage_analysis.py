import subprocess
import os

def analyze_test_coverage():
    """Analyze your test coverage - measures your ACTUAL tests"""
    print("🛡️  ANALYZING TEST COVERAGE")
    print("=" * 50)
    
    try:
        # Run pytest with coverage (you need to install: pip install pytest pytest-cov)
        print("Running test coverage analysis...")
        
        # This runs YOUR existing tests
        result = subprocess.run([
            'pytest', 
            '--cov=authentication',
            '--cov=food_listings', 
            '--cov=interactions',
            '--cov=notifications',
            '--cov=analytics', 
            '--cov=scheduling',
            '--cov=reviews',
            '--cov-report=term',
            '--cov-report=html'
        ], capture_output=True, text=True, timeout=60)
        
        print("Coverage Report:")
        print(result.stdout)
        
        if result.stderr:
            print("Errors:", result.stderr)
        
        # Extract coverage percentage (basic parsing)
        lines = result.stdout.split('\n')
        total_coverage = 0
        
        for line in lines:
            if 'TOTAL' in line and '%' in line:
                # Parse total coverage percentage
                parts = line.split()
                for part in parts:
                    if '%' in part:
                        total_coverage = int(part.replace('%', ''))
                        break
        
        print(f"\n🎯 COVERAGE RESULTS:")
        print(f"   Total Test Coverage: {total_coverage}%")
        
        # This validates your ">80% test coverage" claim
        if total_coverage >= 80:
            print("✅ RELIABILITY REQUIREMENT MET!")
        elif total_coverage >= 70:
            print("⚠️  Good coverage, aim for 80%+")
        else:
            print("❌ Need more tests for reliability")
        
        print(f"   HTML Report: Open htmlcov/index.html in browser")
        
        return {'coverage_percentage': total_coverage}
        
    except subprocess.TimeoutExpired:
        print("❌ Tests took too long - check for infinite loops")
        return {'coverage_percentage': 0}
    except FileNotFoundError:
        print("❌ pytest not installed. Run: pip install pytest pytest-cov")
        return {'coverage_percentage': 0}