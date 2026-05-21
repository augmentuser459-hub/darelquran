// Treasury Page JavaScript
console.log('[Treasury] 🚀 Initializing...');

let paymentsTable = null;
let allPayments = [];
let treasuryData = [];

// Initialize page
async function initTreasuryPage() {
    console.log('[Treasury] 📊 Loading treasury data...');
    
    // Initialize Supabase if not already done
    if (!window.supabaseClient) {
        window.supabaseClient = initSupabase();
    }

    // Wait for Supabase to initialize
    await new Promise(resolve => setTimeout(resolve, 500));

    // Load treasury data
    await loadTreasuryData();

    console.log('[Treasury] ✅ Initialization complete');
}

// Load treasury data
async function loadTreasuryData() {
    try {
        const client = window.supabaseClient;
        
        if (!client) {
            console.error('[Treasury] ❌ Supabase client not initialized');
            return;
        }

        console.log('[Treasury] 📡 Fetching data...');

        // Fetch all payments with student and country info
        const { data: payments, error: paymentsError } = await client
            .from('payments')
            .select(`
                *,
                student:students(
                    id,
                    name,
                    country:countries(
                        id,
                        name_ar,
                        currency_code,
                        currency_symbol,
                        currency_name_ar
                    )
                )
            `)
            .eq('status', 'completed')
            .order('payment_date', { ascending: false });

        if (paymentsError) {
            console.error('[Treasury] ❌ Error fetching payments:', paymentsError);
            throw paymentsError;
        }

        console.log('[Treasury] ✅ Loaded', payments?.length || 0, 'payments');
        allPayments = payments || [];

        // Fetch all countries
        const { data: countries, error: countriesError } = await client
            .from('countries')
            .select('*')
            .eq('is_active', true)
            .order('display_order');

        if (countriesError) {
            console.error('[Treasury] ❌ Error fetching countries:', countriesError);
            throw countriesError;
        }

        console.log('[Treasury] ✅ Loaded', countries?.length || 0, 'countries');

        // Calculate treasury balances
        treasuryData = calculateTreasuryBalances(countries, payments);
        
        // Load transactions and update balances
        const transactions = await loadTreasuryTransactions();
        treasuryData = updateTreasuryBalancesWithTransactions(treasuryData, transactions);

        // Update UI
        updateStats(payments);
        displayTreasuryCards(treasuryData);
        populateCurrencyFilter(treasuryData);
        displayPayments(payments);
        
        // Load transfers
        await loadTransfers();
        
        // Load all transactions
        await loadAllTransactions();

        // Initialize DataTable
        setTimeout(() => {
            initializeDataTable();
        }, 500);

    } catch (error) {
        console.error('[Treasury] Error loading data:', error);
        showError('فشل تحميل بيانات الخزائن: ' + error.message);
    }
}

// Calculate treasury balances
function calculateTreasuryBalances(countries, payments) {
    const treasuries = [];

    countries.forEach(country => {
        // Filter payments for this currency
        const currencyPayments = payments.filter(p => 
            p.currency_code === country.currency_code
        );

        // Calculate total
        const totalAmount = currencyPayments.reduce((sum, p) => 
            sum + parseFloat(p.amount || 0), 0
        );

        // Calculate today's payments
        const today = new Date().toISOString().split('T')[0];
        const todayAmount = currencyPayments
            .filter(p => p.payment_date === today)
            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

        // Calculate this week's payments
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weekAmount = currencyPayments
            .filter(p => {
                const paymentDate = new Date(p.payment_date);
                return paymentDate >= oneWeekAgo;
            })
            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

        // Calculate this month's payments
        const now = new Date();
        const monthAmount = currencyPayments
            .filter(p => {
                const paymentDate = new Date(p.payment_date);
                return paymentDate.getMonth() === now.getMonth() && 
                       paymentDate.getFullYear() === now.getFullYear();
            })
            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

        treasuries.push({
            country_id: country.id,
            country_name: country.name_ar,
            currency_code: country.currency_code,
            currency_symbol: country.currency_symbol,
            currency_name: country.currency_name_ar,
            total_amount: totalAmount,
            today_amount: todayAmount,
            week_amount: weekAmount,
            month_amount: monthAmount,
            payments_count: currencyPayments.length,
            payments: currencyPayments
        });
    });

    return treasuries;
}

// Load treasury transactions
async function loadTreasuryTransactions() {
    try {
        const client = window.supabaseClient;
        
        const { data: transactions, error } = await client
            .from('treasury_transactions')
            .select('*')
            .order('transaction_date', { ascending: false});
        
        if (error) {
            console.error('[Treasury] Error loading transactions:', error);
            return [];
        }
        
        return transactions || [];
    } catch (error) {
        console.error('[Treasury] Error loading transactions:', error);
        return [];
    }
}

// Update treasury balances with transactions
function updateTreasuryBalancesWithTransactions(treasuries, transactions) {
    treasuries.forEach(treasury => {
        // Filter transactions for this currency
        const currencyTransactions = transactions.filter(t => 
            t.currency_code === treasury.currency_code
        );
        
        // Calculate total from transactions
        const transactionsTotal = currencyTransactions.reduce((sum, t) => 
            sum + parseFloat(t.amount || 0), 0
        );
        
        // Add transactions to total
        treasury.total_amount += transactionsTotal;
        
        // Calculate today's transactions
        const today = new Date().toISOString().split('T')[0];
        const todayTransactions = currencyTransactions
            .filter(t => t.transaction_date === today)
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        
        treasury.today_amount += todayTransactions;
        
        // Calculate this week's transactions
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weekTransactions = currencyTransactions
            .filter(t => {
                const transactionDate = new Date(t.transaction_date);
                return transactionDate >= oneWeekAgo;
            })
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        
        treasury.week_amount += weekTransactions;
        
        // Calculate this month's transactions
        const now = new Date();
        const monthTransactions = currencyTransactions
            .filter(t => {
                const transactionDate = new Date(t.transaction_date);
                return transactionDate.getMonth() === now.getMonth() && 
                       transactionDate.getFullYear() === now.getFullYear();
            })
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        
        treasury.month_amount += monthTransactions;
    });
    
    return treasuries;
}

// Update stats
function updateStats(payments) {
    const totalTreasuries = treasuryData.length;
    const totalPayments = payments.length;

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
    document.getElementById('totalTreasuries').textContent = totalTreasuries;
    document.getElementById('totalPayments').textContent = totalPayments;
    document.getElementById('todayPayments').textContent = todayPayments;
    document.getElementById('weekPayments').textContent = weekPayments;
}

// Display treasury cards
function displayTreasuryCards(treasuries) {
    const container = document.getElementById('treasuryCardsContainer');
    
    if (treasuries.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #999;">
                <i class="fas fa-vault" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>لا توجد خزائن متاحة</p>
            </div>
        `;
        return;
    }

    const colors = ['#2c5f2d', '#97b885', '#c9a961', '#8b6f47', '#4a7c59', '#6b8e23', '#556b2f', '#8fbc8f'];

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
            ${treasuries.map((treasury, index) => {
                const isEGP = treasury.currency_code === 'EGP';
                return `
                <div class="treasury-card" style="
                    background: linear-gradient(135deg, ${colors[index % colors.length]} 0%, ${adjustColor(colors[index % colors.length], -20)} 100%);
                    border-radius: 12px;
                    padding: 1.5rem;
                    color: white;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    cursor: pointer;
                " onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 8px 12px rgba(0,0,0,0.2)';" 
                   onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)';"
                   onclick="filterPaymentsByCurrency('${treasury.currency_code}')">
                    
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <h3 style="margin: 0; font-size: 1.3rem; font-weight: 600; color: white;">
                                ${treasury.country_name}
                            </h3>
                            <p style="margin: 0.25rem 0 0 0; opacity: 0.95; font-size: 0.9rem; color: white;">
                                ${treasury.currency_name}
                            </p>
                        </div>
                        <div style="background: rgba(255,255,255,0.2); padding: 0.5rem 0.75rem; border-radius: 8px;">
                            <i class="fas fa-coins" style="font-size: 1.5rem; color: white;"></i>
                        </div>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <div style="font-size: 0.85rem; opacity: 0.95; margin-bottom: 0.25rem; color: white;">الرصيد الإجمالي</div>
                        <div style="font-size: 2rem; font-weight: 700; color: white;">
                            ${formatNumber(treasury.total_amount)} ${treasury.currency_symbol}
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.85rem;">
                        <div style="background: rgba(255,255,255,0.1); padding: 0.75rem; border-radius: 6px;">
                            <div style="opacity: 0.95; margin-bottom: 0.25rem; color: white;">اليوم</div>
                            <div style="font-weight: 600; font-size: 1rem; color: white;">
                                ${formatNumber(treasury.today_amount)} ${treasury.currency_symbol}
                            </div>
                        </div>
                        <div style="background: rgba(255,255,255,0.1); padding: 0.75rem; border-radius: 6px;">
                            <div style="opacity: 0.95; margin-bottom: 0.25rem; color: white;">هذا الأسبوع</div>
                            <div style="font-weight: 600; font-size: 1rem; color: white;">
                                ${formatNumber(treasury.week_amount)} ${treasury.currency_symbol}
                            </div>
                        </div>
                        <div style="background: rgba(255,255,255,0.1); padding: 0.75rem; border-radius: 6px;">
                            <div style="opacity: 0.95; margin-bottom: 0.25rem; color: white;">هذا الشهر</div>
                            <div style="font-weight: 600; font-size: 1rem; color: white;">
                                ${formatNumber(treasury.month_amount)} ${treasury.currency_symbol}
                            </div>
                        </div>
                        <div style="background: rgba(255,255,255,0.1); padding: 0.75rem; border-radius: 6px;">
                            <div style="opacity: 0.95; margin-bottom: 0.25rem; color: white;">عدد المدفوعات</div>
                            <div style="font-weight: 600; font-size: 1rem; color: white;">
                                ${treasury.payments_count}
                            </div>
                        </div>
                    </div>
                    
                    ${isEGP ? `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 1rem;" onclick="event.stopPropagation();">
                        <button onclick="showDepositModal('${treasury.currency_code}', '${treasury.currency_symbol}')" 
                                style="background: rgba(40, 167, 69, 0.9); color: white; border: none; padding: 0.75rem; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.3s ease;"
                                onmouseover="this.style.background='rgba(40, 167, 69, 1)'"
                                onmouseout="this.style.background='rgba(40, 167, 69, 0.9)'">
                            <i class="fas fa-plus-circle"></i> إيداع
                        </button>
                        <button onclick="showWithdrawalModal('${treasury.currency_code}', '${treasury.currency_symbol}')" 
                                style="background: rgba(220, 53, 69, 0.9); color: white; border: none; padding: 0.75rem; border-radius: 6px; cursor: pointer; font-weight: 600; transition: all 0.3s ease;"
                                onmouseover="this.style.background='rgba(220, 53, 69, 1)'"
                                onmouseout="this.style.background='rgba(220, 53, 69, 0.9)'">
                            <i class="fas fa-minus-circle"></i> صرف
                        </button>
                    </div>
                    ` : ''}
                </div>
            `}).join('')}
        </div>
    `;
}

// Populate currency filter
function populateCurrencyFilter(treasuries) {
    const select = document.getElementById('currencyFilter');
    
    select.innerHTML = '<option value="">جميع العملات</option>';
    
    treasuries.forEach(treasury => {
        const option = document.createElement('option');
        option.value = treasury.currency_code;
        option.textContent = `${treasury.country_name} (${treasury.currency_symbol})`;
        select.appendChild(option);
    });
}

// Filter payments by currency
function filterPaymentsByCurrency(currencyCode = null) {
    const select = document.getElementById('currencyFilter');
    
    if (currencyCode) {
        select.value = currencyCode;
    } else {
        currencyCode = select.value;
    }

    let filteredPayments = allPayments;
    
    if (currencyCode) {
        filteredPayments = allPayments.filter(p => p.currency_code === currencyCode);
    }

    displayPayments(filteredPayments);

    // Scroll to table
    document.getElementById('paymentsTable').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Display payments
function displayPayments(payments) {
    const tbody = document.getElementById('paymentsTableBody');
    
    if (!tbody) {
        console.error('[Treasury] ❌ Table body not found');
        return;
    }

    if (payments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-money-bill-wave"></i><br>
                    لا توجد مدفوعات
                </td>
            </tr>
        `;
        return;
    }

    // Destroy existing DataTable first
    if (paymentsTable) {
        paymentsTable.destroy();
        paymentsTable = null;
    }

    tbody.innerHTML = payments.map(payment => {
        const amount = parseFloat(payment.amount || 0);
        const studentName = payment.student?.name || '-';
        const countryName = payment.student?.country?.name_ar || '-';

        return `
            <tr>
                <td>${payment.payment_number || '-'}</td>
                <td>${studentName}</td>
                <td>${countryName}</td>
                <td style="font-weight: 600;">${formatNumber(amount)}</td>
                <td>
                    <span style="background: #f0f0f0; padding: 0.25rem 0.75rem; border-radius: 4px; font-weight: 600;">
                        ${payment.currency_symbol || ''} ${payment.currency_code || ''}
                    </span>
                </td>
                <td>${formatDate(payment.payment_date)}</td>
                <td>${getPaymentMethodText(payment.payment_method)}</td>
            </tr>
        `;
    }).join('');

    // Reinitialize DataTable
    setTimeout(() => {
        initializeDataTable();
    }, 100);
}

// Initialize DataTable
function initializeDataTable() {
    try {
        if (typeof $.fn.DataTable !== 'undefined' && $('#paymentsTable').length) {
            const tbody = $('#paymentsTable tbody tr');
            if (tbody.length === 0 || tbody.find('td[colspan]').length > 0) {
                console.log('[Treasury] ⏭️ Skipping DataTable - no data');
                return;
            }
            
            // Check if DataTable already exists
            if ($.fn.DataTable.isDataTable('#paymentsTable')) {
                console.log('[Treasury] ⚠️ DataTable already initialized, destroying first');
                $('#paymentsTable').DataTable().destroy();
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
                order: [[5, 'desc']], // Sort by date
                pageLength: 25
            });
            console.log('[Treasury] ✅ DataTable initialized');
        }
    } catch (e) {
        console.warn('[Treasury] DataTable initialization skipped:', e.message);
    }
}

// Load transfers
async function loadTransfers() {
    try {
        const client = window.supabaseClient;
        
        const { data: transfers, error } = await client
            .from('treasury_transfers')
            .select('*')
            .order('transfer_date', { ascending: false })
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('[Treasury] Error loading transfers:', error);
            // Don't throw error, just show empty state
            displayTransfers([]);
            return;
        }
        
        console.log('[Treasury] ✅ Loaded', transfers?.length || 0, 'transfers');
        displayTransfers(transfers || []);
        
    } catch (error) {
        console.error('[Treasury] Error loading transfers:', error);
        displayTransfers([]);
    }
}

// Display transfers
function displayTransfers(transfers) {
    const tbody = document.getElementById('transfersTableBody');
    
    if (!tbody) {
        console.error('[Treasury] ❌ Transfers table body not found');
        return;
    }
    
    if (transfers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-exchange-alt" style="font-size: 2rem; color: #ccc; margin-bottom: 0.5rem;"></i><br>
                    لا توجد تحويلات بين الخزائن
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = transfers.map(transfer => {
        // Find currency info
        const fromTreasury = treasuryData.find(t => t.currency_code === transfer.from_currency);
        const toTreasury = treasuryData.find(t => t.currency_code === transfer.to_currency);
        
        const fromSymbol = fromTreasury?.currency_symbol || transfer.from_currency;
        const toSymbol = toTreasury?.currency_symbol || transfer.to_currency;
        const fromCountry = fromTreasury?.country_name || transfer.from_currency;
        const toCountry = toTreasury?.country_name || transfer.to_currency;
        
        return `
            <tr>
                <td style="font-weight: 600;">${transfer.transfer_number}</td>
                <td>
                    <span style="background: #f0f0f0; padding: 0.25rem 0.75rem; border-radius: 4px;">
                        ${fromCountry} (${fromSymbol})
                    </span>
                </td>
                <td>
                    <span style="background: #e7f3ff; padding: 0.25rem 0.75rem; border-radius: 4px;">
                        ${toCountry} (${toSymbol})
                    </span>
                </td>
                <td style="font-weight: 600; color: #dc3545;">
                    -${formatNumber(transfer.from_amount)} ${fromSymbol}
                </td>
                <td style="font-size: 0.9rem;">
                    1 ${fromSymbol} = ${transfer.exchange_rate} ${toSymbol}
                </td>
                <td style="font-weight: 600; color: #28a745;">
                    +${formatNumber(transfer.to_amount)} ${toSymbol}
                </td>
                <td>${formatDate(transfer.transfer_date)}</td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${transfer.notes || '-'}">
                    ${transfer.notes || '-'}
                </td>
            </tr>
        `;
    }).join('');
    
    // Initialize DataTable for transfers
    setTimeout(() => {
        if (typeof $.fn.DataTable !== 'undefined' && $('#transfersTable').length) {
            if ($.fn.DataTable.isDataTable('#transfersTable')) {
                $('#transfersTable').DataTable().destroy();
            }
            
            $('#transfersTable').DataTable({
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
                order: [[6, 'desc']], // Sort by date
                pageLength: 10
            });
        }
    }, 100);
}

// Refresh treasury
async function refreshTreasury() {
    console.log('[Treasury] 🔄 Refreshing...');
    
    // Show loading
    const container = document.getElementById('treasuryCardsContainer');
    container.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
            <div class="spinner"></div>
            <p>جاري تحديث البيانات...</p>
        </div>
    `;

    await loadTreasuryData();
    
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success',
            title: 'تم التحديث',
            text: 'تم تحديث بيانات الخزائن بنجاح',
            timer: 1500,
            showConfirmButton: false
        });
    }
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG');
}

function formatNumber(num) {
    return parseFloat(num).toLocaleString('ar-EG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
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

function adjustColor(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
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

console.log('[Treasury] ✅ Script loaded');

// Show deposit modal
function showDepositModal(currencyCode, currencySymbol) {
    const modal = document.getElementById('depositModal');
    modal.style.display = 'flex';
    
    document.getElementById('depositCurrency').value = currencyCode;
    document.getElementById('depositCurrencySymbol').value = currencySymbol;
    document.getElementById('depositForm').reset();
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('depositDate').value = today;
}

// Close deposit modal
function closeDepositModal() {
    document.getElementById('depositModal').style.display = 'none';
}

// Show withdrawal modal
function showWithdrawalModal(currencyCode, currencySymbol) {
    const modal = document.getElementById('withdrawalModal');
    modal.style.display = 'flex';
    
    document.getElementById('withdrawalCurrency').value = currencyCode;
    document.getElementById('withdrawalCurrencySymbol').value = currencySymbol;
    document.getElementById('withdrawalForm').reset();
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('withdrawalDate').value = today;
}

// Close withdrawal modal
function closeWithdrawalModal() {
    document.getElementById('withdrawalModal').style.display = 'none';
}

// Handle deposit form submission
document.addEventListener('DOMContentLoaded', function() {
    const depositForm = document.getElementById('depositForm');
    if (depositForm) {
        depositForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await processDeposit();
        });
    }
    
    const withdrawalForm = document.getElementById('withdrawalForm');
    if (withdrawalForm) {
        withdrawalForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await processWithdrawal();
        });
    }
});

// Process deposit
async function processDeposit() {
    try {
        const currencyCode = document.getElementById('depositCurrency').value;
        const currencySymbol = document.getElementById('depositCurrencySymbol').value;
        const amount = parseFloat(document.getElementById('depositAmount').value);
        const category = document.getElementById('depositCategory').value || 'إيداع';
        const transactionDate = document.getElementById('depositDate').value;
        const description = document.getElementById('depositDescription').value;
        
        // Close deposit modal first
        closeDepositModal();
        
        // Confirm deposit
        const result = await Swal.fire({
            title: 'تأكيد الإيداع',
            html: `
                <div style="text-align: right; padding: 1rem;">
                    <p style="margin-bottom: 1rem;">هل أنت متأكد من إيداع هذا المبلغ؟</p>
                    <div style="background: #d4edda; padding: 1rem; border-radius: 0.5rem; border: 2px solid #28a745;">
                        <div style="margin-bottom: 0.5rem;">
                            <strong>المبلغ:</strong> ${formatNumber(amount)} ${currencySymbol}
                        </div>
                        ${category ? `<div style="margin-bottom: 0.5rem;"><strong>البند:</strong> ${category}</div>` : ''}
                        <div style="margin-bottom: 0.5rem;">
                            <strong>التاريخ:</strong> ${transactionDate}
                        </div>
                        ${description ? `<div><strong>الوصف:</strong> ${description}</div>` : ''}
                    </div>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-check"></i> نعم، تأكيد الإيداع',
            cancelButtonText: '<i class="fas fa-times"></i> إلغاء',
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d'
        });
        
        if (!result.isConfirmed) {
            // If cancelled, reopen deposit modal
            showDepositModal(currencyCode, currencySymbol);
            // Restore form values
            document.getElementById('depositAmount').value = amount;
            document.getElementById('depositCategory').value = category;
            document.getElementById('depositDate').value = transactionDate;
            document.getElementById('depositDescription').value = description;
            return;
        }
        
        const client = window.supabaseClient;
        
        const transactionNumber = `DEP-${Date.now()}`;
        
        const transactionData = {
            transaction_number: transactionNumber,
            currency_code: currencyCode,
            transaction_type: 'deposit',
            amount: amount,
            category: category,
            description: description,
            transaction_date: transactionDate,
            created_at: new Date().toISOString()
        };
        
        const { error } = await client
            .from('treasury_transactions')
            .insert(transactionData);
        
        if (error) {
            console.error('[Treasury] Error creating deposit:', error);
            throw new Error('فشل في تسجيل الإيداع');
        }
        
        await refreshTreasury();
        
        Swal.fire({
            icon: 'success',
            title: 'تم بنجاح!',
            html: `
                <div style="text-align: right; padding: 1rem;">
                    <p>تم تسجيل الإيداع بنجاح</p>
                    <div style="background: #d4edda; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem;">
                        <div><strong>رقم العملية:</strong> ${transactionNumber}</div>
                        <div><strong>المبلغ:</strong> ${formatNumber(amount)} ${currencySymbol}</div>
                    </div>
                </div>
            `,
            confirmButtonText: 'حسناً'
        });
        
    } catch (error) {
        console.error('[Treasury] Error processing deposit:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: error.message || 'فشل في إجراء الإيداع'
        });
    }
}

// Process withdrawal
async function processWithdrawal() {
    try {
        const currencyCode = document.getElementById('withdrawalCurrency').value;
        const currencySymbol = document.getElementById('withdrawalCurrencySymbol').value;
        const amount = parseFloat(document.getElementById('withdrawalAmount').value);
        const category = document.getElementById('withdrawalCategory').value || 'صرف';
        const transactionDate = document.getElementById('withdrawalDate').value;
        const description = document.getElementById('withdrawalDescription').value;
        
        // Get current treasury balance
        const egpTreasury = treasuryData.find(t => t.currency_code === currencyCode);
        if (egpTreasury && amount > egpTreasury.total_amount) {
            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: 'المبلغ المطلوب صرفه أكبر من الرصيد المتاح',
                timer: 2000,
                showConfirmButton: false
            });
            return;
        }
        
        // Close withdrawal modal first
        closeWithdrawalModal();
        
        // Confirm withdrawal
        const result = await Swal.fire({
            title: 'تأكيد الصرف',
            html: `
                <div style="text-align: right; padding: 1rem;">
                    <p style="margin-bottom: 1rem;">هل أنت متأكد من صرف هذا المبلغ؟</p>
                    <div style="background: #f8d7da; padding: 1rem; border-radius: 0.5rem; border: 2px solid #dc3545;">
                        <div style="margin-bottom: 0.5rem;">
                            <strong>المبلغ:</strong> ${formatNumber(amount)} ${currencySymbol}
                        </div>
                        ${category ? `<div style="margin-bottom: 0.5rem;"><strong>البند:</strong> ${category}</div>` : ''}
                        <div style="margin-bottom: 0.5rem;">
                            <strong>التاريخ:</strong> ${transactionDate}
                        </div>
                        ${description ? `<div><strong>الوصف:</strong> ${description}</div>` : ''}
                    </div>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-check"></i> نعم، تأكيد الصرف',
            cancelButtonText: '<i class="fas fa-times"></i> إلغاء',
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d'
        });
        
        if (!result.isConfirmed) {
            // If cancelled, reopen withdrawal modal
            showWithdrawalModal(currencyCode, currencySymbol);
            // Restore form values
            document.getElementById('withdrawalAmount').value = amount;
            document.getElementById('withdrawalCategory').value = category;
            document.getElementById('withdrawalDate').value = transactionDate;
            document.getElementById('withdrawalDescription').value = description;
            return;
        }
        
        const client = window.supabaseClient;
        
        const transactionNumber = `WTH-${Date.now()}`;
        
        const transactionData = {
            transaction_number: transactionNumber,
            currency_code: currencyCode,
            transaction_type: 'withdrawal',
            amount: -amount, // Negative for withdrawal
            category: category,
            description: description,
            transaction_date: transactionDate,
            created_at: new Date().toISOString()
        };
        
        const { error } = await client
            .from('treasury_transactions')
            .insert(transactionData);
        
        if (error) {
            console.error('[Treasury] Error creating withdrawal:', error);
            throw new Error('فشل في تسجيل الصرف');
        }
        
        await refreshTreasury();
        
        Swal.fire({
            icon: 'success',
            title: 'تم بنجاح!',
            html: `
                <div style="text-align: right; padding: 1rem;">
                    <p>تم تسجيل الصرف بنجاح</p>
                    <div style="background: #f8d7da; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem;">
                        <div><strong>رقم العملية:</strong> ${transactionNumber}</div>
                        <div><strong>المبلغ:</strong> ${formatNumber(amount)} ${currencySymbol}</div>
                    </div>
                </div>
            `,
            confirmButtonText: 'حسناً'
        });
        
    } catch (error) {
        console.error('[Treasury] Error processing withdrawal:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: error.message || 'فشل في إجراء الصرف'
        });
    }
}

// Load treasury transactions (all currencies)
let allTransactions = [];

async function loadAllTransactions() {
    try {
        const client = window.supabaseClient;
        
        const { data: transactions, error } = await client
            .from('treasury_transactions')
            .select('*')
            .order('transaction_date', { ascending: false })
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('[Treasury] Error loading transactions:', error);
            displayTransactions([]);
            return;
        }
        
        console.log('[Treasury] ✅ Loaded', transactions?.length || 0, 'transactions');
        allTransactions = transactions || [];
        
        // Populate currency filter
        populateTransactionCurrencyFilter();
        
        // Display all transactions initially
        displayTransactions(allTransactions);
        
    } catch (error) {
        console.error('[Treasury] Error loading transactions:', error);
        displayTransactions([]);
    }
}

// Populate transaction currency filter
function populateTransactionCurrencyFilter() {
    const select = document.getElementById('transactionCurrencyFilter');
    if (!select) return;
    
    // Get unique currencies from transactions
    const currencies = [...new Set(allTransactions.map(t => t.currency_code))];
    
    // Keep "جميع الخزائن" option
    select.innerHTML = '<option value="">جميع الخزائن</option>';
    
    // Add currency options
    currencies.forEach(currencyCode => {
        const treasury = treasuryData.find(t => t.currency_code === currencyCode);
        if (treasury) {
            const option = document.createElement('option');
            option.value = currencyCode;
            option.textContent = `${treasury.country_name} (${treasury.currency_symbol})`;
            select.appendChild(option);
        }
    });
}

// Filter transactions by currency
function filterTransactionsByCurrency() {
    const select = document.getElementById('transactionCurrencyFilter');
    const currencyCode = select?.value;
    
    if (!currencyCode) {
        displayTransactions(allTransactions);
    } else {
        const filtered = allTransactions.filter(t => t.currency_code === currencyCode);
        displayTransactions(filtered);
    }
}

// Display transactions
function displayTransactions(transactions) {
    const tbody = document.getElementById('transactionsTableBody');
    
    if (!tbody) {
        console.error('[Treasury] ❌ Transactions table body not found');
        return;
    }
    
    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-receipt" style="font-size: 2rem; color: #ccc; margin-bottom: 0.5rem;"></i><br>
                    لا توجد معاملات
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = transactions.map(transaction => {
        const isDeposit = transaction.amount > 0;
        const typeText = isDeposit ? 'إيداع' : 'صرف';
        const typeColor = isDeposit ? '#28a745' : '#dc3545';
        const typeIcon = isDeposit ? 'fa-plus-circle' : 'fa-minus-circle';
        
        // Get treasury info
        const treasury = treasuryData.find(t => t.currency_code === transaction.currency_code);
        const currencySymbol = treasury?.currency_symbol || transaction.currency_code;
        const countryName = treasury?.country_name || transaction.currency_code;
        
        return `
            <tr>
                <td style="font-weight: 600;">${transaction.transaction_number}</td>
                <td>
                    <span style="background: #f0f0f0; padding: 0.25rem 0.75rem; border-radius: 4px;">
                        ${countryName}
                    </span>
                </td>
                <td>
                    <span style="background: ${isDeposit ? '#d4edda' : '#f8d7da'}; color: ${typeColor}; padding: 0.25rem 0.75rem; border-radius: 4px; font-weight: 600;">
                        <i class="fas ${typeIcon}"></i> ${typeText}
                    </span>
                </td>
                <td style="font-weight: 600; color: ${typeColor};">
                    ${isDeposit ? '+' : ''}${formatNumber(Math.abs(transaction.amount))} ${currencySymbol}
                </td>
                <td>${transaction.category || '-'}</td>
                <td>${formatDate(transaction.transaction_date)}</td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${transaction.description || '-'}">
                    ${transaction.description || '-'}
                </td>
            </tr>
        `;
    }).join('');
    
    // Initialize DataTable for transactions
    setTimeout(() => {
        if (typeof $.fn.DataTable !== 'undefined' && $('#transactionsTable').length) {
            if ($.fn.DataTable.isDataTable('#transactionsTable')) {
                $('#transactionsTable').DataTable().destroy();
            }
            
            $('#transactionsTable').DataTable({
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
                order: [[5, 'desc']], // Sort by date
                pageLength: 10
            });
        }
    }, 100);
}

// Show transfer modal
function showTransferModal() {
    const modal = document.getElementById('transferModal');
    modal.style.display = 'flex';
    
    // Reset form
    document.getElementById('transferForm').reset();
    document.getElementById('conversionResult').style.display = 'none';
    document.getElementById('fromTreasuryInfo').innerHTML = '';
    document.getElementById('toTreasuryInfo').innerHTML = '';
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transferDate').value = today;
    
    // Populate treasury dropdowns
    populateTransferDropdowns();
}

// Close transfer modal
function closeTransferModal() {
    document.getElementById('transferModal').style.display = 'none';
}

// Populate transfer dropdowns
function populateTransferDropdowns() {
    const fromSelect = document.getElementById('fromTreasury');
    const toSelect = document.getElementById('toTreasury');
    
    fromSelect.innerHTML = '<option value="">اختر الخزنة المصدر</option>';
    toSelect.innerHTML = '<option value="">اختر الخزنة المستهدفة</option>';
    
    treasuryData.forEach(treasury => {
        const fromOption = document.createElement('option');
        fromOption.value = treasury.currency_code;
        fromOption.textContent = `${treasury.country_name} (${treasury.currency_symbol}) - الرصيد: ${formatNumber(treasury.total_amount)}`;
        fromOption.dataset.treasury = JSON.stringify(treasury);
        fromSelect.appendChild(fromOption);
        
        const toOption = document.createElement('option');
        toOption.value = treasury.currency_code;
        toOption.textContent = `${treasury.country_name} (${treasury.currency_symbol})`;
        toOption.dataset.treasury = JSON.stringify(treasury);
        toSelect.appendChild(toOption);
    });
}

// Update from treasury info
function updateFromTreasuryInfo() {
    const fromSelect = document.getElementById('fromTreasury');
    const selectedOption = fromSelect.options[fromSelect.selectedIndex];
    const infoDiv = document.getElementById('fromTreasuryInfo');
    
    if (!selectedOption.value) {
        infoDiv.innerHTML = '';
        return;
    }
    
    const treasury = JSON.parse(selectedOption.dataset.treasury);
    
    infoDiv.innerHTML = `
        <div style="background: #f8f9fa; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #dee2e6;">
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                <span style="color: #6c757d;">الرصيد المتاح:</span>
                <strong style="color: #1a5f7a;">${formatNumber(treasury.total_amount)} ${treasury.currency_symbol}</strong>
            </div>
        </div>
    `;
    
    calculateConversion();
}

// Calculate conversion
function calculateConversion() {
    const fromSelect = document.getElementById('fromTreasury');
    const toSelect = document.getElementById('toTreasury');
    const amountInput = document.getElementById('transferAmount');
    const rateInput = document.getElementById('exchangeRate');
    const resultDiv = document.getElementById('conversionResult');
    
    const fromOption = fromSelect.options[fromSelect.selectedIndex];
    const toOption = toSelect.options[toSelect.selectedIndex];
    
    if (!fromOption.value || !toOption.value) {
        resultDiv.style.display = 'none';
        return;
    }
    
    if (fromOption.value === toOption.value) {
        Swal.fire({
            icon: 'warning',
            title: 'تنبيه',
            text: 'لا يمكن التحويل من نفس الخزنة إلى نفسها',
            timer: 2000,
            showConfirmButton: false
        });
        toSelect.value = '';
        resultDiv.style.display = 'none';
        return;
    }
    
    const fromTreasury = JSON.parse(fromOption.dataset.treasury);
    const toTreasury = JSON.parse(toOption.dataset.treasury);
    const amount = parseFloat(amountInput.value) || 0;
    const rate = parseFloat(rateInput.value) || 0;
    
    // Update exchange rate hint
    document.getElementById('exchangeRateHint').textContent = 
        `مثال: إذا كان 1 ${fromTreasury.currency_symbol} = X ${toTreasury.currency_symbol}، أدخل X`;
    
    // Update to treasury info
    const toInfoDiv = document.getElementById('toTreasuryInfo');
    toInfoDiv.innerHTML = `
        <div style="background: #f8f9fa; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #dee2e6;">
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
                <span style="color: #6c757d;">الرصيد الحالي:</span>
                <strong style="color: #1a5f7a;">${formatNumber(toTreasury.total_amount)} ${toTreasury.currency_symbol}</strong>
            </div>
        </div>
    `;
    
    if (amount > 0 && rate > 0) {
        // Check if amount exceeds available balance
        if (amount > fromTreasury.total_amount) {
            Swal.fire({
                icon: 'error',
                title: 'خطأ',
                text: 'المبلغ المطلوب تحويله أكبر من الرصيد المتاح',
                timer: 2000,
                showConfirmButton: false
            });
            amountInput.value = '';
            resultDiv.style.display = 'none';
            return;
        }
        
        const convertedAmount = amount * rate;
        
        // Show result
        resultDiv.style.display = 'block';
        document.getElementById('displayFromAmount').textContent = 
            `${formatNumber(amount)} ${fromTreasury.currency_symbol}`;
        document.getElementById('displayExchangeRate').textContent = 
            `1 ${fromTreasury.currency_symbol} = ${rate} ${toTreasury.currency_symbol}`;
        document.getElementById('displayToAmount').textContent = 
            `${formatNumber(convertedAmount)} ${toTreasury.currency_symbol}`;
    } else {
        resultDiv.style.display = 'none';
    }
}

// Handle transfer form submission
document.addEventListener('DOMContentLoaded', function() {
    const transferForm = document.getElementById('transferForm');
    if (transferForm) {
        transferForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await processTransfer();
        });
    }
});

// Process transfer
async function processTransfer() {
    try {
        const fromSelect = document.getElementById('fromTreasury');
        const toSelect = document.getElementById('toTreasury');
        const amount = parseFloat(document.getElementById('transferAmount').value);
        const rate = parseFloat(document.getElementById('exchangeRate').value);
        const transferDate = document.getElementById('transferDate').value;
        const notes = document.getElementById('transferNotes').value;
        
        const fromOption = fromSelect.options[fromSelect.selectedIndex];
        const toOption = toSelect.options[toSelect.selectedIndex];
        
        const fromTreasury = JSON.parse(fromOption.dataset.treasury);
        const toTreasury = JSON.parse(toOption.dataset.treasury);
        
        const convertedAmount = amount * rate;
        
        // Close transfer modal first
        closeTransferModal();
        
        // Confirm transfer
        const result = await Swal.fire({
            title: 'تأكيد التحويل',
            html: `
                <div style="text-align: right; padding: 1rem;">
                    <p style="margin-bottom: 1rem;">هل أنت متأكد من إجراء هذا التحويل؟</p>
                    <div style="background: #f8f9fa; padding: 1rem; border-radius: 0.5rem;">
                        <div style="margin-bottom: 0.5rem;">
                            <strong>من:</strong> ${fromTreasury.country_name} (${fromTreasury.currency_symbol})
                        </div>
                        <div style="margin-bottom: 0.5rem;">
                            <strong>إلى:</strong> ${toTreasury.country_name} (${toTreasury.currency_symbol})
                        </div>
                        <div style="margin-bottom: 0.5rem;">
                            <strong>المبلغ المحول:</strong> ${formatNumber(amount)} ${fromTreasury.currency_symbol}
                        </div>
                        <div style="margin-bottom: 0.5rem;">
                            <strong>سعر الصرف:</strong> 1 ${fromTreasury.currency_symbol} = ${rate} ${toTreasury.currency_symbol}
                        </div>
                        <div style="padding-top: 0.5rem; border-top: 2px solid #1a5f7a; color: #1a5f7a; font-size: 1.1rem;">
                            <strong>المبلغ المستلم:</strong> ${formatNumber(convertedAmount)} ${toTreasury.currency_symbol}
                        </div>
                    </div>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-check"></i> نعم، تأكيد التحويل',
            cancelButtonText: '<i class="fas fa-times"></i> إلغاء',
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d'
        });
        
        if (!result.isConfirmed) {
            // If cancelled, reopen transfer modal
            showTransferModal();
            // Restore form values
            document.getElementById('fromTreasury').value = fromTreasury.currency_code;
            document.getElementById('toTreasury').value = toTreasury.currency_code;
            document.getElementById('transferAmount').value = amount;
            document.getElementById('exchangeRate').value = rate;
            document.getElementById('transferDate').value = transferDate;
            document.getElementById('transferNotes').value = notes;
            // Trigger updates
            updateFromTreasuryInfo();
            calculateConversion();
            return;
        }
        
        const client = window.supabaseClient;
        
        // Create transfer record in treasury_transfers table
        const transferNumber = `TRF-${Date.now()}`;
        
        const transferData = {
            transfer_number: transferNumber,
            from_currency: fromTreasury.currency_code,
            to_currency: toTreasury.currency_code,
            from_amount: amount,
            to_amount: convertedAmount,
            exchange_rate: rate,
            transfer_date: transferDate,
            notes: notes || `تحويل من ${fromTreasury.country_name} إلى ${toTreasury.country_name}`,
            created_at: new Date().toISOString()
        };
        
        // Insert transfer record
        const { data: insertedTransfer, error: transferError } = await client
            .from('treasury_transfers')
            .insert(transferData)
            .select()
            .single();
        
        if (transferError) {
            console.error('[Treasury] Error creating transfer:', transferError);
            throw new Error('فشل في تسجيل التحويل');
        }
        
        // Create withdrawal transaction from source treasury
        const withdrawalTransactionNumber = `TRF-WTH-${Date.now()}`;
        const withdrawalData = {
            transaction_number: withdrawalTransactionNumber,
            currency_code: fromTreasury.currency_code,
            transaction_type: 'withdrawal',
            amount: -amount, // Negative for withdrawal
            category: 'تحويل بين الخزائن',
            description: `تحويل إلى ${toTreasury.country_name} - رقم التحويل: ${transferNumber}`,
            reference_type: 'treasury_transfer',
            reference_id: insertedTransfer?.id || null,
            transaction_date: transferDate,
            created_at: new Date().toISOString()
        };
        
        const { error: withdrawalError } = await client
            .from('treasury_transactions')
            .insert(withdrawalData);
        
        if (withdrawalError) {
            console.error('[Treasury] Error creating withdrawal transaction:', withdrawalError);
            // Don't throw error, continue with deposit
        }
        
        // Create deposit transaction in target treasury
        const depositTransactionNumber = `TRF-DEP-${Date.now()}`;
        const depositData = {
            transaction_number: depositTransactionNumber,
            currency_code: toTreasury.currency_code,
            transaction_type: 'deposit',
            amount: convertedAmount, // Positive for deposit
            category: 'تحويل بين الخزائن',
            description: `تحويل من ${fromTreasury.country_name} - رقم التحويل: ${transferNumber}`,
            reference_type: 'treasury_transfer',
            reference_id: insertedTransfer?.id || null,
            transaction_date: transferDate,
            created_at: new Date().toISOString()
        };
        
        const { error: depositError } = await client
            .from('treasury_transactions')
            .insert(depositData);
        
        if (depositError) {
            console.error('[Treasury] Error creating deposit transaction:', depositError);
            // Don't throw error, just log it
        }
        
        await refreshTreasury();
        
        Swal.fire({
            icon: 'success',
            title: 'تم بنجاح!',
            html: `
                <div style="text-align: right; padding: 1rem;">
                    <p>تم تسجيل التحويل بنجاح</p>
                    <div style="background: #d4edda; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem;">
                        <div><strong>رقم التحويل:</strong> ${transferNumber}</div>
                        <div><strong>المبلغ المحول:</strong> ${formatNumber(amount)} ${fromTreasury.currency_symbol}</div>
                        <div><strong>المبلغ المستلم:</strong> ${formatNumber(convertedAmount)} ${toTreasury.currency_symbol}</div>
                    </div>
                </div>
            `,
            confirmButtonText: 'حسناً'
        });
        
    } catch (error) {
        console.error('[Treasury] Error processing transfer:', error);
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: error.message || 'فشل في إجراء التحويل'
        });
    }
}

// Initialize page on load
document.addEventListener('DOMContentLoaded', initTreasuryPage);
