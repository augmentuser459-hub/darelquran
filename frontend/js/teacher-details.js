// Teacher Details Page
console.log('[Teacher Details] 🚀 Initializing...');

// Get teacher ID from URL
const urlParams = new URLSearchParams(window.location.search);
const teacherId = urlParams.get('id');

if (!teacherId) {
    alert('معرف المحفظ مفقود');
    window.location.href = '/pages/teachers.html';
}

let sessionsChart = null;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async function() {
    if (!window.supabaseClient) {
        window.supabaseClient = initSupabase();
    }
    
    await loadTeacherDetails();
});

async function loadTeacherDetails() {
    try {
        const client = window.supabaseClient;
        
        const { data: teacher, error } = await client
            .from('teachers')
            .select('*')
            .eq('id', teacherId)
            .single();

        if (error) throw error;
        
        console.log('[Teacher Details] Teacher:', teacher);
        
        // Display teacher info
        displayTeacherInfo(teacher);
        
        // Load students
        await loadTeacherStudents();
        
        // Load schedule
        await loadTeacherSchedule();
        
        // Load sessions stats
        await loadSessionsStats();
        
    } catch (error) {
        console.error('[Teacher Details] Error:', error);
        alert('فشل تحميل بيانات المحفظ');
    }
}

function displayTeacherInfo(teacher) {
    // Update page title
    document.title = `${teacher.name} - تفاصيل المحفظ`;
    
    // Update teacher name in header
    const nameEl = document.getElementById('teacherName');
    if (nameEl) nameEl.textContent = teacher.name;
    
    // Update basic info
    const fields = {
        'fullName': teacher.name || '-',
        'email': teacher.email || '-',
        'phone': teacher.phone || '-',
        'specialization': teacher.specialization || '-',
        'qualification': teacher.qualification || '-',
        'experience': teacher.years_of_experience ? `${teacher.years_of_experience} سنة` : '-',
        'status': teacher.status === 'active' ? 'نشط' : teacher.status === 'inactive' ? 'غير نشط' : teacher.status,
        'hireDate': teacher.hire_date || '-'
    };
    
    Object.entries(fields).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) {
            if (id === 'status') {
                const badge = teacher.status === 'active' ? 'success' : 'secondary';
                el.innerHTML = `<span class="badge badge-${badge}">${value}</span>`;
            } else {
                el.textContent = value;
            }
        }
    });
    
    console.log('[Teacher Details] ✅ Teacher info displayed');
}

async function loadTeacherStudents() {
    try {
        const client = window.supabaseClient;
        
        const { data: students, error } = await client
            .from('students')
            .select(`
                *,
                country:countries(name_ar, name)
            `)
            .eq('preferred_teacher_id', teacherId)
            .order('name');

        if (error) throw error;
        
        console.log('[Teacher Details] Students:', students);
        
        // Update total students count
        const totalStudentsEl = document.getElementById('totalStudents');
        if (totalStudentsEl) {
            totalStudentsEl.textContent = students?.length || 0;
        }
        
        // Display students
        displayStudents(students || []);
        
    } catch (error) {
        console.error('[Teacher Details] Error loading students:', error);
        const tbody = document.getElementById('studentsBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">فشل تحميل الطلبة</td></tr>';
        }
    }
}

function displayStudents(students) {
    const tbody = document.getElementById('studentsBody');
    
    if (!tbody) return;
    
    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">لا يوجد طلبة</td></tr>';
        return;
    }
    
    tbody.innerHTML = students.map(student => {
        const statusText = student.status === 'active' ? 'نشط' : 'غير نشط';
        const statusClass = student.status === 'active' ? 'success' : 'secondary';
        
        return `
            <tr>
                <td>${student.name}</td>
                <td>${student.email || '-'}</td>
                <td>${student.country?.name_ar || student.country?.name || '-'}</td>
                <td><span class="badge badge-${statusClass}">${statusText}</span></td>
                <td>${student.attendance_rate || 0}%</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewStudent('${student.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function loadTeacherSchedule() {
    try {
        const client = window.supabaseClient;
        
        const { data: schedule, error } = await client
            .from('scheduled_sessions')
            .select(`
                *,
                student:students(name)
            `)
            .eq('teacher_id', teacherId)
            .eq('is_active', true)
            .order('day_of_week')
            .order('session_time');

        if (error) throw error;
        
        console.log('[Teacher Details] Schedule:', schedule);
        
        // Display schedule
        displaySchedule(schedule || []);
        
    } catch (error) {
        console.error('[Teacher Details] Error loading schedule:', error);
        const tbody = document.getElementById('scheduleBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">فشل تحميل الجدول</td></tr>';
        }
    }
}

function displaySchedule(schedule) {
    const tbody = document.getElementById('scheduleBody');
    
    if (!tbody) return;
    
    if (schedule.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">لا يوجد جدول</td></tr>';
        return;
    }
    
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    
    tbody.innerHTML = schedule.map(item => {
        const statusText = item.is_active ? 'نشط' : 'غير نشط';
        const statusClass = item.is_active ? 'success' : 'secondary';
        
        return `
            <tr>
                <td>${days[item.day_of_week]}</td>
                <td>${item.session_time}</td>
                <td>${item.student?.name || '-'}</td>
                <td><span class="badge badge-${statusClass}">${statusText}</span></td>
            </tr>
        `;
    }).join('');
}

async function loadSessionsStats() {
    try {
        const client = window.supabaseClient;
        
        // جلب كل الحصص للمحفظ (فقط الحصص التي حضرها الطالب)
        const { data: allSessions, error } = await client
            .from('sessions')
            .select('id, session_date, status, student_attendance, session_type')
            .eq('teacher_id', teacherId);

        if (error) throw error;
        
        console.log('[Teacher Details] All sessions:', allSessions);
        
        // فلترة الحصص: استبعاد الحصص التي غاب فيها الطالب أو اعتذر
        const validSessions = allSessions.filter(session => {
            // استبعاد الحصص التي فيها غياب أو اعتذار من الطالب
            const isStudentAbsent = session.status === 'student_absent' || 
                                   session.status === 'student_excused' ||
                                   session.student_attendance === 'absent' ||
                                   session.student_attendance === 'excused';
            
            return !isStudentAbsent;
        });
        
        console.log('[Teacher Details] Valid sessions (excluding student absences):', validSessions);
        
        // Update total sessions count (all valid sessions)
        const totalSessionsEl = document.getElementById('totalSessionsEl');
        if (totalSessionsEl) {
            totalSessionsEl.textContent = validSessions.length;
        }
        
        // حساب الحصص المكتملة (الحصص اللي فعلاً اشتغلها المحفظ)
        const completedSessions = validSessions.filter(s => s.status === 'completed');
        
        console.log('[Teacher Details] Completed sessions:', completedSessions.length);
        
        const completedSessionsEl = document.getElementById('completedSessions');
        if (completedSessionsEl) {
            completedSessionsEl.textContent = completedSessions.length;
        }
        
        // رسم الإحصائيات الشهرية
        await drawSessionsChart(validSessions);
        
    } catch (error) {
        console.error('[Teacher Details] Error loading sessions stats:', error);
    }
}

async function drawSessionsChart(sessions) {
    const canvas = document.getElementById('sessionsChart');
    if (!canvas) return;
    
    // تجميع الحصص حسب الشهر
    const monthlyData = {};
    const now = new Date();
    
    // آخر 6 شهور
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[key] = 0;
    }
    
    // عد الحصص لكل شهر
    sessions.forEach(session => {
        const date = new Date(session.session_date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData.hasOwnProperty(key)) {
            monthlyData[key]++;
        }
    });
    
    const labels = Object.keys(monthlyData).map(key => {
        const [year, month] = key.split('-');
        return getMonthName(parseInt(month));
    });
    
    const data = Object.values(monthlyData);
    
    // Update total in card
    const totalSessionsEl = document.getElementById('totalSessions');
    if (totalSessionsEl) {
        totalSessionsEl.textContent = sessions.length;
    }
    
    // Destroy existing chart
    if (sessionsChart) {
        sessionsChart.destroy();
    }
    
    // Create new chart
    sessionsChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'عدد الحصص',
                data: data,
                borderColor: '#c9a961',
                backgroundColor: 'rgba(201, 169, 97, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function getMonthName(month) {
    const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[month - 1] || month;
}

function viewStudent(studentId) {
    window.location.href = `/pages/student-details.html?id=${studentId}`;
}

function editTeacher() {
    // TODO: Implement edit functionality
    alert('ميزة التعديل قيد التطوير');
}

console.log('[Teacher Details] ✅ Script loaded');
