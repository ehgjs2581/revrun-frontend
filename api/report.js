import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

function parseCookies(cookieHeader) {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      cookies[name] = value;
    });
  }
  return cookies;
}

async function getCampaignName(campaignId) {
  if (!campaignId || !META_ACCESS_TOKEN) return null;

  try {
    const url = `https://graph.facebook.com/v18.0/${campaignId}?fields=name&access_token=${META_ACCESS_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.name || null;
  } catch (err) {
    console.error('Campaign name error:', err);
    return null;
  }
}

async function getMetaInsights(campaignId) {
  if (!campaignId || !META_ACCESS_TOKEN) return null;

  try {
    const url = `https://graph.facebook.com/v18.0/${campaignId}/insights?fields=impressions,reach,spend,actions&access_token=${META_ACCESS_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.data && data.data.length > 0) {
      return data.data[0];
    }
    return null;
  } catch (err) {
    console.error('Meta API error:', err);
    return null;
  }
}

function formatNumber(num) {
  return Number(num).toLocaleString('ko-KR');
}

function formatCurrency(num) {
  return '₩' + Number(num).toLocaleString('ko-KR');
}

function getActionValue(actions, type) {
  if (!actions) return '0';
  const action = actions.find(a => a.action_type === type);
  return action ? action.value : '0';
}

// 캠페인명에서 업체명 추출 (예: "원드베이크샵 리얼" -> "원드베이크샵")
function extractBusinessName(campaignName) {
  if (!campaignName) return '고객';
  // 첫 번째 단어만 추출 (공백 기준)
  const firstWord = campaignName.split(' ')[0];
  // 날짜 패턴 제거 (예: 20251219)
  if (/^\d{8}/.test(firstWord)) {
    const parts = campaignName.split(' ');
    return parts[1] || '고객';
  }
  return firstWord;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', 'https://revrun.co.kr');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const cookies = parseCookies(req.headers.cookie);
    const userId = cookies.session;

    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Not authenticated' });
    }

    // 사용자 정보 가져오기
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, campaign_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    // 캠페인명 가져오기
    const campaignName = await getCampaignName(user.campaign_id);
    const businessName = user.name || extractBusinessName(campaignName) || '고객';

    // Meta API에서 데이터 가져오기
    const metaData = await getMetaInsights(user.campaign_id);

    if (!metaData) {
      return res.status(200).json({
        ok: true,
        report: {
          clientName: businessName,
          period: '최근 30일',
          reach: '0',
          impressions: '0',
          spend: '₩0',
          engagement: '0',
          videoViews: '0',
          linkClicks: '0',
          landingPageViews: '0',
          highlights: ['데이터를 불러오는 중입니다.'],
          actions: ['캠페인이 연결되지 않았습니다.']
        }
      });
    }

    // Meta 데이터 가공
    const impressions = formatNumber(metaData.impressions || 0);
    const reach = formatNumber(metaData.reach || 0);
    const spend = formatCurrency(metaData.spend || 0);
    const engagement = formatNumber(getActionValue(metaData.actions, 'post_engagement'));
    const videoViews = formatNumber(getActionValue(metaData.actions, 'video_view'));
    const linkClicks = formatNumber(getActionValue(metaData.actions, 'link_click'));
    const landingPageViews = formatNumber(getActionValue(metaData.actions, 'landing_page_view'));

    // 하이라이트 자동 생성
    const highlights = [];
    if (Number(metaData.reach) > 1000) {
      highlights.push(`${reach}명에게 광고가 도달했습니다.`);
    }
    if (Number(getActionValue(metaData.actions, 'video_view')) > 100) {
      highlights.push(`영상이 ${videoViews}회 조회되었습니다.`);
    }
    if (Number(getActionValue(metaData.actions, 'link_click')) > 50) {
      highlights.push(`${linkClicks}명이 링크를 클릭했습니다.`);
    }
    if (highlights.length === 0) {
      highlights.push('광고가 정상적으로 운영되고 있습니다.');
    }

    // 개선점 자동 생성
    const actionItems = [];
    const ctr = (Number(getActionValue(metaData.actions, 'link_click')) / Number(metaData.impressions) * 100);
    if (ctr < 1) {
      actionItems.push('클릭률 개선을 위해 광고 소재 변경을 고려해보세요.');
    }
    if (Number(getActionValue(metaData.actions, 'landing_page_view')) < Number(getActionValue(metaData.actions, 'link_click')) * 0.5) {
      actionItems.push('랜딩페이지 로딩 속도를 확인해보세요.');
    }
    if (actionItems.length === 0) {
      actionItems.push('현재 광고 성과가 양호합니다. 유지하세요!');
    }

    return res.status(200).json({
      ok: true,
      report: {
        clientName: businessName,
        period: `${metaData.date_start} ~ ${metaData.date_stop}`,
        reach: reach,
        impressions: impressions,
        spend: spend,
        engagement: engagement,
        videoViews: videoViews,
        linkClicks: linkClicks,
        landingPageViews: landingPageViews,
        highlights: highlights,
        actions: actionItems
      }
    });

  } catch (err) {
    console.error('Report error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
}