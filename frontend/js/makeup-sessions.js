// Makeup Sessions Page JavaScript
console.log('[Makeup Sessions] 🚀 Initializing...');

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('[Makeup Sessions] 📊 Loading data...');
    
    // Initialize Supabase if not already done
    if (!window.supabaseClient) {
        window.supabaseClient = initSupabase();
    }

    // Wait for Supabase to initialize
    await new Promise(resolve => setTimeout(resolve, 500));

    // Load makeup sessions
    await loadMakeupSessions();

    console.log('[Makeup Sessions] ✅ Initialization complete');
});

// Load makeup sessions
async function loadMakeupSessions() {
    try {
        const client = window.supabaseClient;
        
        if (!client) {
            console.error('[Makeup Sessions] ❌ Supabase client not initialized');
            return;
        }
        
        console.log('[Makeup Sessions] 📡 Fetching data...');
        
        // Get all makeup sessions first to know which original sessions have makeup scheduled
        const { data: allMakeupSessions, error: makeupError } = await client
            .from('sessions')
            .select('makeup_for_session_id')
            .eq('is_makeup', true);
        
        if (makeupError) {
            console.error('[Makeup Sessions] ❌ Error loading makeup sessions:', makeupError);
            throw makeupError;
        }
        
        // Get IDs of sessions that already have makeup scheduled (filter out nulls)
        const sessionsWithMakeup = allMakeupSessions
            ?.filter(s => s.makeup_for_session_id != null)
            .map(s => s.makeup_for_session_id) || [];
        
        console.log('[Makeup Sessions] Sessions with makeup already scheduled:', sessionsWithMakeup.length);
        
        // Get sessions that need makeup (absent or cancelled) and don't have makeup scheduled yet
        let needMakeupQuery = client
            .from('sessions')
            .select('*, student:students(name), teacher:teachers(name)')
            .in('status', ['student_absent', 'student_excused', 'teacher_cancelled', 'cancelled'])
            .eq('is_makeup', false)
            .order('session_date', { ascending: false })
            .limit(50);
        
        // Exclude sessions that already have makeup scheduled
        if (sessionsWithMakeup.length > 0) {
            needMakeupQuery = needMakeupQuery.not('id', 'in', `(${sessionsWithMakeup.join(',')})`);
        }
        
        const { data: needMakeup, error: error1 } = await needMakeupQuery;

        if (error1) {
            console.error('[Makeup Sessions] ❌ Error loading need makeup:', error1);
            throw error1;
        }

        // Get scheduled makeup sessions
        const { data: scheduled, error: error2 } = await client
            .from('sessions')
            .select('*, student:students(name), teacher:teachers(name)')
            .eq('is_makeup', true)
            .eq('status', 'scheduled')
            .order('session_date', { ascending: true })
            .limit(50);

        if (error2) {
            console.error('[Makeup Sessions] ❌ Error loading scheduled:', error2);
            throw error2;
        }

        // Get completed makeup sessions
        const { data: completed, error: error3 } = await client
            .from('sessions')
            .select('*, student:students(name), teacher:teachers(name)')
            .eq('is_makeup', true)
            .eq('status', 'completed')
            .order('session_date', { ascending: false })
            .limit(50);

        if (error3) {
            console.error('[Makeup Sessions] ❌ Error loading completed:', error3);
            throw error3;
        }

        console.log('[Makeup Sessions] ✅ Need makeup:', needMakeup?.length || 0);
        console.log('[Makeup Sessions] ✅ Scheduled:', scheduled?.length || 0);
        console.log('[Makeup Sessions] ✅ Completed:', completed?.length || 0);

        // Update stats
        document.getElementById('needMakeupCount').textContent = needMakeup?.length || 0;
        document.getElementById('scheduledMakeupCount').textContent = scheduled?.length || 0;
        document.getElementById('completedMakeupCount').textContent = completed?.length || 0;

        // Display data
        displayNeedMakeup(needMakeup || []);
        displayScheduled(scheduled || []);
        displayCompleted(completed || []);

        console.log('[Makeup Sessions] ✅ Data loaded');
    } catch (error) {
        console.error('[Makeup Sessions] Error loading data:', error);
        
        // Show error in UI
        const containers = ['needMakeupContainer', 'scheduledContainer', 'completedContainer'];
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: red;">
                        <i class="fas fa-exclamation-triangle"></i><br>
                        خطأ في تحميل البيانات: ${error.message}<br>
                        <small>تحقق من Console (F12) لمزيد من التفاصيل</small>
                    </div>
                `;
            }
        });
    }
}

// Display sessions that need makeup
function displayNeedMakeup(sessions) {
    const container = document.getElementById('needMakeupContainer');
    
    if (!container) {
        console.error('[Makeup Sessions] ❌ Container not found');
        return;
    }
    
    if (sessions.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;"><i class="fas fa-check-circle"></i><br>لا توجد حصص تحتاج تعويض</p>';
        return;
    }

    container.innerHTML = sessions.map(session => {
        try {
            return `
                <div class="makeup-card">
                    <div class="makeup-header">
                        <div class="makeup-info">
                            <div class="makeup-date">${formatDate(session.session_date)}</div>
                            <div class="makeup-reason">السبب: ${getStatusText(session.status)}</div>
                            <div class="makeup-details">
                                <div><i class="fas fa-user-graduate"></i> ${session.student?.name || '-'}</div>
                                <div><i class="fas fa-chalkboard-teacher"></i> ${session.teacher?.name || '-'}</div>
                                <div><i class="fas fa-clock"></i> ${session.session_time || '-'}</div>
                            </div>
                        </div>
                    </div>
                    <div class="makeup-actions">
                        <button class="btn btn-primary" onclick="scheduleMakeup('${session.id}')">
                            <i class="fas fa-calendar-plus"></i> جدولة حصة تعويضية
                        </button>
                    </div>
                </div>
            `;
        } catch (err) {
            console.error('[Makeup Sessions] Error rendering session:', session, err);
            return '';
        }
    }).join('');
}

// Display scheduled makeup sessions
function displayScheduled(sessions) {
    const container = document.getElementById('scheduledContainer');
    
    if (sessions.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">لا توجد حصص مجدولة</p>';
        return;
    }

    container.innerHTML = sessions.map(session => `
        <div class="makeup-card">
            <div class="makeup-header">
                <div class="makeup-info">
                    <div class="makeup-date">${session.session_date}</div>
                    <div class="makeup-details">
                        <div><i class="fas fa-user-graduate"></i> ${session.student?.name || '-'}</div>
                        <div><i class="fas fa-chalkboard-teacher"></i> ${session.teacher?.name || '-'}</div>
                        <div><i class="fas fa-clock"></i> ${session.session_time || '-'}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Display completed makeup sessions
function displayCompleted(sessions) {
    const container = document.getElementById('completedContainer');
    
    if (sessions.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: #666;">لا توجد حصص مكتملة</p>';
        return;
    }

    container.innerHTML = sessions.map(session => `
        <div class="makeup-card">
            <div class="makeup-header">
                <div class="makeup-info">
                    <div class="makeup-date">${session.session_date}</div>
                    <div class="makeup-details">
                        <div><i class="fas fa-user-graduate"></i> ${session.student?.name || '-'}</div>
                        <div><i class="fas fa-chalkboard-teacher"></i> ${session.teacher?.name || '-'}</div>
                        <div><i class="fas fa-clock"></i> ${session.session_time || '-'}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Switch tabs
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG');
}

function getStatusText(status) {
    const texts = {
        'student_absent': 'غياب الطالب',
        'student_excused': 'اعتذار الطالب',
        'teacher_cancelled': 'إلغاء من المحفظ',
        'cancelled': 'ملغاة',
        'scheduled': 'مجدولة',
        'completed': 'مكتملة'
    };
    return texts[status] || status;
}

// Schedule makeup session
async function scheduleMakeup(sessionId) {
    console.log('[Makeup Sessions] Schedule makeup for session:', sessionId);
    
    try {
        const client = window.supabaseClient;
        
        // Get original session details
        const { data: originalSession, error } = await client
            .from('sessions')
            .select('*, student:students(id, name), teacher:teachers(id, name)')
            .eq('id', sessionId)
            .single();
        
        if (error) throw error;
        
        // Show modal with pre-filled data
        const result = await Swal.fire({
            title: `
                <div style="display: flex; align-items: center; gap: 1rem; justify-content: center; color: #1a5f7a;">
                    <i class="fas fa-calendar-plus" style="font-size: 2rem;"></i>
                    <span>جدولة حصة تعويضية</span>
                </div>
            `,
            html: `
                <div style="text-align: right; padding: 0.5rem;">
                    <!-- Original Session Info -->
                    <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 1.5rem; border-radius: 1rem; margin-bottom: 1.5rem; border: 2px solid #dee2e6; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 2px solid #dee2e6;">
                            <div style="background: linear-gradient(135deg, #1a5f7a, #159895); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(26, 95, 122, 0.3);">
                                <i class="fas fa-info-circle" style="color: white; font-size: 1.2rem;"></i>
                            </div>
                            <h4 style="color: #1a5f7a; margin: 0; font-size: 1.1rem; font-weight: 700;">معلومات الحصة الأصلية</h4>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; font-size: 0.95rem;">
                            <div style="background: white; padding: 0.75rem; border-radius: 0.5rem; border-right: 3px solid #1a5f7a;">
                                <div style="color: #6c757d; font-size: 0.85rem; margin-bottom: 0.25rem;">
                                    <i class="fas fa-user-graduate"></i> الطالب
                                </div>
                                <div style="font-weight: 700; color: #1a5f7a;">${originalSession.student?.name || '-'}</div>
                            </div>
                            <div style="background: white; padding: 0.75rem; border-radius: 0.5rem; border-right: 3px solid #159895;">
                                <div style="color: #6c757d; font-size: 0.85rem; margin-bottom: 0.25rem;">
                                    <i class="fas fa-chalkboard-teacher"></i> المحفظ
                                </div>
                                <div style="font-weight: 700; color: #159895;">${originalSession.teacher?.name || '-'}</div>
                            </div>
                            <div style="background: white; padding: 0.75rem; border-radius: 0.5rem; border-right: 3px solid #f39c12;">
                                <div style="color: #6c757d; font-size: 0.85rem; margin-bottom: 0.25rem;">
                                    <i class="fas fa-calendar"></i> التاريخ
                                </div>
                                <div style="font-weight: 700; color: #f39c12;">${formatDate(originalSession.session_date)}</div>
                            </div>
                            <div style="background: white; padding: 0.75rem; border-radius: 0.5rem; border-right: 3px solid #e74c3c;">
                                <div style="color: #6c757d; font-size: 0.85rem; margin-bottom: 0.25rem;">
                                    <i class="fas fa-exclamation-circle"></i> السبب
                                </div>
                                <div style="font-weight: 700; color: #e74c3c;">${getStatusText(originalSession.status)}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- New Session Form -->
                    <div style="background: white; padding: 1.5rem; border-radius: 1rem; border: 2px solid #dee2e6;">
                        <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 2px solid #dee2e6;">
                            <div style="background: linear-gradient(135deg, #28a745, #20c997); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);">
                                <i class="fas fa-calendar-check" style="color: white; font-size: 1.2rem;"></i>
                            </div>
                            <h4 style="color: #28a745; margin: 0; font-size: 1.1rem; font-weight: 700;">موعد الحصة التعويضية</h4>
                        </div>
                        
                        <div style="display: grid; gap: 1.25rem;">
                            <div>
                                <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                    <i class="fas fa-calendar" style="color: #1a5f7a;"></i>
                                    <span>تاريخ الحصة التعويضية</span>
                                    <span style="color: #e74c3c;">*</span>
                                </label>
                                <input type="date" id="makeup-date" class="swal2-input" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; font-size: 1rem; transition: all 0.3s;" onfocus="this.style.borderColor='#1a5f7a'" onblur="this.style.borderColor='#dee2e6'" required>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div>
                                    <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                        <i class="fas fa-clock" style="color: #159895;"></i>
                                        <span>الوقت</span>
                                        <span style="color: #e74c3c;">*</span>
                                    </label>
                                    <input type="time" id="makeup-time" class="swal2-input" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; font-size: 1rem; transition: all 0.3s;" onfocus="this.style.borderColor='#159895'" onblur="this.style.borderColor='#dee2e6'" value="${originalSession.session_time || '10:00'}" required>
                                </div>
                                
                                <div>
                                    <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                        <i class="fas fa-hourglass-half" style="color: #f39c12;"></i>
                                        <span>المدة (دقيقة)</span>
                                    </label>
                                    <input type="number" id="makeup-duration" class="swal2-input" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; font-size: 1rem; transition: all 0.3s;" onfocus="this.style.borderColor='#f39c12'" onblur="this.style.borderColor='#dee2e6'" value="${originalSession.session_duration || 60}" min="15" max="180">
                                </div>
                            </div>
                            
                            <div>
                                <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                    <i class="fas fa-sticky-note" style="color: #6c757d;"></i>
                                    <span>ملاحظات</span>
                                    <span style="color: #6c757d; font-size: 0.85rem; font-weight: 400;">(اختياري)</span>
                                </label>
                                <textarea id="makeup-notes" class="swal2-textarea" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; font-size: 0.95rem; resize: vertical; min-height: 80px; transition: all 0.3s;" onfocus="this.style.borderColor='#6c757d'" onblur="this.style.borderColor='#dee2e6'" placeholder="أضف أي ملاحظات إضافية هنا..."></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            width: '700px',
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-check-circle"></i> جدولة الحصة',
            cancelButtonText: '<i class="fas fa-times-circle"></i> إلغاء',
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            customClass: {
                popup: 'swal-rtl',
                confirmButton: 'swal-confirm-btn',
                cancelButton: 'swal-cancel-btn'
            },
            didOpen: () => {
                // Set minimum date to today
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('makeup-date').min = today;
                document.getElementById('makeup-date').value = today;
                
                // Add custom styles
                const style = document.createElement('style');
                style.textContent = `
                    .swal-rtl { font-family: 'Cairo', sans-serif !important; }
                    .swal-confirm-btn { 
                        padding: 0.75rem 2rem !important; 
                        font-size: 1rem !important; 
                        font-weight: 600 !important;
                        border-radius: 0.5rem !important;
                        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3) !important;
                        transition: all 0.3s !important;
                    }
                    .swal-confirm-btn:hover {
                        transform: translateY(-2px) !important;
                        box-shadow: 0 6px 16px rgba(40, 167, 69, 0.4) !important;
                    }
                    .swal-cancel-btn { 
                        padding: 0.75rem 2rem !important; 
                        font-size: 1rem !important; 
                        font-weight: 600 !important;
                        border-radius: 0.5rem !important;
                        transition: all 0.3s !important;
                    }
                    .swal-cancel-btn:hover {
                        transform: translateY(-2px) !important;
                    }
                `;
                document.head.appendChild(style);
            },
            preConfirm: () => {
                const date = document.getElementById('makeup-date').value;
                const time = document.getElementById('makeup-time').value;
                const duration = document.getElementById('makeup-duration').value;
                const notes = document.getElementById('makeup-notes').value;
                
                if (!date || !time) {
                    Swal.showValidationMessage('⚠️ يرجى ملء جميع الحقول المطلوبة');
                    return false;
                }
                
                return { date, time, duration, notes };
            }
        });
        
        if (result.isConfirmed) {
            const { date, time, duration, notes } = result.value;
            
            // Show loading
            Swal.fire({
                title: 'جاري الحفظ...',
                html: '<div style="padding: 1rem;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #1a5f7a;"></i></div>',
                allowOutsideClick: false,
                showConfirmButton: false
            });
            
            // Create makeup session
            const { data: newSession, error: insertError } = await client
                .from('sessions')
                .insert({
                    student_id: originalSession.student_id,
                    teacher_id: originalSession.teacher_id,
                    session_date: date,
                    session_time: time,
                    session_duration: parseInt(duration),
                    status: 'scheduled',
                    session_type: 'makeup',
                    is_makeup: true,
                    makeup_for_session_id: sessionId,
                    teacher_notes: notes || null
                })
                .select()
                .single();
            
            if (insertError) throw insertError;
            
            console.log('[Makeup Sessions] ✅ Makeup session created:', newSession);
            
            Swal.fire({
                icon: 'success',
                title: '<div style="color: #28a745;">تم بنجاح!</div>',
                html: '<div style="font-size: 1.1rem; color: #495057;">تم جدولة الحصة التعويضية بنجاح</div>',
                timer: 2000,
                showConfirmButton: false,
                customClass: {
                    popup: 'swal-rtl'
                }
            });
            
            // Reload data
            await loadMakeupSessions();
        }
        
    } catch (error) {
        console.error('[Makeup Sessions] Error scheduling makeup:', error);
        Swal.fire({
            icon: 'error',
            title: '<div style="color: #e74c3c;">خطأ</div>',
            html: `<div style="font-size: 1rem; color: #495057;">فشل جدولة الحصة التعويضية<br><small style="color: #6c757d;">${error.message}</small></div>`,
            confirmButtonColor: '#e74c3c',
            customClass: {
                popup: 'swal-rtl'
            }
        });
    }
}

async function showScheduleMakeupModal() {
    try {
        const client = window.supabaseClient;
        
        // Load students and teachers
        const [studentsRes, teachersRes] = await Promise.all([
            client.from('students').select('id, name').eq('status', 'active').order('name'),
            client.from('teachers').select('id, name').eq('status', 'active').order('name')
        ]);
        
        if (studentsRes.error) throw studentsRes.error;
        if (teachersRes.error) throw teachersRes.error;
        
        const students = studentsRes.data || [];
        const teachers = teachersRes.data || [];
        
        const result = await Swal.fire({
            title: '<i class="fas fa-calendar-plus"></i> جدولة حصة تعويضية جديدة',
            html: `
                <div style="text-align: right; padding: 1rem;">
                    <div style="display: grid; gap: 1rem;">
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; text-align: right;">
                                <i class="fas fa-user-graduate"></i> الطالب *
                            </label>
                            <select id="new-student" class="swal2-input" style="width: 100%; margin: 0;" required>
                                <option value="">اختر الطالب</option>
                                ${students.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; text-align: right;">
                                <i class="fas fa-chalkboard-teacher"></i> المحفظ *
                            </label>
                            <select id="new-teacher" class="swal2-input" style="width: 100%; margin: 0;" required>
                                <option value="">اختر المحفظ</option>
                                ${teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; text-align: right;">
                                <i class="fas fa-calendar"></i> التاريخ *
                            </label>
                            <input type="date" id="new-date" class="swal2-input" style="width: 100%; margin: 0;" required>
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; text-align: right;">
                                <i class="fas fa-clock"></i> الوقت *
                            </label>
                            <input type="time" id="new-time" class="swal2-input" style="width: 100%; margin: 0;" value="10:00" required>
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; text-align: right;">
                                <i class="fas fa-hourglass-half"></i> المدة (دقيقة)
                            </label>
                            <input type="number" id="new-duration" class="swal2-input" style="width: 100%; margin: 0;" value="60" min="15" max="180">
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; text-align: right;">
                                <i class="fas fa-sticky-note"></i> ملاحظات
                            </label>
                            <textarea id="new-notes" class="swal2-textarea" style="width: 100%; margin: 0;" rows="3" placeholder="ملاحظات إضافية (اختياري)"></textarea>
                        </div>
                    </div>
                </div>
            `,
            width: '600px',
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-save"></i> جدولة الحصة',
            cancelButtonText: '<i class="fas fa-times"></i> إلغاء',
            confirmButtonColor: '#1a5f7a',
            cancelButtonColor: '#6c757d',
            didOpen: () => {
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('new-date').min = today;
                document.getElementById('new-date').value = today;
            },
            preConfirm: () => {
                const studentId = document.getElementById('new-student').value;
                const teacherId = document.getElementById('new-teacher').value;
                const date = document.getElementById('new-date').value;
                const time = document.getElementById('new-time').value;
                const duration = document.getElementById('new-duration').value;
                const notes = document.getElementById('new-notes').value;
                
                if (!studentId || !teacherId || !date || !time) {
                    Swal.showValidationMessage('يرجى ملء جميع الحقول المطلوبة');
                    return false;
                }
                
                return { studentId, teacherId, date, time, duration, notes };
            }
        });
        
        if (result.isConfirmed) {
            const { studentId, teacherId, date, time, duration, notes } = result.value;
            
            Swal.fire({
                title: 'جاري الحفظ...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            const { data, error } = await client
                .from('sessions')
                .insert({
                    student_id: studentId,
                    teacher_id: teacherId,
                    session_date: date,
                    session_time: time,
                    session_duration: parseInt(duration),
                    status: 'scheduled',
                    session_type: 'makeup',
                    is_makeup: true,
                    teacher_notes: notes || null
                })
                .select()
                .single();
            
            if (error) throw error;
            
            Swal.fire({
                icon: 'success',
                title: 'تم بنجاح!',
                text: 'تم جدولة الحصة التعويضية',
                timer: 2000,
                showConfirmButton: false
            });
            
            await loadMakeupSessions();
        }
        
    } catch (error) {
        console.error('[Makeup Sessions] Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'فشل جدولة الحصة: ' + error.message
        });
    }
}

function closeMakeupModal() {
    // Modal is now handled by SweetAlert2
    console.log('[Makeup Sessions] Modal closed');
}

console.log('[Makeup Sessions] ✅ Script loaded');
