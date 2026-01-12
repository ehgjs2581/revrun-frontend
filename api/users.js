import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        if (req.method === 'GET') return await handleGet(req, res);
        if (req.method === 'POST') return await handlePost(req, res);
        if (req.method === 'PUT') return await handlePut(req, res);
        if (req.method === 'DELETE') return await handleDelete(req, res);
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

async function handleGet(req, res) {
    const { id, stats } = req.query;

    if (id) {
        const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
        if (error) return res.status(404).json({ success: false, error: 'User not found' });
        delete data.password;
        return res.json({ success: true, user: data });
    }

    if (stats === 'true') {
        const [total, active, pending, inactive] = await Promise.all([
            supabase.from('users').select('id', { count: 'exact', head: true }),
            supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'active'),
            supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'inactive')
        ]);
        return res.json({ success: true, stats: { total: total.count || 0, active: active.count || 0, pending: pending.count || 0, inactive: inactive.count || 0 } });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let query = supabase.from('users').select('*', { count: 'exact' });
    if (req.query.search) query = query.or(`name.ilike.%${req.query.search}%,username.ilike.%${req.query.search}%`);
    if (req.query.status) query = query.eq('status', req.query.status);
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });

    const users = (data || []).map(u => { delete u.password; return u; });
    return res.json({ success: true, users, pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) } });
}

async function handlePost(req, res) {
    const { name, username, password, phone, plan, status, meta_account_id, campaign_id, instagram_url, naver_visitors } = req.body;

    if (!name || !username || !password) return res.status(400).json({ success: false, error: '이름, 아이디, 비밀번호는 필수입니다' });
    if (password.length < 4) return res.status(400).json({ success: false, error: '비밀번호는 4자리 이상이어야 합니다' });

    const { data: existing } = await supabase.from('users').select('id').eq('username', username).single();
    if (existing) return res.status(400).json({ success: false, error: '이미 사용 중인 아이디입니다.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase.from('users').insert({
        name,
        username,
        password: hashedPassword,
        phone: phone || null,
        plan: plan || 'basic',
        status: status || 'active',
        role: 'client',
        meta_account_id: meta_account_id || null,
        campaign_id: campaign_id || null,
        instagram_url: instagram_url || null,
        naver_visitors: parseInt(naver_visitors) || 0,
        created_at: new Date().toISOString()
    }).select().single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    delete data.password;
    return res.status(201).json({ success: true, user: data });
}

async function handlePut(req, res) {
    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, error: 'User ID required' });

    const { name, phone, plan, status, meta_account_id, campaign_id, instagram_url, naver_visitors, ai_highlights, ai_actions, ai_generated_at } = req.body;
    const updateData = { updated_at: new Date().toISOString() };

    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone || null;
    if (plan) updateData.plan = plan;
    if (status) updateData.status = status;
    if (meta_account_id !== undefined) updateData.meta_account_id = meta_account_id || null;
    if (campaign_id !== undefined) updateData.campaign_id = campaign_id || null;
    if (instagram_url !== undefined) updateData.instagram_url = instagram_url || null;
    if (naver_visitors !== undefined) updateData.naver_visitors = parseInt(naver_visitors) || 0;

    // AI 콘텐츠 필드
    if (ai_highlights !== undefined) updateData.ai_highlights = ai_highlights;
    if (ai_actions !== undefined) updateData.ai_actions = ai_actions;
    if (ai_generated_at !== undefined) updateData.ai_generated_at = ai_generated_at;

    const { data, error } = await supabase.from('users').update(updateData).eq('id', id).select().single();
    if (error) return res.status(500).json({ success: false, error: error.message });
    delete data.password;
    return res.json({ success: true, user: data });
}

async function handleDelete(req, res) {
    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, error: 'User ID required' });
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, message: 'User deleted' });
}