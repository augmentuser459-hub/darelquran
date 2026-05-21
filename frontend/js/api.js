// API Helper Functions using Supabase
const API = {
    // Get Supabase client
    getClient() {
        if (!window.supabaseClient) {
            window.supabaseClient = initSupabase();
        }
        return window.supabaseClient;
    },

    // Generic GET request
    async get(table, options = {}) {
        try {
            const client = this.getClient();
            let query = client.from(table).select(options.select || '*');

            // Apply filters
            if (options.filters) {
                Object.entries(options.filters).forEach(([key, value]) => {
                    query = query.eq(key, value);
                });
            }

            // Apply ordering
            if (options.order) {
                query = query.order(options.order.column, { ascending: options.order.ascending !== false });
            }

            // Apply limit
            if (options.limit) {
                query = query.limit(options.limit);
            }

            const { data, error } = await query;

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error(`[API] Error fetching ${table}:`, error);
            return { success: false, error: error.message };
        }
    },

    // Generic POST request
    async post(table, data) {
        try {
            const client = this.getClient();
            const { data: result, error } = await client
                .from(table)
                .insert(data)
                .select();

            if (error) throw error;
            return { success: true, data: result };
        } catch (error) {
            console.error(`[API] Error creating ${table}:`, error);
            return { success: false, error: error.message };
        }
    },

    // Generic PUT/PATCH request
    async update(table, id, data) {
        try {
            const client = this.getClient();
            const { data: result, error } = await client
                .from(table)
                .update(data)
                .eq('id', id)
                .select();

            if (error) throw error;
            return { success: true, data: result };
        } catch (error) {
            console.error(`[API] Error updating ${table}:`, error);
            return { success: false, error: error.message };
        }
    },

    // Generic DELETE request
    async delete(table, id) {
        try {
            const client = this.getClient();
            const { error } = await client
                .from(table)
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error(`[API] Error deleting ${table}:`, error);
            return { success: false, error: error.message };
        }
    }
};

console.log('[API] ✅ API helper loaded');
