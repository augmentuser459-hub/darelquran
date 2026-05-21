// Attendance Page JavaScript
console.log('[Attendance] 🚀 Initializing...');

// Initialize page
async function initAttendancePage() {
    console.log('[Attendance] 📊 Loading page...');
    
    // Initialize Supabase if not already done
    if (!window.supabaseClient) {
        window.supabaseClient = initSupabase();
    }

    // Wait for Supabase to initialize
    await new Promise(resolve => setTimeout(resolve, 500));

    // Set default date to today
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const dateInput = document.getElementById('dateSelect');
    dateInput.value = todayStr;
    dateInput.max = todayStr; // Prevent selecting future dates

    console.log('[Attendance] ✅ Initialization complete');
}

// Load sessions for selected day
async function loadDaySessions() {
    const selectedDate = document.getElementById('dateSelect').value;

    if (!selectedDate) {
        console.log('[Attendance] No date selected');
        return;
    }

    // Validate date is not in the future
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    
    if (selectedDate > todayStr) {
        showError('لا يمكن اختيار تاريخ مستقبلي');
        return;
    }

    try {
        const client = window.supabaseClient;

        // Get all sessions for the selected date with student and teacher info
        const { data: sessions, error } = await client
            .from('sessions')
            .select(`
                *,
                student:students(id, name),
                teacher:teachers(id, name)
            `)
            .eq('session_date', selectedDate)
            .order('session_time', { ascending: true });

        if (error) throw error;

        // Display sessions
        displayDaySessions(sessions, selectedDate);

        console.log('[Attendance] ✅ Sessions loaded:', sessions.length);
    } catch (error) {
        console.error('[Attendance] Error loading sessions:', error);
        showError('فشل تحميل حصص اليوم: ' + error.message);
    }
}

// Display sessions for the day
function displayDaySessions(sessions, date) {
    const tbody = document.getElementById('sessionsTableBody');
    const card = document.getElementById('sessionsTableCard');
    const dateDisplay = document.getElementById('selectedDateDisplay');
    
    // Format date for display
    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString('ar-EG', { weekday: 'long' });
    const formattedDate = dateObj.toLocaleDateString('ar-EG', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    dateDisplay.textContent = `${dayName} ${formattedDate}`;
    card.style.display = 'block';

    if (sessions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">لا توجد حصص في هذا اليوم</td></tr>';
        return;
    }

    tbody.innerHTML = sessions.map((session, index) => {
        // Check if session has been marked (not scheduled)
        const isMarked = session.status !== 'scheduled';
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${session.student?.name || '-'}</td>
                <td>${session.teacher?.name || '-'}</td>
                <td>${session.session_time || '-'}</td>
                <td>
                    <span class="badge badge-${getStatusClass(session.status)}">
                        ${getStatusText(session.status)}
                    </span>
                </td>
                <td>
                    ${isMarked ? 
                        `<span style="color: var(--gray); font-style: italic;">
                            <i class="fas fa-check-circle"></i> تم التسجيل
                        </span>` 
                        : 
                        `<button class="btn btn-sm btn-success" onclick="markAttendance('${session.id}', 'completed')">
                            <i class="fas fa-check"></i> حضر
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="markAttendance('${session.id}', 'student_absent')">
                            <i class="fas fa-times"></i> غاب
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="markAttendance('${session.id}', 'student_excused')">
                            <i class="fas fa-user-clock"></i> اعتذر
                        </button>`
                    }
                </td>
            </tr>
        `;
    }).join('');
}

// Mark attendance
async function markAttendance(sessionId, status) {
    try {
        const client = window.supabaseClient;
        const { error } = await client
            .from('sessions')
            .update({ status: status })
            .eq('id', sessionId);

        if (error) throw error;

        // Reload data
        await loadDaySessions();

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'تم التحديث',
                text: 'تم تسجيل الحضور بنجاح',
                timer: 1500,
                showConfirmButton: false
            });
        }
    } catch (error) {
        console.error('[Attendance] Error marking attendance:', error);
        showError('فشل تسجيل الحضور: ' + error.message);
    }
}

// Helper functions
function getStatusClass(status) {
    const classes = {
        'scheduled': 'warning',
        'completed': 'success',
        'cancelled': 'danger',
        'student_absent': 'danger',
        'student_excused': 'info',
        'teacher_cancelled': 'secondary'
    };
    return classes[status] || 'secondary';
}

function getStatusText(status) {
    const texts = {
        'scheduled': 'مجدولة',
        'completed': 'حضر',
        'cancelled': 'ملغاة',
        'student_absent': 'غاب',
        'student_excused': 'اعتذر',
        'teacher_cancelled': 'ألغاها المحفظ'
    };
    return texts[status] || status;
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

console.log('[Attendance] ✅ Script loaded');
