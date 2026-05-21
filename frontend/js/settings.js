// Settings Page JavaScript
console.log('[Settings] Script loaded');

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Settings] Initializing page...');
    
    // Wait for Supabase to initialize
    if (!window.supabaseClient) {
        window.supabaseClient = initSupabase();
    }
    
    // Wait a bit for Supabase to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await loadSettings();
    await loadPricingPlans();
});

// Switch between tabs
window.switchTab = function(tabName, clickedElement) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    if (clickedElement) {
        clickedElement.classList.add('active');
    }
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    
    // Load country pricing when tab is opened
    if (tabName === 'country-pricing') {
        loadCountryPricing();
    }
}

// Load Settings from localStorage or defaults
async function loadSettings() {
    try {
        console.log('[Settings] Loading settings...');
        
        // Load from localStorage or use defaults
        const settings = {
            institutionName: localStorage.getItem('institutionName') || 'دار القرآن',
            institutionEmail: localStorage.getItem('institutionEmail') || 'info@darquran.com',
            institutionPhone: localStorage.getItem('institutionPhone') || '+966123456789',
            defaultSessionDuration: localStorage.getItem('defaultSessionDuration') || '60',
            monthlyExcusesLimit: localStorage.getItem('monthlyExcusesLimit') || '4',
            invoiceDueDays: localStorage.getItem('invoiceDueDays') || '7',
            defaultCurrency: localStorage.getItem('defaultCurrency') || 'SAR'
        };
        
        // Set values
        document.getElementById('institutionName').value = settings.institutionName;
        document.getElementById('institutionEmail').value = settings.institutionEmail;
        document.getElementById('institutionPhone').value = settings.institutionPhone;
        document.getElementById('defaultSessionDuration').value = settings.defaultSessionDuration;
        document.getElementById('monthlyExcusesLimit').value = settings.monthlyExcusesLimit;
        document.getElementById('invoiceDueDays').value = settings.invoiceDueDays;
        document.getElementById('defaultCurrency').value = settings.defaultCurrency;
        
        console.log('[Settings] ✅ Settings loaded');
    } catch (error) {
        console.error('[Settings] Error loading settings:', error);
    }
}

// Save all settings
window.saveAllSettings = async function() {
    try {
        console.log('[Settings] Saving settings...');
        
        // Get old value before saving
        const oldExcusesLimit = localStorage.getItem('monthlyExcusesLimit') || '4';
        
        // Get values
        const settings = {
            institutionName: document.getElementById('institutionName').value,
            institutionEmail: document.getElementById('institutionEmail').value,
            institutionPhone: document.getElementById('institutionPhone').value,
            defaultSessionDuration: document.getElementById('defaultSessionDuration').value,
            monthlyExcusesLimit: document.getElementById('monthlyExcusesLimit').value,
            invoiceDueDays: document.getElementById('invoiceDueDays').value,
            defaultCurrency: document.getElementById('defaultCurrency').value
        };
        
        // Check if excuse limit changed
        const excuseLimitChanged = oldExcusesLimit !== settings.monthlyExcusesLimit;
        
        // Save to localStorage
        Object.keys(settings).forEach(key => {
            localStorage.setItem(key, settings[key]);
        });
        
        // If excuse limit changed, update all students
        if (excuseLimitChanged) {
            console.log('[Settings] Excuse limit changed from', oldExcusesLimit, 'to', settings.monthlyExcusesLimit);
            await updateAllStudentsExcuseLimit(parseInt(settings.monthlyExcusesLimit));
        }
        
        // Optionally save to database (system_settings table)
        // You can implement this later if needed
        
        Swal.fire({
            icon: 'success',
            title: 'تم الحفظ',
            text: excuseLimitChanged ? 
                `تم حفظ الإعدادات وتحديث حد الاعتذارات لجميع الطلاب إلى ${settings.monthlyExcusesLimit}` :
                'تم حفظ الإعدادات بنجاح',
            timer: 3000,
            showConfirmButton: false
        });
        
        console.log('[Settings] ✅ Settings saved');
    } catch (error) {
        console.error('[Settings] Error saving settings:', error);
        Swal.fire('خطأ', 'حدث خطأ أثناء حفظ الإعدادات', 'error');
    }
}

// Update all students excuse limit
async function updateAllStudentsExcuseLimit(newLimit) {
    try {
        console.log('[Settings] Updating all students excuse limit to:', newLimit);
        
        const client = window.supabaseClient;
        if (!client) {
            throw new Error('Supabase client not initialized');
        }
        
        // Update all active students
        const { data, error } = await client
            .from('students')
            .update({ 
                max_excuses_per_month: newLimit,
                updated_at: new Date().toISOString()
            })
            .eq('status', 'active')
            .select();
        
        if (error) {
            throw error;
        }
        
        console.log('[Settings] ✅ Updated', data?.length || 0, 'students');
        
        // Also update the default value in the database schema
        // This requires a SQL command, so we'll use RPC if available
        try {
            await client.rpc('update_students_default_excuse_limit', { new_limit: newLimit });
        } catch (rpcError) {
            console.warn('[Settings] Could not update default value (RPC not available):', rpcError);
            // This is optional, so we don't throw
        }
        
    } catch (error) {
        console.error('[Settings] Error updating students excuse limit:', error);
        throw error;
    }
}

// ============================================================================
// PRICING PLANS
// ============================================================================

let pricingTable;

async function loadPricingPlans() {
    try {
        console.log('[Settings] Loading pricing plans...');
        
        // Initialize Supabase if not already done
        if (!window.supabaseClient) {
            window.supabaseClient = initSupabase();
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        const client = window.supabaseClient;
        if (!client) {
            console.error('[Settings] Supabase client not initialized');
            // Show message in table
            const tbody = document.querySelector('#pricingTable tbody');
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 30px; color: #f44336;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i><br>
                        خطأ في الاتصال بقاعدة البيانات. يرجى تحديث الصفحة.
                    </td>
                </tr>
            `;
            return;
        }

        // Get all pricing plans
        const { data: allPlans, error } = await client
            .from('pricing_plans')
            .select('*')
            .order('sessions_per_week', { ascending: true });

        if (error) {
            throw error;
        }

        console.log('[Settings] All plans:', allPlans);

        // Group by sessions_per_week AND session_duration to get unique packages
        const uniquePackages = {};
        
        allPlans.forEach(plan => {
            const key = `${plan.sessions_per_week}_${plan.session_duration || 60}`;
            if (!uniquePackages[key]) {
                // Format duration for display
                let durationText = '';
                const duration = plan.session_duration || 60;
                if (duration === 30) durationText = 'نصف ساعة';
                else if (duration === 45) durationText = '45 دقيقة';
                else if (duration === 60) durationText = 'ساعة';
                else if (duration === 90) durationText = 'ساعة ونصف';
                else if (duration === 120) durationText = 'ساعتان';
                else durationText = `${duration} دقيقة`;
                
                uniquePackages[key] = {
                    sessions: plan.sessions_per_week,
                    duration: duration,
                    durationText: durationText,
                    description: plan.description || `باقة ${plan.sessions_per_week} حصص × ${durationText}`,
                    count: 0
                };
            }
            uniquePackages[key].count++;
        });

        // Convert to array and sort
        const packages = Object.values(uniquePackages).sort((a, b) => {
            if (a.sessions !== b.sessions) return a.sessions - b.sessions;
            return a.duration - b.duration;
        });

        console.log('[Settings] Unique packages:', packages);

        // Initialize DataTable
        if (pricingTable) {
            pricingTable.destroy();
        }
        
        const tbody = document.querySelector('#pricingTable tbody');
        tbody.innerHTML = '';

        // Package icons
        const packageIcons = {
            2: '<i class="fas fa-book" style="color: #4CAF50;"></i>',
            3: '<i class="fas fa-book-open" style="color: #2196F3;"></i>',
            4: '<i class="fas fa-graduation-cap" style="color: #FF9800;"></i>',
            5: '<i class="fas fa-user-graduate" style="color: #9C27B0;"></i>'
        };
        
        if (packages.length > 0) {
            packages.forEach(pkg => {
                const icon = packageIcons[pkg.sessions] || '<i class="fas fa-book"></i>';
                
                // Extract package name from description (first part before dash or full description)
                const packageName = pkg.description.split('-')[0].trim() || pkg.description;
                
                const row = `
                    <tr>
                        <td>${icon} ${packageName}</td>
                        <td><strong>${pkg.sessions}</strong> حصة/أسبوع × <strong>${pkg.durationText}</strong></td>
                        <td>${pkg.description}</td>
                        <td>
                            <span class="badge badge-success">
                                <i class="fas fa-globe"></i> ${pkg.count} دولة
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-danger" onclick="deletePricingPlan(${pkg.sessions}, ${pkg.duration})" title="حذف">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        } else {
            // Show default 3 packages if no data
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 30px; color: #999;">
                        <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 10px;"></i><br>
                        لا توجد باقات محددة بعد. اضغط على "إضافة نظام تسعير جديد" للبدء.
                    </td>
                </tr>
            `;
        }
        
        // Initialize DataTable with minimal options
        pricingTable = $('#pricingTable').DataTable({
            language: {
                search: "بحث:",
                lengthMenu: "عرض _MENU_ سجلات",
                info: "عرض _START_ إلى _END_ من _TOTAL_ سجل",
                infoEmpty: "لا توجد سجلات",
                infoFiltered: "(تصفية من _MAX_ سجل)",
                paginate: {
                    first: "الأول",
                    last: "الأخير",
                    next: "التالي",
                    previous: "السابق"
                },
                zeroRecords: "لا توجد سجلات مطابقة",
                emptyTable: "لا توجد بيانات"
            },
            pageLength: 10,
            paging: false,
            searching: false,
            info: false,
            ordering: false
        });
        
        console.log('[Settings] ✅ Pricing plans loaded:', packages.length, 'unique packages');
    } catch (error) {
        console.error('[Settings] Error loading pricing plans:', error);
        Swal.fire('خطأ', 'حدث خطأ أثناء تحميل أنظمة التسعير: ' + error.message, 'error');
    }
}

window.showAddPricingModal = function() {
    document.getElementById('pricingModalTitle').innerHTML = '<i class="fas fa-dollar-sign"></i> إضافة نظام تسعير';
    document.getElementById('pricingForm').reset();
    document.getElementById('pricingId').value = '';
    document.getElementById('pricingModal').style.display = 'block';
}

window.closePricingModal = function() {
    document.getElementById('pricingModal').style.display = 'none';
}

window.editPricing = async function(id) {
    try {
        const response = await API.get('pricing_plans', {
            filters: { id: id }
        });
        
        if (response.success && response.data.length > 0) {
            const plan = response.data[0];
            document.getElementById('pricingModalTitle').innerHTML = '<i class="fas fa-dollar-sign"></i> تعديل نظام تسعير';
            document.getElementById('pricingId').value = plan.id;
            document.getElementById('pricingName').value = plan.plan_name || plan.plan_name_ar || '';
            document.getElementById('pricingPrice').value = plan.monthly_price;
            document.getElementById('pricingSessionsCount').value = plan.sessions_per_week;
            document.getElementById('pricingDescription').value = plan.description || '';
            document.getElementById('pricingModal').style.display = 'block';
        }
    } catch (error) {
        console.error('[Settings] Error loading pricing plan:', error);
        Swal.fire('خطأ', 'حدث خطأ أثناء تحميل البيانات', 'error');
    }
}

window.deletePricing = async function(id) {
    const result = await Swal.fire({
        title: 'هل أنت متأكد؟',
        text: 'سيتم حذف نظام التسعير نهائياً',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، احذف',
        cancelButtonText: 'إلغاء'
    });
    
    if (result.isConfirmed) {
        try {
            const response = await API.delete('pricing_plans', id);
            
            if (response.success) {
                Swal.fire('تم الحذف', 'تم حذف نظام التسعير بنجاح', 'success');
                await loadPricingPlans();
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            console.error('[Settings] Error deleting pricing plan:', error);
            Swal.fire('خطأ', 'حدث خطأ أثناء الحذف', 'error');
        }
    }
}

// Handle pricing form submission - REMOVED (using savePricingPlan function instead)
// The form now uses onsubmit="savePricingPlan(event)" directly

// Close modals when clicking outside
window.onclick = function(event) {
    const pricingModal = document.getElementById('pricingModal');
    
    if (event.target === pricingModal) {
        closePricingModal();
    }
};

console.log('[Settings] ✅ Settings module ready');


// ============================================================================
// COUNTRY PRICING
// ============================================================================

async function loadCountryPricing() {
    try {
        console.log('[Settings] Loading country pricing...');
        
        const client = window.supabaseClient;
        if (!client) {
            console.error('[Settings] Supabase client not initialized');
            return;
        }

        // Get all countries
        const { data: countries, error: countriesError } = await client
            .from('countries')
            .select('*')
            .order('display_order', { ascending: true});

        if (countriesError) {
            throw countriesError;
        }

        // Get all pricing plans for all countries
        const { data: pricingPlans, error: pricingError } = await client
            .from('pricing_plans')
            .select('*')
            .order('sessions_per_week', { ascending: true });

        if (pricingError) {
            throw pricingError;
        }

        console.log('[Settings] Countries:', countries?.length);
        console.log('[Settings] Pricing plans:', pricingPlans?.length);

        // Get unique sessions counts AND durations (packages)
        const uniquePackagesMap = new Map();
        pricingPlans.forEach(p => {
            const key = `${p.sessions_per_week}_${p.session_duration || 60}`;
            if (!uniquePackagesMap.has(key)) {
                uniquePackagesMap.set(key, {
                    sessions: p.sessions_per_week,
                    duration: p.session_duration || 60
                });
            }
        });
        
        const uniqueSessions = Array.from(uniquePackagesMap.values()).sort((a, b) => {
            if (a.sessions !== b.sessions) return a.sessions - b.sessions;
            return a.duration - b.duration;
        });
        
        console.log('[Settings] Unique packages:', uniqueSessions);

        // Package icons and colors
        const packageIcons = {
            2: { icon: 'fa-book', color: '#4CAF50' },
            3: { icon: 'fa-book-open', color: '#2196F3' },
            4: { icon: 'fa-graduation-cap', color: '#FF9800' },
            5: { icon: 'fa-user-graduate', color: '#9C27B0' },
            6: { icon: 'fa-star', color: '#E91E63' },
            7: { icon: 'fa-crown', color: '#FF5722' },
            8: { icon: 'fa-trophy', color: '#FFC107' }
        };

        // Country flag emojis
        const flagEmojis = {
            'مصر': '🇪🇬',
            'السعودية': '🇸🇦',
            'الإمارات': '🇦🇪',
            'الكويت': '🇰🇼',
            'قطر': '🇶🇦',
            'البحرين': '🇧🇭',
            'عمان': '🇴🇲',
            'الأردن': '🇯🇴'
        };

        // Update table header
        const thead = document.querySelector('#countryPricingTable thead tr');
        thead.innerHTML = `
            <th style="width: 200px;">الدولة</th>
            <th>العملة</th>
            ${uniqueSessions.map(pkg => {
                const pkgIcon = packageIcons[pkg.sessions] || { icon: 'fa-book', color: '#666' };
                // Format duration
                let durationText = '';
                if (pkg.duration === 30) durationText = '(30د)';
                else if (pkg.duration === 45) durationText = '(45د)';
                else if (pkg.duration === 60) durationText = '(60د)';
                else if (pkg.duration === 90) durationText = '(90د)';
                else if (pkg.duration === 120) durationText = '(120د)';
                else durationText = `(${pkg.duration}د)`;
                
                return `<th><i class="fas ${pkgIcon.icon}" style="color: ${pkgIcon.color};"></i> ${pkg.sessions} حصص ${durationText}</th>`;
            }).join('')}
            <th>الإجراءات</th>
        `;

        const tbody = document.getElementById('countryPricingTableBody');
        tbody.innerHTML = '';

        // Create a row for each country
        countries.forEach(country => {
            const flag = flagEmojis[country.name_ar] || '🌍';
            
            const row = document.createElement('tr');
            
            // Country and currency columns
            let rowHTML = `
                <td>
                    <div class="country-cell">
                        <span class="country-flag-cell">${flag}</span>
                        <strong>${country.name_ar}</strong>
                    </div>
                </td>
                <td>
                    <div class="currency-cell">
                        <strong>${country.currency_name_ar}</strong><br>
                        <small style="color: #999;">${country.currency_code}</small>
                    </div>
                </td>
            `;
            
            // Add input for each package
            uniqueSessions.forEach(pkg => {
                const plan = pricingPlans.find(p => 
                    p.country_id === country.id && 
                    p.sessions_per_week === pkg.sessions &&
                    (p.session_duration || 60) === pkg.duration
                );
                rowHTML += `
                    <td>
                        <input 
                            type="number" 
                            class="price-input"
                            step="0.01" 
                            min="0"
                            placeholder="0.00"
                            value="${plan ? plan.monthly_price : ''}"
                            data-country-id="${country.id}"
                            data-sessions="${pkg.sessions}"
                            data-duration="${pkg.duration}"
                            data-plan-id="${plan ? plan.id : ''}"
                        />
                    </td>
                `;
            });
            
            // Actions column
            rowHTML += `
                <td>
                    <button class="btn btn-sm btn-primary" onclick="saveCountryPricing('${country.id}', '${country.name_ar}')">
                        <i class="fas fa-save"></i> حفظ
                    </button>
                </td>
            `;
            
            row.innerHTML = rowHTML;
            tbody.appendChild(row);
        });

        console.log('[Settings] ✅ Country pricing loaded');

    } catch (error) {
        console.error('[Settings] Error loading country pricing:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'فشل تحميل أسعار الباقات: ' + error.message
        });
    }
}

window.saveCountryPricing = async function(countryId, countryName) {
    try {
        console.log('[Settings] Saving pricing for country:', countryId);

        const client = window.supabaseClient;
        if (!client) {
            throw new Error('Supabase client not initialized');
        }

        // Get all inputs for this country
        const inputs = document.querySelectorAll(`input[data-country-id="${countryId}"]`);
        
        const updates = [];
        const inserts = [];

        for (const input of inputs) {
            const price = parseFloat(input.value);
            const sessions = parseInt(input.dataset.sessions);
            const duration = parseInt(input.dataset.duration);
            const planId = input.dataset.planId;

            if (!price || price <= 0) {
                continue; // Skip empty or invalid prices
            }

            // Format duration for description
            let durationText = '';
            if (duration === 30) durationText = 'نصف ساعة';
            else if (duration === 45) durationText = '45 دقيقة';
            else if (duration === 60) durationText = 'ساعة';
            else if (duration === 90) durationText = 'ساعة ونصف';
            else if (duration === 120) durationText = 'ساعتان';
            else durationText = `${duration} دقيقة`;

            const planData = {
                country_id: countryId,
                sessions_per_week: sessions,
                session_duration: duration,
                monthly_price: price,
                plan_name_ar: `خطة ${sessions} حصص × ${durationText}`,
                plan_name_en: `${sessions} Sessions × ${duration}min`,
                plan_name: `${sessions} Sessions × ${duration}min`,
                description: `${sessions} حصص × ${durationText}`,
                is_active: true
            };

            if (planId) {
                // Update existing plan
                updates.push({ id: planId, data: planData });
            } else {
                // Insert new plan
                inserts.push(planData);
            }
        }

        // Perform updates
        for (const update of updates) {
            const { error } = await client
                .from('pricing_plans')
                .update(update.data)
                .eq('id', update.id);

            if (error) {
                throw error;
            }
        }

        // Perform inserts
        if (inserts.length > 0) {
            const { error } = await client
                .from('pricing_plans')
                .insert(inserts);

            if (error) {
                throw error;
            }
        }

        Swal.fire({
            icon: 'success',
            title: 'تم الحفظ',
            text: `تم حفظ أسعار ${countryName} بنجاح`,
            timer: 2000,
            showConfirmButton: false
        });

        // Reload to update plan IDs
        await loadCountryPricing();

        console.log('[Settings] ✅ Country pricing saved');

    } catch (error) {
        console.error('[Settings] Error saving country pricing:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'فشل حفظ الأسعار: ' + error.message
        });
    }
};

window.saveAllCountryPricing = async function() {
    try {
        console.log('[Settings] Saving all country pricing...');

        const client = window.supabaseClient;
        if (!client) {
            throw new Error('Supabase client not initialized');
        }

        // Get all price inputs
        const inputs = document.querySelectorAll('.price-input');
        
        const updates = [];
        const inserts = [];

        for (const input of inputs) {
            const price = parseFloat(input.value);
            const countryId = input.dataset.countryId;
            const sessions = parseInt(input.dataset.sessions);
            const duration = parseInt(input.dataset.duration);
            const planId = input.dataset.planId;

            if (!price || price <= 0) {
                continue; // Skip empty or invalid prices
            }

            // Format duration for description
            let durationText = '';
            if (duration === 30) durationText = 'نصف ساعة';
            else if (duration === 45) durationText = '45 دقيقة';
            else if (duration === 60) durationText = 'ساعة';
            else if (duration === 90) durationText = 'ساعة ونصف';
            else if (duration === 120) durationText = 'ساعتان';
            else durationText = `${duration} دقيقة`;

            const planData = {
                country_id: countryId,
                sessions_per_week: sessions,
                session_duration: duration,
                monthly_price: price,
                plan_name_ar: `خطة ${sessions} حصص × ${durationText}`,
                plan_name_en: `${sessions} Sessions × ${duration}min`,
                plan_name: `${sessions} Sessions × ${duration}min`,
                description: `${sessions} حصص × ${durationText}`,
                is_active: true
            };

            if (planId) {
                // Update existing plan
                updates.push({ id: planId, data: planData });
            } else {
                // Insert new plan
                inserts.push(planData);
            }
        }

        // Perform updates
        for (const update of updates) {
            const { error } = await client
                .from('pricing_plans')
                .update(update.data)
                .eq('id', update.id);

            if (error) {
                throw error;
            }
        }

        // Perform inserts
        if (inserts.length > 0) {
            const { error } = await client
                .from('pricing_plans')
                .insert(inserts);

            if (error) {
                throw error;
            }
        }

        Swal.fire({
            icon: 'success',
            title: 'تم الحفظ',
            text: 'تم حفظ جميع الأسعار بنجاح',
            timer: 2000,
            showConfirmButton: false
        });

        // Reload to update plan IDs
        await loadCountryPricing();

        console.log('[Settings] ✅ All country pricing saved');

    } catch (error) {
        console.error('[Settings] Error saving all country pricing:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'فشل حفظ الأسعار: ' + error.message
        });
    }
};

console.log('[Settings] ✅ Country pricing module loaded');


// ============================================================================
// ADD NEW PRICING PLAN
// ============================================================================

// Show modal for adding new pricing plan
window.showAddPricingPlanModal = function() {
    document.getElementById('pricingName').value = '';
    document.getElementById('pricingSessionsCount').value = '';
    document.getElementById('pricingSessionDuration').value = '60'; // Default to 60 minutes
    document.getElementById('customSessionDuration').value = '';
    document.getElementById('customDurationGroup').style.display = 'none'; // Hide custom input
    document.getElementById('pricingDescription').value = '';
    document.getElementById('pricingModal').style.display = 'block';
}

// Toggle custom duration input
window.toggleCustomDuration = function() {
    const select = document.getElementById('pricingSessionDuration');
    const customGroup = document.getElementById('customDurationGroup');
    const customInput = document.getElementById('customSessionDuration');
    
    if (select.value === 'custom') {
        customGroup.style.display = 'block';
        customInput.required = true;
        customInput.focus();
    } else {
        customGroup.style.display = 'none';
        customInput.required = false;
        customInput.value = '';
    }
}

// Save new pricing plan
window.savePricingPlan = async function(event) {
    event.preventDefault();
    
    try {
        console.log('[Settings] savePricingPlan called');
        
        // Check if elements exist
        const nameElement = document.getElementById('pricingName');
        const sessionsElement = document.getElementById('pricingSessionsCount');
        const descElement = document.getElementById('pricingDescription');
        
        console.log('[Settings] Elements:', {
            nameElement: nameElement,
            sessionsElement: sessionsElement,
            descElement: descElement
        });
        
        if (!nameElement || !sessionsElement) {
            throw new Error('Required form elements not found. Please refresh the page.');
        }
        
        const packageName = nameElement.value.trim();
        const sessionsCount = parseInt(sessionsElement.value);
        
        // Get session duration (from dropdown or custom input)
        const durationSelect = document.getElementById('pricingSessionDuration');
        let sessionDuration;
        
        if (durationSelect.value === 'custom') {
            const customInput = document.getElementById('customSessionDuration');
            sessionDuration = parseInt(customInput.value);
            
            if (!sessionDuration || sessionDuration < 5 || sessionDuration > 300) {
                Swal.fire({
                    icon: 'error',
                    title: 'خطأ',
                    text: 'الرجاء إدخال مدة صحيحة (من 5 إلى 300 دقيقة)',
                    confirmButtonText: 'حسناً',
                    confirmButtonColor: '#dc3545'
                });
                return;
            }
        } else {
            sessionDuration = parseInt(durationSelect.value);
        }
        
        const description = descElement ? descElement.value.trim() : '';
        
        // Format duration for display
        let durationText = '';
        if (sessionDuration === 30) durationText = 'نصف ساعة';
        else if (sessionDuration === 45) durationText = '45 دقيقة';
        else if (sessionDuration === 60) durationText = 'ساعة';
        else if (sessionDuration === 90) durationText = 'ساعة ونصف';
        else if (sessionDuration === 120) durationText = 'ساعتان';
        else durationText = `${sessionDuration} دقيقة`;
        
        const finalDescription = description || `${packageName} - ${sessionsCount} حصص × ${durationText}`;
        
        console.log('[Settings] Adding new pricing plan:', packageName, sessionsCount, 'sessions ×', sessionDuration, 'minutes');
        
        const client = window.supabaseClient;
        if (!client) {
            throw new Error('Supabase client not initialized');
        }
        
        // Check if this sessions count + duration combination already exists
        const { data: existingPlans, error: checkError } = await client
            .from('pricing_plans')
            .select('*')
            .eq('sessions_per_week', sessionsCount)
            .eq('session_duration', sessionDuration)
            .limit(1);
        
        if (checkError) {
            throw checkError;
        }
        
        if (existingPlans && existingPlans.length > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'تنبيه',
                text: `باقة ${sessionsCount} حصص × ${durationText} موجودة بالفعل في النظام`,
                confirmButtonText: 'حسناً',
                confirmButtonColor: '#2c5f2d'
            });
            return;
        }
        
        // Get all countries
        const { data: countries, error: countriesError } = await client
            .from('countries')
            .select('*');
        
        if (countriesError) {
            throw countriesError;
        }
        
        // Create pricing plan for each country with default price 0 (not set yet)
        const newPlans = countries.map(country => ({
            country_id: country.id,
            sessions_per_week: sessionsCount,
            session_duration: sessionDuration,
            monthly_price: 0, // 0 means price not set yet
            description: finalDescription,
            is_active: true
        }));
        
        // Insert all plans
        const { data: insertedPlans, error: insertError } = await client
            .from('pricing_plans')
            .insert(newPlans)
            .select();
        
        if (insertError) {
            console.error('[Settings] Insert error details:', insertError);
            
            // Check if it's a constraint error
            if (insertError.message.includes('sessions_per_week_check') || 
                insertError.message.includes('violates check constraint')) {
                throw new Error(`عدد الحصص ${sessionsCount} غير مسموح به في قاعدة البيانات الحالية.\n\nالحل: افتح الملف إصلاح_قيود_أنظمة_التسعير.html وشغّل الإصلاح`);
            } else if (insertError.message.includes('monthly_price') || 
                       insertError.message.includes('null value')) {
                throw new Error('خطأ في قيود قاعدة البيانات.\n\nالحل: افتح الملف إصلاح_قيود_أنظمة_التسعير.html وشغّل الإصلاح');
            } else {
                throw new Error(insertError.message || 'فشل إضافة الباقة');
            }
        }
        
        console.log('[Settings] ✅ Created', insertedPlans.length, 'pricing plans');
        
        // Close modal
        closePricingModal();
        
        // Show success message
        await Swal.fire({
            icon: 'success',
            title: 'تم بنجاح!',
            html: `
                <p>تم إضافة <strong>${packageName}</strong> بنجاح</p>
                <p style="color: #666; font-size: 0.9rem;">
                    <i class="fas fa-info-circle"></i> 
                    عدد الحصص: <strong>${sessionsCount} حصة أسبوعياً</strong>
                </p>
                <p style="color: #666; font-size: 0.9rem;">
                    <i class="fas fa-clock"></i> 
                    مدة الحصة: <strong>${durationText}</strong>
                </p>
                <p style="color: #666; font-size: 0.9rem;">
                    تم إضافة الباقة لجميع الدول (${countries.length} دولة)
                </p>
                <p style="color: #666; font-size: 0.9rem;">
                    انتقل إلى تبويب "أسعار الباقات حسب الدول" لتحديد الأسعار
                </p>
            `,
            confirmButtonText: 'حسناً',
            confirmButtonColor: '#2c5f2d'
        });
        
        // Reload pricing plans
        await loadPricingPlans();
        
        // Switch to country pricing tab
        switchTab('country-pricing', document.querySelectorAll('.tab')[2]);
        
    } catch (error) {
        console.error('[Settings] Error saving pricing plan:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'حدث خطأ أثناء حفظ نظام التسعير: ' + error.message,
            confirmButtonText: 'حسناً',
            confirmButtonColor: '#dc3545'
        });
    }
}

// Delete pricing plan
window.deletePricingPlan = async function(sessionsCount, sessionDuration) {
    try {
        // Format duration for display
        let durationText = '';
        if (sessionDuration === 30) durationText = 'نصف ساعة';
        else if (sessionDuration === 45) durationText = '45 دقيقة';
        else if (sessionDuration === 60) durationText = 'ساعة';
        else if (sessionDuration === 90) durationText = 'ساعة ونصف';
        else if (sessionDuration === 120) durationText = 'ساعتان';
        else durationText = `${sessionDuration} دقيقة`;
        
        const result = await Swal.fire({
            title: 'تأكيد الحذف',
            html: `
                <p>هل أنت متأكد من حذف باقة <strong>${sessionsCount} حصص × ${durationText}</strong>؟</p>
                <p style="color: #dc3545; font-size: 0.9rem;">
                    <i class="fas fa-exclamation-triangle"></i> 
                    سيتم حذف الباقة من جميع الدول
                </p>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        });
        
        if (!result.isConfirmed) {
            return;
        }
        
        console.log('[Settings] Deleting pricing plan:', sessionsCount, 'sessions ×', sessionDuration, 'minutes');
        
        const client = window.supabaseClient;
        if (!client) {
            throw new Error('Supabase client not initialized');
        }
        
        // Delete all plans with this sessions count AND duration
        const { error: deleteError } = await client
            .from('pricing_plans')
            .delete()
            .eq('sessions_per_week', sessionsCount)
            .eq('session_duration', sessionDuration);
        
        if (deleteError) {
            throw deleteError;
        }
        
        console.log('[Settings] ✅ Deleted pricing plan');
        
        // Show success message
        Swal.fire({
            icon: 'success',
            title: 'تم الحذف',
            text: `تم حذف باقة ${sessionsCount} حصص × ${durationText} بنجاح`,
            timer: 2000,
            showConfirmButton: false
        });
        
        // Reload pricing plans
        await loadPricingPlans();
        
    } catch (error) {
        console.error('[Settings] Error deleting pricing plan:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'حدث خطأ أثناء حذف نظام التسعير: ' + error.message,
            confirmButtonText: 'حسناً',
            confirmButtonColor: '#dc3545'
        });
    }
}

console.log('[Settings] ✅ Pricing plan management functions loaded');
