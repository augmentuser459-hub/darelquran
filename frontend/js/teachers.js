// Teachers Page JavaScript
console.log('[Teachers] 🚀 Initializing...');

let teachersTable = null;

// Wait for DOM and Supabase to be ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('[Teachers] 📊 Loading teachers data...');
    
    // Initialize Supabase if not already done
    if (!window.supabaseClient) {
        window.supabaseClient = initSupabase();
    }

    // Wait a bit for Supabase to initialize
    await new Promise(resolve => setTimeout(resolve, 500));

    // Load teachers
    await loadTeachers();

    console.log('[Teachers] ✅ Initialization complete');
});

// Load teachers data
async function loadTeachers() {
    try {
        const client = window.supabaseClient;
        if (!client) {
            console.error('[Teachers] ❌ Supabase client not initialized');
            return;
        }

        console.log('[Teachers] 📡 Fetching teachers...');

        const { data: teachers, error } = await client
            .from('teachers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Teachers] ❌ Error:', error);
            throw error;
        }

        console.log('[Teachers] ✅ Loaded', teachers?.length || 0, 'teachers');

        // Display teachers
        displayTeachers(teachers || []);

        // Initialize DataTable after a delay to ensure DOM is ready
        setTimeout(() => {
            try {
                if (typeof $.fn.DataTable !== 'undefined' && $('#teachersTable').length) {
                    // Destroy existing instance if any
                    if (teachersTable) {
                        teachersTable.destroy();
                    }
                    
                    // Check if table has data
                    const tbody = $('#teachersTable tbody tr');
                    const hasData = tbody.length > 0 && !tbody.first().find('td[colspan]').length;
                    
                    if (hasData) {
                        teachersTable = $('#teachersTable').DataTable({
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
                        console.log('[Teachers] ✅ DataTable initialized');
                    } else {
                        console.log('[Teachers] ℹ️ No data to initialize DataTable');
                    }
                }
            } catch (e) {
                console.warn('[Teachers] DataTable initialization skipped:', e.message);
            }
        }, 500);

    } catch (error) {
        console.error('[Teachers] Error loading teachers:', error);
        showError('فشل تحميل بيانات المحفظين: ' + error.message);
    }
}

// Display teachers in table
async function displayTeachers(teachers) {
    const tbody = document.getElementById('teachersTableBody') || 
                  document.querySelector('#teachersTable tbody');
    
    if (!tbody) {
        console.error('[Teachers] ❌ Table body not found');
        return;
    }

    // Update statistics
    updateStatistics(teachers);

    if (teachers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">لا يوجد محفظين</td></tr>';
        return;
    }

    // Get student counts for each teacher
    const client = window.supabaseClient;
    const studentCounts = {};
    
    for (const teacher of teachers) {
        const { count } = await client
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('preferred_teacher_id', teacher.id)
            .eq('status', 'active');
        studentCounts[teacher.id] = count || 0;
    }

    tbody.innerHTML = teachers.map(teacher => `
        <tr>
            <td>${teacher.name || '-'}</td>
            <td>${teacher.email || '-'}</td>
            <td>${teacher.phone || '-'}</td>
            <td>${teacher.specialization || '-'}</td>
            <td>${studentCounts[teacher.id] || 0}</td>
            <td>
                <span class="badge badge-${teacher.status === 'active' ? 'success' : 'secondary'}">
                    ${teacher.status === 'active' ? 'نشط' : 'غير نشط'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewTeacher('${teacher.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="editTeacher('${teacher.id}')">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Update statistics
function updateStatistics(teachers) {
    const total = teachers.length;
    const active = teachers.filter(t => t.status === 'active').length;
    const onLeave = teachers.filter(t => t.status === 'on_leave').length;
    
    // Update stat cards
    const totalEl = document.getElementById('totalTeachers');
    const activeEl = document.getElementById('activeTeachers');
    const leaveEl = document.getElementById('onLeaveTeachers');
    
    if (totalEl) totalEl.textContent = total;
    if (activeEl) activeEl.textContent = active;
    if (leaveEl) leaveEl.textContent = onLeave;
    
    console.log('[Teachers] Statistics updated:', { total, active, onLeave });
}

// View teacher details
window.viewTeacher = function(id) {
    window.location.href = `./teacher-details.html?id=${id}`;
}

// Edit teacher
window.editTeacher = async function(id) {
    console.log('[Teachers] Edit teacher:', id);
    
    try {
        const client = window.supabaseClient;
        
        // Fetch teacher data
        const { data: teacher, error } = await client
            .from('teachers')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        console.log('[Teachers] Teacher data:', teacher);
        
        // Open modal
        const modal = document.getElementById('teacherModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            
            // Set title
            const title = document.getElementById('modalTitle');
            if (title) {
                title.innerHTML = '<i class="fas fa-edit"></i> تعديل بيانات المحفظ';
            }
            
            // Fill form with teacher data
            document.getElementById('teacherId').value = teacher.id;
            
            // Split name into first and last
            const nameParts = (teacher.name || '').split(' ');
            document.getElementById('firstName').value = nameParts[0] || '';
            document.getElementById('lastName').value = nameParts.slice(1).join(' ') || '';
            
            document.getElementById('email').value = teacher.email || '';
            document.getElementById('phone').value = teacher.phone || '';
            document.getElementById('specialization').value = teacher.specialization || '';
            document.getElementById('qualification').value = teacher.qualifications || '';
            document.getElementById('experience').value = teacher.experience_years || 0;
            document.getElementById('sessionRate').value = teacher.session_rate || 0;
            document.getElementById('status').value = teacher.status || 'active';
            document.getElementById('notes').value = teacher.notes || '';
        }
        
    } catch (error) {
        console.error('[Teachers] Error loading teacher:', error);
        showError('فشل تحميل بيانات المحفظ: ' + error.message);
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

// Show add teacher modal
window.showAddTeacherModal = function() {
    const modal = document.getElementById('teacherModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        
        // Reset form
        const form = document.getElementById('teacherForm');
        if (form) {
            form.reset();
        }
        
        // Set title
        const title = document.getElementById('modalTitle');
        if (title) {
            title.innerHTML = '<i class="fas fa-user-plus"></i> إضافة محفظ جديد';
        }
        
        console.log('[Teachers] Modal opened');
    } else {
        console.error('[Teachers] Modal not found');
        alert('إضافة محفظ جديد - قيد التطوير');
    }
}

// Close teacher modal
window.closeTeacherModal = function() {
    const modal = document.getElementById('teacherModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Handle teacher form submission
document.addEventListener('DOMContentLoaded', function() {
    const teacherForm = document.getElementById('teacherForm');
    if (teacherForm) {
        teacherForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                console.log('[Teachers] Submitting form...');
                
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
                    specialization: document.getElementById('specialization')?.value || null,
                    qualifications: document.getElementById('qualification')?.value || null,
                    experience_years: parseInt(document.getElementById('experience')?.value) || 0,
                    session_rate: parseFloat(document.getElementById('sessionRate')?.value) || 0,
                    status: document.getElementById('status')?.value || 'active',
                    notes: document.getElementById('notes')?.value || null
                };
                
                console.log('[Teachers] Form data:', formData);
                
                const client = window.supabaseClient;
                const teacherId = document.getElementById('teacherId')?.value;
                
                let data, error;
                
                if (teacherId) {
                    // Update existing teacher
                    console.log('[Teachers] Updating teacher:', teacherId);
                    const result = await client
                        .from('teachers')
                        .update(formData)
                        .eq('id', teacherId)
                        .select();
                    
                    data = result.data;
                    error = result.error;
                } else {
                    // Insert new teacher
                    console.log('[Teachers] Adding new teacher');
                    const result = await client
                        .from('teachers')
                        .insert([formData])
                        .select();
                    
                    data = result.data;
                    error = result.error;
                }
                
                if (error) throw error;
                
                console.log('[Teachers] Teacher saved:', data);
                
                // Show success message
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: 'تم الحفظ',
                        text: teacherId ? 'تم تحديث بيانات المحفظ بنجاح' : 'تم إضافة المحفظ بنجاح',
                        timer: 2000,
                        showConfirmButton: false
                    });
                } else {
                    alert(teacherId ? 'تم تحديث بيانات المحفظ بنجاح' : 'تم إضافة المحفظ بنجاح');
                }
                
                // Close modal and reload
                closeTeacherModal();
                await loadTeachers();
                
            } catch (error) {
                console.error('[Teachers] Error saving teacher:', error);
                if (typeof Swal !== 'undefined') {
                    Swal.fire('خطأ', 'حدث خطأ أثناء حفظ البيانات: ' + error.message, 'error');
                } else {
                    alert('حدث خطأ أثناء حفظ البيانات');
                }
            }
        });
    }
});

console.log('[Teachers] ✅ Script loaded');
