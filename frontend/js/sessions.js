// Sessions Page JavaScript
console.log('[Sessions] 🚀 Initializing...');

let sessionsTable = null;
let allSessions = [];

// Initialize sessions page
async function initSessionsPage() {
    console.log('[Sessions] 📊 Initializing sessions page...');
    
    // Initialize Supabase if not already done
    if (!window.supabaseClient) {
        window.supabaseClient = initSupabase();
    }

    // Wait a bit then load data
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Load filters
    await Promise.all([
        loadStudentsFilter(),
        loadTeachersFilter()
    ]);
    
    // Set default date filters to current month
    setDefaultDateFilters();
    
    // Load sessions
    await loadSessions();
}

// Load students for filter
async function loadStudentsFilter() {
    try {
        const client = window.supabaseClient;
        const { data: students, error } = await client
            .from('students')
            .select('id, name')
            .eq('status', 'active')
            .order('name');

        if (error) throw error;

        const select = document.getElementById('studentFilter');
        if (select) {
            select.innerHTML = '<option value="">الكل</option>';
            students?.forEach(s => {
                const option = document.createElement('option');
                option.value = s.id;
                option.textContent = s.name;
                select.appendChild(option);
            });
        }

        console.log('[Sessions] ✅ Students filter loaded');
    } catch (error) {
        console.error('[Sessions] Error loading students:', error);
    }
}

// Load teachers for filter
async function loadTeachersFilter() {
    try {
        const client = window.supabaseClient;
        const { data: teachers, error } = await client
            .from('teachers')
            .select('id, name')
            .eq('status', 'active')
            .order('name');

        if (error) throw error;

        const select = document.getElementById('teacherFilter');
        if (select) {
            select.innerHTML = '<option value="">الكل</option>';
            teachers?.forEach(t => {
                const option = document.createElement('option');
                option.value = t.id;
                option.textContent = t.name;
                select.appendChild(option);
            });
        }

        console.log('[Sessions] ✅ Teachers filter loaded');
    } catch (error) {
        console.error('[Sessions] Error loading teachers:', error);
    }
}

// Set default date filters to current month
function setDefaultDateFilters() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const dateFrom = document.getElementById('dateFromFilter');
    const dateTo = document.getElementById('dateToFilter');
    
    if (dateFrom) dateFrom.value = firstDay.toISOString().split('T')[0];
    if (dateTo) dateTo.value = lastDay.toISOString().split('T')[0];
}

// Generate sessions from scheduled_sessions
async function generateSessionsFromSchedule(startDate, endDate) {
    try {
        const client = window.supabaseClient;
        
        console.log('[Sessions] 📅 Generating sessions from', startDate, 'to', endDate);
        
        // Get all active scheduled sessions
        const { data: scheduledSessions, error } = await client
            .from('scheduled_sessions')
            .select(`
                *,
                student:students(id, name),
                teacher:teachers(id, name)
            `)
            .eq('is_active', true);

        if (error) throw error;

        // Get all existing sessions in the date range (ONE QUERY)
        const { data: existingSessions, error: existingError } = await client
            .from('sessions')
            .select('student_id, session_date, session_time')
            .gte('session_date', startDate)
            .lte('session_date', endDate);

        if (existingError) throw existingError;

        // Create a Set for fast lookup
        const existingSessionsSet = new Set(
            existingSessions?.map(s => `${s.student_id}_${s.session_date}_${s.session_time}`) || []
        );

        const generatedSessions = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Loop through each day in the range
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            const dayOfWeek = date.getDay();
            const dateStr = date.toISOString().split('T')[0];

            // Find scheduled sessions for this day
            const dayScheduled = scheduledSessions.filter(s => {
                const scheduleStart = new Date(s.start_date);
                const scheduleEnd = s.end_date ? new Date(s.end_date) : null;
                
                return s.day_of_week === dayOfWeek &&
                       date >= scheduleStart &&
                       (!scheduleEnd || date <= scheduleEnd);
            });

            // Check if session already exists using Set (FAST)
            for (const scheduled of dayScheduled) {
                const sessionKey = `${scheduled.student_id}_${dateStr}_${scheduled.session_time}`;
                
                if (!existingSessionsSet.has(sessionKey)) {
                    // Create new session
                    generatedSessions.push({
                        scheduled_session_id: scheduled.id,
                        student_id: scheduled.student_id,
                        teacher_id: scheduled.teacher_id,
                        session_date: dateStr,
                        session_time: scheduled.session_time,
                        session_duration: scheduled.session_duration,
                        status: 'scheduled',
                        session_type: 'regular',
                        is_online: scheduled.is_online || false
                    });
                }
            }
        }

        // Insert generated sessions in one batch
        if (generatedSessions.length > 0) {
            const { data, error: insertError } = await client
                .from('sessions')
                .insert(generatedSessions)
                .select();

            if (insertError) throw insertError;

            console.log('[Sessions] ✅ Generated', data.length, 'new sessions');
        } else {
            console.log('[Sessions] ℹ️ No new sessions to generate');
        }

    } catch (error) {
        console.error('[Sessions] Error generating sessions:', error);
    }
}

// Load sessions data
async function loadSessions() {
    try {
        const client = window.supabaseClient;
        if (!client) {
            console.error('[Sessions] ❌ Supabase client not initialized');
            return;
        }

        // Get date filters
        const dateFrom = document.getElementById('dateFromFilter')?.value;
        const dateTo = document.getElementById('dateToFilter')?.value;

        // توليد الحصص الفعلية من الجدول الأسبوعي تلقائياً
        if (dateFrom && dateTo) {
            await generateSessionsFromSchedule(dateFrom, dateTo);
        }

        console.log('[Sessions] 📡 Fetching sessions...');

        let query = client
            .from('sessions')
            .select(`
                *,
                student:students(id, name),
                teacher:teachers(id, name)
            `)
            .order('session_date', { ascending: false })
            .order('session_time', { ascending: true });

        // Apply date filters
        if (dateFrom) {
            query = query.gte('session_date', dateFrom);
        }
        if (dateTo) {
            query = query.lte('session_date', dateTo);
        }

        const { data: sessions, error } = await query;

        if (error) {
            console.error('[Sessions] ❌ Error:', error);
            throw error;
        }

        console.log('[Sessions] ✅ Loaded', sessions?.length || 0, 'sessions');
        console.log('[Sessions] 📊 Session types breakdown:');
        console.log('  - Regular (from schedule):', sessions?.filter(s => !s.is_makeup && s.scheduled_session_id).length || 0);
        console.log('  - Makeup:', sessions?.filter(s => s.is_makeup === true).length || 0);
        console.log('  - Extra (one-time, no schedule):', sessions?.filter(s => !s.is_makeup && !s.scheduled_session_id).length || 0);
        
        // Log sessions by student with details
        const studentGroups = {};
        sessions?.forEach(s => {
            const studentName = s.student?.name || 'Unknown';
            if (!studentGroups[studentName]) {
                studentGroups[studentName] = { 
                    total: 0, 
                    regular: 0, 
                    makeup: 0, 
                    extra: 0,
                    sessions: []
                };
            }
            studentGroups[studentName].total++;
            studentGroups[studentName].sessions.push({
                date: s.session_date,
                time: s.session_time,
                type: s.is_makeup ? 'makeup' : (s.scheduled_session_id ? 'regular' : 'extra'),
                status: s.status
            });
            
            if (s.is_makeup) {
                studentGroups[studentName].makeup++;
            } else if (s.scheduled_session_id) {
                studentGroups[studentName].regular++;
            } else {
                studentGroups[studentName].extra++;
            }
        });
        console.log('[Sessions] 👥 Sessions by student:', studentGroups);
        
        // Log all sessions for debugging
        console.table(sessions?.map(s => ({
            'التاريخ': s.session_date,
            'الوقت': s.session_time,
            'الطالب': s.student?.name,
            'النوع': s.is_makeup ? '🔄 تعويضية' : (s.scheduled_session_id ? '📅 عادية' : '➕ إضافية'),
            'الحالة': s.status,
            'scheduled_id': s.scheduled_session_id ? '✓' : '✗',
            'is_makeup': s.is_makeup ? '✓' : '✗'
        })));

        allSessions = sessions || [];
        
        // Update stats
        updateStats(allSessions);

        // Display sessions
        displaySessions(allSessions);

    } catch (error) {
        console.error('[Sessions] Error loading sessions:', error);
        showError('فشل تحميل بيانات الحصص: ' + error.message);
    }
}

// Update stats
function updateStats(sessions) {
    const total = sessions.length;
    const completed = sessions.filter(s => s.status === 'completed').length;
    const scheduled = sessions.filter(s => s.status === 'scheduled').length;
    const cancelled = sessions.filter(s => s.status === 'cancelled' || s.status === 'student_absent').length;

    document.getElementById('totalSessions').textContent = total;
    document.getElementById('completedSessions').textContent = completed;
    document.getElementById('scheduledSessions').textContent = scheduled;
    document.getElementById('cancelledSessions').textContent = cancelled;
}

// Filter sessions
function filterSessions() {
    const studentFilter = document.getElementById('studentFilter')?.value;
    const teacherFilter = document.getElementById('teacherFilter')?.value;
    const statusFilter = document.getElementById('statusFilter')?.value;

    console.log('[Sessions] Filtering:', { studentFilter, teacherFilter, statusFilter });

    let filtered = [...allSessions];

    if (studentFilter) {
        filtered = filtered.filter(s => s.student_id === studentFilter);
        console.log('[Sessions] After student filter:', filtered.length);
    }

    if (teacherFilter) {
        filtered = filtered.filter(s => s.teacher_id === teacherFilter);
        console.log('[Sessions] After teacher filter:', filtered.length);
    }

    if (statusFilter) {
        filtered = filtered.filter(s => s.status === statusFilter);
        console.log('[Sessions] After status filter:', filtered.length);
    }

    console.log('[Sessions] Final filtered count:', filtered.length);

    // Update stats with filtered data
    updateStats(filtered);
    
    // Display filtered sessions
    displaySessions(filtered);
}

// Clear filters
function clearFilters() {
    document.getElementById('studentFilter').value = '';
    document.getElementById('statusFilter').value = '';
    setDefaultDateFilters();
    loadSessions();
}

// Display sessions in table
function displaySessions(sessions) {
    const tbody = document.getElementById('sessionsTableBody') || 
                  document.querySelector('#sessionsTable tbody');
    
    if (!tbody) {
        console.error('[Sessions] ❌ Table body not found');
        return;
    }

    if (sessions.length === 0) {
        if (sessionsTable) {
            sessionsTable.clear().draw();
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;"><i class="fas fa-info-circle"></i><br>لا توجد حصص في الفترة المحددة</td></tr>';
        }
        return;
    }

    // Sort sessions: by date (ascending), then by time (ascending)
    const sortedSessions = [...sessions].sort((a, b) => {
        const dateCompare = (a.session_date || '').localeCompare(b.session_date || '');
        if (dateCompare !== 0) return dateCompare;
        return (a.session_time || '').localeCompare(b.session_time || '');
    });

    // Prepare rows data
    const rowsData = sortedSessions.map(session => {
        let sessionTypeLabel = '';
        let sessionTypeColor = '';
        
        if (session.is_makeup) {
            sessionTypeLabel = 'تعويضية';
            sessionTypeColor = 'warning';
        } else if (session.scheduled_session_id) {
            sessionTypeLabel = 'عادية';
            sessionTypeColor = 'info';
        } else {
            sessionTypeLabel = 'إضافية';
            sessionTypeColor = 'success';
        }
        
        return [
            formatDate(session.session_date),
            session.session_time || '-',
            session.student?.name || '-',
            session.teacher?.name || '-',
            `<span class="badge badge-${getStatusClass(session.status)}">${getStatusText(session.status)}</span>`,
            `<span class="badge badge-${sessionTypeColor}" style="font-size: 0.9rem;">${sessionTypeLabel}</span>`
        ];
    });

    // If DataTable is already initialized, just update its data (FAST)
    if (sessionsTable) {
        sessionsTable.clear();
        sessionsTable.rows.add(rowsData);
        sessionsTable.draw();
        console.log('[Sessions] ✅ DataTable updated with', sortedSessions.length, 'sessions');
        return;
    }

    // Build initial table HTML if DataTable is NOT yet initialized
    tbody.innerHTML = sortedSessions.map(session => {
        let sessionTypeLabel = session.is_makeup ? 'تعويضية' : (session.scheduled_session_id ? 'عادية' : 'إضافية');
        let sessionTypeColor = session.is_makeup ? 'warning' : (session.scheduled_session_id ? 'info' : 'success');
        
        return `
            <tr>
                <td>${formatDate(session.session_date)}</td>
                <td>${session.session_time || '-'}</td>
                <td>${session.student?.name || '-'}</td>
                <td>${session.teacher?.name || '-'}</td>
                <td>
                    <span class="badge badge-${getStatusClass(session.status)}">
                        ${getStatusText(session.status)}
                    </span>
                </td>
                <td>
                    <span class="badge badge-${sessionTypeColor}" style="font-size: 0.9rem;">
                        ${sessionTypeLabel}
                    </span>
                </td>
            </tr>
        `;
    }).join('');

    // Initialize DataTable for the first time
    setTimeout(() => {
        try {
            if (typeof $.fn.DataTable !== 'undefined' && $('#sessionsTable').length) {
                sessionsTable = $('#sessionsTable').DataTable({
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
                    ordering: false,      // Disable sorting completely
                    pageLength: 25,
                    lengthChange: false,
                    searching: false,
                    destroy: true
                });
                
                console.log('[Sessions] ✅ DataTable initialized with', sortedSessions.length, 'sessions (sorted by date & time)');
            }
        } catch (e) {
            console.warn('[Sessions] DataTable initialization skipped:', e.message);
        }
    }, 50);
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayName = days[date.getDay()];
    return `${dayName} ${date.toLocaleDateString('ar-EG')}`;
}

function getStatusClass(status) {
    const classes = {
        'scheduled': 'warning',
        'completed': 'success',
        'cancelled': 'danger',
        'student_absent': 'danger',
        'student_excused': 'secondary',
        'teacher_cancelled': 'danger'
    };
    return classes[status] || 'secondary';
}

function getStatusText(status) {
    const texts = {
        'scheduled': 'مجدولة',
        'completed': 'حضر',
        'cancelled': 'ملغاة',
        'student_absent': 'غائب',
        'student_excused': 'معتذر',
        'teacher_cancelled': 'ألغاها المحفظ'
    };
    return texts[status] || status;
}

function showAddSessionModal() {
    Swal.fire({
        icon: 'info',
        title: 'إضافة حصة',
        text: 'لإضافة حصص جديدة، يرجى الذهاب إلى صفحة الجدول الأسبوعي',
        confirmButtonText: 'الذهاب للجدول الأسبوعي',
        showCancelButton: true,
        cancelButtonText: 'إلغاء'
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = '/pages/scheduled-sessions.html';
        }
    });
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

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSessionsPage);
} else {
    initSessionsPage();
}

console.log('[Sessions] ✅ Script loaded');
