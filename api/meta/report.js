import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function getAccessToken() {
  try {
    const { data } = await supabase
      .from('settings')
      .select('value, expires_at')
      .eq('key', 'meta_access_token')
      .single();
    
    if (data?.value) {
      if (data.expires_at) {
        const expiresAt = new Date(data.expires_at);
        const daysLeft = Math.floor((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 7) {
          console.warn(`토큰 만료 ${daysLeft}일 남음!`);
        }
      }
      return data.value;
    }
  } catch (e) {
    console.log('DB 토큰 조회 실패, 환경변수 사용');
  }
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
      const days = parseInt(req.query.days) || 7;
      return await getDailyInsights(req.query.campaign_id, accessToken, days, res);
    }

    if (action === 'demographics' && req.query.campaign_id) {
      return await getDemographics(req.query.campaign_id, accessToken, res);
    }

    if (action === 'accounts') {
      return await getAdAccounts(accessToken, res);
    }

    return res.status(400).json({ success: false, error: 'Invalid action' });

  } catch (error) {
    console.error('Meta API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function getCampaignInsights(accountId, accessToken, res) {
  const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  const timeRange = JSON.stringify({
    since: startDate.toISOString().split('T')[0],
    until: endDate.toISOString().split('T')[0]
  });

  const fields = [
    'campaign_id', 'campaign_name', 'impressions', 'clicks', 'ctr', 'cpc', 'cpm',
    'spend', 'reach', 'frequency', 'actions', 'cost_per_action_type',
    'video_p25_watched_actions', 'video_p50_watched_actions',
    'video_p75_watched_actions', 'video_p100_watched_actions'
  ].join(',');

  const url = `https://graph.facebook.com/v18.0/${formattedAccountId}/insights?level=campaign&fields=${fields}&time_range=${encodeURIComponent(timeRange)}&access_token=${accessToken}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    return res.status(400).json({ success: false, error: data.error.message });
  }

  const insights = (data.data || []).map(item => {
    let conversions = 0, costPerConversion = 0;
    
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
    dateRange: { start: startDate.toISOString().split('T')[0], end: endDate.toISOString().split('T')[0] },
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

  return res.status(200).json({ success: true, accounts: data.data || [] });
}

async function getDailyInsights(campaignId, accessToken, days, res) {
  const endDate = new Date();
  const startDate = new Date();
  
  // days가 0이면 전체 기간 (캠페인 시작부터)
  if (days === 0) {
    startDate.setFullYear(2020, 0, 1); // 충분히 과거로 설정
  } else {
    startDate.setDate(startDate.getDate() - (days - 1));
  }
  
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
      const lpv = item.actions.find(a => a.action_type === 'landing_page_view');
      conversions = parseInt(lpv?.value || 0);
    }
    return {
      date: item.date_start,
      impressions: parseInt(item.impressions || 0),
      clicks: parseInt(item.clicks || 0),
      reach: parseInt(item.reach || 0),
      conversions
    };
  });

  return res.status(200).json({ success: true, days, dailyData });
}

async function getDemographics(campaignId, accessToken, res) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  const timeRange = JSON.stringify({
    since: startDate.toISOString().split('T')[0],
    until: endDate.toISOString().split('T')[0]
  });

  const genderUrl = `https://graph.facebook.com/v18.0/${campaignId}/insights?fields=impressions&time_range=${encodeURIComponent(timeRange)}&breakdowns=gender&access_token=${accessToken}`;
  const ageUrl = `https://graph.facebook.com/v18.0/${campaignId}/insights?fields=impressions&time_range=${encodeURIComponent(timeRange)}&breakdowns=age&access_token=${accessToken}`;

  try {
    const [genderRes, ageRes] = await Promise.all([fetch(genderUrl), fetch(ageUrl)]);
    const genderData = await genderRes.json();
    const ageData = await ageRes.json();

    // 성별 파싱
    let gender = { male: 0, female: 0, malePercent: 50, femalePercent: 50 };
    if (genderData.data && genderData.data.length > 0) {
      let total = 0;
      genderData.data.forEach(item => {
        const imp = parseInt(item.impressions || 0);
        total += imp;
        if (item.gender === 'male') gender.male = imp;
        else if (item.gender === 'female') gender.female = imp;
      });
      if (total > 0) {
        gender.malePercent = Math.round((gender.male / total) * 100);
        gender.femalePercent = Math.round((gender.female / total) * 100);
      }
    }

    // 연령 파싱
    let age = {};
    let ageTotal = 0;
    if (ageData.data && ageData.data.length > 0) {
      ageData.data.forEach(item => {
        const imp = parseInt(item.impressions || 0);
        ageTotal += imp;
        age[item.age] = { count: imp, percent: 0 };
      });
      if (ageTotal > 0) {
        Object.keys(age).forEach(key => {
          age[key].percent = Math.round((age[key].count / ageTotal) * 100);
        });
      }
    }

    return res.status(200).json({ success: true, gender, age });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
}