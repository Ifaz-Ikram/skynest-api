import re

# Read the file
with open(r'c:\Users\Ifaz\Desktop\skynest-api\frontend\src\components\dashboard\Dashboard.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remove imports
lines[4] = lines[4].replace(', KPIComparisonCard', '')
lines[7] = ''  # Remove RevenueDeepDive import
lines[8] = ''  # Remove GuestAnalyticsDashboard import  
lines[9] = ''  # Remove AIInsightsPanel import

# Find and remove KPI Comparison section (around line 649-687)
new_lines = []
skip_until = None
i = 0
while i < len(lines):
    line = lines[i]
    
    # Skip KPI Comparison Cards section
    if 'KPI Comparison Cards' in line:
        skip_until = 'PHASE 1: Today'
        i += 1
        continue
    
    # Skip Revenue Deep Dive section
    if 'Revenue Deep Dive' in line:
        skip_until = 'PHASE 3: Occupancy Calendar'
        i += 1
        continue
    
    # Skip Guest Analytics section
    if 'Guest Analytics Dashboard' in line:
        skip_until = 'PHASE 3: Real-Time Activity'
        i += 1
        continue
        
    # Skip AI Insights section
    if 'AI Insights Panel' in line:
        skip_until = 'Primary KPI Cards'
        i += 1
        continue
    
    # Check if we should stop skipping
    if skip_until and skip_until in line:
        skip_until = None
        new_lines.append(line)
        i += 1
        continue
    
    # Skip or keep line
    if skip_until is None:
        new_lines.append(line)
    
    i += 1

# Write back
with open(r'c:\Users\Ifaz\Desktop\skynest-api\frontend\src\components\dashboard\Dashboard.jsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Done! Removed all hardcoded analytics components")
