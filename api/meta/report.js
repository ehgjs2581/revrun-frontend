import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

const META_API_VERSION = 'v18.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
            default:
                return res.status(405).json({ success: false, error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Meta API Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}

// GET - 리포트 조회
async function handleGet(req, res) {
    const { action, account_id, campaign_id, start_date, end_date, client_id } = req.query;

    switch (action) {
        case 'accounts':
            return await getAdAccounts(req, res);
        case 'campaigns':
            return await getCampaigns(account_id, req, res);
        case 'insights':
            return await getInsights(account_id, campaign_id, start_date, end_date, req, res);
        case 'report':
            return await getReport(client_id, start_date, end_date, res);
        default:
            return res.status(400).json({ success: false, error: 'Invalid action' });
    }
}

// POST - 리포트 생성/저장
async function handlePost(req, res) {
    const { action } = req.body;

    switch (action) {
        case 'sync':
            return await syncData(req, res);
        case 'generate':
            return await generateReport(req, res);
        default:
            return res.status(400).json({ success: false, error: 'Invalid action' });
    }
}

// Meta 광고 계정 목록 조회
async function getAdAccounts(req, res) {
    const accessToken = await getAccessToken(req);
    if (!accessToken) {
        return res.status(401).json({ success: false, error: 'Meta access token required' });
    }

    const response = await fetch(
        `${META_API_BASE}/me/adaccounts?fields=id,name,account_status,currency,timezone_name&access_token=${accessToken}`
    );
    const data = await response.json();

    if (data.error) {
        return res.status(400).json({ success: false, error: data.error.message });
    }

    return res.json({
        success: true,
        accounts: data.data.map(acc => ({
            id: acc.id,
            name: acc.name,
            status: acc.account_status === 1 ? 'active' : 'inactive',
            currency: acc.currency,
            timezone: acc.timezone_name
        }))
    });
}

// 캠페인 목록 조회
async function getCampaigns(accountId, req, res) {
    const accessToken = await getAccessToken(req);
    if (!accessToken) {
        return res.status(401).json({ success: false, error: 'Meta access token required' });
    }

    const response = await fetch(
        `${META_API_BASE}/${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,created_time&limit=100&access_token=${accessToken}`
    );
    const data = await response.json();

    if (data.error) {
        return res.status(400).json({ success: false, error: data.error.message });
    }

    return res.json({
        success: true,
        campaigns: data.data.map(campaign => ({
            id: campaign.id,
            name: campaign.name,
            status: campaign.status,
            objective: campaign.objective,
            dailyBudget: campaign.daily_budget ? parseInt(campaign.daily_budget) / 100 : null,
            lifetimeBudget: campaign.lifetime_budget ? parseInt(campaign.lifetime_budget) / 100 : null,
            createdAt: campaign.created_time
        }))
    });
}

// 인사이트(성과 데이터) 조회
async function getInsights(accountId, campaignId, startDate, endDate, req, res) {
    const accessToken = await getAccessToken(req);
    if (!accessToken) {
        return res.status(401).json({ success: false, error: 'Meta access token required' });
    }

    // 날짜 기본값 설정 (최근 30일)
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const endpoint = campaignId 
        ? `${META_API_BASE}/${campaignId}/insights`
        : `${META_API_BASE}/${accountId}/insights`;

    const fields = [
        'campaign_id',
        'campaign_name',
        'impressions',
        'clicks',
        'ctr',
        'cpc',
        'cpm',
        'spend',
        'reach',
        'frequency',
        'actions',
        'cost_per_action_type',
        'video_p25_watched_actions',
        'video_p50_watched_actions',
        'video_p75_watched_actions',
        'video_p100_watched_actions'
    ].join(',');

    const params = new URLSearchParams({
        fields,
        time_range: JSON.stringify({ since: start, until: end }),
        level: 'campaign',
        access_token: accessToken
    });

    const response = await fetch(`${endpoint}?${params}`);
    const data = await response.json();

    if (data.error) {
        return res.status(400).json({ success: false, error: data.error.message });
    }

    // 데이터 가공
    const insights = data.data.map(item => ({
        campaignId: item.campaign_id,
        campaignName: item.campaign_name,
        impressions: parseInt(item.impressions) || 0,
        clicks: parseInt(item.clicks) || 0,
        ctr: parseFloat(item.ctr) || 0,
        cpc: parseFloat(item.cpc) || 0,
        cpm: parseFloat(item.cpm) || 0,
        spend: parseFloat(item.spend) || 0,
        reach: parseInt(item.reach) || 0,
        frequency: parseFloat(item.frequency) || 0,
        conversions: extractConversions(item.actions),
        costPerConversion: extractCostPerConversion(item.cost_per_action_type),
        videoViews: extractVideoViews(item)
    }));

    return res.json({
        success: true,
        dateRange: { start, end },
        insights
    });
}

// DB에서 저장된 리포트 조회
async function getReport(clientId, startDate, endDate, res) {
    let query = supabase
        .from('meta_reports')
        .select('*')
        .order('date', { ascending: false });

    if (clientId) {
        query = query.eq('client_id', clientId);
    }

    if (startDate && endDate) {
        query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data, error } = await query.limit(100);

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    // 요약 통계 계산
    const summary = calculateSummary(data);

    return res.json({
        success: true,
        reports: data,
        summary
    });
}

// Meta 데이터 동기화
async function syncData(req, res) {
    const { client_id, account_id, start_date, end_date } = req.body;
    const accessToken = await getAccessToken(req);

    if (!accessToken) {
        return res.status(401).json({ success: false, error: 'Meta access token required' });
    }

    if (!client_id || !account_id) {
        return res.status(400).json({ success: false, error: 'client_id and account_id required' });
    }

    // 날짜 범위 설정
    const end = end_date || new Date().toISOString().split('T')[0];
    const start = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 일별 데이터 조회
    const fields = [
        'campaign_id',
        'campaign_name',
        'impressions',
        'clicks',
        'ctr',
        'cpc',
        'cpm',
        'spend',
        'reach',
        'frequency',
        'actions',
        'cost_per_action_type'
    ].join(',');

    const params = new URLSearchParams({
        fields,
        time_range: JSON.stringify({ since: start, until: end }),
        time_increment: 1, // 일별
        level: 'campaign',
        access_token: accessToken
    });

    const response = await fetch(`${META_API_BASE}/${account_id}/insights?${params}`);
    const data = await response.json();

    if (data.error) {
        return res.status(400).json({ success: false, error: data.error.message });
    }

    // DB에 저장
    const records = data.data.map(item => ({
        client_id,
        account_id,
        campaign_id: item.campaign_id,
        campaign_name: item.campaign_name,
        date: item.date_start,
        impressions: parseInt(item.impressions) || 0,
        clicks: parseInt(item.clicks) || 0,
        ctr: parseFloat(item.ctr) || 0,
        cpc: parseFloat(item.cpc) || 0,
        cpm: parseFloat(item.cpm) || 0,
        spend: parseFloat(item.spend) || 0,
        reach: parseInt(item.reach) || 0,
        frequency: parseFloat(item.frequency) || 0,
        conversions: extractConversions(item.actions),
        cost_per_conversion: extractCostPerConversion(item.cost_per_action_type),
        synced_at: new Date().toISOString()
    }));

    // Upsert (중복 시 업데이트)
    const { error } = await supabase
        .from('meta_reports')
        .upsert(records, { 
            onConflict: 'client_id,campaign_id,date',
            ignoreDuplicates: false 
        });

    if (error) {
        return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({
        success: true,
        message: `${records.length}개의 데이터가 동기화되었습니다.`,
        synced: records.length
    });
}

// 리포트 생성 (PDF용 데이터)
async function generateReport(req, res) {
    const { client_id, start_date, end_date, format } = req.body;
// 5. 환경변수에서 가져오기
if (process.env.META_ACCESS_TOKEN) return process.env.META_ACCESS_TOKEN;

return null;
    if (!client_id) {
        return res.status(400).json({ success: false, error: 'client_id required' });
    }

    // 날짜 범위 설정
    const end = end_date || new Date().toISOString().split('T')[0];
    const start = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 클라이언트 정보 조회
    const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', client_id)
        .single();

    // 리포트 데이터 조회
    const { data: reports } = await supabase
        .from('meta_reports')
        .select('*')
        .eq('client_id', client_id)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true });

    // 캠페인별 요약
    const campaignSummary = summarizeByCampaign(reports);

    // 일별 추이
    const dailyTrend = summarizeByDate(reports);

    // 전체 요약
    const totalSummary = calculateSummary(reports);

    // 전월 대비 변화율
    const previousEnd = new Date(start);
    previousEnd.setDate(previousEnd.getDate() - 1);
    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - 30);

    const { data: previousReports } = await supabase
        .from('meta_reports')
        .select('*')
        .eq('client_id', client_id)
        .gte('date', previousStart.toISOString().split('T')[0])
        .lte('date', previousEnd.toISOString().split('T')[0]);

    const previousSummary = calculateSummary(previousReports || []);
    const changes = calculateChanges(totalSummary, previousSummary);

    const reportData = {
        client: client || { id: client_id },
        dateRange: { start, end },
        summary: totalSummary,
        changes,
        campaigns: campaignSummary,
        dailyTrend,
        generatedAt: new Date().toISOString()
    };

    // 리포트 생성 기록 저장
    await supabase
        .from('report_history')
        .insert({
            client_id,
            start_date: start,
            end_date: end,
            report_data: reportData,
            created_at: new Date().toISOString()
        });

    return res.json({
        success: true,
        report: reportData
    });
}

// Helper Functions

async function getAccessToken(req) {
    // 1. Header에서 가져오기
    const authHeader = req.headers['x-meta-token'];
    if (authHeader) return authHeader;

    // 2. Query에서 가져오기
    if (req.query.access_token) return req.query.access_token;

    // 3. Body에서 가져오기
    if (req.body?.access_token) return req.body.access_token;

    // 4. 클라이언트 ID로 DB에서 조회
    const clientId = req.query.client_id || req.body?.client_id;
    if (clientId) {
        const { data } = await supabase
            .from('meta_connections')
            .select('access_token')
            .eq('client_id', clientId)
            .single();
        
        if (data) return data.access_token;
    }

    return null;
}

function extractConversions(actions) {
    if (!actions) return 0;
    
    const conversionTypes = [
        'purchase',
        'lead',
        'complete_registration',
        'add_to_cart',
        'initiate_checkout'
    ];

    return actions
        .filter(a => conversionTypes.includes(a.action_type))
        .reduce((sum, a) => sum + parseInt(a.value), 0);
}

function extractCostPerConversion(costPerAction) {
    if (!costPerAction) return 0;
    
    const conversionAction = costPerAction.find(a => 
        ['purchase', 'lead', 'complete_registration'].includes(a.action_type)
    );

    return conversionAction ? parseFloat(conversionAction.value) : 0;
}

function extractVideoViews(item) {
    return {
        p25: parseInt(item.video_p25_watched_actions?.[0]?.value) || 0,
        p50: parseInt(item.video_p50_watched_actions?.[0]?.value) || 0,
        p75: parseInt(item.video_p75_watched_actions?.[0]?.value) || 0,
        p100: parseInt(item.video_p100_watched_actions?.[0]?.value) || 0
    };
}

function calculateSummary(reports) {
    if (!reports || reports.length === 0) {
        return {
            impressions: 0,
            clicks: 0,
            spend: 0,
            reach: 0,
            conversions: 0,
            ctr: 0,
            cpc: 0,
            cpm: 0,
            roas: 0
        };
    }

    const totals = reports.reduce((acc, r) => ({
        impressions: acc.impressions + (r.impressions || 0),
        clicks: acc.clicks + (r.clicks || 0),
        spend: acc.spend + (r.spend || 0),
        reach: acc.reach + (r.reach || 0),
        conversions: acc.conversions + (r.conversions || 0)
    }), { impressions: 0, clicks: 0, spend: 0, reach: 0, conversions: 0 });

    return {
        ...totals,
        ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions * 100).toFixed(2) : 0,
        cpc: totals.clicks > 0 ? (totals.spend / totals.clicks).toFixed(0) : 0,
        cpm: totals.impressions > 0 ? (totals.spend / totals.impressions * 1000).toFixed(0) : 0,
        roas: totals.spend > 0 ? ((totals.conversions * 50000) / totals.spend).toFixed(2) : 0 // 가정: 전환당 50,000원
    };
}

function summarizeByCampaign(reports) {
    const campaigns = {};

    reports.forEach(r => {
        if (!campaigns[r.campaign_id]) {
            campaigns[r.campaign_id] = {
                id: r.campaign_id,
                name: r.campaign_name,
                impressions: 0,
                clicks: 0,
                spend: 0,
                conversions: 0
            };
        }
        campaigns[r.campaign_id].impressions += r.impressions || 0;
        campaigns[r.campaign_id].clicks += r.clicks || 0;
        campaigns[r.campaign_id].spend += r.spend || 0;
        campaigns[r.campaign_id].conversions += r.conversions || 0;
    });

    return Object.values(campaigns).map(c => ({
        ...c,
        ctr: c.impressions > 0 ? (c.clicks / c.impressions * 100).toFixed(2) : 0,
        cpc: c.clicks > 0 ? Math.round(c.spend / c.clicks) : 0
    }));
}

function summarizeByDate(reports) {
    const dates = {};

    reports.forEach(r => {
        if (!dates[r.date]) {
            dates[r.date] = {
                date: r.date,
                impressions: 0,
                clicks: 0,
                spend: 0,
                conversions: 0
            };
        }
        dates[r.date].impressions += r.impressions || 0;
        dates[r.date].clicks += r.clicks || 0;
        dates[r.date].spend += r.spend || 0;
        dates[r.date].conversions += r.conversions || 0;
    });

    return Object.values(dates).sort((a, b) => a.date.localeCompare(b.date));
}

function calculateChanges(current, previous) {
    const calc = (curr, prev) => {
        if (!prev || prev === 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / prev * 100).toFixed(1);
    };

    return {
        impressions: calc(current.impressions, previous.impressions),
        clicks: calc(current.clicks, previous.clicks),
        spend: calc(current.spend, previous.spend),
        conversions: calc(current.conversions, previous.conversions),
        ctr: calc(parseFloat(current.ctr), parseFloat(previous.ctr)),
        cpc: calc(parseFloat(current.cpc), parseFloat(previous.cpc))
    };
}
