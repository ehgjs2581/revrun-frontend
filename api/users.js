import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Auth check (간단한 예시 - 실제로는 JWT 검증 등 필요)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // 개발 단계에서는 인증 스킵 가능
        // return res.status(401).json({ success: false, error: 'Unauthorized' });
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
    const { id } = req.query;

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
    if (req.query.stats === 'true') {
        return await getStats(res);
    }

    // CSV 내보내기
    if (req.query.export === 'true') {
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
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
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
        return res.status(500).json({ success: false, error: error.message });
    }

    // 비밀번호 제외
    const users = data.map(user => {
        delete user.password;
        return user;
    });

    return res.json({
        success: true,
        users,
        pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit)
        }
    });
}

// 통계 조회
async function getStats(res) {
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
}

// CSV 내보내기
async function exportUsers(res) {
    const { data, error } = await supabase
        .from('users')
        .select('name, email, phone, company, plan, status, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    // CSV 생성
    const headers = ['이름', '이메일', '연락처', '회사', '플랜', '상태', '가입일'];
    const rows = data.map(user => [
        user.name,
        user.email,
        user.phone || '',
        user.company || '',
        user.plan,
        user.status,
        new Date(user.created_at).toLocaleDateString('ko-KR')
    ]);

    const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // BOM 추가 (한글 엑셀 호환)
    const bom = '\uFEFF';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=users_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(bom + csv);
}

// POST - 회원 생성
async function handlePost(req, res) {
    const { name, email, password, phone, company, plan, status } = req.body;

    // 필수 필드 검증
    if (!name || !email || !password) {
        return res.status(400).json({ 
            success: false, 
            error: '이름, 이메일, 비밀번호는 필수입니다.' 
        });
    }

    // 이메일 중복 체크
    const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

    if (existing) {
        return res.status(400).json({ 
            success: false, 
            error: '이미 사용 중인 이메일입니다.' 
        });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 회원 생성
    const { data, error } = await supabase
        .from('users')
        .insert({
            name,
            email,
            password: hashedPassword,
            phone: phone || null,
            company: company || null,
            plan: plan || 'basic',
            status: status || 'pending',
            created_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
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

    const { name, email, phone, company, plan, status } = req.body;

    // 이메일 변경 시 중복 체크
    if (email) {
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .neq('id', id)
            .single();

        if (existing) {
            return res.status(400).json({ 
                success: false, 
                error: '이미 사용 중인 이메일입니다.' 
            });
        }
    }

    const updateData = {
        updated_at: new Date().toISOString()
    };

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone || null;
    if (company !== undefined) updateData.company = company || null;
    if (plan) updateData.plan = plan;
    if (status) updateData.status = status;

    const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
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
        return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, message: 'User deleted' });
}
