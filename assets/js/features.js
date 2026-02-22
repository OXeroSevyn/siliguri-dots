// ============================================================
// features.js — Shared Utilities for Siliguri News Features
// ============================================================

// --- View Count ---
function formatViewCount(n) {
    if (!n || n < 0) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
}

async function incrementViewCount(articleId, supabaseClient) {
    try {
        const { data } = await supabaseClient
            .from('articles')
            .select('views')
            .eq('id', articleId)
            .single();
        const newViews = (data?.views || 0) + 1;
        await supabaseClient.from('articles').update({ views: newViews }).eq('id', articleId);
        return newViews;
    } catch (e) {
        return 0;
    }
}

// --- Share Buttons ---
function renderShareButtons(title, url) {
    const enc = encodeURIComponent;
    const wa = `https://wa.me/?text=${enc(title)}%20${enc(url)}`;
    const tw = `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`;
    return `
    <div class="flex items-center gap-2 flex-wrap mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <span class="font-mono text-[11px] font-bold uppercase tracking-widest text-gray-400 mr-1">Share:</span>
        <a href="${wa}" target="_blank" rel="noopener noreferrer"
            class="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe5a] text-white font-bold text-xs px-3 py-1.5 rounded-full transition">
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.86L.057 23.116a.5.5 0 00.611.64l5.446-1.428A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.967 0-3.811-.534-5.392-1.464l-.386-.228-4.003 1.05 1.07-3.906-.251-.399A9.938 9.938 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
            WhatsApp
        </a>
        <a href="${tw}" target="_blank" rel="noopener noreferrer"
            class="flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white font-bold text-xs px-3 py-1.5 rounded-full transition">
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.638L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            Share on X
        </a>
        <button id="copyLinkBtn" onclick="copyArticleLink('${url}')"
            class="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs px-3 py-1.5 rounded-full transition border border-gray-200 dark:border-gray-700">
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            Copy Link
        </button>
    </div>`;
}

function copyArticleLink(url) {
    const link = url || window.location.href;
    navigator.clipboard.writeText(link).then(() => {
        const btn = document.getElementById('copyLinkBtn');
        if (btn) { btn.innerText = '✅ Copied!'; setTimeout(() => { btn.innerHTML = `<svg class="h-3.5 w-3.5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg> Copy Link`; }, 2000); }
    });
}

// --- Newsletter ---
async function subscribeToNewsletter(email, supabaseClient) {
    if (!email || !email.includes('@')) return { success: false, message: 'Please enter a valid email.' };
    try {
        const { error } = await supabaseClient
            .from('newsletter_subscribers')
            .upsert({ email: email.toLowerCase().trim() }, { onConflict: 'email', ignoreDuplicates: false });
        if (error) throw error;
        return { success: true, message: '✅ Subscribed! Thanks for joining.' };
    } catch (e) {
        if (e.code === '23505') return { success: true, message: '✅ You\'re already subscribed!' };
        return { success: false, message: 'Something went wrong. Try again.' };
    }
}

// --- Skeleton Loading ---
function renderSkeletonMain() {
    return `<div class="animate-pulse w-full">
        <div class="aspect-video w-full bg-gray-200 rounded mb-4"></div>
        <div class="h-4 bg-gray-200 rounded w-24 mb-3"></div>
        <div class="h-8 bg-gray-200 rounded w-full mb-2"></div>
        <div class="h-8 bg-gray-200 rounded w-5/6 mb-4"></div>
        <div class="h-4 bg-gray-200 rounded w-1/3"></div>
    </div>`;
}

function renderSkeletonCards(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `<div class="flex flex-col gap-3 animate-pulse">
            <div class="aspect-[3/2] bg-gray-200 rounded"></div>
            <div class="h-3 bg-gray-200 rounded w-1/4"></div>
            <div class="h-5 bg-gray-200 rounded w-full"></div>
            <div class="h-5 bg-gray-200 rounded w-4/5"></div>
            <div class="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>`;
    }
    return html;
}

// --- Newsletter HTML Block (reused in both pages) ---
function renderNewsletterBlock() {
    return `
    <div class="border-t-2 border-black dark:border-gray-700 pt-6 mt-6">
        <h4 class="font-mono text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">📬 Newsletter</h4>
        <p class="text-white text-sm mb-3 font-sans">Get the best of Siliguri delivered to your inbox.</p>
        <form id="newsletterForm" onsubmit="handleNewsletterSubmit(event)" class="flex gap-2">
            <input type="email" id="newsletterEmail" placeholder="your@email.com" required
                class="flex-1 bg-gray-800 dark:bg-gray-900 border border-gray-700 text-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brandYellow rounded min-w-0">
            <button type="submit" id="newsletterBtn"
                class="bg-brandYellow text-black font-bold text-xs px-4 py-2 uppercase tracking-wide hover:bg-yellow-400 transition shrink-0 rounded">
                Subscribe
            </button>
        </form>
        <p id="newsletterMsg" class="text-sm mt-2 hidden"></p>
    </div>`;
}
