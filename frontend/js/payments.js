// Payments Page JavaScript
console.log('[Payments] 🚀 Initializing...');

let paymentsTable = null;

// Initialize page
async function initPaymentsPage() {
    console.log('[Payments] 📊 Loading payments data...');
    
    // Initialize Supabase if not already done
    if (!window.supabaseClient) {
        window.supabaseClient = initSupabase();
    }

    // Wait for Supabase to initialize
    await new Promise(resolve => setTimeout(resolve, 500));

    // Load payments
    await loadPayments();

    console.log('[Payments] ✅ Initialization complete');
}

// Load payments
async function loadPayments() {
    try {
        const client = window.supabaseClient;
        
        if (!client) {
            console.error('[Payments] ❌ Supabase client not initialized');
            return;
        }

        console.log('[Payments] 📡 Fetching payments...');

        const { data: payments, error } = await client
            .from('payments')
            .select(`
                *,
                student:students(id, name),
                invoice:invoices(invoice_number)
            `)
            .order('payment_date', { ascending: false });

        if (error) {
            console.error('[Payments] ❌ Error:', error);
            throw error;
        }

        console.log('[Payments] ✅ Loaded', payments?.length || 0, 'payments');

        // Update stats
        updateStats(payments || []);

        // Display payments
        displayPayments(payments || []);

        // Initialize DataTable
        setTimeout(() => {
            try {
                if (typeof $.fn.DataTable !== 'undefined' && $('#paymentsTable').length) {
                    // Check if table has data
                    const tbody = $('#paymentsTable tbody tr');
                    if (tbody.length === 0 || tbody.find('td[colspan]').length > 0) {
                        console.log('[Payments] ⏭️ Skipping DataTable - no data');
                        return;
                    }
                    
                    if (paymentsTable) {
                        paymentsTable.destroy();
                    }
                    
                    paymentsTable = $('#paymentsTable').DataTable({
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
                    console.log('[Payments] ✅ DataTable initialized');
                }
            } catch (e) {
                console.warn('[Payments] DataTable initialization skipped:', e.message);
            }
        }, 500);

    } catch (error) {
        console.error('[Payments] Error loading payments:', error);
        const tbody = document.getElementById('paymentsTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">
                <i class="fas fa-exclamation-triangle"></i><br>
                خطأ في تحميل البيانات: ${error.message}<br>
                <small>تحقق من Console (F12) لمزيد من التفاصيل</small>
            </td></tr>`;
        }
        showError('فشل تحميل بيانات المدفوعات: ' + error.message);
    }
}

// Update stats
function updateStats(payments) {
    const totalPayments = payments.length;
    
    const totalAmount = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    // Today's payments
    const today = new Date().toISOString().split('T')[0];
    const todayPayments = payments.filter(p => p.payment_date === today).length;

    // This week's payments
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weekPayments = payments.filter(p => {
        const paymentDate = new Date(p.payment_date);
        return paymentDate >= oneWeekAgo;
    }).length;

    // Update DOM
    const totalPaymentsEl = document.getElementById('totalPayments');
    const totalAmountEl = document.getElementById('totalAmount');
    const todayPaymentsEl = document.getElementById('todayPayments');
    const weekPaymentsEl = document.getElementById('weekPayments');

    if (totalPaymentsEl) totalPaymentsEl.textContent = totalPayments;
    if (totalAmountEl) totalAmountEl.textContent = totalAmount.toFixed(2) + ' $';
    if (todayPaymentsEl) todayPaymentsEl.textContent = todayPayments;
    if (weekPaymentsEl) weekPaymentsEl.textContent = weekPayments;
}

// Display payments
function displayPayments(payments) {
    const tbody = document.getElementById('paymentsTableBody');
    
    if (!tbody) {
        console.error('[Payments] ❌ Table body not found');
        // Try alternative selector
        const table = document.getElementById('paymentsTable');
        if (table) {
            const tbodyAlt = table.querySelector('tbody');
            if (tbodyAlt) {
                console.log('[Payments] ✅ Found tbody using querySelector');
                displayPaymentsInElement(tbodyAlt, payments);
                return;
            }
        }
        return;
    }

    displayPaymentsInElement(tbody, payments);
}

// Display payments in element
function displayPaymentsInElement(tbody, payments) {
    if (payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;"><i class="fas fa-money-bill-wave"></i><br>لا توجد مدفوعات<br><small>يمكنك إضافة دفعة جديدة من الزر أعلاه</small></td></tr>';
        return;
    }

    tbody.innerHTML = payments.map(payment => {
        try {
            const amount = parseFloat(payment.amount || 0);

            return `
                <tr>
                    <td>${payment.payment_number || '-'}</td>
                    <td>${payment.student?.name || '-'}</td>
                    <td>${payment.invoice?.invoice_number || '-'}</td>
                    <td>${amount.toFixed(2)} ${payment.currency_symbol || '$'}</td>
                    <td>${getPaymentMethodText(payment.payment_method)}</td>
                    <td>${formatDate(payment.payment_date)}</td>
                    <td>
                        <span class="badge badge-${getStatusClass(payment.status)}">
                            ${getStatusText(payment.status)}
                        </span>
                    </td>
                </tr>
            `;
        } catch (err) {
            console.error('[Payments] Error rendering payment:', payment, err);
            return '';
        }
    }).join('');
}

// Show add payment modal
function showAddPaymentModal() {
    const modal = document.getElementById('addPaymentModal');
    if (modal) {
        modal.style.display = 'flex';
        loadInvoicesForPayment();
    } else {
        alert('إضافة دفعة جديدة - قيد التطوير');
    }
}

// Close add payment modal
function closeAddPaymentModal() {
    const modal = document.getElementById('addPaymentModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Load invoices for payment
async function loadInvoicesForPayment() {
    try {
        const client = window.supabaseClient;
        const { data: invoices, error } = await client
            .from('invoices')
            .select('id, invoice_number, student:students(name), total_amount, amount_paid, amount_due')
            .in('status', ['pending', 'partial', 'overdue'])
            .order('created_at', { ascending: false });

        if (error) throw error;

        const select = document.getElementById('invoiceId');
        if (select) {
            select.innerHTML = '<option value="">اختر الفاتورة...</option>';
            
            invoices?.forEach(invoice => {
                const option = document.createElement('option');
                option.value = invoice.id;
                option.textContent = `${invoice.invoice_number} - ${invoice.student?.name} - المتبقي: ${parseFloat(invoice.amount_due || 0).toFixed(2)}$`;
                option.dataset.amountDue = invoice.amount_due;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('[Payments] Error loading invoices:', error);
    }
}

// On invoice change
function onInvoiceChange() {
    const select = document.getElementById('invoiceId');
    const selectedOption = select?.options[select.selectedIndex];
    
    if (selectedOption && selectedOption.value) {
        const amountDue = parseFloat(selectedOption.dataset.amountDue || 0);
        const amountInput = document.getElementById('amount');
        if (amountInput) {
            amountInput.value = amountDue.toFixed(2);
            amountInput.max = amountDue;
        }
    }
}

// Save payment
async function savePayment(event) {
    if (event) event.preventDefault();
    
    try {
        const client = window.supabaseClient;
        
        const invoiceId = document.getElementById('invoiceId')?.value;
        const amount = document.getElementById('amount')?.value;
        const paymentMethod = document.getElementById('paymentMethod')?.value;
        const paymentDate = document.getElementById('paymentDate')?.value;
        const notes = document.getElementById('notes')?.value;

        if (!invoiceId || !amount) {
            showError('الرجاء ملء جميع الحقول المطلوبة');
            return;
        }

        const paymentData = {
            invoice_id: invoiceId,
            student_id: null, // Will be set below
            amount: parseFloat(amount),
            payment_method: paymentMethod || 'cash',
            payment_date: paymentDate || new Date().toISOString().split('T')[0],
            status: 'completed',
            currency_code: 'USD',
            currency_symbol: '$',
            notes: notes || null
        };

        // Get student_id from invoice
        const { data: invoice } = await client
            .from('invoices')
            .select('student_id')
            .eq('id', paymentData.invoice_id)
            .single();

        if (invoice) {
            paymentData.student_id = invoice.student_id;
        }

        const { error } = await client
            .from('payments')
            .insert(paymentData);

        if (error) throw error;
        
        // If payment is completed and currency is EGP, record deposit in treasury
        if (paymentData.status === 'completed' && paymentData.currency_code === 'EGP') {
            const transactionNumber = `PAY-${Date.now()}`;
            
            // Get student name for description
            const { data: student } = await client
                .from('students')
                .select('name')
                .eq('id', paymentData.student_id)
                .single();
            
            const transactionData = {
                transaction_number: transactionNumber,
                currency_code: 'EGP',
                transaction_type: 'payment_received',
                amount: paymentData.amount, // Positive for deposit
                category: 'دفعة طالب',
                description: `دفعة من ${student?.name || 'طالب'} - ${paymentData.payment_method}`,
                reference_type: 'payment',
                reference_id: null, // Will be updated if we get the payment ID
                transaction_date: paymentData.payment_date,
                created_at: new Date().toISOString()
            };
            
            const { error: transactionError } = await client
                .from('treasury_transactions')
                .insert(transactionData);
            
            if (transactionError) {
                console.error('[Payments] Error recording treasury transaction:', transactionError);
                // Don't throw error, just log it
            }
        }

        closeAddPaymentModal();
        await loadPayments();

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'تم الحفظ',
                text: 'تم تسجيل الدفعة بنجاح',
                timer: 1500,
                showConfirmButton: false
            });
        }
    } catch (error) {
        console.error('[Payments] Error saving payment:', error);
        showError('فشل حفظ الدفعة: ' + error.message);
    }
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG');
}

function getStatusClass(status) {
    const classes = {
        'pending': 'warning',
        'processing': 'info',
        'completed': 'success',
        'failed': 'danger',
        'cancelled': 'secondary',
        'refunded': 'warning'
    };
    return classes[status] || 'secondary';
}

function getStatusText(status) {
    const texts = {
        'pending': 'معلقة',
        'processing': 'قيد المعالجة',
        'completed': 'مكتملة',
        'failed': 'فشلت',
        'cancelled': 'ملغاة',
        'refunded': 'مستردة'
    };
    return texts[status] || status;
}

function getPaymentMethodText(method) {
    const methods = {
        'cash': 'نقدي',
        'bank_transfer': 'تحويل بنكي',
        'credit_card': 'بطاقة ائتمان',
        'debit_card': 'بطاقة خصم',
        'paypal': 'PayPal',
        'stripe': 'Stripe',
        'vodafone_cash': 'فودافون كاش',
        'orange_cash': 'أورانج كاش',
        'etisalat_cash': 'اتصالات كاش',
        'instapay': 'InstaPay',
        'fawry': 'فوري',
        'check': 'شيك',
        'other': 'أخرى'
    };
    return methods[method] || method;
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

console.log('[Payments] ✅ Script loaded');

// Initialize page on load
document.addEventListener('DOMContentLoaded', initPaymentsPage);
