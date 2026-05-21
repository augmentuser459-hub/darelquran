// Today Sessions Page
console.log('[Today Sessions] 🚀 Initializing...');

document.addEventListener('DOMContentLoaded', async function() {
    if (!window.supabaseClient) {
        window.supabaseClient = initSupabase();
    }
    
    await loadTodaySessions();
});

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
            .order('session_time', { ascending: true });

        if (error) throw error;
        
        console.log('[Today Sessions] Loaded:', sessions?.length || 0);
        
    } catch (error) {
        console.error('[Today Sessions] Error:', error);
    }
}

console.log('[Today Sessions] ✅ Script loaded');
