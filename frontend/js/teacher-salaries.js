// Teacher Salaries Page
console.log('[Teacher Salaries] 🚀 Initializing...');

let salariesTable = null;

document.addEventListener('DOMContentLoaded', async function() {
    if (!window.supabaseClient) {
        window.supabaseClient = initSupabase();
    }
    
    await Promise.all([
        loadTeachers(),
        loadSalaries()
    ]);
    
    // Setup form submit
    document.getElementById('salaryForm')?.addEventListener('submit', saveSalary);
});

// Calculate total salary with bonus and deductions
function calculateTotal() {
    const baseSalary = parseFloat(document.getElementById('amount').value) || 0;
    const bonus = parseFloat(document.getElementById('bonusAmount').value) || 0;
    const deduction = parseFloat(document.getElementById('deductionAmount').value) || 0;
    
    const total = baseSalary + bonus - deduction;
    
    // Update display
    document.getElementById('displayBaseSalary').textContent = baseSalary.toFixed(2) + ' ج.م';
    document.getElementById('displayBonus').textContent = bonus.toFixed(2) + ' ج.م';
    document.getElementById('displayDeduction').textContent = deduction.toFixed(2) + ' ج.م';
    document.getElementById('displayTotal').textContent = total.toFixed(2) + ' ج.م';
    
    return total;
}

// Load teachers for dropdown
async function loadTeachers() {
    try {
        const client = window.supabaseClient;
        
        const { data: teachers, error } = await client
            .from('teachers')
            .select('id, name, session_rate')
            .eq('status', 'active')
            .order('name');

        if (error) throw error;
        
        const select = document.getElementById('teacherId');
        if (select) {
            select.innerHTML = '<option value="">اختر المحفظ</option>';
            teachers?.forEach(teacher => {
                const option = document.createElement('option');
                option.value = teacher.id;
                option.textContent = teacher.name;
                option.dataset.sessionRate = teacher.session_rate || 0;
                select.appendChild(option);
            });
        }
        
        // Auto-calculate salary when teacher is selected
        select?.addEventListener('change', async function() {
            const teacherId = this.value;
            if (!teacherId) {
                document.getElementById('amount').value = '';
                document.getElementById('sessionsInfo').innerHTML = '';
                return;
            }
            
            const selectedOption = this.options[this.selectedIndex];
            const sessionRate = parseFloat(selectedOption.dataset.sessionRate) || 0;
            
            // Get selected month
            const salaryMonth = document.getElementById('salaryMonth').value;
            if (!salaryMonth) {
                document.getElementById('amount').value = '';
                return;
            }
            
            const [year, month] = salaryMonth.split('-').map(Number);
            
            // Calculate completed sessions for this teacher in this month
            const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0];
            const lastDay = new Date(year, month, 0).toISOString().split('T')[0];
            
            const { data: sessions, error: sessionsError } = await client
                .from('sessions')
                .select('id')
                .eq('teacher_id', teacherId)
                .eq('status', 'completed')
                .gte('session_date', firstDay)
                .lte('session_date', lastDay);
            
            if (sessionsError) {
                console.error('Error fetching sessions:', sessionsError);
                return;
            }
            
            const completedSessions = sessions?.length || 0;
            const totalSalary = completedSessions * sessionRate;
            
            document.getElementById('amount').value = totalSalary.toFixed(2);
            
            // Update total calculation
            calculateTotal();
            
            // Show info
            const infoDiv = document.getElementById('sessionsInfo');
            if (infoDiv) {
                infoDiv.innerHTML = `
                    <div style="background: #e7f3ff; padding: 1rem; border-radius: 0.5rem; border-right: 4px solid #1a5f7a; margin-top: 0.5rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <i class="fas fa-calculator" style="color: #1a5f7a;"></i>
                            <strong style="color: #1a5f7a;">حساب الراتب الأساسي</strong>
                        </div>
                        <div style="display: grid; gap: 0.5rem; font-size: 0.95rem;">
                            <div style="display: flex; justify-content: space-between;">
                                <span>عدد الحصص المكتملة:</span>
                                <strong>${completedSessions} حصة</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>سعر الحصة:</span>
                                <strong>${sessionRate.toFixed(2)} ج.م</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding-top: 0.5rem; border-top: 2px solid #1a5f7a; color: #1a5f7a;">
                                <span>الراتب الأساسي:</span>
                                <strong>${totalSalary.toFixed(2)} ج.م</strong>
                            </div>
                        </div>
                    </div>
                `;
            }
        });
        
        // Also trigger calculation when month changes
        document.getElementById('salaryMonth')?.addEventListener('change', function() {
            const teacherSelect = document.getElementById('teacherId');
            if (teacherSelect.value) {
                teacherSelect.dispatchEvent(new Event('change'));
            }
        });
        
        console.log('[Teacher Salaries] Teachers loaded:', teachers?.length || 0);
        
    } catch (error) {
        console.error('[Teacher Salaries] Error loading teachers:', error);
    }
}

// Load salaries
async function loadSalaries() {
    try {
        const client = window.supabaseClient;
        
        const { data: salaries, error } = await client
            .from('teacher_salaries')
            .select(`
                *,
                teacher:teachers(id, name)
            `)
            .order('payment_date', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log('[Teacher Salaries] Loaded:', salaries?.length || 0);
        
        // Update stats
        updateStats(salaries || []);
        
        // Display salaries
        displaySalaries(salaries || []);
        
    } catch (error) {
        console.error('[Teacher Salaries] Error:', error);
        showError('فشل تحميل البيانات: ' + error.message);
    }
}

// Update stats
function updateStats(salaries) {
    const uniqueTeachers = new Set(salaries.map(s => s.teacher_id)).size;
    const totalPaid = salaries.filter(s => s.status === 'paid').reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
    
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthPaid = salaries.filter(s => s.month === currentMonth && s.year === currentYear && s.status === 'paid')
        .reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
    
    document.getElementById('totalTeachers').textContent = uniqueTeachers;
    document.getElementById('totalPaid').textContent = totalPaid.toFixed(2);
    document.getElementById('monthPaid').textContent = monthPaid.toFixed(2);
}

// Display salaries
function displaySalaries(salaries) {
    const tbody = document.querySelector('#salariesTable tbody');
    
    if (!tbody) return;
    
    if (salaries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">لا توجد سجلات</td></tr>';
        return;
    }
    
    tbody.innerHTML = salaries.map((salary, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${salary.teacher?.name || '-'}</td>
            <td>${getMonthName(salary.month)} ${salary.year}</td>
            <td>${salary.total_amount.toFixed(2)} ${salary.currency_symbol || 'ج.م'}</td>
            <td>${salary.payment_date || '-'}</td>
            <td>
                <span class="badge badge-${getStatusClass(salary.status)}">
                    ${getStatusText(salary.status)}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewSalary('${salary.id}')" title="عرض">
                    <i class="fas fa-eye"></i>
                </button>
                ${salary.status === 'pending' ? `
                <button class="btn btn-sm btn-success" onclick="paySalary('${salary.id}')" title="دفع">
                    <i class="fas fa-dollar-sign"></i>
                </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
    
    // Initialize DataTable
    setTimeout(() => {
        if (typeof $.fn.DataTable !== 'undefined' && $('#salariesTable').length) {
            if (salariesTable) {
                salariesTable.destroy();
            }
            
            salariesTable = $('#salariesTable').DataTable({
                language: {
                    search: "بحث:",
                    lengthMenu: "عرض _MENU_ سجلات",
                    info: "عرض _START_ إلى _END_ من _TOTAL_ سجل",
                    infoEmpty: "لا توجد سجلات",
                    paginate: {
                        first: "الأول",
                        last: "الأخير",
                        next: "التالي",
                        previous: "السابق"
                    }
                },
                order: [[4, 'desc']],
                pageLength: 25
            });
        }
    }, 100);
}

// Show add salary modal
function showAddSalaryModal() {
    document.getElementById('salaryModal').style.display = 'flex';
    document.getElementById('salaryForm').reset();
    document.getElementById('salaryId').value = '';
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-wallet"></i> تسجيل راتب';
    
    // Set default month to current month
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    document.getElementById('salaryMonth').value = currentMonth;
    
    // Set default payment date to today
    document.getElementById('paymentDate').value = now.toISOString().split('T')[0];
    
    // Reset bonus and deduction
    document.getElementById('bonusAmount').value = '0';
    document.getElementById('deductionAmount').value = '0';
    document.getElementById('adjustmentNotes').value = '';
    
    // Reset display
    calculateTotal();
}

// Close salary modal
function closeSalaryModal() {
    document.getElementById('salaryModal').style.display = 'none';
}

// Save salary
async function saveSalary(event) {
    event.preventDefault();
    
    try {
        const client = window.supabaseClient;
        
        const teacherId = document.getElementById('teacherId').value;
        const salaryMonth = document.getElementById('salaryMonth').value;
        const [year, month] = salaryMonth.split('-').map(Number);
        const baseSalary = parseFloat(document.getElementById('amount').value);
        const bonusAmount = parseFloat(document.getElementById('bonusAmount').value) || 0;
        const deductionAmount = parseFloat(document.getElementById('deductionAmount').value) || 0;
        const totalAmount = baseSalary + bonusAmount - deductionAmount;
        const paymentDate = document.getElementById('paymentDate').value;
        const notes = document.getElementById('notes').value;
        const adjustmentNotes = document.getElementById('adjustmentNotes').value;
        
        // Combine notes
        let finalNotes = notes || '';
        if (adjustmentNotes) {
            finalNotes += (finalNotes ? '\n\n' : '') + 'تفاصيل المكافأة/الخصم:\n' + adjustmentNotes;
        }
        
        // Generate salary number
        const salaryNumber = `SAL-${year}${String(month).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;
        
        const salaryData = {
            salary_number: salaryNumber,
            teacher_id: teacherId,
            month: month,
            year: year,
            base_salary: baseSalary,
            bonus_amount: bonusAmount,
            deduction_amount: deductionAmount,
            overtime_amount: 0,
            total_amount: totalAmount,
            currency_code: 'EGP',
            currency_symbol: 'ج.م',
            status: paymentDate ? 'paid' : 'pending',
            payment_date: paymentDate || null,
            paid_at: paymentDate ? new Date().toISOString() : null,
            notes: finalNotes || null
        };
        
        const { error } = await client
            .from('teacher_salaries')
            .insert(salaryData);
        
        if (error) throw error;
        
        // If payment is made, record withdrawal from EGP treasury
        if (paymentDate) {
            const transactionNumber = `SAL-${Date.now()}`;
            
            const transactionData = {
                transaction_number: transactionNumber,
                currency_code: 'EGP',
                transaction_type: 'salary_payment',
                amount: -totalAmount, // Negative for withdrawal
                category: 'راتب محفظ',
                description: `راتب ${document.getElementById('teacherId').options[document.getElementById('teacherId').selectedIndex].text} - ${getMonthName(month)} ${year}`,
                reference_type: 'teacher_salary',
                reference_id: null, // Will be updated if we get the salary ID
                transaction_date: paymentDate,
                created_at: new Date().toISOString()
            };
            
            const { error: transactionError } = await client
                .from('treasury_transactions')
                .insert(transactionData);
            
            if (transactionError) {
                console.error('[Teacher Salaries] Error recording treasury transaction:', transactionError);
                // Don't throw error, just log it
            }
        }
        
        closeSalaryModal();
        await loadSalaries();
        
        Swal.fire({
            icon: 'success',
            title: 'تم بنجاح!',
            text: 'تم تسجيل الراتب بنجاح',
            timer: 2000,
            showConfirmButton: false
        });
        
    } catch (error) {
        console.error('[Teacher Salaries] Error saving:', error);
        showError('فشل حفظ الراتب: ' + error.message);
    }
}

// View salary details
async function viewSalary(id) {
    try {
        const client = window.supabaseClient;
        
        const { data: salary, error } = await client
            .from('teacher_salaries')
            .select('*, teacher:teachers(name, phone)')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        await Swal.fire({
            title: `
                <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; color: #1a5f7a;">
                    <i class="fas fa-wallet" style="font-size: 2rem;"></i>
                    <span>تفاصيل الراتب</span>
                </div>
            `,
            html: `
                <div style="text-align: right; padding: 1rem;">
                    <div style="background: linear-gradient(135deg, #1a5f7a 0%, #159895 100%); color: white; padding: 1.5rem; border-radius: 1rem; margin-bottom: 1.5rem;">
                        <div style="font-size: 0.9rem; opacity: 0.9;">رقم السجل</div>
                        <div style="font-size: 1.3rem; font-weight: 700;">${salary.salary_number}</div>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 1rem; margin-bottom: 1.5rem;">
                        <h4 style="color: #1a5f7a; margin-bottom: 1rem;">معلومات المحفظ</h4>
                        <div style="display: grid; gap: 0.75rem;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6c757d;">الاسم:</span>
                                <strong>${salary.teacher?.name || '-'}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6c757d;">الشهر:</span>
                                <strong>${getMonthName(salary.month)} ${salary.year}</strong>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: white; padding: 1.5rem; border-radius: 1rem; border: 2px solid #dee2e6;">
                        <h4 style="color: #159895; margin-bottom: 1rem;">التفاصيل المالية</h4>
                        <div style="display: grid; gap: 0.75rem;">
                            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #dee2e6;">
                                <span>الراتب الأساسي:</span>
                                <strong>${salary.base_salary.toFixed(2)} ${salary.currency_symbol}</strong>
                            </div>
                            ${salary.bonus_amount > 0 ? `
                            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #dee2e6; color: #28a745;">
                                <span><i class="fas fa-plus-circle"></i> المكافأة / الزيادة:</span>
                                <strong>+${salary.bonus_amount.toFixed(2)} ${salary.currency_symbol}</strong>
                            </div>
                            ` : ''}
                            ${salary.deduction_amount > 0 ? `
                            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #dee2e6; color: #dc3545;">
                                <span><i class="fas fa-minus-circle"></i> الخصم:</span>
                                <strong>-${salary.deduction_amount.toFixed(2)} ${salary.currency_symbol}</strong>
                            </div>
                            ` : ''}
                            <div style="display: flex; justify-content: space-between; padding: 1rem 0; font-size: 1.3rem; font-weight: 700; color: #1a5f7a; border-top: 2px solid #1a5f7a;">
                                <span>الإجمالي النهائي:</span>
                                <span>${salary.total_amount.toFixed(2)} ${salary.currency_symbol}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                                <span>تاريخ الدفع:</span>
                                <strong>${salary.payment_date || 'لم يتم الدفع بعد'}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                                <span>الحالة:</span>
                                <span class="badge badge-${getStatusClass(salary.status)}">${getStatusText(salary.status)}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${salary.notes ? `
                    <div style="background: #fff3cd; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem;">
                        <strong><i class="fas fa-sticky-note"></i> ملاحظات:</strong>
                        <p style="margin: 0.5rem 0 0 0;">${salary.notes}</p>
                    </div>
                    ` : ''}
                </div>
            `,
            width: '700px',
            confirmButtonText: '<i class="fas fa-check"></i> حسناً',
            confirmButtonColor: '#1a5f7a',
            customClass: {
                popup: 'swal-rtl'
            }
        });
        
    } catch (error) {
        console.error('[Teacher Salaries] Error viewing:', error);
        showError('فشل عرض التفاصيل: ' + error.message);
    }
}

// Pay salary
async function paySalary(id) {
    try {
        const result = await Swal.fire({
            title: 'تأكيد الدفع',
            text: 'هل تريد تأكيد دفع هذا الراتب؟',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-check"></i> نعم، تأكيد',
            cancelButtonText: '<i class="fas fa-times"></i> إلغاء',
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d'
        });
        
        if (result.isConfirmed) {
            const client = window.supabaseClient;
            
            const { error } = await client
                .from('teacher_salaries')
                .update({
                    status: 'paid',
                    payment_date: new Date().toISOString().split('T')[0],
                    paid_at: new Date().toISOString()
                })
                .eq('id', id);
            
            if (error) throw error;
            
            await loadSalaries();
            
            Swal.fire({
                icon: 'success',
                title: 'تم بنجاح!',
                text: 'تم تأكيد دفع الراتب',
                timer: 2000,
                showConfirmButton: false
            });
        }
        
    } catch (error) {
        console.error('[Teacher Salaries] Error paying:', error);
        showError('فشل تأكيد الدفع: ' + error.message);
    }
}

// Helper functions
function getMonthName(month) {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return months[month - 1] || month;
}

function getStatusClass(status) {
    const classes = {
        'pending': 'warning',
        'approved': 'info',
        'paid': 'success',
        'rejected': 'danger',
        'on_hold': 'secondary'
    };
    return classes[status] || 'secondary';
}

function getStatusText(status) {
    const texts = {
        'pending': 'معلق',
        'approved': 'معتمد',
        'paid': 'مدفوع',
        'rejected': 'مرفوض',
        'on_hold': 'قيد الانتظار'
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

console.log('[Teacher Salaries] ✅ Script loaded');
