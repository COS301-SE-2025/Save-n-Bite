import os

def analyze_modularity():
    """Analyze Django app modularity - measures what you ACTUALLY have"""
    print("🏗️  ANALYZING SAVE N BITE MODULARITY")
    print("=" * 50)
    
    # These are YOUR actual Django apps (from your grep output)
    apps = ['authentication', 'food_listings', 'interactions', 
            'notifications', 'analytics', 'scheduling', 'reviews']
    
    backend_path = "../backend"  # Adjust if needed
    
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
            py_files = [f for f in os.listdir(app_path) 
                       if f.endswith('.py') and f != '__init__.py']
            
            completeness = sum([has_models, has_views, has_urls])
            print(f"✅ {app:15} | Files: {len(py_files):2} | Components: {completeness}/3")
            print(f"   └─ Models: {'✓' if has_models else '✗'} | "
                  f"Views: {'✓' if has_views else '✗'} | "
                  f"URLs: {'✓' if has_urls else '✗'}")
        else:
            print(f"❌ {app:15} | NOT FOUND")
    
    # Calculate modularity score
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