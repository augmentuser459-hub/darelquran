/**
 * Database Logger - تسجيل جميع طلبات قاعدة البيانات
 * يسجل تفاصيل كل request يذهب إلى Supabase
 */

class DatabaseLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 100; // الحد الأقصى للسجلات المحفوظة
        this.enabled = true;
    }

    /**
     * تسجيل طلب قاعدة البيانات
     */
    logRequest(operation, table, data = null, filters = null) {
        if (!this.enabled) return;

        const logEntry = {
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleString('ar-EG'),
            operation: operation, // select, insert, update, delete, rpc
            table: table,
            data: data,
            filters: filters,
            user: this.getCurrentUser(),
            stackTrace: this.getStackTrace()
        };

        this.logs.push(logEntry);
        
        // حذف السجلات القديمة
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // طباعة في Console
        this.printLog(logEntry);
        
        // حفظ في LocalStorage
        this.saveToStorage();

        return logEntry;
    }

    /**
     * تسجيل نتيجة الطلب
     */
    logResponse(operation, table, success, data = null, error = null, duration = 0) {
        if (!this.enabled) return;

        const logEntry = {
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleString('ar-EG'),
            type: 'RESPONSE',
            operation: operation,
            table: table,
            success: success,
            duration: `${duration}ms`,
            recordCount: data ? (Array.isArray(data) ? data.length : 1) : 0,
            data: data,
            error: error,
            user: this.getCurrentUser()
        };

        this.logs.push(logEntry);
        
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        this.printResponse(logEntry);
        this.saveToStorage();

        return logEntry;
    }

    /**
     * طباعة السجل في Console
     */
    printLog(log) {
        const style = 'background: #2196F3; color: white; padding: 2px 5px; border-radius: 3px;';
        
        console.group(`%c📤 DB REQUEST: ${log.operation.toUpperCase()} - ${log.table}`, style);
        console.log('⏰ الوقت:', log.time);
        console.log('👤 المستخدم:', log.user);
        console.log('🎯 العملية:', log.operation);
        console.log('📊 الجدول:', log.table);
        
        if (log.data) {
            console.log('📝 البيانات:', log.data);
        }
        
        if (log.filters) {
            console.log('🔍 الفلاتر:', log.filters);
        }
        
        console.log('📍 Stack Trace:', log.stackTrace);
        console.groupEnd();
    }

    /**
     * طباعة النتيجة في Console
     */
    printResponse(log) {
        const style = log.success 
            ? 'background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;'
            : 'background: #f44336; color: white; padding: 2px 5px; border-radius: 3px;';
        
        const icon = log.success ? '✅' : '❌';
        
        console.group(`%c${icon} DB RESPONSE: ${log.operation.toUpperCase()} - ${log.table}`, style);
        console.log('⏰ الوقت:', log.time);
        console.log('⚡ المدة:', log.duration);
        console.log('📊 عدد السجلات:', log.recordCount);
        console.log('✔️ النجاح:', log.success);
        
        if (log.data) {
            console.log('📦 البيانات:', log.data);
        }
        
        if (log.error) {
            console.error('⚠️ الخطأ:', log.error);
        }
        
        console.groupEnd();
    }

    /**
     * الحصول على المستخدم الحالي
     */
    getCurrentUser() {
        try {
            const user = JSON.parse(localStorage.getItem('currentUser'));
            return user ? user.username : 'غير معروف';
        } catch {
            return 'غير معروف';
        }
    }

    /**
     * الحصول على Stack Trace
     */
    getStackTrace() {
        const stack = new Error().stack;
        const lines = stack.split('\n').slice(3, 6); // أخذ 3 أسطر من الـ stack
        return lines.map(line => line.trim()).join(' → ');
    }

    /**
     * حفظ السجلات في LocalStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem('db_logs', JSON.stringify(this.logs));
        } catch (e) {
            console.warn('فشل حفظ السجلات:', e);
        }
    }

    /**
     * تحميل السجلات من LocalStorage
     */
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('db_logs');
            if (saved) {
                this.logs = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('فشل تحميل السجلات:', e);
        }
    }

    /**
     * الحصول على جميع السجلات
     */
    getAllLogs() {
        return this.logs;
    }

    /**
     * الحصول على سجلات جدول معين
     */
    getLogsByTable(table) {
        return this.logs.filter(log => log.table === table);
    }

    /**
     * الحصول على سجلات عملية معينة
     */
    getLogsByOperation(operation) {
        return this.logs.filter(log => log.operation === operation);
    }

    /**
     * مسح جميع السجلات
     */
    clearLogs() {
        this.logs = [];
        localStorage.removeItem('db_logs');
        console.log('✅ تم مسح جميع السجلات');
    }

    /**
     * تصدير السجلات كـ JSON
     */
    exportLogs() {
        const dataStr = JSON.stringify(this.logs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `db-logs-${new Date().toISOString()}.json`;
        link.click();
        console.log('✅ تم تصدير السجلات');
    }

    /**
     * طباعة ملخص السجلات
     */
    printSummary() {
        const summary = {
            total: this.logs.length,
            byOperation: {},
            byTable: {},
            errors: 0,
            success: 0
        };

        this.logs.forEach(log => {
            // حسب العملية
            summary.byOperation[log.operation] = (summary.byOperation[log.operation] || 0) + 1;
            
            // حسب الجدول
            if (log.table) {
                summary.byTable[log.table] = (summary.byTable[log.table] || 0) + 1;
            }
            
            // النجاح والفشل
            if (log.type === 'RESPONSE') {
                if (log.success) {
                    summary.success++;
                } else {
                    summary.errors++;
                }
            }
        });

        console.group('📊 ملخص سجلات قاعدة البيانات');
        console.log('📝 إجمالي السجلات:', summary.total);
        console.log('✅ الناجحة:', summary.success);
        console.log('❌ الفاشلة:', summary.errors);
        console.log('🎯 حسب العملية:', summary.byOperation);
        console.log('📊 حسب الجدول:', summary.byTable);
        console.groupEnd();

        return summary;
    }

    /**
     * تفعيل/تعطيل التسجيل
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        console.log(`${enabled ? '✅ تم تفعيل' : '❌ تم تعطيل'} تسجيل قاعدة البيانات`);
    }
}

// إنشاء instance عام
window.dbLogger = new DatabaseLogger();

// تحميل السجلات السابقة
window.dbLogger.loadFromStorage();

// إضافة أوامر مساعدة في Console
console.log('%c📊 Database Logger متاح الآن!', 'background: #4CAF50; color: white; padding: 5px 10px; font-size: 14px;');
console.log('الأوامر المتاحة:');
console.log('  dbLogger.getAllLogs() - عرض جميع السجلات');
console.log('  dbLogger.printSummary() - عرض ملخص السجلات');
console.log('  dbLogger.clearLogs() - مسح السجلات');
console.log('  dbLogger.exportLogs() - تصدير السجلات');
console.log('  dbLogger.setEnabled(false) - تعطيل التسجيل');
