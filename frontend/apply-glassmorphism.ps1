# PowerShell Script to Apply Glassmorphism Styling to Modal Components
# This script will help you quickly update the remaining modal files

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Glassmorphism Styling Applicator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Define the glassmorphism class patterns
$patterns = @{
    # Modal overlay
    'bg-black/50 flex' = 'bg-black/50 backdrop-blur-sm flex'

    # Modal containers (multiple variations)
    'bg-surface-secondary rounded' = 'bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl'
    'bg-surface-secondary dark:bg-slate-800 rounded' = 'bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50'
    'bg-white rounded' = 'bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50'

    # Modal headers
    'border-b border-border' = 'border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-lg'
    'p-6 border-b border-border sticky' = 'px-6 py-5 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky'

    # Input fields (old style to new)
    'input-field bg-slate-800/50 border-2 border-slate-600' = 'w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none'

    # Textareas
    'input-field.*rows=' = 'w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none resize-vertical'
}

# List of modal files to update
$modalFiles = @(
    "src\components\bookings\BookingDetailsModal.jsx",
    "src\components\checkin\CheckInModal.jsx",
    "src\components\checkin\RoomAssignmentModal.jsx",
    "src\components\checkout\CheckoutModal.jsx",
    "src\components\payments\CreatePaymentModal.jsx",
    "src\components\payments\PaymentAdjustmentModal.jsx",
    "src\components\rooms\RoomAvailabilityModal.jsx"
)

Write-Host "Files to update:" -ForegroundColor Yellow
foreach ($file in $modalFiles) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        Write-Host "  [✓] $file" -ForegroundColor Green
    } else {
        Write-Host "  [✗] $file (not found)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Quick Reference for Manual Updates" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. MODAL OVERLAY:" -ForegroundColor Yellow
Write-Host "   Old: " -NoNewline -ForegroundColor Gray
Write-Host 'className="fixed inset-0 bg-black/50 flex..."'
Write-Host "   New: " -NoNewline -ForegroundColor Green
Write-Host 'className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"'
Write-Host ""

Write-Host "2. MODAL CONTAINER:" -ForegroundColor Yellow
Write-Host "   Old: " -NoNewline -ForegroundColor Gray
Write-Host 'className="bg-surface-secondary rounded-lg..."'
Write-Host "   New: " -NoNewline -ForegroundColor Green
Write-Host 'className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl ... border border-slate-700/50"'
Write-Host ""

Write-Host "3. MODAL HEADER:" -ForegroundColor Yellow
Write-Host "   Old: " -NoNewline -ForegroundColor Gray
Write-Host 'className="p-6 border-b border-border..."'
Write-Host "   New: " -NoNewline -ForegroundColor Green
Write-Host 'className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky top-0 z-10"'
Write-Host ""

Write-Host "4. INPUT FIELDS:" -ForegroundColor Yellow
Write-Host "   Replace: " -NoNewline -ForegroundColor Gray
Write-Host 'className="input-field bg-slate-800/50..."'
Write-Host "   With:    " -NoNewline -ForegroundColor Green
Write-Host 'className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70'
Write-Host "            rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500"
Write-Host "            focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none"'
Write-Host ""

Write-Host "5. TEXTAREAS:" -ForegroundColor Yellow
Write-Host "   Add: " -NoNewline -ForegroundColor Green
Write-Host 'resize-vertical'
Write-Host "   to the input field classes above"
Write-Host ""

Write-Host "6. SELECT DROPDOWNS:" -ForegroundColor Yellow
Write-Host "   Same as input fields, but add: " -NoNewline -ForegroundColor Green
Write-Host 'appearance-none cursor-pointer'
Write-Host ""

Write-Host "7. CHECKBOXES:" -ForegroundColor Yellow
Write-Host "   Old: " -NoNewline -ForegroundColor Gray
Write-Host 'className="w-4 h-4..."'
Write-Host "   New: " -NoNewline -ForegroundColor Green
Write-Host 'className="w-5 h-5 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded'
Write-Host "            checked:bg-blue-500 checked:border-blue-500 cursor-pointer transition-all"'
Write-Host ""

Write-Host "8. MODAL FOOTER:" -ForegroundColor Yellow
Write-Host "   Wrap buttons in:" -ForegroundColor Green
Write-Host '   <div className="px-6 py-5 border-t border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky bottom-0 z-10">'
Write-Host ""

Write-Host "9. CANCEL BUTTON:" -ForegroundColor Yellow
Write-Host "   " -NoNewline
Write-Host 'className="px-6 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70' -ForegroundColor Green
Write-Host "              text-slate-300 font-semibold rounded-lg hover:bg-slate-700/60 hover:border-slate-500"
Write-Host "              hover:text-white transition-all duration-200 flex-1"'
Write-Host ""

Write-Host "10. SUBMIT BUTTON:" -ForegroundColor Yellow
Write-Host "    " -NoNewline
Write-Host 'className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold' -ForegroundColor Green
Write-Host "               rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
Write-Host "               disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 transition-all duration-200 flex-1"'
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Example Files to Reference:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ CreateBookingModal.jsx (UPDATED)" -ForegroundColor Green
Write-Host "✓ ServicesPage.jsx - ServiceModal (UPDATED)" -ForegroundColor Green
Write-Host "✓ RegistrationModal.jsx (UPDATED)" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Search & Replace Tips (VS Code):" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Use Ctrl+H in VS Code with Regex enabled to do bulk replacements:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Find:    " -NoNewline -ForegroundColor Gray
Write-Host 'className="input-field bg-slate-800/50 border-2 border-slate-600 text-white placeholder-slate-400"'
Write-Host "Replace: " -NoNewline -ForegroundColor Green
Write-Host 'className="w-full px-4 py-3 bg-slate-700/40 backdrop-blur-md border-2 border-slate-600/70 rounded-lg text-white placeholder-slate-400 focus:bg-slate-700/60 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 hover:border-slate-500 transition-all duration-200 outline-none"'
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Documentation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "See GLASSMORPHISM_STYLING_GUIDE.md for complete details" -ForegroundColor Yellow
Write-Host ""

Write-Host "Press any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
