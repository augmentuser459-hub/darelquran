// Scheduled Sessions Page JavaScript
console.log('[Scheduled Sessions] 🚀 Initializing...');

let scheduledSessionsTable = null;

// Initialize page
async function initScheduledSessionsPage() {
    console.log('[Scheduled Sessions] 📊 Loading data...');

    // Initialize Supabase if not already done
    if (!window.supabaseClient) {
        window.supabaseClient = initSupabase();
    }

    // Wait for Supabase to initialize
    await new Promise(resolve => setTimeout(resolve, 500));

    // Load data
    await Promise.all([
        loadTeachers(),
        loadStudents(),
        loadScheduledSessions()
    ]);

    console.log('[Scheduled Sessions] ✅ Initialization complete');
}

// Load teachers
async function loadTeachers() {
    try {
        const client = window.supabaseClient;
        const { data: teachers, error } = await client
            .from('teachers')
            .select('id, name')
            .eq('status', 'active')
            .order('name');

        if (error) throw error;

        console.log('[Scheduled Sessions] ✅ Teachers loaded:', teachers?.length || 0);
    } catch (error) {
        console.error('[Scheduled Sessions] Error loading teachers:', error);
    }
}

// Load students
async function loadStudents() {
    try {
        const client = window.supabaseClient;
        const { data: students, error } = await client
            .from('students')
            .select('id, name, preferred_teacher_id, pricing_plan_id')
            .eq('status', 'active')
            .order('name');

        if (error) throw error;

        // Populate dropdowns
        const extraSelect = document.getElementById('extraStudent');
        const monthlySelect = document.getElementById('monthlyStudent');

        if (extraSelect) {
            extraSelect.innerHTML = '<option value="">اختر الطالب</option>';
            students?.forEach(student => {
                const option = document.createElement('option');
                option.value = student.id;
                option.textContent = student.name;
                option.dataset.teacherId = student.preferred_teacher_id || '';
                option.dataset.pricingPlanId = student.pricing_plan_id || '';
                extraSelect.appendChild(option);
            });
        }

        if (monthlySelect) {
            monthlySelect.innerHTML = '<option value="">اختر الطالب</option>';
            students?.forEach(student => {
                const option = document.createElement('option');
                option.value = student.id;
                option.textContent = student.name;
                option.dataset.teacherId = student.preferred_teacher_id || '';
                option.dataset.pricingPlanId = student.pricing_plan_id || '';
                monthlySelect.appendChild(option);
            });
        }

        console.log('[Scheduled Sessions] ✅ Students loaded:', students?.length || 0);
    } catch (error) {
        console.error('[Scheduled Sessions] Error loading students:', error);
    }
}

// Load scheduled sessions
async function loadScheduledSessions() {
    try {
        const client = window.supabaseClient;

        if (!client) {
            console.error('[Scheduled Sessions] ❌ Supabase client not initialized');
            const tbody = document.getElementById('scheduledSessionsTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">خطأ: لم يتم تهيئة الاتصال بقاعدة البيانات</td></tr>';
            }
            return;
        }

        console.log('[Scheduled Sessions] 📡 Fetching sessions...');

        const { data: sessions, error } = await client
            .from('scheduled_sessions')
            .select(`
                *,
                student:students(id, name),
                teacher:teachers(id, name)
            `)
            .order('day_of_week')
            .order('session_time');

        if (error) {
            console.error('[Scheduled Sessions] ❌ Error:', error);
            throw error;
        }

        console.log('[Scheduled Sessions] ✅ Loaded', sessions?.length || 0, 'scheduled sessions');

        // Update stats
        updateStats(sessions || []);

        // Display sessions
        displayScheduledSessions(sessions || []);

        // Initialize DataTable
        setTimeout(() => {
            try {
                if (typeof $.fn.DataTable !== 'undefined' && $('#scheduledSessionsTable').length) {
                    // Check if table has data
                    const tbody = $('#scheduledSessionsTable tbody tr');
                    if (tbody.length === 0 || tbody.find('td[colspan]').length > 0) {
                        console.log('[Scheduled Sessions] ⏭️ Skipping DataTable - no data');
                        return;
                    }

                    if (scheduledSessionsTable) {
                        scheduledSessionsTable.destroy();
                    }

                    scheduledSessionsTable = $('#scheduledSessionsTable').DataTable({
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
                            zeroRecords: "لا توجد نتائج"
                        },
                        order: [[0, 'asc']],
                        pageLength: 25
                    });
                    console.log('[Scheduled Sessions] ✅ DataTable initialized');
                }
            } catch (e) {
                console.warn('[Scheduled Sessions] DataTable initialization skipped:', e.message);
            }
        }, 500);

    } catch (error) {
        console.error('[Scheduled Sessions] Error loading scheduled sessions:', error);
        const tbody = document.getElementById('scheduledSessionsTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">
                <i class="fas fa-exclamation-triangle"></i><br>
                خطأ في تحميل البيانات: ${error.message}<br>
                <small>تحقق من Console (F12) لمزيد من التفاصيل</small>
            </td></tr>`;
        }
        showError('فشل تحميل بيانات الجدول: ' + error.message);
    }
}

// Update stats
function updateStats(sessions) {
    const totalScheduled = sessions.length;
    const activeSessions = sessions.filter(s => s.is_active).length;
    const inactiveSessions = sessions.filter(s => !s.is_active).length;
    const uniqueStudents = new Set(sessions.map(s => s.student_id)).size;

    document.getElementById('totalScheduledSessions').textContent = totalScheduled;
    document.getElementById('activeScheduledSessions').textContent = activeSessions;
    document.getElementById('inactiveScheduledSessions').textContent = inactiveSessions;
    document.getElementById('totalStudentsInSchedule').textContent = uniqueStudents;
}

// Display scheduled sessions
function displayScheduledSessions(sessions) {
    const tbody = document.getElementById('scheduledSessionsTableBody');

    if (!tbody) {
        console.error('[Scheduled Sessions] ❌ Table body not found');
        return;
    }

    if (sessions.length === 0) {
        if (scheduledSessionsTable) {
            scheduledSessionsTable.clear().draw();
        } else {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;"><i class="fas fa-info-circle"></i><br>لا توجد حصص مجدولة<br><small>يمكنك إضافة حصص جديدة من الأزرار أعلاه</small></td></tr>';
        }
        return;
    }

    if (scheduledSessionsTable) {
        const rowsData = sessions.map(session => {
            return [
                getDayName(session.day_of_week),
                session.session_time || '-',
                session.student?.name || '-',
                session.teacher?.name || '-',
                `${session.session_duration || 60} دقيقة`,
                `<span class="badge badge-${session.is_active ? 'success' : 'secondary'}">
                    ${session.is_active ? 'نشط' : 'غير نشط'}
                </span>`,
                `<button class="btn btn-sm btn-warning" onclick="editScheduledSession('${session.id}')" title="تعديل">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteScheduledSession('${session.id}')" title="حذف">
                    <i class="fas fa-trash"></i>
                </button>`
            ];
        });
        scheduledSessionsTable.clear();
        scheduledSessionsTable.rows.add(rowsData);
        scheduledSessionsTable.draw();
        return;
    }

    tbody.innerHTML = sessions.map(session => {
        try {
            return `
                <tr>
                    <td>${getDayName(session.day_of_week)}</td>
                    <td>${session.session_time || '-'}</td>
                    <td>${session.student?.name || '-'}</td>
                    <td>${session.teacher?.name || '-'}</td>
                    <td>${session.session_duration || 60} دقيقة</td>
                    <td>
                        <span class="badge badge-${session.is_active ? 'success' : 'secondary'}">
                            ${session.is_active ? 'نشط' : 'غير نشط'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-warning" onclick="editScheduledSession('${session.id}')" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteScheduledSession('${session.id}')" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        } catch (err) {
            console.error('[Scheduled Sessions] Error rendering session:', session, err);
            return '';
        }
    }).join('');
}

// Show add extra session modal
function showAddExtraSessionModal() {
    document.getElementById('extraSessionModal').style.display = 'flex';
    document.getElementById('extraSessionForm').reset();
    document.getElementById('extraStudentInfo').style.display = 'none';

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('extraDate').value = today;
}

// Close extra session modal
function closeExtraSessionModal() {
    document.getElementById('extraSessionModal').style.display = 'none';
}

// On extra student change
async function onExtraStudentChange() {
    const select = document.getElementById('extraStudent');
    const selectedOption = select.options[select.selectedIndex];

    if (!selectedOption.value) {
        document.getElementById('extraStudentInfo').style.display = 'none';
        return;
    }

    const teacherId = selectedOption.dataset.teacherId;

    try {
        const client = window.supabaseClient;
        const { data: teacher, error } = await client
            .from('teachers')
            .select('name')
            .eq('id', teacherId)
            .single();

        if (error) throw error;

        document.getElementById('extraTeacher').value = teacherId;
        document.getElementById('extraTeacherName').textContent = teacher.name;
        document.getElementById('extraStudentInfo').style.display = 'block';
    } catch (error) {
        console.error('[Scheduled Sessions] Error loading teacher:', error);
    }
}

// Handle extra session form submit
document.addEventListener('DOMContentLoaded', () => {
    const extraForm = document.getElementById('extraSessionForm');
    if (extraForm) {
        extraForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveExtraSession();
        });
    }
});

// Save extra session
async function saveExtraSession() {
    const studentId = document.getElementById('extraStudent').value;
    const teacherId = document.getElementById('extraTeacher').value;
    const date = document.getElementById('extraDate').value;
    const time = document.getElementById('extraTime').value;
    const duration = parseInt(document.getElementById('extraDuration').value || 60);

    if (!studentId || !teacherId || !date || !time) {
        showError('يرجى ملء جميع الحقول المطلوبة');
        return;
    }

    try {
        Swal.fire({
            title: 'جاري الحفظ...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const client = window.supabaseClient;

        // Insert directly into sessions table (not scheduled_sessions)
        // This is a one-time extra session, not a recurring scheduled session
        const { data, error } = await client
            .from('sessions')
            .insert({
                student_id: studentId,
                teacher_id: teacherId,
                session_date: date,
                session_time: time,
                session_duration: duration,
                status: 'scheduled',
                session_type: 'regular',
                is_makeup: false,
                is_online: false
                // NO scheduled_session_id - this marks it as an extra session
            })
            .select()
            .single();

        if (error) throw error;

        console.log('[Scheduled Sessions] ✅ Extra session created in sessions table:', data);

        closeExtraSessionModal();

        Swal.fire({
            icon: 'success',
            title: 'تم بنجاح!',
            text: 'تم إضافة الحصة الإضافية',
            timer: 2000,
            showConfirmButton: false
        });

        // Reload data
        await loadScheduledSessions();

    } catch (error) {
        console.error('[Scheduled Sessions] Error saving extra session:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'فشل حفظ الحصة: ' + error.message
        });
    }
}

// Generate monthly schedule
function generateMonthlySchedule() {
    const modal = document.getElementById('monthlyScheduleModal');
    modal.style.display = 'flex';
}

// Close monthly schedule modal
function closeMonthlyScheduleModal() {
    document.getElementById('monthlyScheduleModal').style.display = 'none';
}

// On monthly student change
async function onMonthlyStudentChange() {
    const select = document.getElementById('monthlyStudent');
    const selectedOption = select.options[select.selectedIndex];

    if (!selectedOption.value) {
        document.getElementById('monthlyStudentInfo').style.display = 'none';
        document.getElementById('monthlySessionsContainer').innerHTML = '';
        return;
    }

    const teacherId = selectedOption.dataset.teacherId;
    const pricingPlanId = selectedOption.dataset.pricingPlanId;

    try {
        const client = window.supabaseClient;

        // Get teacher
        const { data: teacher, error: teacherError } = await client
            .from('teachers')
            .select('name')
            .eq('id', teacherId)
            .single();

        if (teacherError) throw teacherError;

        // Get pricing plan
        const { data: pricingPlan, error: planError } = await client
            .from('pricing_plans')
            .select('sessions_per_week')
            .eq('id', pricingPlanId)
            .single();

        if (planError) throw planError;

        const sessionsPerWeek = pricingPlan.sessions_per_week || 2;
        const totalSessions = sessionsPerWeek * 4; // تقريباً 4 أسابيع في الشهر

        document.getElementById('monthlyTeacher').value = teacherId;
        document.getElementById('monthlyTeacherName').textContent = teacher.name;
        document.getElementById('monthlySessionsPerWeek').textContent = sessionsPerWeek;
        document.getElementById('monthlyTotalSessions').textContent = totalSessions;
        document.getElementById('monthlySessionsCount').value = sessionsPerWeek;
        document.getElementById('monthlyStudentInfo').style.display = 'block';

        // Generate session time inputs
        generateSessionTimeInputs(sessionsPerWeek);
    } catch (error) {
        console.error('[Scheduled Sessions] Error loading student info:', error);
        showError('فشل تحميل بيانات الطالب: ' + error.message);
    }
}

// Generate session time inputs
function generateSessionTimeInputs(sessionsPerWeek) {
    const container = document.getElementById('monthlySessionsContainer');

    const daysOfWeek = [
        { value: 0, name: 'الأحد' },
        { value: 1, name: 'الاثنين' },
        { value: 2, name: 'الثلاثاء' },
        { value: 3, name: 'الأربعاء' },
        { value: 4, name: 'الخميس' },
        { value: 5, name: 'الجمعة' },
        { value: 6, name: 'السبت' }
    ];

    let html = `
        <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 0.5rem; border: 2px solid var(--border-color);">
            <h4 style="color: var(--primary-color); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-calendar-week"></i>
                حدد أوقات الحصص الأسبوعية (${sessionsPerWeek} حصص)
            </h4>
            <div style="display: grid; gap: 1rem;">
    `;

    for (let i = 0; i < sessionsPerWeek; i++) {
        html += `
            <div style="background: white; padding: 1rem; border-radius: 0.5rem; border: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; color: var(--primary-color); font-weight: 600;">
                    <i class="fas fa-clock"></i>
                    <span>الحصة ${i + 1}</span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 100px; gap: 1rem;">
                    <div class="form-group">
                        <label class="form-label" style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">
                            <i class="fas fa-calendar-day"></i> اليوم *
                        </label>
                        <select id="sessionDay${i}" class="form-control" required style="width: 100%; padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 0.5rem;">
                            <option value="">اختر اليوم</option>
                            ${daysOfWeek.map(day => `<option value="${day.value}">${day.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">
                            <i class="fas fa-clock"></i> الوقت *
                        </label>
                        <input type="time" id="sessionTime${i}" class="form-control" required style="width: 100%; padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 0.5rem;">
                    </div>
                    <div class="form-group">
                        <label class="form-label" style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem;">
                            <i class="fas fa-hourglass-half"></i> المدة
                        </label>
                        <input type="number" id="sessionDuration${i}" class="form-control" value="60" min="15" max="180" style="width: 100%; padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 0.5rem;">
                    </div>
                </div>
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// Save monthly schedule
async function saveMonthlySchedule() {
    const studentId = document.getElementById('monthlyStudent').value;
    const teacherId = document.getElementById('monthlyTeacher').value;
    const sessionsCount = parseInt(document.getElementById('monthlySessionsCount').value);

    if (!studentId || !teacherId) {
        showError('يرجى اختيار الطالب أولاً');
        return;
    }

    // Collect session data
    const sessions = [];
    let hasErrors = false;

    for (let i = 0; i < sessionsCount; i++) {
        const dayElement = document.getElementById(`sessionDay${i}`);
        const timeElement = document.getElementById(`sessionTime${i}`);
        const durationElement = document.getElementById(`sessionDuration${i}`);

        if (!dayElement || !timeElement) {
            console.error(`Missing elements for session ${i}`);
            continue;
        }

        const day = dayElement.value;
        const time = timeElement.value;
        const duration = parseInt(durationElement?.value || 60);

        if (!day || !time) {
            showError(`يرجى تحديد اليوم والوقت للحصة ${i + 1}`);
            hasErrors = true;
            break;
        }

        sessions.push({
            student_id: studentId,
            teacher_id: teacherId,
            day_of_week: parseInt(day),
            session_time: time,
            session_duration: duration,
            is_active: true,
            is_recurring: true,
            start_date: new Date().toISOString().split('T')[0]
        });
    }

    if (hasErrors || sessions.length === 0) {
        return;
    }

    try {
        // Show loading
        Swal.fire({
            title: 'جاري الحفظ...',
            text: 'يتم إنشاء الجدول الشهري',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const client = window.supabaseClient;

        // Insert all sessions
        const { data, error } = await client
            .from('scheduled_sessions')
            .insert(sessions)
            .select();

        if (error) throw error;

        console.log('[Scheduled Sessions] ✅ Created', data.length, 'sessions');

        // Close modal and reload
        closeMonthlyScheduleModal();

        Swal.fire({
            icon: 'success',
            title: 'تم بنجاح!',
            text: `تم إنشاء ${data.length} حصة في الجدول الأسبوعي`,
            timer: 2000,
            showConfirmButton: false
        });

        // Reload data
        await loadScheduledSessions();

    } catch (error) {
        console.error('[Scheduled Sessions] Error saving schedule:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'فشل حفظ الجدول: ' + error.message
        });
    }
}

// Helper functions
function getDayName(dayNumber) {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[dayNumber] || dayNumber;
}

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

function editScheduledSession(id) {
    console.log('[Scheduled Sessions] Edit session:', id);
    showEditSessionModal(id);
}

// Show edit session modal
async function showEditSessionModal(sessionId) {
    try {
        const client = window.supabaseClient;

        // Get session data
        const { data: session, error } = await client
            .from('scheduled_sessions')
            .select(`
                *,
                student:students(id, name),
                teacher:teachers(id, name)
            `)
            .eq('id', sessionId)
            .single();

        if (error) throw error;

        // Create modal HTML
        const modalHtml = `
            <div id="editSessionModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; overflow-y: auto; padding: 1rem; align-items: center; justify-content: center;">
                <div style="max-width: 600px; width: 100%; background: white; border-radius: 1rem; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
                    <div style="padding: 1.5rem; border-bottom: 2px solid var(--border-color);">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h2 style="color: var(--primary-color); margin: 0; font-size: 1.3rem;">
                                <i class="fas fa-edit"></i>
                                تعديل الحصة المجدولة
                            </h2>
                            <button onclick="closeEditSessionModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--gray);">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div style="padding: 1.5rem; max-height: calc(90vh - 200px); overflow-y: auto;">
                        <div style="background: #e3f2fd; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem; border-right: 4px solid #2196f3;">
                            <div style="margin-bottom: 0.5rem;">
                                <strong><i class="fas fa-user-graduate"></i> الطالب:</strong>
                                <span>${session.student?.name || '-'}</span>
                            </div>
                            <div>
                                <strong><i class="fas fa-chalkboard-teacher"></i> المحفظ:</strong>
                                <span>${session.teacher?.name || '-'}</span>
                            </div>
                        </div>
                        
                        <form id="editSessionForm">
                            <input type="hidden" id="editSessionId" value="${sessionId}">
                            <input type="hidden" id="editStudentId" value="${session.student_id}">
                            <input type="hidden" id="editTeacherId" value="${session.teacher_id}">
                            
                            <div style="display: grid; gap: 1rem;">
                                <div class="form-group">
                                    <label class="form-label" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                                        <i class="fas fa-calendar-day"></i> اليوم *
                                    </label>
                                    <select id="editDayOfWeek" class="form-control" required style="width: 100%; padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 0.5rem; font-size: 1rem;">
                                        <option value="0" ${session.day_of_week === 0 ? 'selected' : ''}>الأحد</option>
                                        <option value="1" ${session.day_of_week === 1 ? 'selected' : ''}>الاثنين</option>
                                        <option value="2" ${session.day_of_week === 2 ? 'selected' : ''}>الثلاثاء</option>
                                        <option value="3" ${session.day_of_week === 3 ? 'selected' : ''}>الأربعاء</option>
                                        <option value="4" ${session.day_of_week === 4 ? 'selected' : ''}>الخميس</option>
                                        <option value="5" ${session.day_of_week === 5 ? 'selected' : ''}>الجمعة</option>
                                        <option value="6" ${session.day_of_week === 6 ? 'selected' : ''}>السبت</option>
                                    </select>
                                </div>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                    <div class="form-group">
                                        <label class="form-label" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                                            <i class="fas fa-clock"></i> الوقت *
                                        </label>
                                        <input type="time" id="editSessionTime" class="form-control" value="${session.session_time}" required style="width: 100%; padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 0.5rem; font-size: 1rem;">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                                            <i class="fas fa-hourglass-half"></i> المدة (دقيقة)
                                        </label>
                                        <input type="number" id="editSessionDuration" class="form-control" value="${session.session_duration || 60}" min="15" max="180" style="width: 100%; padding: 0.75rem; border: 2px solid var(--border-color); border-radius: 0.5rem; font-size: 1rem;">
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                        <input type="checkbox" id="editIsActive" ${session.is_active ? 'checked' : ''} style="width: 20px; height: 20px;">
                                        <span style="font-weight: 600;">الحصة نشطة</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div id="conflictWarning" style="display: none; background: #fff3cd; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem; border-right: 4px solid #ffc107;">
                                <p style="margin: 0; color: #856404; font-size: 0.95rem;">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <strong>تحذير:</strong> <span id="conflictMessage"></span>
                                </p>
                            </div>
                            
                            <div style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: flex-end; flex-wrap: wrap;">
                                <button type="button" onclick="closeEditSessionModal()" class="btn" style="background: var(--gray); color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; flex: 1; min-width: 120px;">
                                    <i class="fas fa-times"></i> إلغاء
                                </button>
                                <button type="submit" class="btn btn-primary" style="padding: 0.75rem 1.5rem; border: none; border-radius: 0.5rem; cursor: pointer; flex: 1; min-width: 120px;">
                                    <i class="fas fa-save"></i> حفظ التعديلات
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            
            <style>
                @media (max-width: 768px) {
                    #editSessionModal > div {
                        margin: 1rem;
                        max-width: 100%;
                    }
                    #editSessionModal > div > div:first-child {
                        padding: 1rem;
                    }
                    #editSessionModal > div > div:first-child h2 {
                        font-size: 1.1rem;
                    }
                    #editSessionModal > div > div:last-child {
                        padding: 1rem;
                    }
                    #editSessionModal form > div > div[style*="grid-template-columns"] {
                        grid-template-columns: 1fr !important;
                    }
                    #editSessionModal .form-control {
                        font-size: 0.9rem !important;
                        padding: 0.6rem !important;
                    }
                    #editSessionModal button {
                        font-size: 0.9rem !important;
                        padding: 0.6rem 1rem !important;
                    }
                }
                
                @media (max-width: 480px) {
                    #editSessionModal > div {
                        margin: 0.5rem;
                    }
                    #editSessionModal > div > div:first-child h2 {
                        font-size: 1rem;
                    }
                    #editSessionModal .form-control {
                        font-size: 0.85rem !important;
                        padding: 0.5rem !important;
                    }
                    #editSessionModal button {
                        font-size: 0.85rem !important;
                        padding: 0.5rem 0.8rem !important;
                        min-width: 100px !important;
                    }
                }
            </style>
        `;

        // Add modal to page
        const existingModal = document.getElementById('editSessionModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Add event listeners
        const form = document.getElementById('editSessionForm');
        form.addEventListener('submit', handleEditSessionSubmit);

        // Add change listeners for conflict detection
        const daySelect = document.getElementById('editDayOfWeek');
        const timeInput = document.getElementById('editSessionTime');

        daySelect.addEventListener('change', checkForConflicts);
        timeInput.addEventListener('change', checkForConflicts);

    } catch (error) {
        console.error('[Scheduled Sessions] Error loading session:', error);
        showError('فشل تحميل بيانات الحصة: ' + error.message);
    }
}

// Close edit session modal
function closeEditSessionModal() {
    const modal = document.getElementById('editSessionModal');
    if (modal) {
        modal.remove();
    }
}

// Check for conflicts
async function checkForConflicts() {
    const sessionId = document.getElementById('editSessionId').value;
    const teacherId = document.getElementById('editTeacherId').value;
    const dayOfWeek = parseInt(document.getElementById('editDayOfWeek').value);
    const sessionTime = document.getElementById('editSessionTime').value;
    const duration = parseInt(document.getElementById('editSessionDuration').value || 60);

    if (!sessionTime) return;

    try {
        const client = window.supabaseClient;

        // Get all sessions for this teacher on the same day
        const { data: sessions, error } = await client
            .from('scheduled_sessions')
            .select(`
                *,
                student:students(name)
            `)
            .eq('teacher_id', teacherId)
            .eq('day_of_week', dayOfWeek)
            .eq('is_active', true)
            .neq('id', sessionId);

        if (error) throw error;

        // Check for time conflicts
        const [newHour, newMinute] = sessionTime.split(':').map(Number);
        const newStartMinutes = newHour * 60 + newMinute;
        const newEndMinutes = newStartMinutes + duration;

        const conflicts = sessions.filter(session => {
            const [existingHour, existingMinute] = session.session_time.split(':').map(Number);
            const existingStartMinutes = existingHour * 60 + existingMinute;
            const existingEndMinutes = existingStartMinutes + (session.session_duration || 60);

            // Check if times overlap
            return (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes);
        });

        const warningDiv = document.getElementById('conflictWarning');
        const messageSpan = document.getElementById('conflictMessage');
        const submitButton = document.querySelector('#editSessionForm button[type="submit"]');

        if (conflicts.length > 0) {
            const conflict = conflicts[0];
            messageSpan.textContent = `هذا الموعد محجوز مع الطالب "${conflict.student?.name}" في نفس اليوم والوقت. لا يمكن الحفظ.`;
            warningDiv.style.display = 'block';
            warningDiv.style.background = '#f8d7da';
            warningDiv.style.borderRightColor = '#dc3545';
            messageSpan.style.color = '#721c24';
            submitButton.disabled = true;
            submitButton.style.opacity = '0.5';
            submitButton.style.cursor = 'not-allowed';
        } else {
            warningDiv.style.display = 'none';
            submitButton.disabled = false;
            submitButton.style.opacity = '1';
            submitButton.style.cursor = 'pointer';
        }

    } catch (error) {
        console.error('[Scheduled Sessions] Error checking conflicts:', error);
    }
}

// Handle edit session form submit
async function handleEditSessionSubmit(e) {
    e.preventDefault();

    const sessionId = document.getElementById('editSessionId').value;
    const studentId = document.getElementById('editStudentId').value;
    const dayOfWeek = parseInt(document.getElementById('editDayOfWeek').value);
    const sessionTime = document.getElementById('editSessionTime').value;
    const duration = parseInt(document.getElementById('editSessionDuration').value || 60);
    const isActive = document.getElementById('editIsActive').checked;

    try {
        Swal.fire({
            title: 'جاري الحفظ...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const client = window.supabaseClient;

        // Get old session data before update
        const { data: oldSession, error: fetchError } = await client
            .from('scheduled_sessions')
            .select('day_of_week, session_time, student_id')
            .eq('id', sessionId)
            .single();

        if (fetchError) throw fetchError;

        // Update scheduled_sessions table
        const { data, error } = await client
            .from('scheduled_sessions')
            .update({
                day_of_week: dayOfWeek,
                session_time: sessionTime,
                session_duration: duration,
                is_active: isActive
            })
            .eq('id', sessionId)
            .select()
            .single();

        if (error) throw error;

        console.log('[Scheduled Sessions] ✅ Session updated:', data);

        // Update future sessions in sessions table
        // Use scheduled_session_id to directly find linked sessions
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        
        const oldDayOfWeek = oldSession.day_of_week;
        const dayChanged = oldDayOfWeek !== dayOfWeek;
        
        console.log('[Scheduled Sessions] 🔍 Updating future sessions...');
        console.log('[Scheduled Sessions] 📅 Old day:', oldDayOfWeek, '→ New day:', dayOfWeek, '(changed:', dayChanged, ')');
        console.log('[Scheduled Sessions] ⏰ New time:', sessionTime);
        console.log('[Scheduled Sessions] 📆 Starting from date:', todayStr);
        
        // Get all future sessions linked to this scheduled session by scheduled_session_id
        const { data: futureSessions, error: sessionsError } = await client
            .from('sessions')
            .select('id, session_date, session_time')
            .eq('scheduled_session_id', sessionId)
            .gte('session_date', todayStr)
            .in('status', ['scheduled'])
            .order('session_date', { ascending: true });

        if (sessionsError) {
            console.error('[Scheduled Sessions] ❌ Error fetching future sessions:', sessionsError);
        } else if (futureSessions && futureSessions.length > 0) {
            console.log('[Scheduled Sessions] 📋 Found', futureSessions.length, 'future sessions to update');
            
            for (const session of futureSessions) {
                const updateData = { session_time: sessionTime };
                
                // If day of week changed, recalculate the session date
                if (dayChanged) {
                    const sessionDate = new Date(session.session_date + 'T00:00:00');
                    let diff = dayOfWeek - oldDayOfWeek;
                    // Adjust to find nearest occurrence of new day
                    if (diff < -3) diff += 7;
                    if (diff > 3) diff -= 7;
                    if (diff === 0) diff = 0; // same day, no change needed
                    sessionDate.setDate(sessionDate.getDate() + diff);
                    updateData.session_date = sessionDate.toISOString().split('T')[0];
                    console.log(`[Scheduled Sessions] 📝 Session ${session.id}: ${session.session_date} → ${updateData.session_date}, time: ${session.session_time} → ${sessionTime}`);
                } else {
                    console.log(`[Scheduled Sessions] 📝 Session ${session.id}: ${session.session_date}, time: ${session.session_time} → ${sessionTime}`);
                }
                
                const { error: updateError } = await client
                    .from('sessions')
                    .update(updateData)
                    .eq('id', session.id);

                if (updateError) {
                    console.error('[Scheduled Sessions] ❌ Error updating session:', session.id, updateError);
                } else {
                    console.log('[Scheduled Sessions] ✅ Updated session', session.id);
                }
            }
            
            console.log('[Scheduled Sessions] ✅ All future sessions updated successfully');
        } else {
            console.log('[Scheduled Sessions] ℹ️ No future scheduled sessions found linked to this scheduled session');
        }

        closeEditSessionModal();

        Swal.fire({
            icon: 'success',
            title: 'تم بنجاح!',
            text: 'تم تحديث الحصة والحصص المستقبلية بنجاح',
            timer: 2000,
            showConfirmButton: false
        });

        // Reload data
        await loadScheduledSessions();

    } catch (error) {
        console.error('[Scheduled Sessions] Error updating session:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'فشل تحديث الحصة: ' + error.message
        });
    }
}

async function deleteScheduledSession(id) {
    console.log('[Scheduled Sessions] Delete session:', id);

    const result = await Swal.fire({
        title: 'هل أنت متأكد؟',
        text: 'سيتم حذف هذه الحصة من الجدول الأسبوعي',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'نعم، احذف',
        cancelButtonText: 'إلغاء'
    });

    if (!result.isConfirmed) {
        return;
    }

    try {
        Swal.fire({
            title: 'جاري الحذف...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const client = window.supabaseClient;
        const { error } = await client
            .from('scheduled_sessions')
            .delete()
            .eq('id', id);

        if (error) throw error;

        Swal.fire({
            icon: 'success',
            title: 'تم الحذف!',
            text: 'تم حذف الحصة بنجاح',
            timer: 2000,
            showConfirmButton: false
        });

        // Reload data
        await loadScheduledSessions();

    } catch (error) {
        console.error('[Scheduled Sessions] Error deleting session:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'فشل حذف الحصة: ' + error.message
        });
    }
}

// Filter scheduled sessions by name
function filterScheduledSessions() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim().toLowerCase();

    if (scheduledSessionsTable) {
        // Use DataTable search if initialized
        scheduledSessionsTable.search(searchTerm).draw();
    } else {
        // Manual filtering if DataTable not initialized
        const tbody = document.getElementById('scheduledSessionsTableBody');
        const rows = tbody.getElementsByTagName('tr');

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            // Skip loading/empty rows
            if (row.cells.length < 3) continue;

            const studentName = row.cells[2].textContent.toLowerCase();
            const teacherName = row.cells[3].textContent.toLowerCase();

            if (studentName.includes(searchTerm) || teacherName.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    }
}

// Clear search
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = '';
    filterScheduledSessions();
}

console.log('[Scheduled Sessions] ✅ Script loaded');
