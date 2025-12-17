require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase 클라이언트
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/report", express.static(path.join(__dirname, "public", "report")));
app.use("/admin", express.static(path.join(__dirname, "public", "admin")));

// 테스트 라우트
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "report", "login.html"));
});


// 고객 목록 조회
app.get('/api/customers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 고객 추가
app.post('/api/customers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([req.body])
      .select();
    
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 로그인
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();
    
    if (error || !data) {
      return res.status(401).json({ error: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }
    
    res.json({ success: true, customer: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});