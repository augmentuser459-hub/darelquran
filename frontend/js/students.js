// Students Page JavaScript
console.log('[Students] 🚀 Initializing...');

let studentsTable = null;
let allStudents = []; // Store all students for filtering

// Wait for DOM and Supabase to be ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('[Students] 📊 Loading students data...');
    
    // Initialize Supabase if not already done
    if (!window.supabaseClient) {
        window.supabaseClient = initSupabase();
    }

    // Wait a bit for Supabase to initialize
    await new Promise(resolve => setTimeout(resolve, 500));

    // Load countries for filter
    await loadCountriesFilter();

    // Load students
    await loadStudents();

    console.log('[Students] ✅ Initialization complete');
});

// Load students data
async function loadStudents(countryId = null) {
    try {
        const client = window.supabaseClient;
        if (!client) {
            console.error('[Students] ❌ Supabase client not initialized');
            return;
        }

        console.log('[Students] 📡 Fetching students...', countryId ? `for country: ${countryId}` : '');

        let query = client
            .from('students')
            .select(`
                *,
                country:countries(id, name_ar, name),
                teacher:teachers(name),
                pricing:pricing_plans(plan_name_ar, monthly_price)
            `)
            .order('created_at', { ascending: false });

        // Apply country filter if specified
        if (countryId) {
            query = query.eq('country_id', countryId);
        }

        const { data: students, error } = await query;

        if (error) {
            console.error('[Students] ❌ Error:', error);
            throw error;
        }

        console.log('[Students] ✅ Loaded', students?.length || 0, 'students');

        // Store all students for filtering
        allStudents = students || [];

        // Display students
        displayStudents(allStudents);

        // Initialize DataTable after a delay to ensure DOM is ready
        setTimeout(() => {
            try {
                if (typeof $.fn.DataTable !== 'undefined' && $('#studentsTable').length) {
                    // Destroy existing instance if any
                    if (studentsTable) {
                        studentsTable.destroy();
                    }
                    
                    // Check if table has data
                    const tbody = $('#studentsTable tbody tr');
                    const hasData = tbody.length > 0 && !tbody.first().find('td[colspan]').length;
                    
                    if (hasData) {
                        studentsTable = $('#studentsTable').DataTable({
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
                            order: [[0, 'asc']],
                            pageLength: 25
                        });
                        console.log('[Students] ✅ DataTable initialized');
                    } else {
                        console.log('[Students] ℹ️ No data to initialize DataTable');
                    }
                }
            } catch (e) {
                console.warn('[Students] DataTable initialization skipped:', e.message);
            }
        }, 500);

    } catch (error) {
        console.error('[Students] Error loading students:', error);
        showError('فشل تحميل بيانات الطلبة: ' + error.message);
    }
}

// Display students in table
function displayStudents(students) {
    const tbody = document.getElementById('studentsTableBody') || 
                  document.querySelector('#studentsTable tbody');
    
    if (!tbody) {
        console.error('[Students] ❌ Table body not found');
        return;
    }

    // Update statistics
    updateStatistics(students);

    // Destroy DataTable if exists
    if (studentsTable) {
        studentsTable.destroy();
        studentsTable = null;
    }

    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">لا يوجد طلبة</td></tr>';
        return;
    }

    tbody.innerHTML = students.map(student => `
        <tr>
            <td>${student.name || '-'}</td>
            <td>${student.email || '-'}</td>
            <td>${student.country?.name_ar || student.country?.name || '-'}</td>
            <td>${student.teacher?.name || '-'}</td>
            <td>
                <span class="badge badge-${student.status === 'active' ? 'success' : 'secondary'}">
                    ${student.status === 'active' ? 'نشط' : student.status === 'inactive' ? 'غير نشط' : student.status}
                </span>
            </td>
            <td>${student.pricing?.plan_name_ar || '-'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewStudent('${student.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="editStudent('${student.id}')">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');

    // Reinitialize DataTable
    setTimeout(() => {
        try {
            if (typeof $.fn.DataTable !== 'undefined' && $('#studentsTable').length) {
                studentsTable = $('#studentsTable').DataTable({
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
                    order: [[0, 'asc']],
                    pageLength: 25
                });
            }
        } catch (e) {
            console.warn('[Students] DataTable initialization skipped:', e.message);
        }
    }, 100);
}

// Update statistics
function updateStatistics(students) {
    const total = students.length;
    const active = students.filter(s => s.status === 'active').length;
    
    // Update stat cards if they exist
    const totalEl = document.getElementById('totalStudents');
    const activeEl = document.getElementById('activeStudents');
    
    if (totalEl) totalEl.textContent = total;
    if (activeEl) activeEl.textContent = active;
    
    console.log('[Students] Statistics updated:', { total, active });
}

// View student details
window.viewStudent = function(id) {
    window.location.href = `./student-details.html?id=${id}`;
}

// Edit student
window.editStudent = async function(id) {
    try {
        console.log('[Students] Edit student:', id);
        
        // Load student data
        const client = window.supabaseClient;
        const { data: student, error } = await client
            .from('students')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Open modal
        const modal = document.getElementById('studentModal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Update modal title
            document.getElementById('modalTitle').innerHTML = '<i class="fas fa-user-edit"></i> تعديل بيانات الطالب';
            
            // Set student ID
            document.getElementById('studentId').value = student.id;
            
            // Split name into first and last
            const nameParts = (student.name || '').split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            // Fill form fields
            document.getElementById('firstName').value = firstName;
            document.getElementById('lastName').value = lastName;
            document.getElementById('email').value = student.email || '';
            document.getElementById('phone').value = student.phone || '';
            document.getElementById('status').value = student.status || 'active';
            
            // Load dropdowns then set values
            await loadCountriesAndPricing();
            
            // Set selected values after loading
            setTimeout(() => {
                if (student.country_id) {
                    document.getElementById('country').value = student.country_id;
                }
                if (student.pricing_plan_id) {
                    document.getElementById('pricingPlan').value = student.pricing_plan_id;
                }
                if (student.preferred_teacher_id) {
                    document.getElementById('teacher').value = student.preferred_teacher_id;
                }
            }, 500);
            
            console.log('[Students] Edit modal opened');
        }
    } catch (error) {
        console.error('[Students] Error loading student:', error);
        alert('حدث خطأ أثناء تحميل بيانات الطالب');
    }
}

// Show error message
function showError(message) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: message
        });
    } else {
        alert(message);
    }
}

// Show add student modal
window.showAddStudentModal = async function() {
    const modal = document.getElementById('studentModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('modalTitle').innerHTML = '<i class="fas fa-user-plus"></i> إضافة طالب جديد';
        document.getElementById('studentForm').reset();
        document.getElementById('studentId').value = '';
        
        // Load countries and pricing plans
        await loadCountriesAndPricing();
    } else {
        alert('إضافة طالب جديد - قيد التطوير');
    }
}

// Load countries and pricing plans for the modal
async function loadCountriesAndPricing() {
    try {
        console.log('[Students] Loading countries, pricing plans, and teachers...');
        const client = window.supabaseClient;
        
        if (!client) {
            console.error('[Students] Supabase client not available');
            return;
        }
        
        // Load countries
        console.log('[Students] Fetching countries...');
        const { data: countries, error: countriesError } = await client
            .from('countries')
            .select('*')
            .order('display_order', { ascending: true });
        
        if (countriesError) {
            console.error('[Students] Error loading countries:', countriesError);
        } else {
            console.log('[Students] Countries loaded:', countries?.length || 0);
            const countrySelect = document.getElementById('country');
            if (countrySelect) {
                countrySelect.innerHTML = '<option value="">اختر الدولة</option>' +
                    countries.map(country => 
                        `<option value="${country.id}">${country.name_ar || country.name}</option>`
                    ).join('');
                console.log('[Students] Country select populated');
                
                // Add event listener to update pricing when country changes
                countrySelect.removeEventListener('change', handleCountryChange);
                countrySelect.addEventListener('change', handleCountryChange);
            } else {
                console.error('[Students] Country select element not found');
            }
        }
        
        // Load pricing plans
        console.log('[Students] Fetching pricing plans...');
        const { data: pricingPlans, error: pricingError } = await client
            .from('pricing_plans')
            .select('*')
            .order('sessions_per_week', { ascending: true });
        
        if (pricingError) {
            console.error('[Students] Error loading pricing plans:', pricingError);
        } else {
            console.log('[Students] Pricing plans loaded:', pricingPlans?.length || 0);
            
            // Store all pricing plans globally for filtering by country
            window.allPricingPlans = pricingPlans;
            
            const pricingSelect = document.getElementById('pricingPlan');
            if (pricingSelect) {
                pricingSelect.innerHTML = '<option value="">اختر الدولة أولاً</option>';
                console.log('[Students] Pricing select initialized (will update on country selection)');
            } else {
                console.error('[Students] Pricing select element not found');
            }
        }
        
        // Load teachers
        console.log('[Students] Fetching teachers...');
        const { data: teachers, error: teachersError } = await client
            .from('teachers')
            .select('*')
            .eq('status', 'active')
            .order('name', { ascending: true });
        
        if (teachersError) {
            console.error('[Students] Error loading teachers:', teachersError);
        } else {
            console.log('[Students] Teachers loaded:', teachers?.length || 0);
            const teacherSelect = document.getElementById('teacher');
            if (teacherSelect) {
                teacherSelect.innerHTML = '<option value="">اختر المحفظ</option>' +
                    teachers.map(teacher => 
                        `<option value="${teacher.id}">${teacher.name}</option>`
                    ).join('');
                console.log('[Students] Teacher select populated');
            } else {
                console.error('[Students] Teacher select element not found');
            }
        }
        
        console.log('[Students] ✅ Countries, pricing, and teachers loaded');
    } catch (error) {
        console.error('[Students] Error loading data:', error);
    }
}

// Close student modal
window.closeStudentModal = function() {
    const modal = document.getElementById('studentModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Handle student form submission
document.addEventListener('DOMContentLoaded', function() {
    const studentForm = document.getElementById('studentForm');
    if (studentForm) {
        studentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                console.log('[Students] Submitting form...');
                
                // Combine first and last name
                const firstName = document.getElementById('firstName')?.value || '';
                const lastName = document.getElementById('lastName')?.value || '';
                const fullName = `${firstName} ${lastName}`.trim();
                
                if (!fullName) {
                    alert('الرجاء إدخال الاسم');
                    return;
                }
                
                const formData = {
                    name: fullName,
                    email: document.getElementById('email')?.value || null,
                    phone: document.getElementById('phone')?.value || null,
                    country_id: document.getElementById('country')?.value || null,
                    pricing_plan_id: document.getElementById('pricingPlan')?.value || null,
                    preferred_teacher_id: document.getElementById('teacher')?.value || null,
                    status: document.getElementById('status')?.value || 'active'
                };
                
                console.log('[Students] Form data:', formData);
                
                const client = window.supabaseClient;
                const studentId = document.getElementById('studentId')?.value;
                
                let data, error;
                
                if (studentId) {
                    // Update existing student
                    const result = await client
                        .from('students')
                        .update(formData)
                        .eq('id', studentId)
                        .select();
                    data = result.data;
                    error = result.error;
                } else {
                    // Insert new student
                    const result = await client
                        .from('students')
                        .insert([formData])
                        .select();
                    data = result.data;
                    error = result.error;
                }
                
                if (error) throw error;
                
                console.log('[Students] Student saved:', data);
                
                // Show success message
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: 'تم الحفظ',
                        text: studentId ? 'تم تحديث بيانات الطالب بنجاح' : 'تم إضافة الطالب بنجاح',
                        timer: 2000,
                        showConfirmButton: false
                    });
                } else {
                    alert(studentId ? 'تم تحديث بيانات الطالب بنجاح' : 'تم إضافة الطالب بنجاح');
                }
                
                // Close modal and reload
                closeStudentModal();
                await loadStudents();
                
            } catch (error) {
                console.error('[Students] Error saving student:', error);
                if (typeof Swal !== 'undefined') {
                    Swal.fire('خطأ', 'حدث خطأ أثناء حفظ البيانات: ' + error.message, 'error');
                } else {
                    alert('حدث خطأ أثناء حفظ البيانات');
                }
            }
        });
    }
});

// Load countries for filter dropdown
async function loadCountriesFilter() {
    try {
        const client = window.supabaseClient;
        const { data: countries, error } = await client
            .from('countries')
            .select('id, name_ar, name')
            .order('name_ar');

        if (error) throw error;

        const select = document.getElementById('countryFilter');
        if (select && countries) {
            countries.forEach(country => {
                const option = document.createElement('option');
                option.value = country.id;
                option.textContent = country.name_ar || country.name;
                select.appendChild(option);
            });
        }

        console.log('[Students] ✅ Countries filter loaded:', countries?.length || 0);
    } catch (error) {
        console.error('[Students] Error loading countries:', error);
    }
}

// Filter students by country
window.filterByCountry = async function() {
    const select = document.getElementById('countryFilter');
    const countryId = select.value;
    
    console.log('[Students] Filtering by country:', countryId || 'all');
    
    if (!countryId) {
        // Show all students
        displayStudents(allStudents);
        return;
    }
    
    // Filter students by country_id
    const filteredStudents = allStudents.filter(student => {
        return student.country_id === countryId;
    });
    
    console.log('[Students] Filtered students:', filteredStudents.length, 'out of', allStudents.length);
    
    // Display filtered students
    displayStudents(filteredStudents);
}

// Clear country filter
window.clearCountryFilter = function() {
    const select = document.getElementById('countryFilter');
    select.value = '';
    displayStudents(allStudents);
}

console.log('[Students] ✅ Script loaded');


// Handle country change to update pricing plans
async function handleCountryChange(event) {
    const countryId = event.target.value;
    const pricingSelect = document.getElementById('pricingPlan');
    
    if (!pricingSelect) return;
    
    if (!countryId) {
        pricingSelect.innerHTML = '<option value="">اختر الدولة أولاً</option>';
        return;
    }
    
    console.log('[Students] Country changed:', countryId);
    
    // Filter pricing plans by selected country
    const countryPlans = window.allPricingPlans?.filter(plan => plan.country_id === countryId) || [];
    
    console.log('[Students] Pricing plans for country:', countryPlans.length);
    
    if (countryPlans.length > 0) {
        // Get country info for currency
        const client = window.supabaseClient;
        const { data: country } = await client
            .from('countries')
            .select('currency_symbol, currency_name_ar')
            .eq('id', countryId)
            .single();
        
        const currencySymbol = country?.currency_symbol || '';
        
        pricingSelect.innerHTML = '<option value="">اختر نظام التسعير</option>' +
            countryPlans.map(plan => {
                const packageIcons = {
                    2: '📚',
                    3: '📖',
                    4: '📕',
                    5: '🎓'
                };
                const icon = packageIcons[plan.sessions_per_week] || '📗';
                return `<option value="${plan.id}">${icon} ${plan.sessions_per_week} حصص/أسبوع - ${plan.monthly_price} ${currencySymbol}</option>`;
            }).join('');
    } else {
        pricingSelect.innerHTML = '<option value="">لا توجد باقات متاحة لهذه الدولة</option>';
    }
}

console.log('[Students] ✅ Country pricing handler loaded');
