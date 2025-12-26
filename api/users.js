import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        switch (req.method) {
            case 'GET':
                return await handleGet(req, res);
            case 'POST':
                return await handlePost(req, res);
            case 'PUT':
                return await handlePut(req, res);
            case 'DELETE':
                return await handleDelete(req, res);
            default:
                return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

// GET - 목록 조회 / 단일 조회 / 통계 / 내보내기
async function handleGet(req, res) {
    const { id, stats, export: exportCsv } = req.query;

    // 단일 회원 조회
    if (id) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // 비밀번호 제외
        delete data.password;
        return res.json({ success: true, user: data });
    }

    // 통계만 요청
    if (stats === 'true') {
        return await getStats(res);
    }

    // CSV 내보내기
    if (exportCsv === 'true') {
        return await exportUsers(res);
    }

    // 목록 조회
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { search, status, plan } = req.query;

    let query = supabase
        .from('users')
        .select('*', { count: 'exact' });

    // 검색 필터
    if (search) {
        query = query.or(`name.ilike.%${search}%,username.ilike.%${search}%`);
    }

    // 상태 필터
    if (status) {
        query = query.eq('status', status);
    }

    // 플랜 필터
    if (plan) {
        query = query.eq('plan', plan);
    }

    // 정렬 및 페이지네이션
    query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }

    // 비밀번호 제외
    const users = (data || []).map(user => {
        delete user.password;
        return user;
    });

    return res.json({
        success: true,
        users,
        pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
        }
    });
}

// 통계 조회
async function getStats(res) {
    try {
        const [total, active, pending, inactive] = await Promise.all([
            supabase.from('users').select('id', { count: 'exact', head: true }),
            supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'active'),
            supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'inactive')
        ]);

        return res.json({
            success: true,
            stats: {
                total: total.count || 0,
                active: active.count || 0,
                pending: pending.count || 0,
                inactive: inactive.count || 0
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        return res.json({
            success: true,
            stats: { total: 0, active: 0, pending: 0, inactive: 0 }
        });
    }
}

// CSV 내보내기
async function exportUsers(res) {
    const { data, error } = await supabase
        .from('users')
        .select('name, username, phone, company, plan, status, meta_account_id, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    // CSV 생성
    const headers = ['이름', '아이디', '연락처', '회사', '플랜', '상태', 'Meta계정ID', '가입일'];
    const rows = (data || []).map(user => [
        user.name || '',
        user.username || '',
        user.phone || '',
        user.company || '',
        user.plan || '',
        user.status || '',
        user.meta_account_id || '',
        user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : ''
    ]);

    const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // BOM 추가 (한글 엑셀 호환)
    const bom = '\uFEFF';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=users_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(bom + csv);
}

// POST - 회원 생성
async function handlePost(req, res) {
    const { name, username, password, phone, plan, status, meta_account_id } = req.body;

    // 필수 필드 검증 (이름, 아이디, 비밀번호만 필수)
    if (!name || !username || !password) {
        return res.status(400).json({ 
            success: false, 
            error: '이름, 아이디, 비밀번호는 필수입니다.' 
        });
    }

    // 비밀번호 4자리 이상
    if (password.length < 4) {
        return res.status(400).json({ 
            success: false, 
            error: '비밀번호는 4자리 이상이어야 합니다.' 
        });
    }

    // 아이디 중복 체크
    const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

    if (existing) {
        return res.status(400).json({ 
            success: false, 
            error: '이미 사용 중인 아이디입니다.' 
        });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 회원 생성
    const { data, error } = await supabase
        .from('users')
        .insert({
            name,
            username,
            password: hashedPassword,
            phone: phone || null,
            company: null,  // 회원 추가 시 회사명은 비워둠 (나중에 Meta에서 가져옴)
            plan: plan || 'basic',
            status: status || 'active',
            role: 'client',
            meta_account_id: meta_account_id || null,
            created_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('Insert error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }

    delete data.password;
    return res.status(201).json({ success: true, user: data });
}

// PUT - 회원 수정
async function handlePut(req, res) {
    const { id } = req.query;
    
    if (!id) {
        return res.status(400).json({ success: false, error: 'User ID required' });
    }

    const { name, username, phone, company, plan, status, meta_account_id } = req.body;

    // 아이디 변경 시 중복 체크
    if (username) {
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .neq('id', id)
            .single();

        if (existing) {
            return res.status(400).json({ 
                success: false, 
                error: '이미 사용 중인 아이디입니다.' 
            });
        }
    }

    const updateData = {
        updated_at: new Date().toISOString()
    };

    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (phone !== undefined) updateData.phone = phone || null;
    if (company !== undefined) updateData.company = company || null;  // 수정 시 회사명 변경 가능
    if (plan) updateData.plan = plan;
    if (status) updateData.status = status;
    if (meta_account_id !== undefined) updateData.meta_account_id = meta_account_id || null;

    const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Update error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }

    delete data.password;
    return res.json({ success: true, user: data });
}

// DELETE - 회원 삭제
async function handleDelete(req, res) {
    const { id } = req.query;
    
    if (!id) {
        return res.status(400).json({ success: false, error: 'User ID required' });
    }

    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Delete error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, message: 'User deleted' });
}