// Invoices Page JavaScript
console.log('[Invoices] 🚀 Initializing...');

let invoicesTable = null;

// Initialize page
async function initInvoicesPage() {
    console.log('[Invoices] 📊 Loading invoices data...');
    
    // Initialize Supabase if not already done
    if (!window.supabaseClient) {
        window.supabaseClient = initSupabase();
    }

    // Wait for Supabase to initialize
    await new Promise(resolve => setTimeout(resolve, 500));

    // Load invoices
    await loadInvoices();

    // Set default year
    const currentYear = new Date().getFullYear();
    document.getElementById('yearInput').value = currentYear;

    console.log('[Invoices] ✅ Initialization complete');
}

// Load invoices
async function loadInvoices() {
    try {
        const client = window.supabaseClient;
        const { data: invoices, error } = await client
            .from('invoices')
            .select(`
                *,
                student:students(id, name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        console.log('[Invoices] ✅ Loaded', invoices?.length || 0, 'invoices');

        // Update stats
        updateStats(invoices || []);

        // Display invoices
        displayInvoices(invoices || []);

        // Initialize DataTable
        setTimeout(() => {
            try {
                if (typeof $.fn.DataTable !== 'undefined' && $('#invoicesTable').length) {
                    // Check if table has data
                    const tbody = $('#invoicesTable tbody tr');
                    if (tbody.length === 0 || tbody.find('td[colspan]').length > 0) {
                        console.log('[Invoices] ⏭️ Skipping DataTable - no data');
                        return;
                    }
                    
                    if (invoicesTable) {
                        invoicesTable.destroy();
                    }
                    
                    invoicesTable = $('#invoicesTable').DataTable({
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
                        order: [[0, 'desc']],
                        pageLength: 25
                    });
                    console.log('[Invoices] ✅ DataTable initialized');
                }
            } catch (e) {
                console.warn('[Invoices] DataTable initialization skipped:', e.message);
            }
        }, 500);

    } catch (error) {
        console.error('[Invoices] Error loading invoices:', error);
        showError('فشل تحميل بيانات الفواتير: ' + error.message);
    }
}

// Update stats
function updateStats(invoices) {
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(i => i.status === 'paid').length;
    const pendingInvoices = invoices.filter(i => i.status === 'pending').length;
    const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;

    document.getElementById('totalInvoices').textContent = totalInvoices;
    document.getElementById('paidInvoices').textContent = paidInvoices;
    document.getElementById('pendingInvoices').textContent = pendingInvoices;
    document.getElementById('overdueInvoices').textContent = overdueInvoices;
}

// Display invoices
function displayInvoices(invoices) {
    const tbody = document.getElementById('invoicesTableBody');
    
    if (!tbody) {
        console.error('[Invoices] ❌ Table body not found');
        return;
    }

    if (invoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;"><i class="fas fa-file-invoice"></i><br>لا توجد فواتير<br><small>يمكنك إنشاء فاتورة جديدة من الزر أعلاه</small></td></tr>';
        return;
    }

    tbody.innerHTML = invoices.map(invoice => {
        try {
            const totalAmount = parseFloat(invoice.total_amount || 0);
            const paidAmount = parseFloat(invoice.amount_paid || 0);
            const dueAmount = parseFloat(invoice.amount_due || 0);

            return `
                <tr>
                    <td>${invoice.invoice_number || '-'}</td>
                    <td>${invoice.student?.name || '-'}</td>
                    <td>${getMonthName(invoice.month)} ${invoice.year}</td>
                    <td>${totalAmount.toFixed(2)} ${invoice.currency_symbol || '$'}</td>
                    <td>${paidAmount.toFixed(2)} ${invoice.currency_symbol || '$'}</td>
                    <td>${dueAmount.toFixed(2)} ${invoice.currency_symbol || '$'}</td>
                    <td>
                        <span class="badge badge-${getStatusClass(invoice.status)}">
                            ${getStatusText(invoice.status)}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="viewInvoice('${invoice.id}')" title="عرض">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-success" onclick="payAndEditInvoice('${invoice.id}')" title="دفع" ${invoice.status === 'paid' ? 'disabled' : ''}>
                            <i class="fas fa-dollar-sign"></i>
                        </button>
                    </td>
                </tr>
            `;
        } catch (err) {
            console.error('[Invoices] Error rendering invoice:', invoice, err);
            return '';
        }
    }).join('');
}

// Show add invoice modal
function showAddInvoiceModal() {
    document.getElementById('addInvoiceModal').style.display = 'flex';
    loadStudentsForInvoice();
}

// Close add invoice modal
function closeAddInvoiceModal() {
    document.getElementById('addInvoiceModal').style.display = 'none';
}

// Load students for invoice
async function loadStudentsForInvoice() {
    try {
        const client = window.supabaseClient;
        const { data: students, error } = await client
            .from('students')
            .select('id, name')
            .eq('status', 'active')
            .order('name');

        if (error) throw error;

        const select = document.getElementById('studentSelect');
        select.innerHTML = '<option value="">اختر الطالب...</option>';
        
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = student.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('[Invoices] Error loading students:', error);
    }
}

// Calculate total
function calculateTotal() {
    const baseAmount = parseFloat(document.getElementById('baseAmountInput').value) || 0;
    const discountPercentage = parseFloat(document.getElementById('discountPercentageInput').value) || 0;
    const additionalCharges = parseFloat(document.getElementById('additionalChargesInput').value) || 0;

    const discountAmount = (baseAmount * discountPercentage) / 100;
    const totalAmount = baseAmount - discountAmount + additionalCharges;

    document.getElementById('discountAmountInput').value = discountAmount.toFixed(2);
    document.getElementById('totalAmountInput').value = totalAmount.toFixed(2);

    // Update summary
    document.getElementById('summaryBase').textContent = baseAmount.toFixed(2) + ' $';
    document.getElementById('summaryDiscount').textContent = discountAmount.toFixed(2) + ' $';
    document.getElementById('summaryCharges').textContent = additionalCharges.toFixed(2) + ' $';
    document.getElementById('summaryTotal').textContent = totalAmount.toFixed(2) + ' $';
}

// Save invoice
async function saveInvoice(event) {
    event.preventDefault();
    
    try {
        const client = window.supabaseClient;
        
        const studentId = document.getElementById('studentSelect').value;
        const month = parseInt(document.getElementById('monthSelect').value);
        const year = parseInt(document.getElementById('yearInput').value);
        
        // Get student's pricing plan and country to calculate expected sessions and currency
        const { data: student, error: studentError } = await client
            .from('students')
            .select(`
                pricing_plan:pricing_plans(sessions_per_week),
                country:countries(currency_code, currency_symbol)
            `)
            .eq('id', studentId)
            .single();
        
        if (studentError) throw studentError;
        
        // Calculate expected sessions (sessions_per_week * 4 weeks)
        const sessionsPerWeek = student?.pricing_plan?.sessions_per_week || 0;
        const expectedSessions = sessionsPerWeek * 4;
        
        // Get currency from student's country
        const currencyCode = student?.country?.currency_code || 'SAR';
        const currencySymbol = student?.country?.currency_symbol || 'ر.س';
        
        // Count actual sessions for this month
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];
        
        const { data: sessions, error: sessionsError } = await client
            .from('sessions')
            .select('id, status')
            .eq('student_id', studentId)
            .gte('session_date', startDate)
            .lte('session_date', endDate);
        
        if (sessionsError) throw sessionsError;
        
        // Count sessions by status
        const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
        const absentSessions = sessions?.filter(s => s.status === 'student_absent').length || 0;
        const excusedSessions = sessions?.filter(s => s.status === 'student_excused').length || 0;
        const cancelledByTeacher = sessions?.filter(s => s.status === 'teacher_cancelled').length || 0;
        
        // Generate invoice number
        const invoiceNumber = `INV-${year}${String(month).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;
        
        const invoiceData = {
            invoice_number: invoiceNumber,
            student_id: studentId,
            month: month,
            year: year,
            base_amount: parseFloat(document.getElementById('baseAmountInput').value),
            discount_percentage: parseFloat(document.getElementById('discountPercentageInput').value) || 0,
            discount_amount: parseFloat(document.getElementById('discountAmountInput').value) || 0,
            additional_charges: parseFloat(document.getElementById('additionalChargesInput').value) || 0,
            tax_amount: 0,
            tax_percentage: 0,
            subtotal: parseFloat(document.getElementById('totalAmountInput').value),
            total_amount: parseFloat(document.getElementById('totalAmountInput').value),
            amount_paid: 0,
            amount_due: parseFloat(document.getElementById('totalAmountInput').value),
            due_date: document.getElementById('dueDateInput').value,
            issue_date: new Date().toISOString().split('T')[0],
            status: 'pending',
            currency_code: currencyCode,
            currency_symbol: currencySymbol,
            expected_sessions: expectedSessions,
            completed_sessions: completedSessions,
            absent_sessions: absentSessions,
            cancelled_by_student: excusedSessions,
            cancelled_by_teacher: cancelledByTeacher,
            notes: document.getElementById('notesInput').value || null,
            discount_reason: document.getElementById('discountReasonInput').value || null,
            billing_period_start: startDate,
            billing_period_end: endDate
        };

        const { error } = await client
            .from('invoices')
            .insert(invoiceData);

        if (error) throw error;

        closeAddInvoiceModal();
        await loadInvoices();

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'تم الحفظ',
                text: 'تم إنشاء الفاتورة بنجاح',
                timer: 1500,
                showConfirmButton: false
            });
        }
    } catch (error) {
        console.error('[Invoices] Error saving invoice:', error);
        showError('فشل حفظ الفاتورة: ' + error.message);
    }
}

// Helper functions
function getStatusClass(status) {
    const classes = {
        'pending': 'warning',
        'paid': 'success',
        'overdue': 'danger',
        'cancelled': 'secondary'
    };
    return classes[status] || 'secondary';
}

function getStatusText(status) {
    const texts = {
        'pending': 'معلقة',
        'paid': 'مدفوعة',
        'overdue': 'متأخرة',
        'cancelled': 'ملغاة'
    };
    return texts[status] || status;
}

function getMonthName(month) {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return months[month - 1] || month;
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

// View invoice details
async function viewInvoice(id) {
    console.log('[Invoices] View invoice:', id);
    
    try {
        const client = window.supabaseClient;
        
        // Get invoice with student details
        const { data: invoice, error } = await client
            .from('invoices')
            .select(`
                *,
                student:students(id, name, phone, parent_phone)
            `)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // Show beautiful modal
        await Swal.fire({
            title: `
                <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; color: #1a5f7a;">
                    <i class="fas fa-file-invoice" style="font-size: 2rem;"></i>
                    <span>تفاصيل الفاتورة</span>
                </div>
            `,
            html: `
                <div style="text-align: right; padding: 1rem;">
                    <!-- Invoice Header -->
                    <div style="background: linear-gradient(135deg, #1a5f7a 0%, #159895 100%); color: white; padding: 1.5rem; border-radius: 1rem; margin-bottom: 1.5rem; box-shadow: 0 4px 12px rgba(26, 95, 122, 0.3);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <div>
                                <div style="font-size: 0.9rem; opacity: 0.9;">رقم الفاتورة</div>
                                <div style="font-size: 1.3rem; font-weight: 700;">${invoice.invoice_number}</div>
                            </div>
                            <div style="text-align: left;">
                                <span class="badge badge-${getStatusClass(invoice.status)}" style="font-size: 1rem; padding: 0.5rem 1rem;">
                                    ${getStatusText(invoice.status)}
                                </span>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; font-size: 0.95rem;">
                            <div>
                                <i class="fas fa-calendar"></i> الشهر: <strong>${getMonthName(invoice.month)} ${invoice.year}</strong>
                            </div>
                            <div>
                                <i class="fas fa-clock"></i> تاريخ الإصدار: <strong>${invoice.issue_date}</strong>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Student Info -->
                    <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 1rem; margin-bottom: 1.5rem; border-right: 4px solid #1a5f7a;">
                        <h4 style="color: #1a5f7a; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-user-graduate"></i>
                            <span>معلومات الطالب</span>
                        </h4>
                        <div style="display: grid; gap: 0.75rem;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6c757d;">الاسم:</span>
                                <strong>${invoice.student?.name || '-'}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6c757d;">الهاتف:</span>
                                <strong>${invoice.student?.phone || '-'}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6c757d;">هاتف ولي الأمر:</span>
                                <strong>${invoice.student?.parent_phone || '-'}</strong>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Sessions Info -->
                    <div style="background: white; padding: 1.5rem; border-radius: 1rem; margin-bottom: 1.5rem; border: 2px solid #dee2e6;">
                        <h4 style="color: #159895; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-calendar-check"></i>
                            <span>الحصص</span>
                        </h4>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                            <div style="text-align: center; padding: 1rem; background: #e3f2fd; border-radius: 0.5rem;">
                                <div style="font-size: 2rem; font-weight: 700; color: #2196f3;">${invoice.expected_sessions || 0}</div>
                                <div style="color: #6c757d; font-size: 0.9rem;">المتوقعة</div>
                            </div>
                            <div style="text-align: center; padding: 1rem; background: #e8f5e9; border-radius: 0.5rem;">
                                <div style="font-size: 2rem; font-weight: 700; color: #4caf50;">${invoice.completed_sessions || 0}</div>
                                <div style="color: #6c757d; font-size: 0.9rem;">المكتملة</div>
                            </div>
                            <div style="text-align: center; padding: 1rem; background: #fff3e0; border-radius: 0.5rem;">
                                <div style="font-size: 2rem; font-weight: 700; color: #ff9800;">${invoice.cancelled_by_student || 0}</div>
                                <div style="color: #6c757d; font-size: 0.9rem;">اعتذارات</div>
                            </div>
                            <div style="text-align: center; padding: 1rem; background: #ffebee; border-radius: 0.5rem;">
                                <div style="font-size: 2rem; font-weight: 700; color: #f44336;">${invoice.absent_sessions || 0}</div>
                                <div style="color: #6c757d; font-size: 0.9rem;">غياب</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Financial Details -->
                    <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 1.5rem; border-radius: 1rem; border: 2px solid #dee2e6;">
                        <h4 style="color: #1a5f7a; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-money-bill-wave"></i>
                            <span>التفاصيل المالية</span>
                        </h4>
                        <div style="display: grid; gap: 0.75rem; font-size: 1rem;">
                            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #dee2e6;">
                                <span>المبلغ الأساسي:</span>
                                <strong>${invoice.base_amount.toFixed(2)} ${invoice.currency_symbol}</strong>
                            </div>
                            ${invoice.discount_amount > 0 ? `
                            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #dee2e6; color: #28a745;">
                                <span>الخصم (${invoice.discount_percentage}%):</span>
                                <strong>- ${invoice.discount_amount.toFixed(2)} ${invoice.currency_symbol}</strong>
                            </div>
                            ` : ''}
                            ${invoice.additional_charges > 0 ? `
                            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #dee2e6; color: #dc3545;">
                                <span>رسوم إضافية:</span>
                                <strong>+ ${invoice.additional_charges.toFixed(2)} ${invoice.currency_symbol}</strong>
                            </div>
                            ` : ''}
                            <div style="display: flex; justify-content: space-between; padding: 1rem 0; font-size: 1.3rem; font-weight: 700; color: #1a5f7a; border-top: 2px solid #1a5f7a;">
                                <span>الإجمالي:</span>
                                <span>${invoice.total_amount.toFixed(2)} ${invoice.currency_symbol}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; color: #28a745;">
                                <span>المدفوع:</span>
                                <strong>${invoice.amount_paid.toFixed(2)} ${invoice.currency_symbol}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; font-size: 1.2rem; font-weight: 700; color: ${invoice.amount_due > 0 ? '#dc3545' : '#28a745'};">
                                <span>المتبقي:</span>
                                <span>${invoice.amount_due.toFixed(2)} ${invoice.currency_symbol}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${invoice.notes ? `
                    <div style="background: #fff3cd; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem; border-right: 4px solid #ffc107;">
                        <strong><i class="fas fa-sticky-note"></i> ملاحظات:</strong>
                        <p style="margin: 0.5rem 0 0 0;">${invoice.notes}</p>
                    </div>
                    ` : ''}
                </div>
            `,
            width: '800px',
            showCancelButton: invoice.status !== 'paid',
            confirmButtonText: invoice.status !== 'paid' ? '<i class="fas fa-money-bill-wave"></i> تسجيل دفعة' : '<i class="fas fa-check"></i> حسناً',
            cancelButtonText: '<i class="fas fa-times"></i> إغلاق',
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            customClass: {
                popup: 'swal-rtl'
            }
        }).then((result) => {
            if (result.isConfirmed && invoice.status !== 'paid') {
                payInvoice(id);
            }
        });
        
    } catch (error) {
        console.error('[Invoices] Error viewing invoice:', error);
        showError('فشل عرض الفاتورة: ' + error.message);
    }
}

// Pay invoice
async function payInvoice(id) {
    console.log('[Invoices] Pay invoice:', id);
    
    try {
        const client = window.supabaseClient;
        
        // Get invoice details
        const { data: invoice, error: invoiceError } = await client
            .from('invoices')
            .select('*, student:students(name)')
            .eq('id', id)
            .single();
        
        if (invoiceError) throw invoiceError;
        
        const result = await Swal.fire({
            title: `
                <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; color: #28a745;">
                    <i class="fas fa-money-bill-wave" style="font-size: 2rem;"></i>
                    <span>تسجيل دفعة</span>
                </div>
            `,
            html: `
                <div style="text-align: right; padding: 1rem;">
                    <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 1rem; margin-bottom: 1.5rem; border-right: 4px solid #28a745;">
                        <div style="display: grid; gap: 0.75rem; font-size: 1rem;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6c757d;">الطالب:</span>
                                <strong>${invoice.student?.name}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6c757d;">رقم الفاتورة:</span>
                                <strong>${invoice.invoice_number}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 1.2rem; padding-top: 0.5rem; border-top: 2px solid #dee2e6;">
                                <span style="color: #6c757d;">المبلغ المتبقي:</span>
                                <strong style="color: #dc3545;">${invoice.amount_due.toFixed(2)} ${invoice.currency_symbol}</strong>
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: grid; gap: 1.25rem;">
                        <div>
                            <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                <i class="fas fa-money-bill-wave" style="color: #28a745;"></i>
                                <span>المبلغ المدفوع</span>
                                <span style="color: #dc3545;">*</span>
                            </label>
                            <input type="number" id="payment-amount" class="swal2-input" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; font-size: 1.1rem; font-weight: 600;" value="${invoice.amount_due.toFixed(2)}" min="0" max="${invoice.amount_due}" step="0.01" required>
                        </div>
                        
                        <div>
                            <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                <i class="fas fa-credit-card" style="color: #1a5f7a;"></i>
                                <span>طريقة الدفع</span>
                                <span style="color: #dc3545;">*</span>
                            </label>
                            <select id="payment-method" class="swal2-input" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; font-size: 1rem;" required>
                                <option value="cash">نقداً</option>
                                <option value="bank_transfer">تحويل بنكي</option>
                                <option value="credit_card">بطاقة ائتمان</option>
                                <option value="vodafone_cash">فودافون كاش</option>
                                <option value="instapay">إنستاباي</option>
                                <option value="other">أخرى</option>
                            </select>
                        </div>
                        
                        <div>
                            <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                <i class="fas fa-calendar" style="color: #f39c12;"></i>
                                <span>تاريخ الدفع</span>
                            </label>
                            <input type="date" id="payment-date" class="swal2-input" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; font-size: 1rem;" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        
                        <div>
                            <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                <i class="fas fa-sticky-note" style="color: #6c757d;"></i>
                                <span>ملاحظات</span>
                            </label>
                            <textarea id="payment-notes" class="swal2-textarea" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; resize: vertical; min-height: 80px;" placeholder="ملاحظات إضافية (اختياري)"></textarea>
                        </div>
                    </div>
                </div>
            `,
            width: '600px',
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-check-circle"></i> تأكيد الدفع',
            cancelButtonText: '<i class="fas fa-times-circle"></i> إلغاء',
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            customClass: {
                popup: 'swal-rtl'
            },
            preConfirm: () => {
                const amount = parseFloat(document.getElementById('payment-amount').value);
                const method = document.getElementById('payment-method').value;
                const date = document.getElementById('payment-date').value;
                const notes = document.getElementById('payment-notes').value;
                
                if (!amount || amount <= 0) {
                    Swal.showValidationMessage('⚠️ يرجى إدخال مبلغ صحيح');
                    return false;
                }
                
                if (amount > invoice.amount_due) {
                    Swal.showValidationMessage('⚠️ المبلغ المدفوع أكبر من المتبقي');
                    return false;
                }
                
                return { amount, method, date, notes };
            }
        });
        
        if (result.isConfirmed) {
            const { amount, method, date, notes } = result.value;
            
            Swal.fire({
                title: 'جاري الحفظ...',
                html: '<div style="padding: 1rem;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #28a745;"></i></div>',
                allowOutsideClick: false,
                showConfirmButton: false
            });
            
            // Generate payment number
            const paymentNumber = `PAY-${Date.now().toString().slice(-8)}`;
            
            // Create payment record
            const { error: paymentError } = await client
                .from('payments')
                .insert({
                    payment_number: paymentNumber,
                    invoice_id: id,
                    student_id: invoice.student_id,
                    amount: amount,
                    currency_code: invoice.currency_code,
                    currency_symbol: invoice.currency_symbol,
                    payment_method: method,
                    payment_date: date,
                    status: 'completed',
                    notes: notes || null
                });
            
            if (paymentError) throw paymentError;
            
            // Update invoice
            const newAmountPaid = invoice.amount_paid + amount;
            const newAmountDue = invoice.total_amount - newAmountPaid;
            const newStatus = newAmountDue <= 0 ? 'paid' : (newAmountPaid > 0 ? 'partial' : 'pending');
            
            const { error: updateError } = await client
                .from('invoices')
                .update({
                    amount_paid: newAmountPaid,
                    amount_due: newAmountDue,
                    status: newStatus,
                    paid_date: newAmountDue <= 0 ? date : null,
                    last_payment_date: date
                })
                .eq('id', id);
            
            if (updateError) throw updateError;
            
            await Swal.fire({
                icon: 'success',
                title: '<div style="color: #28a745;">تم بنجاح!</div>',
                html: `
                    <div style="font-size: 1.1rem; color: #495057;">
                        تم تسجيل الدفعة بنجاح<br>
                        <strong style="color: #28a745;">${amount.toFixed(2)} ${invoice.currency_symbol}</strong>
                    </div>
                `,
                timer: 2000,
                showConfirmButton: false,
                customClass: {
                    popup: 'swal-rtl'
                }
            });
            
            await loadInvoices();
        }
        
    } catch (error) {
        console.error('[Invoices] Error processing payment:', error);
        Swal.fire({
            icon: 'error',
            title: '<div style="color: #dc3545;">خطأ</div>',
            html: `<div style="font-size: 1rem; color: #495057;">فشل تسجيل الدفعة<br><small style="color: #6c757d;">${error.message}</small></div>`,
            confirmButtonColor: '#dc3545',
            customClass: {
                popup: 'swal-rtl'
            }
        });
    }
}

// Edit invoice
async function editInvoice(id) {
    console.log('[Invoices] Edit invoice:', id);
    
    try {
        const client = window.supabaseClient;
        
        // Get invoice details
        const { data: invoice, error } = await client
            .from('invoices')
            .select('*, student:students(name)')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        const result = await Swal.fire({
            title: `
                <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; color: #f39c12;">
                    <i class="fas fa-edit" style="font-size: 2rem;"></i>
                    <span>تعديل الفاتورة</span>
                </div>
            `,
            html: `
                <div style="text-align: right; padding: 1rem;">
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem; border-right: 4px solid #f39c12;">
                        <div style="display: grid; gap: 0.5rem;">
                            <div><strong>الطالب:</strong> ${invoice.student?.name}</div>
                            <div><strong>رقم الفاتورة:</strong> ${invoice.invoice_number}</div>
                            <div><strong>الشهر:</strong> ${getMonthName(invoice.month)} ${invoice.year}</div>
                        </div>
                    </div>
                    
                    <div style="display: grid; gap: 1.25rem;">
                        <div>
                            <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                <i class="fas fa-money-bill-wave" style="color: #1a5f7a;"></i>
                                <span>المبلغ الأساسي</span>
                                <span style="color: #dc3545;">*</span>
                            </label>
                            <input type="number" id="edit-base-amount" class="swal2-input" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; font-size: 1rem;" value="${invoice.base_amount}" min="0" step="0.01" required>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div>
                                <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                    <i class="fas fa-percentage" style="color: #28a745;"></i>
                                    <span>نسبة الخصم (%)</span>
                                </label>
                                <input type="number" id="edit-discount-percentage" class="swal2-input" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; font-size: 1rem;" value="${invoice.discount_percentage}" min="0" max="100" step="0.01" oninput="calculateEditTotal()">
                            </div>
                            
                            <div>
                                <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                    <i class="fas fa-tag" style="color: #28a745;"></i>
                                    <span>مبلغ الخصم</span>
                                </label>
                                <input type="number" id="edit-discount-amount" class="swal2-input" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; font-size: 1rem; background: #f8f9fa;" value="${invoice.discount_amount}" readonly>
                            </div>
                        </div>
                        
                        <div>
                            <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                <i class="fas fa-plus-circle" style="color: #dc3545;"></i>
                                <span>رسوم إضافية</span>
                            </label>
                            <input type="number" id="edit-additional-charges" class="swal2-input" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; font-size: 1rem;" value="${invoice.additional_charges || 0}" min="0" step="0.01" oninput="calculateEditTotal()">
                        </div>
                        
                        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 1rem; border-radius: 0.5rem; border: 2px solid #1a5f7a;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: 600; color: #495057;">الإجمالي:</span>
                                <span id="edit-total-display" style="font-size: 1.5rem; font-weight: 700; color: #1a5f7a;">${invoice.total_amount.toFixed(2)} ${invoice.currency_symbol}</span>
                            </div>
                        </div>
                        
                        <div>
                            <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                <i class="fas fa-calendar" style="color: #f39c12;"></i>
                                <span>تاريخ الاستحقاق</span>
                            </label>
                            <input type="date" id="edit-due-date" class="swal2-input" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; font-size: 1rem;" value="${invoice.due_date}">
                        </div>
                        
                        <div>
                            <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                <i class="fas fa-info-circle" style="color: #6c757d;"></i>
                                <span>سبب الخصم</span>
                            </label>
                            <input type="text" id="edit-discount-reason" class="swal2-input" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; font-size: 1rem;" value="${invoice.discount_reason || ''}" placeholder="سبب الخصم (اختياري)">
                        </div>
                        
                        <div>
                            <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                <i class="fas fa-sticky-note" style="color: #6c757d;"></i>
                                <span>ملاحظات</span>
                            </label>
                            <textarea id="edit-notes" class="swal2-textarea" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; resize: vertical; min-height: 80px;" placeholder="ملاحظات إضافية (اختياري)">${invoice.notes || ''}</textarea>
                        </div>
                    </div>
                </div>
                
                <script>
                    function calculateEditTotal() {
                        const baseAmount = parseFloat(document.getElementById('edit-base-amount').value) || 0;
                        const discountPercentage = parseFloat(document.getElementById('edit-discount-percentage').value) || 0;
                        const additionalCharges = parseFloat(document.getElementById('edit-additional-charges').value) || 0;
                        
                        const discountAmount = (baseAmount * discountPercentage) / 100;
                        const total = baseAmount - discountAmount + additionalCharges;
                        
                        document.getElementById('edit-discount-amount').value = discountAmount.toFixed(2);
                        document.getElementById('edit-total-display').textContent = total.toFixed(2) + ' ${invoice.currency_symbol}';
                    }
                    
                    // Add event listeners
                    document.getElementById('edit-base-amount').addEventListener('input', calculateEditTotal);
                </script>
            `,
            width: '700px',
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-save"></i> حفظ التعديلات',
            cancelButtonText: '<i class="fas fa-times"></i> إلغاء',
            confirmButtonColor: '#f39c12',
            cancelButtonColor: '#6c757d',
            customClass: {
                popup: 'swal-rtl'
            },
            didOpen: () => {
                calculateEditTotal();
            },
            preConfirm: () => {
                const baseAmount = parseFloat(document.getElementById('edit-base-amount').value);
                const discountPercentage = parseFloat(document.getElementById('edit-discount-percentage').value) || 0;
                const discountAmount = parseFloat(document.getElementById('edit-discount-amount').value) || 0;
                const additionalCharges = parseFloat(document.getElementById('edit-additional-charges').value) || 0;
                const dueDate = document.getElementById('edit-due-date').value;
                const discountReason = document.getElementById('edit-discount-reason').value;
                const notes = document.getElementById('edit-notes').value;
                
                if (!baseAmount || baseAmount <= 0) {
                    Swal.showValidationMessage('⚠️ يرجى إدخال مبلغ أساسي صحيح');
                    return false;
                }
                
                const total = baseAmount - discountAmount + additionalCharges;
                
                return {
                    baseAmount,
                    discountPercentage,
                    discountAmount,
                    additionalCharges,
                    total,
                    dueDate,
                    discountReason,
                    notes
                };
            }
        });
        
        if (result.isConfirmed) {
            const data = result.value;
            
            Swal.fire({
                title: 'جاري الحفظ...',
                html: '<div style="padding: 1rem;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #f39c12;"></i></div>',
                allowOutsideClick: false,
                showConfirmButton: false
            });
            
            // Calculate new amount_due
            const newAmountDue = data.total - invoice.amount_paid;
            const newStatus = newAmountDue <= 0 ? 'paid' : (invoice.amount_paid > 0 ? 'partial' : 'pending');
            
            // Update invoice
            const { error: updateError } = await client
                .from('invoices')
                .update({
                    base_amount: data.baseAmount,
                    discount_percentage: data.discountPercentage,
                    discount_amount: data.discountAmount,
                    additional_charges: data.additionalCharges,
                    subtotal: data.total,
                    total_amount: data.total,
                    amount_due: newAmountDue,
                    due_date: data.dueDate,
                    discount_reason: data.discountReason || null,
                    notes: data.notes || null,
                    status: newStatus
                })
                .eq('id', id);
            
            if (updateError) throw updateError;
            
            await Swal.fire({
                icon: 'success',
                title: '<div style="color: #28a745;">تم بنجاح!</div>',
                html: '<div style="font-size: 1.1rem; color: #495057;">تم تحديث الفاتورة بنجاح</div>',
                timer: 2000,
                showConfirmButton: false,
                customClass: {
                    popup: 'swal-rtl'
                }
            });
            
            await loadInvoices();
        }
        
    } catch (error) {
        console.error('[Invoices] Error editing invoice:', error);
        Swal.fire({
            icon: 'error',
            title: '<div style="color: #dc3545;">خطأ</div>',
            html: `<div style="font-size: 1rem; color: #495057;">فشل تحديث الفاتورة<br><small style="color: #6c757d;">${error.message}</small></div>`,
            confirmButtonColor: '#dc3545',
            customClass: {
                popup: 'swal-rtl'
            }
        });
    }
}

function showPayInvoiceModal(id) {
    console.log('[Invoices] Pay invoice:', id);
    alert('دفع الفاتورة: ' + id);
}

// Generate monthly invoices for all students
async function generateMonthlyInvoices() {
    console.log('[Invoices] Generate monthly invoices');
    
    try {
        // Show month selection dialog
        const result = await Swal.fire({
            title: `
                <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; color: #1a5f7a;">
                    <i class="fas fa-calendar-alt" style="font-size: 2rem;"></i>
                    <span>إنشاء فواتير شهرية</span>
                </div>
            `,
            html: `
                <div style="text-align: right; padding: 1rem;">
                    <div style="background: #e3f2fd; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem; border-right: 4px solid #2196f3;">
                        <p style="margin: 0; color: #1976d2;">
                            <i class="fas fa-info-circle"></i>
                            سيتم إنشاء فواتير تلقائية لجميع الطلاب النشطين بناءً على نظام التسعير الخاص بكل طالب
                        </p>
                    </div>
                    
                    <div style="display: grid; gap: 1.25rem;">
                        <div>
                            <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                <i class="fas fa-calendar" style="color: #1a5f7a;"></i>
                                <span>اختر الشهر</span>
                                <span style="color: #dc3545;">*</span>
                            </label>
                            <input type="month" id="invoice-month" class="swal2-input" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; font-size: 1rem;" required>
                        </div>
                        
                        <div>
                            <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                <i class="fas fa-calendar-check" style="color: #f39c12;"></i>
                                <span>تاريخ الاستحقاق</span>
                            </label>
                            <input type="date" id="invoice-due-date" class="swal2-input" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; font-size: 1rem;">
                        </div>
                    </div>
                </div>
            `,
            width: '600px',
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-cogs"></i> إنشاء الفواتير',
            cancelButtonText: '<i class="fas fa-times"></i> إلغاء',
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            customClass: {
                popup: 'swal-rtl'
            },
            didOpen: () => {
                // Set default to current month
                const now = new Date();
                const currentMonth = now.toISOString().slice(0, 7);
                document.getElementById('invoice-month').value = currentMonth;
                
                // Set due date to end of month
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                document.getElementById('invoice-due-date').value = endOfMonth.toISOString().split('T')[0];
            },
            preConfirm: () => {
                const month = document.getElementById('invoice-month').value;
                const dueDate = document.getElementById('invoice-due-date').value;
                
                if (!month) {
                    Swal.showValidationMessage('⚠️ يرجى اختيار الشهر');
                    return false;
                }
                
                return { month, dueDate };
            }
        });
        
        if (result.isConfirmed) {
            const { month, dueDate } = result.value;
            const [year, monthNum] = month.split('-').map(Number);
            
            // Show loading
            Swal.fire({
                title: 'جاري إنشاء الفواتير...',
                html: `
                    <div style="padding: 2rem;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: #1a5f7a;"></i>
                        <p style="margin-top: 1rem; color: #6c757d;">يرجى الانتظار...</p>
                    </div>
                `,
                allowOutsideClick: false,
                showConfirmButton: false
            });
            
            const client = window.supabaseClient;
            
            // Get all active students with their pricing plans
            const { data: students, error: studentsError } = await client
                .from('students')
                .select(`
                    id,
                    name,
                    pricing_plan_id,
                    custom_monthly_price,
                    discount_percentage,
                    pricing_plan:pricing_plans(sessions_per_week, monthly_price),
                    country:countries(currency_code, currency_symbol)
                `)
                .eq('status', 'active');
            
            if (studentsError) throw studentsError;
            
            if (!students || students.length === 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'تنبيه',
                    text: 'لا يوجد طلاب نشطين',
                    confirmButtonColor: '#f39c12'
                });
                return;
            }
            
            // Calculate date range for the month
            const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`;
            const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0];
            
            const invoices = [];
            const errors = [];
            
            for (const student of students) {
                try {
                    // Check if invoice already exists
                    const { data: existing } = await client
                        .from('invoices')
                        .select('id')
                        .eq('student_id', student.id)
                        .eq('month', monthNum)
                        .eq('year', year)
                        .maybeSingle();
                    
                    if (existing) {
                        errors.push(`${student.name}: الفاتورة موجودة مسبقاً`);
                        continue;
                    }
                    
                    // Calculate expected sessions
                    const sessionsPerWeek = student.pricing_plan?.sessions_per_week || 0;
                    const expectedSessions = sessionsPerWeek * 4;
                    
                    // Get actual sessions for this month
                    const { data: sessions } = await client
                        .from('sessions')
                        .select('id, status')
                        .eq('student_id', student.id)
                        .gte('session_date', startDate)
                        .lte('session_date', endDate);
                    
                    const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
                    const absentSessions = sessions?.filter(s => s.status === 'student_absent').length || 0;
                    const excusedSessions = sessions?.filter(s => s.status === 'student_excused').length || 0;
                    const cancelledByTeacher = sessions?.filter(s => s.status === 'teacher_cancelled').length || 0;
                    
                    // Get currency from student's country
                    const currencyCode = student.country?.currency_code || 'SAR';
                    const currencySymbol = student.country?.currency_symbol || 'ر.س';
                    
                    // Calculate price
                    const baseAmount = student.custom_monthly_price || student.pricing_plan?.monthly_price || 0;
                    const discountPercentage = student.discount_percentage || 0;
                    const discountAmount = (baseAmount * discountPercentage) / 100;
                    const totalAmount = baseAmount - discountAmount;
                    
                    // Generate invoice number
                    const invoiceNumber = `INV-${year}${String(monthNum).padStart(2, '0')}-${student.id.slice(0, 6)}`;
                    
                    invoices.push({
                        invoice_number: invoiceNumber,
                        student_id: student.id,
                        month: monthNum,
                        year: year,
                        base_amount: baseAmount,
                        discount_percentage: discountPercentage,
                        discount_amount: discountAmount,
                        additional_charges: 0,
                        tax_amount: 0,
                        tax_percentage: 0,
                        subtotal: totalAmount,
                        total_amount: totalAmount,
                        amount_paid: 0,
                        amount_due: totalAmount,
                        due_date: dueDate,
                        issue_date: new Date().toISOString().split('T')[0],
                        status: 'pending',
                        currency_code: currencyCode,
                        currency_symbol: currencySymbol,
                        expected_sessions: expectedSessions,
                        completed_sessions: completedSessions,
                        absent_sessions: absentSessions,
                        cancelled_by_student: excusedSessions,
                        cancelled_by_teacher: cancelledByTeacher,
                        billing_period_start: startDate,
                        billing_period_end: endDate
                    });
                    
                } catch (err) {
                    errors.push(`${student.name}: ${err.message}`);
                }
            }
            
            // Insert all invoices
            if (invoices.length > 0) {
                const { error: insertError } = await client
                    .from('invoices')
                    .insert(invoices);
                
                if (insertError) throw insertError;
            }
            
            // Show results
            await Swal.fire({
                icon: invoices.length > 0 ? 'success' : 'warning',
                title: invoices.length > 0 ? 'تم بنجاح!' : 'تنبيه',
                html: `
                    <div style="text-align: right; padding: 1rem;">
                        <div style="background: ${invoices.length > 0 ? '#d4edda' : '#fff3cd'}; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; border-right: 4px solid ${invoices.length > 0 ? '#28a745' : '#ffc107'};">
                            <strong style="font-size: 1.2rem;">
                                <i class="fas fa-check-circle"></i>
                                تم إنشاء ${invoices.length} فاتورة بنجاح
                            </strong>
                        </div>
                        
                        ${errors.length > 0 ? `
                        <div style="background: #f8d7da; padding: 1rem; border-radius: 0.5rem; border-right: 4px solid #dc3545;">
                            <strong style="color: #721c24;">
                                <i class="fas fa-exclamation-triangle"></i>
                                ${errors.length} خطأ:
                            </strong>
                            <ul style="text-align: right; margin: 0.5rem 0 0 0; padding-right: 1.5rem;">
                                ${errors.slice(0, 5).map(err => `<li style="color: #721c24;">${err}</li>`).join('')}
                                ${errors.length > 5 ? `<li style="color: #721c24;">... و ${errors.length - 5} أخطاء أخرى</li>` : ''}
                            </ul>
                        </div>
                        ` : ''}
                    </div>
                `,
                confirmButtonColor: '#1a5f7a',
                customClass: {
                    popup: 'swal-rtl'
                }
            });
            
            // Reload invoices
            await loadInvoices();
        }
        
    } catch (error) {
        console.error('[Invoices] Error generating monthly invoices:', error);
        Swal.fire({
            icon: 'error',
            title: '<div style="color: #dc3545;">خطأ</div>',
            html: `<div style="font-size: 1rem; color: #495057;">فشل إنشاء الفواتير<br><small style="color: #6c757d;">${error.message}</small></div>`,
            confirmButtonColor: '#dc3545',
            customClass: {
                popup: 'swal-rtl'
            }
        });
    }
}

function onStudentChange() {
    // TODO: Load student pricing plan
}

console.log('[Invoices] ✅ Script loaded');


// Pay and Edit Invoice - Combined function
async function payAndEditInvoice(id) {
    console.log('[Invoices] Pay and Edit invoice:', id);
    
    try {
        const client = window.supabaseClient;
        
        // Get invoice details
        const { data: invoice, error } = await client
            .from('invoices')
            .select('*, student:students(name)')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        const result = await Swal.fire({
            title: `
                <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; color: #28a745;">
                    <i class="fas fa-money-bill-wave" style="font-size: 2rem;"></i>
                    <i class="fas fa-edit" style="font-size: 1.5rem;"></i>
                    <span>تسجيل دفعة وتعديل الفاتورة</span>
                </div>
            `,
            html: `
                <div style="text-align: right; padding: 1rem;">
                    <!-- Invoice Info -->
                    <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 1rem; margin-bottom: 1.5rem; border-right: 4px solid #28a745;">
                        <div style="display: grid; gap: 0.75rem; font-size: 1rem;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6c757d;">الطالب:</span>
                                <strong>${invoice.student?.name}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6c757d;">رقم الفاتورة:</span>
                                <strong>${invoice.invoice_number}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #6c757d;">الشهر:</span>
                                <strong>${getMonthName(invoice.month)} ${invoice.year}</strong>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Edit Invoice Section -->
                    <div style="background: #fff3cd; padding: 1.5rem; border-radius: 1rem; margin-bottom: 1.5rem; border-right: 4px solid #ffc107;">
                        <h4 style="color: #856404; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-edit"></i>
                            <span>تعديل تفاصيل الفاتورة</span>
                        </h4>
                        
                        <div style="display: grid; gap: 1rem;">
                            <div>
                                <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                    <i class="fas fa-money-bill-wave" style="color: #1a5f7a;"></i>
                                    <span>المبلغ الأساسي</span>
                                    <span style="color: #dc3545;">*</span>
                                </label>
                                <input type="number" id="combined-base-amount" class="swal2-input" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; font-size: 1rem;" value="${invoice.base_amount}" min="0" step="0.01" oninput="calculateCombinedTotal()" required>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div>
                                    <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                        <i class="fas fa-percentage" style="color: #28a745;"></i>
                                        <span>نسبة الخصم (%)</span>
                                    </label>
                                    <input type="number" id="combined-discount-percentage" class="swal2-input" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; font-size: 1rem;" value="${invoice.discount_percentage}" min="0" max="100" step="0.01" oninput="calculateCombinedTotal()">
                                </div>
                                
                                <div>
                                    <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                        <i class="fas fa-tag" style="color: #28a745;"></i>
                                        <span>مبلغ الخصم</span>
                                    </label>
                                    <input type="number" id="combined-discount-amount" class="swal2-input" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; font-size: 1rem; background: #f8f9fa;" value="${invoice.discount_amount}" readonly>
                                </div>
                            </div>
                            
                            <div>
                                <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                    <i class="fas fa-plus-circle" style="color: #dc3545;"></i>
                                    <span>رسوم إضافية</span>
                                </label>
                                <input type="number" id="combined-additional-charges" class="swal2-input" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; font-size: 1rem;" value="${invoice.additional_charges || 0}" min="0" step="0.01" oninput="calculateCombinedTotal()">
                            </div>
                            
                            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 1rem; border-radius: 0.5rem; border: 2px solid #2196f3;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-weight: 600; color: #1565c0;">الإجمالي الجديد:</span>
                                    <span id="combined-total-display" style="font-size: 1.5rem; font-weight: 700; color: #1565c0;">${invoice.total_amount.toFixed(2)} ${invoice.currency_symbol}</span>
                                </div>
                            </div>
                            
                            <div>
                                <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                    <i class="fas fa-info-circle" style="color: #6c757d;"></i>
                                    <span>سبب الخصم</span>
                                </label>
                                <input type="text" id="combined-discount-reason" class="swal2-input" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; font-size: 1rem;" value="${invoice.discount_reason || ''}" placeholder="سبب الخصم (اختياري)">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Payment Section -->
                    <div style="background: #d4edda; padding: 1.5rem; border-radius: 1rem; border-right: 4px solid #28a745;">
                        <h4 style="color: #155724; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-dollar-sign"></i>
                            <span>تسجيل الدفعة</span>
                        </h4>
                        
                        <div style="background: white; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span style="color: #6c757d;">المبلغ المدفوع سابقاً:</span>
                                <strong style="color: #28a745;">${invoice.amount_paid.toFixed(2)} ${invoice.currency_symbol}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 1.1rem; padding-top: 0.5rem; border-top: 2px solid #dee2e6;">
                                <span style="color: #6c757d;">المبلغ المتبقي الحالي:</span>
                                <strong id="combined-current-due" style="color: #dc3545;">${invoice.amount_due.toFixed(2)} ${invoice.currency_symbol}</strong>
                            </div>
                        </div>
                        
                        <div style="display: grid; gap: 1rem;">
                            <div>
                                <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                    <i class="fas fa-money-bill-wave" style="color: #28a745;"></i>
                                    <span>المبلغ المدفوع الآن</span>
                                    <span style="color: #dc3545;">*</span>
                                </label>
                                <input type="number" id="combined-payment-amount" class="swal2-input" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #28a745; border-radius: 0.5rem; font-size: 1.1rem; font-weight: 600;" value="0" min="0" step="0.01" required>
                                <small style="color: #6c757d; display: block; margin-top: 0.25rem;">اترك 0 إذا كنت تريد التعديل فقط</small>
                            </div>
                            
                            <div>
                                <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                    <i class="fas fa-credit-card" style="color: #1a5f7a;"></i>
                                    <span>طريقة الدفع</span>
                                </label>
                                <select id="combined-payment-method" class="swal2-input" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; font-size: 1rem;">
                                    <option value="cash">نقداً</option>
                                    <option value="bank_transfer">تحويل بنكي</option>
                                    <option value="credit_card">بطاقة ائتمان</option>
                                    <option value="vodafone_cash">فودافون كاش</option>
                                    <option value="instapay">إنستاباي</option>
                                    <option value="other">أخرى</option>
                                </select>
                            </div>
                            
                            <div>
                                <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                    <i class="fas fa-calendar" style="color: #f39c12;"></i>
                                    <span>تاريخ الدفع</span>
                                </label>
                                <input type="date" id="combined-payment-date" class="swal2-input" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; font-size: 1rem;" value="${new Date().toISOString().split('T')[0]}">
                            </div>
                            
                            <div>
                                <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-weight: 600; color: #495057;">
                                    <i class="fas fa-sticky-note" style="color: #6c757d;"></i>
                                    <span>ملاحظات</span>
                                </label>
                                <textarea id="combined-notes" class="swal2-textarea" style="width: 100%; margin: 0; padding: 0.75rem; border: 2px solid #dee2e6; border-radius: 0.5rem; resize: vertical; min-height: 80px;" placeholder="ملاحظات إضافية (اختياري)">${invoice.notes || ''}</textarea>
                            </div>
                        </div>
                    </div>
                </div>
                
                <script>
                    function calculateCombinedTotal() {
                        const baseAmount = parseFloat(document.getElementById('combined-base-amount').value) || 0;
                        const discountPercentage = parseFloat(document.getElementById('combined-discount-percentage').value) || 0;
                        const additionalCharges = parseFloat(document.getElementById('combined-additional-charges').value) || 0;
                        
                        const discountAmount = (baseAmount * discountPercentage) / 100;
                        const total = baseAmount - discountAmount + additionalCharges;
                        
                        document.getElementById('combined-discount-amount').value = discountAmount.toFixed(2);
                        document.getElementById('combined-total-display').textContent = total.toFixed(2) + ' ${invoice.currency_symbol}';
                        
                        // Update current due amount
                        const currentDue = total - ${invoice.amount_paid};
                        document.getElementById('combined-current-due').textContent = currentDue.toFixed(2) + ' ${invoice.currency_symbol}';
                    }
                </script>
            `,
            width: '900px',
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-save"></i> حفظ التعديلات والدفعة',
            cancelButtonText: '<i class="fas fa-times"></i> إلغاء',
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            customClass: {
                popup: 'swal-rtl'
            },
            didOpen: () => {
                calculateCombinedTotal();
            },
            preConfirm: () => {
                const baseAmount = parseFloat(document.getElementById('combined-base-amount').value);
                const discountPercentage = parseFloat(document.getElementById('combined-discount-percentage').value) || 0;
                const discountAmount = parseFloat(document.getElementById('combined-discount-amount').value) || 0;
                const additionalCharges = parseFloat(document.getElementById('combined-additional-charges').value) || 0;
                const discountReason = document.getElementById('combined-discount-reason').value;
                const paymentAmount = parseFloat(document.getElementById('combined-payment-amount').value) || 0;
                const paymentMethod = document.getElementById('combined-payment-method').value;
                const paymentDate = document.getElementById('combined-payment-date').value;
                const notes = document.getElementById('combined-notes').value;
                
                if (!baseAmount || baseAmount <= 0) {
                    Swal.showValidationMessage('⚠️ يرجى إدخال مبلغ أساسي صحيح');
                    return false;
                }
                
                const total = baseAmount - discountAmount + additionalCharges;
                const newAmountDue = total - invoice.amount_paid;
                
                if (paymentAmount > newAmountDue) {
                    Swal.showValidationMessage('⚠️ المبلغ المدفوع أكبر من المتبقي');
                    return false;
                }
                
                return {
                    baseAmount,
                    discountPercentage,
                    discountAmount,
                    additionalCharges,
                    total,
                    discountReason,
                    paymentAmount,
                    paymentMethod,
                    paymentDate,
                    notes
                };
            }
        });
        
        if (result.isConfirmed) {
            const data = result.value;
            
            Swal.fire({
                title: 'جاري الحفظ...',
                html: '<div style="padding: 1rem;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #28a745;"></i></div>',
                allowOutsideClick: false,
                showConfirmButton: false
            });
            
            // Calculate new amounts
            const newAmountPaid = invoice.amount_paid + data.paymentAmount;
            const newAmountDue = data.total - newAmountPaid;
            const newStatus = newAmountDue <= 0 ? 'paid' : (newAmountPaid > 0 ? 'partial' : 'pending');
            
            // Update invoice
            const { error: updateError } = await client
                .from('invoices')
                .update({
                    base_amount: data.baseAmount,
                    discount_percentage: data.discountPercentage,
                    discount_amount: data.discountAmount,
                    additional_charges: data.additionalCharges,
                    subtotal: data.total,
                    total_amount: data.total,
                    amount_paid: newAmountPaid,
                    amount_due: newAmountDue,
                    discount_reason: data.discountReason || null,
                    notes: data.notes || null,
                    status: newStatus,
                    paid_date: newAmountDue <= 0 ? data.paymentDate : null,
                    last_payment_date: data.paymentAmount > 0 ? data.paymentDate : invoice.last_payment_date
                })
                .eq('id', id);
            
            if (updateError) throw updateError;
            
            // Create payment record if amount > 0
            if (data.paymentAmount > 0) {
                const paymentNumber = `PAY-${Date.now().toString().slice(-8)}`;
                
                const { error: paymentError } = await client
                    .from('payments')
                    .insert({
                        payment_number: paymentNumber,
                        invoice_id: id,
                        student_id: invoice.student_id,
                        amount: data.paymentAmount,
                        currency_code: invoice.currency_code,
                        currency_symbol: invoice.currency_symbol,
                        payment_method: data.paymentMethod,
                        payment_date: data.paymentDate,
                        status: 'completed',
                        notes: data.notes || null
                    });
                
                if (paymentError) throw paymentError;
            }
            
            await Swal.fire({
                icon: 'success',
                title: '<div style="color: #28a745;">تم بنجاح!</div>',
                html: `
                    <div style="font-size: 1.1rem; color: #495057;">
                        ${data.paymentAmount > 0 ? `
                            ✅ تم تحديث الفاتورة<br>
                            ✅ تم تسجيل دفعة بمبلغ <strong style="color: #28a745;">${data.paymentAmount.toFixed(2)} ${invoice.currency_symbol}</strong>
                        ` : '✅ تم تحديث الفاتورة بنجاح'}
                    </div>
                `,
                timer: 3000,
                showConfirmButton: false,
                customClass: {
                    popup: 'swal-rtl'
                }
            });
            
            await loadInvoices();
        }
        
    } catch (error) {
        console.error('[Invoices] Error in combined operation:', error);
        Swal.fire({
            icon: 'error',
            title: '<div style="color: #dc3545;">خطأ</div>',
            html: `<div style="font-size: 1rem; color: #495057;">فشلت العملية<br><small style="color: #6c757d;">${error.message}</small></div>`,
            confirmButtonColor: '#dc3545',
            customClass: {
                popup: 'swal-rtl'
            }
        });
    }
}

// Make function available globally
window.calculateCombinedTotal = function() {
    // This will be called from the SweetAlert HTML
};
