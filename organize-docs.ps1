# Organize Documentation Script

Write-Host "Organizing documentation..." -ForegroundColor Cyan

# Move setup docs
Move-Item -Path "SETUP_README.md" -Destination "docs\setup\" -Force
Move-Item -Path "READY_TO_RUN.md" -Destination "docs\setup\" -Force
Move-Item -Path "QUICK_START.md" -Destination "docs\setup\" -Force
Move-Item -Path "DATABASE_READY.md" -Destination "docs\setup\" -Force

# Move feature docs
Move-Item -Path "ROLE_BASED_USER_CREATION.md" -Destination "docs\features\" -Force
Move-Item -Path "CUSTOMER_REGISTRATION.md" -Destination "docs\features\" -Force
Move-Item -Path "PREBOOKING_CODE_IMPLEMENTATION.md" -Destination "docs\features\" -Force
Move-Item -Path "ADVANCED_FEATURES.md" -Destination "docs\features\" -Force
Move-Item -Path "FEATURE_STATUS.md" -Destination "docs\features\" -Force

# Move fix docs
Move-Item -Path "WHITE_SCREEN_FIX.md" -Destination "docs\fixes\" -Force
Move-Item -Path "AUDIT_LOG_FIX.md" -Destination "docs\fixes\" -Force
Move-Item -Path "DATE_FORMAT_STANDARDIZATION.md" -Destination "docs\fixes\" -Force
Move-Item -Path "SCHEMA_FIXES.md" -Destination "docs\fixes\" -Force
Move-Item -Path "COLUMN_FIXES.md" -Destination "docs\fixes\" -Force
Move-Item -Path "COMPREHENSIVE_FIXES.md" -Destination "docs\fixes\" -Force
Move-Item -Path "FINAL_FIXES.md" -Destination "docs\fixes\" -Force
Move-Item -Path "PERMANENT_FIX.md" -Destination "docs\fixes\" -Force
Move-Item -Path "PERMISSION_UPDATE.md" -Destination "docs\fixes\" -Force

# Move completion docs
Move-Item -Path "PROJECT_COMPLETE.md" -Destination "docs\" -Force
Move-Item -Path "PROJECT_100_COMPLETE.md" -Destination "docs\" -Force
Move-Item -Path "IMPLEMENTATION_COMPLETE.md" -Destination "docs\" -Force
Move-Item -Path "SOLUTION_COMPLETE.md" -Destination "docs\" -Force
Move-Item -Path "VERIFICATION_COMPLETE.md" -Destination "docs\" -Force
Move-Item -Path "COMPLETION_SUMMARY.md" -Destination "docs\" -Force
Move-Item -Path "IMPLEMENTATION_SUMMARY.md" -Destination "docs\" -Force
Move-Item -Path "SUCCESS.md" -Destination "docs\" -Force
Move-Item -Path "ALL_DONE.md" -Destination "docs\" -Force
Move-Item -Path "SYSTEM_READY.md" -Destination "docs\" -Force

# Move frontend docs
Move-Item -Path "FRONTEND_FIXED.md" -Destination "docs\" -Force
Move-Item -Path "FRONTEND_COMPLETE.md" -Destination "docs\" -Force
Move-Item -Path "FRONTEND_BEAUTIFUL.md" -Destination "docs\" -Force
Move-Item -Path "FINAL_IMPLEMENTATION.md" -Destination "docs\" -Force

# Move testing docs
Move-Item -Path "API_TESTS.md" -Destination "docs\" -Force
Move-Item -Path "TESTING_GUIDE.md" -Destination "docs\" -Force
Move-Item -Path "TESTING_ALL_FEATURES.md" -Destination "docs\" -Force
Move-Item -Path "TEST_ENDPOINTS.md" -Destination "docs\" -Force
Move-Item -Path "TEST_ROLE_BASED_CREATION.md" -Destination "docs\" -Force

# Move planning docs
Move-Item -Path "PROJECT_REQUIREMENTS_COMPARISON.md" -Destination "docs\" -Force
Move-Item -Path "REORGANIZATION_PLAN.md" -Destination "docs\" -Force
Move-Item -Path "BEFORE_AFTER_COMPARISON.md" -Destination "docs\" -Force

Write-Host "Documentation organized!" -ForegroundColor Green
