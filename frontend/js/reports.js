// Reports Page JavaScript
console.log('[Reports] Script loaded');

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Reports] Initializing page...');
    
    // Set default dates (last 30 days)
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setDate(today.getDate() - 30);
    
    // Set dates for all filters
    ['attendance', 'financial', 'teachers'].forEach(prefix => {
        const fromDate = document.getElementById(`${prefix}FromDate`);
        const toDate = document.getElementById(`${prefix}ToDate`);
        if (fromDate) fromDate.value = lastMonth.toISOString().split('T')[0];
        if (toDate) toDate.value = today.toISOString().split('T')[0];
    });
    
    // Load initial data
    await loadStudents();
    await loadTeachers();
    await loadAttendanceReport();
});

// Switch between tabs
function switchTab(tabName, clickedElement) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    if (clickedElement) {
        clickedElement.classList.add('active');
    }
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    
    // Load students report when students tab is opened
    if (tabName === 'students') {
        loadStudentsReport();
    }
}

// Load students for filter
async function loadStudents() {
    try {
        console.log('[Reports] Loading students...');
        const response = await API.get('students', {
            order: { column: 'name', ascending: true }
        });
        
        if (response.success) {
            const select = document.getElementById('attendanceStudent');
            select.innerHTML = '<option value="">الكل</option>';
            response.data.forEach(student => {
                select.innerHTML += `<option value="${student.id}">${student.name}</option>`;
            });
            console.log('[Reports] ✅ Students loaded');
        }
    } catch (error) {
        console.error('[Reports] Error loading students:', error);
    }
}

// Load teachers for filter
async function loadTeachers() {
    try {
        console.log('[Reports] Loading teachers...');
        // Store teachers data for later use
        const response = await API.get('teachers', {
            order: { column: 'name', ascending: true }
        });
        
        if (response.success) {
            window.teachersData = response.data;
            console.log('[Reports] ✅ Teachers loaded');
        }
    } catch (error) {
        console.error('[Reports] Error loading teachers:', error);
    }
}

// Load Attendance Report
let attendanceChart = null;

async function loadAttendanceReport() {
    try {
        console.log('[Reports] Loading attendance report...');
        const fromDate = document.getElementById('attendanceFromDate').value;
        const toDate = document.getElementById('attendanceToDate').value;
        const studentId = document.getElementById('attendanceStudent').value;
        
        // Get sessions with attendance info
        const sessionsResponse = await API.get('sessions', {
            select: '*',
            order: { column: 'session_date', ascending: true }
        });
        
        if (!sessionsResponse.success) {
            throw new Error(sessionsResponse.error);
        }
        
        // Filter data by date range
        let data = sessionsResponse.data.filter(record => {
            const recordDate = record.session_date;
            return recordDate >= fromDate && recordDate <= toDate;
        });
        
        // Filter by student if selected
        if (studentId) {
            data = data.filter(record => record.student_id == studentId);
        }
        
        // Calculate statistics based on session status and student_attendance
        const present = data.filter(r => {
            // الحصة مكتملة = حاضر (إلا لو في غياب أو اعتذار صريح)
            if (r.status === 'completed') {
                // لو في student_attendance، نشوفه
                if (r.student_attendance) {
                    return r.student_attendance === 'present' || r.student_attendance === 'late';
                }
                // لو مفيش student_attendance والحصة completed، يبقى حاضر
                return true;
            }
            return false;
        }).length;
        
        const absent = data.filter(r => 
            r.status === 'student_absent' || r.student_attendance === 'absent'
        ).length;
        
        const excused = data.filter(r => 
            r.status === 'student_excused' || r.student_attendance === 'excused'
        ).length;
        const total = data.length;
        const rate = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
        
        // Update stats
        document.getElementById('attendancePresent').textContent = present;
        document.getElementById('attendanceAbsent').textContent = absent;
        document.getElementById('attendanceExcused').textContent = excused;
        document.getElementById('attendanceRate').textContent = rate + '%';
        
        // Prepare chart data - group by date
        const dateGroups = {};
        data.forEach(record => {
            const date = record.session_date;
            if (!dateGroups[date]) {
                dateGroups[date] = { present: 0, absent: 0, excused: 0 };
            }
            
            // Categorize based on status
            if (record.status === 'completed') {
                // الحصة مكتملة = حاضر (إلا لو في غياب أو اعتذار صريح)
                if (record.student_attendance) {
                    if (record.student_attendance === 'present' || record.student_attendance === 'late') {
                        dateGroups[date].present++;
                    } else if (record.student_attendance === 'absent') {
                        dateGroups[date].absent++;
                    } else if (record.student_attendance === 'excused') {
                        dateGroups[date].excused++;
                    }
                } else {
                    // لو مفيش student_attendance والحصة completed، يبقى حاضر
                    dateGroups[date].present++;
                }
            } else if (record.status === 'student_absent' || record.student_attendance === 'absent') {
                dateGroups[date].absent++;
            } else if (record.status === 'student_excused' || record.student_attendance === 'excused') {
                dateGroups[date].excused++;
            }
        });
        
        const dates = Object.keys(dateGroups).sort();
        const presentData = dates.map(date => dateGroups[date].present);
        const absentData = dates.map(date => dateGroups[date].absent);
        const excusedData = dates.map(date => dateGroups[date].excused);
        
        // Update chart
        updateAttendanceChart(dates, presentData, absentData, excusedData);
        
        console.log('[Reports] ✅ Attendance report loaded');
    } catch (error) {
        console.error('[Reports] Error loading attendance report:', error);
        Swal.fire('خطأ', 'حدث خطأ أثناء تحميل تقرير الحضور', 'error');
    }
}

function updateAttendanceChart(labels, present, absent, excused) {
    const ctx = document.getElementById('attendanceChart');
    
    if (attendanceChart) {
        attendanceChart.destroy();
    }
    
    attendanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'حاضر',
                    data: present,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7
                },
                {
                    label: 'غائب',
                    data: absent,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7
                },
                {
                    label: 'معتذر',
                    data: excused,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 2,
            plugins: {
                legend: { 
                    position: 'top',
                    labels: {
                        font: {
                            size: 14,
                            family: 'Cairo'
                        },
                        padding: 15
                    }
                },
                title: { 
                    display: true, 
                    text: 'تقرير الحضور والغياب',
                    font: {
                        size: 18,
                        family: 'Cairo',
                        weight: 'bold'
                    },
                    padding: 20
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 12,
                            family: 'Cairo'
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 12,
                            family: 'Cairo'
                        }
                    }
                }
            }
        }
    });
}

// Load Financial Report
let financialChart = null;

async function loadFinancialReport() {
    try {
        console.log('[Reports] Loading financial report...');
        const fromDate = document.getElementById('financialFromDate').value;
        const toDate = document.getElementById('financialToDate').value;
        
        // Get payments
        const paymentsResponse = await API.get('payments', {
            select: '*',
            order: { column: 'payment_date', ascending: true }
        });
        
        // Get expenses
        const expensesResponse = await API.get('expenses', {
            select: '*',
            order: { column: 'expense_date', ascending: true }
        });
        
        // Get invoices for pending amounts
        const invoicesResponse = await API.get('invoices', {
            select: '*'
        });
        
        if (!paymentsResponse.success || !expensesResponse.success || !invoicesResponse.success) {
            throw new Error('Failed to load financial data');
        }
        
        // Filter by date range
        const payments = paymentsResponse.data.filter(p => 
            p.payment_date >= fromDate && p.payment_date <= toDate
        );
        
        const expenses = expensesResponse.data.filter(e => 
            e.expense_date >= fromDate && e.expense_date <= toDate
        );
        
        // Calculate totals
        const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
        const netProfit = totalRevenue - totalExpenses;
        
        // Calculate pending amounts
        const pendingAmount = invoicesResponse.data
            .filter(inv => inv.status === 'pending' || inv.status === 'partial')
            .reduce((sum, inv) => sum + (parseFloat(inv.total_amount || 0) - parseFloat(inv.paid_amount || 0)), 0);
        
        // Update stats
        document.getElementById('totalRevenue').textContent = totalRevenue.toFixed(2) + ' ريال';
        document.getElementById('totalExpenses').textContent = totalExpenses.toFixed(2) + ' ريال';
        document.getElementById('netProfit').textContent = netProfit.toFixed(2) + ' ريال';
        document.getElementById('pendingAmount').textContent = pendingAmount.toFixed(2) + ' ريال';
        
        // Update chart
        updateFinancialChart(totalRevenue, totalExpenses, netProfit);
        
        console.log('[Reports] ✅ Financial report loaded');
    } catch (error) {
        console.error('[Reports] Error loading financial report:', error);
        Swal.fire('خطأ', 'حدث خطأ أثناء تحميل التقرير المالي', 'error');
    }
}

function updateFinancialChart(revenue, expenses, profit) {
    const ctx = document.getElementById('financialChart');
    
    if (financialChart) {
        financialChart.destroy();
    }
    
    financialChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['الإيرادات', 'المصروفات', 'صافي الربح'],
            datasets: [{
                label: 'المبلغ (ريال)',
                data: [revenue, expenses, profit],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(59, 130, 246, 0.8)'
                ],
                borderColor: [
                    '#10b981',
                    '#ef4444',
                    '#3b82f6'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'التقرير المالي' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// Load Teachers Performance Report
async function loadTeachersReport() {
    try {
        console.log('[Reports] Loading teachers report...');
        const fromDate = document.getElementById('teachersFromDate').value;
        const toDate = document.getElementById('teachersToDate').value;
        
        const client = window.supabaseClient;
        
        // Get teachers with their session rates
        const { data: teachers, error: teachersError } = await client
            .from('teachers')
            .select('id, name, session_rate')
            .eq('status', 'active');
        
        if (teachersError) throw teachersError;
        
        // Get sessions for the date range
        const { data: sessions, error: sessionsError } = await client
            .from('sessions')
            .select('teacher_id, session_date, status')
            .gte('session_date', fromDate)
            .lte('session_date', toDate)
            .in('status', ['completed', 'scheduled']);
        
        if (sessionsError) throw sessionsError;
        
        console.log('[Reports] Teachers:', teachers?.length, 'Sessions:', sessions?.length);
        
        // Group sessions by teacher
        const teacherStats = {};
        sessions?.forEach(session => {
            const teacherId = session.teacher_id;
            if (!teacherStats[teacherId]) {
                teacherStats[teacherId] = {
                    sessions: 0
                };
            }
            teacherStats[teacherId].sessions++;
        });
        
        // Build HTML
        let html = '<div class="stats-row">';
        
        teachers?.forEach(teacher => {
            const stats = teacherStats[teacher.id] || { sessions: 0 };
            const sessionRate = parseFloat(teacher.session_rate || 0);
            const totalAmount = stats.sessions * sessionRate;
            
            html += `
                <div class="stat-card">
                    <h3 style="color: white; margin-bottom: 1rem;">${teacher.name}</h3>
                    <div class="stat-value" style="font-size: 2rem; color: #ffd700;">${stats.sessions}</div>
                    <div class="stat-label" style="margin-bottom: 1rem;">عدد الحصص</div>
                    <div class="stat-value" style="font-size: 1.5rem; color: #90EE90;">${totalAmount.toFixed(2)} ج.م</div>
                    <div class="stat-label">إجمالي المستحقات</div>
                    <small style="color: rgba(255,255,255,0.7); display: block; margin-top: 0.5rem;">
                        (${sessionRate.toFixed(2)} ج.م × ${stats.sessions} حصة)
                    </small>
                </div>
            `;
        });
        
        if (teachers?.length === 0) {
            html += '<p style="text-align: center; padding: 2rem; color: #666;">لا يوجد محفظين نشطين</p>';
        }
        
        html += '</div>';
        document.getElementById('teachersReportContainer').innerHTML = html;
        
        console.log('[Reports] ✅ Teachers report loaded');
    } catch (error) {
        console.error('[Reports] Error loading teachers report:', error);
        Swal.fire('خطأ', 'حدث خطأ أثناء تحميل تقرير المحفظين: ' + error.message, 'error');
    }
}

console.log('[Reports] ✅ Reports module ready');


// ============================================================================
// Students Report by Country
// ============================================================================

async function loadStudentsReport() {
    try {
        console.log('[Reports] Loading students report...');
        
        const client = window.supabaseClient;
        if (!client) {
            console.error('[Reports] Supabase client not initialized');
            return;
        }

        // Get all students with country information
        const { data: students, error } = await client
            .from('students')
            .select(`
                id,
                name,
                status,
                country:countries(id, name_ar, name_en, display_order)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Reports] Error loading students:', error);
            throw error;
        }

        console.log('[Reports] Students loaded:', students?.length || 0);

        // Define all 8 countries with flags
        const countriesData = [
            { name_ar: 'مصر', name_en: 'Egypt', flag: '🇪🇬' },
            { name_ar: 'السعودية', name_en: 'Saudi Arabia', flag: '🇸🇦' },
            { name_ar: 'الإمارات', name_en: 'UAE', flag: '🇦🇪' },
            { name_ar: 'الكويت', name_en: 'Kuwait', flag: '🇰🇼' },
            { name_ar: 'قطر', name_en: 'Qatar', flag: '🇶🇦' },
            { name_ar: 'البحرين', name_en: 'Bahrain', flag: '🇧🇭' },
            { name_ar: 'عمان', name_en: 'Oman', flag: '🇴🇲' },
            { name_ar: 'الأردن', name_en: 'Jordan', flag: '🇯🇴' }
        ];

        // Calculate statistics for each country
        const countryStats = countriesData.map(country => {
            const countryStudents = students.filter(s => 
                s.country?.name_ar === country.name_ar || 
                s.country?.name_en === country.name_en
            );
            
            const active = countryStudents.filter(s => s.status === 'active').length;
            const inactive = countryStudents.filter(s => s.status !== 'active').length;
            const total = countryStudents.length;
            
            return {
                ...country,
                active,
                inactive,
                total
            };
        });

        // Calculate totals
        const totalStudents = students.length;
        const totalActive = students.filter(s => s.status === 'active').length;
        const totalInactive = students.filter(s => s.status !== 'active').length;
        const countriesWithStudents = countryStats.filter(c => c.total > 0).length;

        // Update summary cards
        document.getElementById('totalStudentsCount').textContent = totalStudents;
        document.getElementById('activeStudentsCount').textContent = totalActive;
        document.getElementById('inactiveStudentsCount').textContent = totalInactive;
        document.getElementById('countriesWithStudents').textContent = countriesWithStudents;

        // Create table
        createStudentsTable(countryStats);

        console.log('[Reports] ✅ Students report loaded successfully');

    } catch (error) {
        console.error('[Reports] Error loading students report:', error);
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: 'فشل تحميل تقرير الطلاب: ' + error.message
            });
        }
    }
}


function createStudentsTable(countryStats) {
    const container = document.getElementById('studentsTableContainer');
    if (!container) return;

    let html = `
        <table class="students-table">
            <thead>
                <tr>
                    <th>الدولة</th>
                    <th>طلاب نشطين</th>
                    <th>طلاب غير نشطين</th>
                    <th>إجمالي الطلاب</th>
                </tr>
            </thead>
            <tbody>
    `;

    const totalStudents = countryStats.reduce((sum, c) => sum + c.total, 0);

    countryStats.forEach(country => {
        html += `
            <tr>
                <td>
                    <span class="country-flag">${country.flag}</span>
                    <strong>${country.name_ar}</strong>
                </td>
                <td>
                    <span class="status-badge status-active">${country.active}</span>
                </td>
                <td>
                    <span class="status-badge status-inactive">${country.inactive}</span>
                </td>
                <td><strong>${country.total}</strong></td>
            </tr>
        `;
    });

    // Add total row
    const totalActive = countryStats.reduce((sum, c) => sum + c.active, 0);
    const totalInactive = countryStats.reduce((sum, c) => sum + c.inactive, 0);

    html += `
            <tr style="background: #f0f0f0; font-weight: bold;">
                <td>الإجمالي</td>
                <td><span class="status-badge status-active">${totalActive}</span></td>
                <td><span class="status-badge status-inactive">${totalInactive}</span></td>
                <td><strong>${totalStudents}</strong></td>
            </tr>
        </tbody>
    </table>
    `;


    container.innerHTML = html;
}

console.log('[Reports] ✅ Students report module loaded');


// ============================================================================
// Financial Summary Report
// ============================================================================

let financialSummaryChart = null;

async function loadFinancialSummaryReport() {
    try {
        console.log('[Reports] Loading financial summary report...');
        
        const monthInput = document.getElementById('financialMonth').value;
        if (!monthInput) {
            Swal.fire('تنبيه', 'الرجاء اختيار الشهر', 'warning');
            return;
        }
        
        const [year, month] = monthInput.split('-').map(Number);
        const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const lastDay = new Date(year, month, 0).toISOString().split('T')[0];
        
        const client = window.supabaseClient;
        if (!client) {
            console.error('[Reports] Supabase client not initialized');
            return;
        }

        // Get all payments (income from students)
        const { data: payments, error: paymentsError } = await client
            .from('payments')
            .select('amount, payment_date, currency_code')
            .eq('status', 'completed')
            .gte('payment_date', firstDay)
            .lte('payment_date', lastDay);

        if (paymentsError) throw paymentsError;

        // Get treasury transactions (deposits and withdrawals)
        const { data: transactions, error: transactionsError } = await client
            .from('treasury_transactions')
            .select('amount, transaction_type, category, transaction_date, currency_code')
            .gte('transaction_date', firstDay)
            .lte('transaction_date', lastDay);

        if (transactionsError) throw transactionsError;

        // Get teacher salaries
        const { data: salaries, error: salariesError } = await client
            .from('teacher_salaries')
            .select('total_amount, month, year, status, currency_code')
            .eq('month', month)
            .eq('year', year)
            .eq('status', 'paid');

        if (salariesError) throw salariesError;

        console.log('[Reports] Data loaded:', {
            payments: payments?.length || 0,
            transactions: transactions?.length || 0,
            salaries: salaries?.length || 0
        });

        // Calculate income
        const paymentsIncome = payments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
        const depositsIncome = transactions?.filter(t => t.amount > 0 && t.transaction_type === 'deposit')
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0;
        const totalIncome = paymentsIncome + depositsIncome;

        // Calculate expenses
        const salariesExpense = salaries?.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0) || 0;
        const withdrawalsExpense = transactions?.filter(t => t.amount < 0 && t.transaction_type === 'withdrawal')
            .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount || 0)), 0) || 0;
        const totalExpenses = salariesExpense + withdrawalsExpense;

        // Calculate net profit
        const netProfit = totalIncome - totalExpenses;

        // Update stats
        document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
        document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
        document.getElementById('netProfit').textContent = formatCurrency(netProfit);
        document.getElementById('netProfit').style.color = netProfit >= 0 ? '#28a745' : '#dc3545';

        // Update income breakdown table
        updateIncomeBreakdownTable(paymentsIncome, depositsIncome, payments?.length || 0);

        // Update expenses breakdown table
        updateExpensesBreakdownTable(salariesExpense, withdrawalsExpense, salaries?.length || 0, transactions);

        // Update chart
        updateFinancialSummaryChart(paymentsIncome, depositsIncome, salariesExpense, withdrawalsExpense);

        console.log('[Reports] ✅ Financial summary report loaded');

    } catch (error) {
        console.error('[Reports] Error loading financial summary report:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'فشل تحميل التقرير المالي: ' + error.message
        });
    }
}

function updateIncomeBreakdownTable(paymentsIncome, depositsIncome, paymentsCount) {
    const tbody = document.getElementById('incomeBreakdownTable');
    const total = paymentsIncome + depositsIncome;
    
    tbody.innerHTML = `
        <tr>
            <td style="text-align: right;">
                <i class="fas fa-money-bill-wave" style="color: #28a745; margin-left: 8px;"></i>
                دفعات الطلاب (${paymentsCount})
            </td>
            <td style="font-weight: 600; color: #28a745;">${formatCurrency(paymentsIncome)}</td>
        </tr>
        <tr>
            <td style="text-align: right;">
                <i class="fas fa-plus-circle" style="color: #28a745; margin-left: 8px;"></i>
                إيداعات الخزنة
            </td>
            <td style="font-weight: 600; color: #28a745;">${formatCurrency(depositsIncome)}</td>
        </tr>
        <tr style="background: #d4edda; font-weight: bold;">
            <td style="text-align: right;">الإجمالي</td>
            <td style="color: #155724;">${formatCurrency(total)}</td>
        </tr>
    `;
}

function updateExpensesBreakdownTable(salariesExpense, withdrawalsExpense, salariesCount, transactions) {
    const tbody = document.getElementById('expensesBreakdownTable');
    const total = salariesExpense + withdrawalsExpense;
    
    // Group withdrawals by category
    const withdrawalsByCategory = {};
    transactions?.filter(t => t.amount < 0 && t.transaction_type === 'withdrawal').forEach(t => {
        const category = t.category || 'أخرى';
        if (!withdrawalsByCategory[category]) {
            withdrawalsByCategory[category] = 0;
        }
        withdrawalsByCategory[category] += Math.abs(parseFloat(t.amount || 0));
    });
    
    let html = `
        <tr>
            <td style="text-align: right;">
                <i class="fas fa-wallet" style="color: #dc3545; margin-left: 8px;"></i>
                رواتب المحفظين (${salariesCount})
            </td>
            <td style="font-weight: 600; color: #dc3545;">${formatCurrency(salariesExpense)}</td>
        </tr>
    `;
    
    // Add withdrawal categories
    Object.entries(withdrawalsByCategory).forEach(([category, amount]) => {
        html += `
            <tr>
                <td style="text-align: right;">
                    <i class="fas fa-minus-circle" style="color: #dc3545; margin-left: 8px;"></i>
                    ${category}
                </td>
                <td style="font-weight: 600; color: #dc3545;">${formatCurrency(amount)}</td>
            </tr>
        `;
    });
    
    html += `
        <tr style="background: #f8d7da; font-weight: bold;">
            <td style="text-align: right;">الإجمالي</td>
            <td style="color: #721c24;">${formatCurrency(total)}</td>
        </tr>
    `;
    
    tbody.innerHTML = html;
}

function updateFinancialSummaryChart(paymentsIncome, depositsIncome, salariesExpense, withdrawalsExpense) {
    const ctx = document.getElementById('financialSummaryChart');
    
    if (financialSummaryChart) {
        financialSummaryChart.destroy();
    }
    
    financialSummaryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['دفعات الطلاب', 'إيداعات', 'رواتب المحفظين', 'صرف من الخزنة'],
            datasets: [{
                label: 'المبلغ',
                data: [paymentsIncome, depositsIncome, salariesExpense, withdrawalsExpense],
                backgroundColor: [
                    'rgba(40, 167, 69, 0.8)',
                    'rgba(40, 167, 69, 0.6)',
                    'rgba(220, 53, 69, 0.8)',
                    'rgba(220, 53, 69, 0.6)'
                ],
                borderColor: [
                    '#28a745',
                    '#28a745',
                    '#dc3545',
                    '#dc3545'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                title: { 
                    display: true, 
                    text: 'مقارنة الإيرادات والمصروفات',
                    font: {
                        size: 18,
                        family: 'Cairo',
                        weight: 'bold'
                    },
                    padding: 20
                }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 12,
                            family: 'Cairo'
                        },
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 12,
                            family: 'Cairo'
                        }
                    }
                }
            }
        }
    });
}

function formatCurrency(amount) {
    return parseFloat(amount).toLocaleString('ar-EG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Set default month to current month
document.addEventListener('DOMContentLoaded', function() {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const monthInput = document.getElementById('financialMonth');
    if (monthInput) {
        monthInput.value = currentMonth;
    }
});

console.log('[Reports] ✅ Financial summary report module loaded');
