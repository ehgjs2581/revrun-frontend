import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// DB 또는 환경변수에서 토큰 가져오기
async function getAccessToken() {
  // 먼저 DB에서 가져오기 시도
  try {
    const { data } = await supabase
      .from('settings')
      .select('value, expires_at')
      .eq('key', 'meta_access_token')
      .single();
    
    if (data?.value) {
      // 만료 체크 (7일 전이면 경고)
      if (data.expires_at) {
        const expiresAt = new Date(data.expires_at);
        const daysLeft = Math.floor((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 7) {
          console.warn(`토큰 만료 ${daysLeft}일 남음! 갱신 필요`);
        }
      }
      return data.value;
    }
  } catch (e) {
    console.log('DB에서 토큰 조회 실패, 환경변수 사용');
  }
  
  // DB에 없으면 환경변수 사용
  return process.env.META_ACCESS_TOKEN;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const { action, account_id } = req.query;
  
  try {
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      return res.status(500).json({ success: false, error: 'Meta access token not configured' });
    }

    if (action === 'insights' && account_id) {
      return await getCampaignInsights(account_id, accessToken, res);
    }

    if (action === 'daily' && req.query.campaign_id) {
      return await getDailyInsights(req.query.campaign_id, accessToken, res);
    }

    if (action === 'accounts') {
      return await getAdAccounts(accessToken, res);
    }

    return res.status(400).json({ success: false, error: 'Invalid action. Use action=insights&account_id=xxx or action=daily&campaign_id=xxx or action=accounts' });

  } catch (error) {
    console.error('Meta API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function getCampaignInsights(accountId, accessToken, res) {
  const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
  
  // 최근 30일
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  const timeRange = JSON.stringify({
    since: startDate.toISOString().split('T')[0],
    until: endDate.toISOString().split('T')[0]
  });

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

  const url = `https://graph.facebook.com/v18.0/${formattedAccountId}/insights?level=campaign&fields=${fields}&time_range=${encodeURIComponent(timeRange)}&access_token=${accessToken}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    return res.status(400).json({ success: false, error: data.error.message });
  }

  const insights = (data.data || []).map(item => {
    // 전환 수 계산 (랜딩페이지 조회 등)
    let conversions = 0;
    let costPerConversion = 0;
    
    if (item.actions) {
      const landingPageView = item.actions.find(a => a.action_type === 'landing_page_view');
      const linkClick = item.actions.find(a => a.action_type === 'link_click');
      conversions = parseInt(landingPageView?.value || linkClick?.value || 0);
    }
    
    if (item.cost_per_action_type) {
      const costPerLanding = item.cost_per_action_type.find(a => a.action_type === 'landing_page_view');
      const costPerClick = item.cost_per_action_type.find(a => a.action_type === 'link_click');
      costPerConversion = parseFloat(costPerLanding?.value || costPerClick?.value || 0);
    }

    return {
      campaignId: item.campaign_id,
      campaignName: item.campaign_name,
      impressions: parseInt(item.impressions || 0),
      clicks: parseInt(item.clicks || 0),
      ctr: parseFloat(item.ctr || 0),
      cpc: parseFloat(item.cpc || 0),
      cpm: parseFloat(item.cpm || 0),
      spend: parseFloat(item.spend || 0),
      reach: parseInt(item.reach || 0),
      frequency: parseFloat(item.frequency || 0),
      conversions,
      costPerConversion,
      videoViews: {
        p25: parseInt(item.video_p25_watched_actions?.[0]?.value || 0),
        p50: parseInt(item.video_p50_watched_actions?.[0]?.value || 0),
        p75: parseInt(item.video_p75_watched_actions?.[0]?.value || 0),
        p100: parseInt(item.video_p100_watched_actions?.[0]?.value || 0)
      }
    };
  });

  return res.status(200).json({
    success: true,
    dateRange: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    },
    insights
  });
}

async function getAdAccounts(accessToken, res) {
  const url = `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name&access_token=${accessToken}`;
  
  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    return res.status(400).json({ success: false, error: data.error.message });
  }

  return res.status(200).json({
    success: true,
    accounts: data.data || []
  });
}

async function getDailyInsights(campaignId, accessToken, res) {
  // 최근 7일
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 6);
  
  const timeRange = JSON.stringify({
    since: startDate.toISOString().split('T')[0],
    until: endDate.toISOString().split('T')[0]
  });

  const fields = 'impressions,clicks,reach,actions';
  const url = `https://graph.facebook.com/v18.0/${campaignId}/insights?fields=${fields}&time_range=${encodeURIComponent(timeRange)}&time_increment=1&access_token=${accessToken}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    return res.status(400).json({ success: false, error: data.error.message });
  }

  const dailyData = (data.data || []).map(item => {
    let conversions = 0;
    if (item.actions) {
      const landingPageView = item.actions.find(a => a.action_type === 'landing_page_view');
      conversions = parseInt(landingPageView?.value || 0);
    }
    
    return {
      date: item.date_start,
      impressions: parseInt(item.impressions || 0),
      clicks: parseInt(item.clicks || 0),
      reach: parseInt(item.reach || 0),
      conversions
    };
  });

  return res.status(200).json({
    success: true,
    dailyData
  });
}

async function getDailyInsights(campaignId, accessToken, res) {
  // 최근 7일
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 6);
  
  const timeRange = JSON.stringify({
    since: startDate.toISOString().split('T')[0],
    until: endDate.toISOString().split('T')[0]
  });

  const fields = 'impressions,clicks,reach,actions';
  const url = `https://graph.facebook.com/v18.0/${campaignId}/insights?fields=${fields}&time_range=${encodeURIComponent(timeRange)}&time_increment=1&access_token=${accessToken}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    return res.status(400).json({ success: false, error: data.error.message });
  }

  const dailyData = (data.data || []).map(item => {
    let conversions = 0;
    if (item.actions) {
      const landingPageView = item.actions.find(a => a.action_type === 'landing_page_view');
      conversions = parseInt(landingPageView?.value || 0);
    }
    
    return {
      date: item.date_start,
      impressions: parseInt(item.impressions || 0),
      clicks: parseInt(item.clicks || 0),
      reach: parseInt(item.reach || 0),
      conversions
    };
  });

  return res.status(200).json({
    success: true,
    dailyData
  });
}