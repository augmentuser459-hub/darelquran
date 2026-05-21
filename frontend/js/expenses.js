// Expenses Page JavaScript
console.log('[Expenses] 🚀 Initializing...');

let expensesTable = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('[Expenses] 📊 Loading expenses data...');
    
    // Initialize Supabase if not already done
    if (!window.supabaseClient) {
        window.supabaseClient = initSupabase();
    }

    // Wait for Supabase to initialize
    await new Promise(resolve => setTimeout(resolve, 500));

    // Load expenses
    await loadExpenses();

    console.log('[Expenses] ✅ Initialization complete');
});

// Load expenses
async function loadExpenses() {
    try {
        const client = window.supabaseClient;
        const { data: expenses, error } = await client
            .from('expenses')
            .select('*')
            .order('expense_date', { ascending: false });

        if (error) throw error;

        console.log('[Expenses] ✅ Loaded', expenses?.length || 0, 'expenses');

        // Update stats
        updateStats(expenses || []);

        // Display expenses
        displayExpenses(expenses || []);

        // Initialize DataTable
        setTimeout(() => {
            try {
                if (typeof $.fn.DataTable !== 'undefined' && $('#expensesTable').length) {
                    if (expensesTable) {
                        expensesTable.destroy();
                    }
                    expensesTable = $('#expensesTable').DataTable({
                        language: {
                            url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/ar.json'
                        },
                        order: [[4, 'desc']]
                    });
                }
            } catch (e) {
                console.warn('[Expenses] DataTable initialization skipped:', e.message);
            }
        }, 100);

    } catch (error) {
        console.error('[Expenses] Error loading expenses:', error);
        showError('فشل تحميل بيانات المصروفات: ' + error.message);
    }
}

// Update stats
function updateStats(expenses) {
    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    
    // Get current month expenses
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthExpenses = expenses.filter(e => new Date(e.expense_date) >= firstDayOfMonth).length;

    document.getElementById('totalExpenses').textContent = totalExpenses;
    document.getElementById('totalAmount').textContent = totalAmount.toFixed(2) + ' ج.م';
    document.getElementById('monthExpenses').textContent = monthExpenses;
}

// Display expenses
function displayExpenses(expenses) {
    const tbody = document.querySelector('#expensesTable tbody');
    
    if (!tbody) {
        console.error('[Expenses] ❌ Table body not found');
        return;
    }

    if (expenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">لا توجد مصروفات</td></tr>';
        return;
    }

    tbody.innerHTML = expenses.map(expense => `
        <tr>
            <td>${expense.id}</td>
            <td>${expense.description || '-'}</td>
            <td>${getCategoryText(expense.category)}</td>
            <td>${parseFloat(expense.amount || 0).toFixed(2)} ج.م</td>
            <td>${formatDate(expense.expense_date)}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editExpense(${expense.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteExpense(${expense.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Show add expense modal
function showAddExpenseModal() {
    document.getElementById('expenseModal').style.display = 'flex';
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-receipt"></i> إضافة مصروف';
    document.getElementById('expenseForm').reset();
    document.getElementById('expenseId').value = '';
    document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
}

// Close expense modal
function closeExpenseModal() {
    document.getElementById('expenseModal').style.display = 'none';
}

// Helper functions
function getCategoryText(category) {
    const categories = {
        'utilities': 'مرافق',
        'supplies': 'مستلزمات',
        'maintenance': 'صيانة',
        'rent': 'إيجار',
        'other': 'أخرى'
    };
    return categories[category] || category;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG');
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

function editExpense(id) {
    console.log('[Expenses] Edit expense:', id);
    alert('تعديل المصروف: ' + id);
}

function deleteExpense(id) {
    console.log('[Expenses] Delete expense:', id);
    if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
        // TODO: Implement delete
        alert('حذف المصروف: ' + id);
    }
}

console.log('[Expenses] ✅ Script loaded');
