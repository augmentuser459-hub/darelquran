// Supabase Client Initialization with Logging
console.log('[Supabase Client] 🚀 Initializing...');

// Global Supabase client
window.supabaseClient = null;

// Initialize Supabase client
function initSupabase() {
    if (window.supabaseClient) {
        console.log('[Supabase Client] ♻️ Client already initialized');
        return window.supabaseClient;
    }

    if (typeof supabase === 'undefined') {
        console.error('[Supabase Client] ❌ Supabase SDK not loaded!');
        return null;
    }

    if (!SUPABASE_CONFIG || !SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
        console.error('[Supabase Client] ❌ Configuration missing!');
        return null;
    }

    try {
        const client = supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            }
        );

        // إضافة Logging Wrapper
        window.supabaseClient = createLoggedClient(client);

        console.log('[Supabase Client] ✅ Client initialized successfully with logging');
        return window.supabaseClient;
    } catch (error) {
        console.error('[Supabase Client] ❌ Initialization failed:', error);
        return null;
    }
}

/**
 * إنشاء Wrapper للـ Supabase Client مع Logging
 */
function createLoggedClient(client) {
    return {
        // الوصول للـ client الأصلي
        _originalClient: client,

        // from() مع logging
        from: function(table) {
            const query = client.from(table);
            return createLoggedQuery(query, table);
        },

        // rpc() مع logging
        rpc: async function(functionName, params = {}) {
            const startTime = performance.now();
            
            if (window.dbLogger) {
                window.dbLogger.logRequest('rpc', functionName, params);
            }

            try {
                const result = await client.rpc(functionName, params);
                const duration = Math.round(performance.now() - startTime);

                if (window.dbLogger) {
                    window.dbLogger.logResponse('rpc', functionName, !result.error, result.data, result.error, duration);
                }

                return result;
            } catch (error) {
                const duration = Math.round(performance.now() - startTime);
                
                if (window.dbLogger) {
                    window.dbLogger.logResponse('rpc', functionName, false, null, error, duration);
                }

                throw error;
            }
        },

        // auth للوصول المباشر
        auth: client.auth,

        // storage للوصول المباشر
        storage: client.storage
    };
}

/**
 * إنشاء Wrapper للـ Query مع Logging
 */
function createLoggedQuery(query, table) {
    const queryInfo = {
        table: table,
        operation: null,
        filters: {},
        data: null
    };

    const wrapper = {
        // select()
        select: function(columns = '*') {
            queryInfo.operation = 'select';
            queryInfo.filters.columns = columns;
            return createLoggedQuery(query.select(columns), table, queryInfo);
        },

        // insert()
        insert: function(data) {
            queryInfo.operation = 'insert';
            queryInfo.data = data;
            return createLoggedQuery(query.insert(data), table, queryInfo);
        },

        // update()
        update: function(data) {
            queryInfo.operation = 'update';
            queryInfo.data = data;
            return createLoggedQuery(query.update(data), table, queryInfo);
        },

        // delete()
        delete: function() {
            queryInfo.operation = 'delete';
            return createLoggedQuery(query.delete(), table, queryInfo);
        },

        // eq()
        eq: function(column, value) {
            queryInfo.filters[`eq_${column}`] = value;
            return createLoggedQuery(query.eq(column, value), table, queryInfo);
        },

        // neq()
        neq: function(column, value) {
            queryInfo.filters[`neq_${column}`] = value;
            return createLoggedQuery(query.neq(column, value), table, queryInfo);
        },

        // gt()
        gt: function(column, value) {
            queryInfo.filters[`gt_${column}`] = value;
            return createLoggedQuery(query.gt(column, value), table, queryInfo);
        },

        // gte()
        gte: function(column, value) {
            queryInfo.filters[`gte_${column}`] = value;
            return createLoggedQuery(query.gte(column, value), table, queryInfo);
        },

        // lt()
        lt: function(column, value) {
            queryInfo.filters[`lt_${column}`] = value;
            return createLoggedQuery(query.lt(column, value), table, queryInfo);
        },

        // lte()
        lte: function(column, value) {
            queryInfo.filters[`lte_${column}`] = value;
            return createLoggedQuery(query.lte(column, value), table, queryInfo);
        },

        // like()
        like: function(column, pattern) {
            queryInfo.filters[`like_${column}`] = pattern;
            return createLoggedQuery(query.like(column, pattern), table, queryInfo);
        },

        // ilike()
        ilike: function(column, pattern) {
            queryInfo.filters[`ilike_${column}`] = pattern;
            return createLoggedQuery(query.ilike(column, pattern), table, queryInfo);
        },

        // in()
        in: function(column, values) {
            queryInfo.filters[`in_${column}`] = values;
            return createLoggedQuery(query.in(column, values), table, queryInfo);
        },

        // is()
        is: function(column, value) {
            queryInfo.filters[`is_${column}`] = value;
            return createLoggedQuery(query.is(column, value), table, queryInfo);
        },

        // order()
        order: function(column, options) {
            queryInfo.filters.order = { column, ...options };
            return createLoggedQuery(query.order(column, options), table, queryInfo);
        },

        // limit()
        limit: function(count) {
            queryInfo.filters.limit = count;
            return createLoggedQuery(query.limit(count), table, queryInfo);
        },

        // range()
        range: function(from, to) {
            queryInfo.filters.range = { from, to };
            return createLoggedQuery(query.range(from, to), table, queryInfo);
        },

        // single()
        single: function() {
            queryInfo.filters.single = true;
            return createLoggedQuery(query.single(), table, queryInfo);
        },

        // maybeSingle()
        maybeSingle: function() {
            queryInfo.filters.maybeSingle = true;
            return createLoggedQuery(query.maybeSingle(), table, queryInfo);
        },

        // Execute query
        then: async function(resolve, reject) {
            const startTime = performance.now();

            // Log request
            if (window.dbLogger) {
                window.dbLogger.logRequest(
                    queryInfo.operation || 'select',
                    queryInfo.table,
                    queryInfo.data,
                    queryInfo.filters
                );
            }

            try {
                const result = await query;
                const duration = Math.round(performance.now() - startTime);

                // Log response
                if (window.dbLogger) {
                    window.dbLogger.logResponse(
                        queryInfo.operation || 'select',
                        queryInfo.table,
                        !result.error,
                        result.data,
                        result.error,
                        duration
                    );
                }

                if (resolve) resolve(result);
                return result;
            } catch (error) {
                const duration = Math.round(performance.now() - startTime);

                // Log error
                if (window.dbLogger) {
                    window.dbLogger.logResponse(
                        queryInfo.operation || 'select',
                        queryInfo.table,
                        false,
                        null,
                        error,
                        duration
                    );
                }

                if (reject) reject(error);
                throw error;
            }
        }
    };

    return wrapper;
}

// Auto-initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initSupabase, 100);
    });
} else {
    setTimeout(initSupabase, 100);
}

console.log('[Supabase Client] ✅ Script loaded');
