// Dashboard JavaScript
console.log('[Dashboard] 🚀 Initializing...');

// Wait for Supabase to be ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('[Dashboard] 📊 Loading dashboard data...');
    
    // Initialize Supabase if not already done
    if (!window.supabaseClient) {
        window.supabaseClient = initSupabase();
    }

    // Wait for Supabase to initialize
    await new Promise(resolve => setTimeout(resolve, 500));

    // Load all dashboard data
    await Promise.all([
        loadStats(),
        loadTodaySessions(),
        loadRecentPayments(),
        loadCharts()
    ]);

    console.log('[Dashboard] ✅ Initialization complete');

    // Auto-refresh statistics every 30 seconds
    setInterval(async () => {
        console.log('[Dashboard] 🔄 Auto-refreshing statistics...');
        await loadStats();
        await loadTodaySessions();
        await loadRecentPayments();
        await loadPricingPlansSummary();
    }, 30000); // 30 seconds
});

// Load statistics
async function loadStats() {
    try {
        const client = window.supabaseClient;

        console.log('[Dashboard] 📊 Loading statistics...');

        // Get total students (all students, not just active)
        const { data: allStudents, error: studentsError } = await client
            .from('students')
            .select('id, status');
        
        if (studentsError) {
            console.error('[Dashboard] Error loading students:', studentsError);
        } else {
            const totalStudents = allStudents?.length || 0;
            const activeStudents = allStudents?.filter(s => s.status === 'active').length || 0;
            
            console.log('[Dashboard] Students:', { total: totalStudents, active: activeStudents });
            
            // Animate the number
            animateValue('totalStudents', 0, totalStudents, 1000);
        }

        // Get total teachers (all teachers, not just active)
        const { data: allTeachers, error: teachersError } = await client
            .from('teachers')
            .select('id, status');
        
        if (teachersError) {
            console.error('[Dashboard] Error loading teachers:', teachersError);
        } else {
            const totalTeachers = allTeachers?.length || 0;
            const activeTeachers = allTeachers?.filter(t => t.status === 'active').length || 0;
            
            console.log('[Dashboard] Teachers:', { total: totalTeachers, active: activeTeachers });
            
            // Animate the number
            animateValue('totalTeachers', 0, totalTeachers, 1000);
        }

        // Get today's sessions
        const today = new Date().toISOString().split('T')[0];
        const { data: todaySessions, error: sessionsError } = await client
            .from('sessions')
            .select('id, status')
            .eq('session_date', today);
        
        if (sessionsError) {
            console.error('[Dashboard] Error loading sessions:', sessionsError);
        } else {
            const sessionsCount = todaySessions?.length || 0;
            console.log('[Dashboard] Today sessions:', sessionsCount);
            
            // Animate the number
            animateValue('todaySessions', 0, sessionsCount, 1000);
        }

        // Get pricing plan types (1-4 sessions per week)
        const { data: pricingPlans, error: pricingError } = await client
            .from('pricing_plans')
            .select('sessions_per_week')
            .eq('is_active', true);
        
        if (pricingError) {
            console.error('[Dashboard] Error loading pricing plans:', pricingError);
        } else {
            // Get unique session types (1, 2, 3, 4 sessions per week)
            const uniqueTypes = [...new Set(pricingPlans?.map(p => p.sessions_per_week))].sort();
            const typesCount = uniqueTypes.length;
            
            console.log('[Dashboard] Pricing plan types:', uniqueTypes, 'Count:', typesCount);
            
            // Update the value (should be 4 types: 1, 2, 3, 4 sessions/week)
            const plansEl = document.getElementById('totalPricingPlans');
            if (plansEl) {
                plansEl.textContent = typesCount;
            }
        }

        console.log('[Dashboard] ✅ Stats loaded successfully');
    } catch (error) {
        console.error('[Dashboard] Error loading stats:', error);
    }
}

// Load today's sessions
async function loadTodaySessions() {
    try {
        const client = window.supabaseClient;
        const today = new Date().toISOString().split('T')[0];

        const { data: sessions, error } = await client
            .from('sessions')
            .select(`
                *,
                student:students(id, name),
                teacher:teachers(id, name)
            `)
            .eq('session_date', today)
            .order('session_time', { ascending: true })
            .limit(10);

        if (error) throw error;

        const tbody = document.getElementById('todaySessionsBody');
        
        if (!sessions || sessions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">لا توجد حصص اليوم</td></tr>';
            return;
        }

        tbody.innerHTML = sessions.map(session => `
            <tr>
                <td>${session.session_time || '-'}</td>
                <td>${session.student?.name || '-'}</td>
                <td>${session.teacher?.name || '-'}</td>
                <td>
                    <span class="badge badge-${getStatusClass(session.status)}">
                        ${getStatusText(session.status)}
                    </span>
                </td>
            </tr>
        `).join('');

        console.log('[Dashboard] ✅ Today sessions loaded');
    } catch (error) {
        console.error('[Dashboard] Error loading today sessions:', error);
        document.getElementById('todaySessionsBody').innerHTML = 
            '<tr><td colspan="4" style="text-align: center; color: red;">خطأ في تحميل البيانات</td></tr>';
    }
}

// Load recent payments
async function loadRecentPayments() {
    try {
        const client = window.supabaseClient;

        const { data: payments, error } = await client
            .from('payments')
            .select(`
                *,
                student:students(id, name)
            `)
            .eq('status', 'completed')
            .order('payment_date', { ascending: false })
            .limit(10);

        if (error) throw error;

        const tbody = document.getElementById('recentPaymentsBody');
        
        if (!payments || payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">لا توجد مدفوعات</td></tr>';
            return;
        }

        tbody.innerHTML = payments.map(payment => `
            <tr>
                <td>${formatDate(payment.payment_date)}</td>
                <td>${payment.student?.name || '-'}</td>
                <td>${parseFloat(payment.amount || 0).toFixed(2)} ج.م</td>
                <td>${getPaymentMethodText(payment.payment_method)}</td>
                <td>
                    <span class="badge badge-success">
                        مكتمل
                    </span>
                </td>
            </tr>
        `).join('');

        console.log('[Dashboard] ✅ Recent payments loaded');
    } catch (error) {
        console.error('[Dashboard] Error loading recent payments:', error);
        document.getElementById('recentPaymentsBody').innerHTML = 
            '<tr><td colspan="5" style="text-align: center; color: red;">خطأ في تحميل البيانات</td></tr>';
    }
}

// Load charts
async function loadCharts() {
    try {
        await Promise.all([
            loadAttendanceStats(),
            loadRevenueChart()
        ]);
        console.log('[Dashboard] ✅ Charts loaded');
    } catch (error) {
        console.error('[Dashboard] Error loading charts:', error);
    }
}

// Load attendance statistics with Pie Chart (4 statuses)
async function loadAttendanceStats() {
    try {
        const client = window.supabaseClient;
        
        if (!client) {
            console.error('[Dashboard] Supabase client not available');
            return;
        }
        
        // Get current month date range
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        console.log('[Dashboard] Loading attendance stats for:', firstDayOfMonth, 'to', lastDayOfMonth);

        // Get all sessions for this month
        const { data: sessions, error } = await client
            .from('sessions')
            .select('status')
            .gte('session_date', firstDayOfMonth)
            .lte('session_date', lastDayOfMonth);

        if (error) {
            console.error('[Dashboard] Error loading sessions:', error);
            return;
        }

        console.log('[Dashboard] Total sessions:', sessions?.length || 0);

        // Count all statuses
        let scheduledCount = 0;  // مجدولة
        let completedCount = 0;  // حضر
        let absentCount = 0;     // غاب
        let excusedCount = 0;    // اعتذر

        if (sessions && sessions.length > 0) {
            sessions.forEach(session => {
                const status = session.status?.toLowerCase();
                if (status === 'scheduled') {
                    scheduledCount++;
                } else if (status === 'completed') {
                    completedCount++;
                } else if (status === 'student_absent' || status === 'absent') {
                    absentCount++;
                } else if (status === 'cancelled' || status === 'student_excused' || status === 'teacher_cancelled') {
                    excusedCount++;
                }
            });
        } else {
            // If no data, show sample data
            scheduledCount = 0;
            completedCount = 0;
            absentCount = 0;
            excusedCount = 0;
        }

        console.log('[Dashboard] Counts:', {
            scheduled: scheduledCount,
            completed: completedCount,
            absent: absentCount,
            excused: excusedCount
        });

        // Create Pie Chart
        const ctx = document.getElementById('attendanceChart');
        if (!ctx) {
            console.error('[Dashboard] Canvas element not found');
            return;
        }

        // Destroy existing chart if any
        if (window.attendanceChartInstance) {
            window.attendanceChartInstance.destroy();
        }

        // Create new chart
        window.attendanceChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['مجدولة', 'حضر', 'غاب', 'اعتذر'],
                datasets: [{
                    data: [scheduledCount, completedCount, absentCount, excusedCount],
                    backgroundColor: [
                        '#ffc107',  // Yellow for scheduled
                        '#2d5f3f',  // Green for completed
                        '#c9302c',  // Red for absent
                        '#6c757d'   // Gray for excused
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 4,
                    hoverOffset: 20,
                    hoverBorderWidth: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                family: 'Cairo',
                                size: 15,
                                weight: '600'
                            },
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            generateLabels: function(chart) {
                                const data = chart.data;
                                if (data.labels.length && data.datasets.length) {
                                    return data.labels.map((label, i) => {
                                        const value = data.datasets[0].data[i];
                                        const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                        return {
                                            text: `${label}: ${value} (${percentage}%)`,
                                            fillStyle: data.datasets[0].backgroundColor[i],
                                            hidden: false,
                                            index: i
                                        };
                                    });
                                }
                                return [];
                            }
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleFont: {
                            family: 'Cairo',
                            size: 16,
                            weight: '700'
                        },
                        bodyFont: {
                            family: 'Cairo',
                            size: 18,
                            weight: '600'
                        },
                        padding: 16,
                        cornerRadius: 12,
                        displayColors: true,
                        boxWidth: 15,
                        boxHeight: 15,
                        boxPadding: 8,
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return [
                                    `العدد: ${value} حصة`,
                                    `النسبة: ${percentage}%`
                                ];
                            }
                        }
                    }
                },
                cutout: '65%',
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 2000,
                    easing: 'easeInOutQuart'
                },
                interaction: {
                    mode: 'nearest',
                    intersect: true
                }
            }
        });

        console.log('[Dashboard] ✅ Attendance chart created successfully');
    } catch (error) {
        console.error('[Dashboard] Error loading attendance stats:', error);
    }
}

// Animate number counting
function animateValue(elementId, start, end, duration) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.round(current);
    }, 16);
}

// Load revenue chart
async function loadRevenueChart() {
    try {
        const client = window.supabaseClient;

        if (!client) {
            console.error('[Dashboard] Supabase client not available');
            return;
        }

        console.log('[Dashboard] Loading revenue chart...');

        // Get last 6 months
        const monthlyData = [];
        const labels = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

            console.log('[Dashboard] Loading data for:', startDate, 'to', endDate);

            // Get payments
            const { data: payments, error: paymentsError } = await client
                .from('payments')
                .select('amount')
                .eq('status', 'completed')
                .gte('payment_date', startDate)
                .lte('payment_date', endDate);

            if (paymentsError) {
                console.error('[Dashboard] Error loading payments:', paymentsError);
            }

            // Get expenses
            const { data: expenses, error: expensesError } = await client
                .from('expenses')
                .select('amount')
                .gte('expense_date', startDate)
                .lte('expense_date', endDate);

            if (expensesError) {
                console.error('[Dashboard] Error loading expenses:', expensesError);
            }

            const revenue = payments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
            const expense = expenses?.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0) || 0;

            console.log('[Dashboard] Month', month, '- Revenue:', revenue, 'Expense:', expense);

            monthlyData.push({ revenue, expense });
            labels.push(getMonthName(month));
        }

        const ctx = document.getElementById('revenueChart');
        if (!ctx) {
            console.error('[Dashboard] Canvas element not found');
            return;
        }

        // Destroy existing chart if any
        if (window.revenueChartInstance) {
            window.revenueChartInstance.destroy();
        }

        // Create new chart
        window.revenueChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'الإيرادات',
                    data: monthlyData.map(d => d.revenue),
                    backgroundColor: '#2d5f3f',
                    borderColor: '#2d5f3f',
                    borderWidth: 1
                }, {
                    label: 'المصروفات',
                    data: monthlyData.map(d => d.expense),
                    backgroundColor: '#c9302c',
                    borderColor: '#c9302c',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                family: 'Cairo',
                                size: 14,
                                weight: '600'
                            },
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleFont: {
                            family: 'Cairo',
                            size: 14,
                            weight: '700'
                        },
                        bodyFont: {
                            family: 'Cairo',
                            size: 13,
                            weight: '600'
                        },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + ' ج.م';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: {
                                family: 'Cairo',
                                size: 12
                            },
                            callback: function(value) {
                                return value.toFixed(0);
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                family: 'Cairo',
                                size: 12,
                                weight: '600'
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        console.log('[Dashboard] ✅ Revenue chart created successfully');
    } catch (error) {
        console.error('[Dashboard] Error loading revenue chart:', error);
    }
}

// Helper functions
function getStatusClass(status) {
    const classes = {
        'scheduled': 'warning',
        'completed': 'success',
        'cancelled': 'danger',
        'absent': 'danger'
    };
    return classes[status] || 'secondary';
}

function getStatusText(status) {
    const texts = {
        'scheduled': 'مجدولة',
        'completed': 'مكتملة',
        'cancelled': 'ملغاة',
        'absent': 'غياب'
    };
    return texts[status] || status;
}

function getPaymentMethodText(method) {
    const methods = {
        'cash': 'نقدي',
        'bank_transfer': 'تحويل بنكي',
        'card': 'بطاقة',
        'online': 'أونلاين'
    };
    return methods[method] || method;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG');
}

function getMonthName(month) {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return months[month - 1];
}
