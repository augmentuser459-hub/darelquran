// Student Details Page
console.log('[Student Details] 🚀 Initializing...');

// Get student ID from URL
const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get('id');

if (!studentId) {
    alert('معرف الطالب مفقود');
    window.location.href = '/pages/students.html';
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async function() {
    if (!window.supabaseClient) {
        window.supabaseClient = initSupabase();
    }
    
    await loadStudentDetails();
});

async function loadStudentDetails() {
    try {
        const client = window.supabaseClient;
        
        const { data: student, error } = await client
            .from('students')
            .select(`
                *,
                country:countries(name_ar, name, currency_symbol),
                teacher:teachers(name),
                pricing:pricing_plans(plan_name_ar, monthly_price, sessions_per_week)
            `)
            .eq('id', studentId)
            .single();

        if (error) throw error;
        
        console.log('[Student Details] Student:', student);
        
        // Display student info (async now)
        await displayStudentInfo(student);
        
        // Load sessions
        await loadRecentSessions();
        
        // Load invoices
        await loadInvoices();
        
    } catch (error) {
        console.error('[Student Details] Error:', error);
        alert('فشل تحميل بيانات الطالب');
    }
}

async function displayStudentInfo(student) {
    // Update page title
    document.title = `${student.name} - تفاصيل الطالب`;
    
    // Update student name in header
    const nameEl = document.getElementById('studentName');
    if (nameEl) nameEl.textContent = student.name;
    
    // Calculate excuse balance correctly
    // الاعتذارات المتبقية = max_excuses_per_month - عدد الاعتذارات المستخدمة هذا الشهر
    const maxExcuses = student.max_excuses_per_month || 4; // Default 4 if not set
    
    // حساب الاعتذارات المستخدمة في الشهر الحالي
    let usedExcuses = 0;
    try {
        const client = window.supabaseClient;
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        
        console.log('[Student Details] Calculating excuses for period:', firstDayOfMonth, 'to', lastDayOfMonth);
        console.log('[Student Details] Student ID:', student.id);
        
        // أولاً: جلب كل الحصص في الشهر الحالي لهذا الطالب
        const { data: allSessions, error: allError } = await client
            .from('sessions')
            .select('id, session_date, status, student_attendance')
            .eq('student_id', student.id)
            .gte('session_date', firstDayOfMonth)
            .lte('session_date', lastDayOfMonth);
        
        console.log('[Student Details] All sessions this month:', allSessions);
        
        if (allError) {
            console.error('[Student Details] Error fetching sessions:', allError);
        }
        
        // حساب الحصص التي تم الاعتذار عنها أو الغياب فيها
        if (allSessions && allSessions.length > 0) {
            // عد الحصص التي فيها غياب أو اعتذار
            usedExcuses = allSessions.filter(session => {
                const isExcused = session.status === 'student_excused' || 
                                 session.status === 'student_absent' ||
                                 session.student_attendance === 'excused' || 
                                 session.student_attendance === 'absent';
                
                if (isExcused) {
                    console.log('[Student Details] Found excuse/absence:', session);
                }
                
                return isExcused;
            }).length;
        }
        
        console.log('[Student Details] Total excuses/absences used:', usedExcuses);
    } catch (error) {
        console.error('[Student Details] Error calculating excuses:', error);
    }
    
    const excusesRemaining = Math.max(0, maxExcuses - usedExcuses);
    
    // Update basic info
    const fields = {
        'fullName': student.name || '-',
        'email': student.email || '-',
        'phone': student.phone || '-',
        'country': student.country?.name_ar || student.country?.name || '-',
        'teacher': student.teacher?.name || '-',
        'pricingPlan': student.pricing ? `${student.pricing.plan_name_ar} (${student.pricing.sessions_per_week} حصص/أسبوع - ${student.pricing.monthly_price} ${student.country?.currency_symbol || 'ريال'})` : '-',
        'status': student.status === 'active' ? 'نشط' : student.status === 'inactive' ? 'غير نشط' : student.status,
        'joinDate': student.enrollment_date || '-',
        'excusesRemaining': excusesRemaining,
        'attendanceRate': (student.attendance_rate || 0) + '%',
        'totalSessions': 0 // سيتم تحديثه من الحصص
    };
    
    Object.entries(fields).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) {
            if (id === 'status') {
                // Add badge styling for status
                const badge = student.status === 'active' ? 'success' : 'secondary';
                el.innerHTML = `<span class="badge badge-${badge}">${value}</span>`;
            } else {
                el.textContent = value;
            }
        }
    });
    
    console.log('[Student Details] ✅ Student info displayed');
    console.log('[Student Details] Excuses - Max:', maxExcuses, 'Used:', usedExcuses, 'Remaining:', excusesRemaining);
}

// Load recent sessions
async function loadRecentSessions() {
    try {
        const client = window.supabaseClient;
        
        const { data: sessions, error } = await client
            .from('sessions')
            .select(`
                *,
                teacher:teachers(name)
            `)
            .eq('student_id', studentId)
            .order('session_date', { ascending: true })
            .order('session_time', { ascending: true })
            .limit(10);

        if (error) throw error;
        
        console.log('[Student Details] Sessions:', sessions);
        
        // Update total sessions count
        const totalSessionsEl = document.getElementById('totalSessions');
        if (totalSessionsEl) {
            totalSessionsEl.textContent = sessions?.length || 0;
        }
        
        // Display sessions
        displayRecentSessions(sessions || []);
        
    } catch (error) {
        console.error('[Student Details] Error loading sessions:', error);
        const tbody = document.getElementById('recentSessionsBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">فشل تحميل الحصص</td></tr>';
        }
    }
}

function displayRecentSessions(sessions) {
    const tbody = document.getElementById('recentSessionsBody');
    
    if (!tbody) return;
    
    if (sessions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">لا توجد حصص</td></tr>';
        return;
    }
    
    tbody.innerHTML = sessions.map(session => {
        const statusText = getSessionStatusText(session.status);
        const statusClass = getSessionStatusClass(session.status);
        const attendanceText = getAttendanceText(session.student_attendance);
        const attendanceClass = getAttendanceClass(session.student_attendance);
        
        return `
            <tr>
                <td>${formatDate(session.session_date)}</td>
                <td>${session.session_time || '-'}</td>
                <td>${session.teacher?.name || '-'}</td>
                <td><span class="badge badge-${statusClass}">${statusText}</span></td>
                <td><span class="badge badge-${attendanceClass}">${attendanceText}</span></td>
                <td>${session.rating ? '⭐'.repeat(session.rating) : '-'}</td>
            </tr>
        `;
    }).join('');
}

// Load invoices
async function loadInvoices() {
    try {
        const client = window.supabaseClient;
        
        const { data: invoices, error } = await client
            .from('invoices')
            .select('*')
            .eq('student_id', studentId)
            .order('year', { ascending: false })
            .order('month', { ascending: false })
            .limit(12);

        if (error) throw error;
        
        console.log('[Student Details] Invoices:', invoices);
        
        // Display invoices
        displayInvoices(invoices || []);
        
    } catch (error) {
        console.error('[Student Details] Error loading invoices:', error);
        const tbody = document.getElementById('invoicesBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">فشل تحميل الفواتير</td></tr>';
        }
    }
}

function displayInvoices(invoices) {
    const tbody = document.getElementById('invoicesBody');
    
    if (!tbody) return;
    
    if (invoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">لا توجد فواتير</td></tr>';
        return;
    }
    
    tbody.innerHTML = invoices.map(invoice => {
        const statusText = getInvoiceStatusText(invoice.status);
        const statusClass = getInvoiceStatusClass(invoice.status);
        const monthName = getMonthName(invoice.month);
        
        return `
            <tr>
                <td>${monthName} ${invoice.year}</td>
                <td>${parseFloat(invoice.total_amount || 0).toFixed(2)} ${invoice.currency_symbol}</td>
                <td>${parseFloat(invoice.amount_paid || 0).toFixed(2)} ${invoice.currency_symbol}</td>
                <td>${parseFloat(invoice.amount_due || 0).toFixed(2)} ${invoice.currency_symbol}</td>
                <td><span class="badge badge-${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewInvoice('${invoice.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG');
}

function getSessionStatusText(status) {
    const statuses = {
        'scheduled': 'مجدولة',
        'in_progress': 'جارية',
        'completed': 'تمت',
        'student_excused': 'اعتذار',
        'teacher_cancelled': 'ملغاة من المحفظ',
        'student_absent': 'غياب',
        'teacher_absent': 'غياب المحفظ',
        'rescheduled': 'تم تغيير الموعد',
        'cancelled': 'ملغاة'
    };
    return statuses[status] || status;
}

function getSessionStatusClass(status) {
    const classes = {
        'scheduled': 'info',
        'in_progress': 'warning',
        'completed': 'success',
        'student_excused': 'warning',
        'teacher_cancelled': 'secondary',
        'student_absent': 'danger',
        'teacher_absent': 'danger',
        'rescheduled': 'info',
        'cancelled': 'secondary'
    };
    return classes[status] || 'secondary';
}

function getAttendanceText(attendance) {
    const texts = {
        'present': 'حاضر',
        'late': 'متأخر',
        'absent': 'غائب',
        'excused': 'معتذر'
    };
    return texts[attendance] || '-';
}

function getAttendanceClass(attendance) {
    const classes = {
        'present': 'success',
        'late': 'warning',
        'absent': 'danger',
        'excused': 'info'
    };
    return classes[attendance] || 'secondary';
}

function getInvoiceStatusText(status) {
    const statuses = {
        'draft': 'مسودة',
        'pending': 'قيد الانتظار',
        'sent': 'تم الإرسال',
        'paid': 'مدفوعة',
        'partial': 'مدفوعة جزئياً',
        'overdue': 'متأخرة',
        'cancelled': 'ملغاة',
        'refunded': 'مسترجعة'
    };
    return statuses[status] || status;
}

function getInvoiceStatusClass(status) {
    const classes = {
        'draft': 'secondary',
        'pending': 'warning',
        'sent': 'info',
        'paid': 'success',
        'partial': 'warning',
        'overdue': 'danger',
        'cancelled': 'secondary',
        'refunded': 'info'
    };
    return classes[status] || 'secondary';
}

function getMonthName(month) {
    const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[month - 1] || month;
}

function viewInvoice(invoiceId) {
    window.location.href = `/pages/invoice-details.html?id=${invoiceId}`;
}

function editStudent() {
    // TODO: Implement edit functionality
    alert('ميزة التعديل قيد التطوير');
}

console.log('[Student Details] ✅ Script loaded');
