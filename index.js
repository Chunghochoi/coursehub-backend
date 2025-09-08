const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Dữ liệu người dùng mẫu (thay thế bằng database trong thực tế)
const users = {
  'chungdayy2006@gmail.com': { id: 'admin', username: 'admindeptrai', role: 'ADMIN' },
  'user@gmail.com': { id: 'chung', username: 'ChungHo', role: 'MEMBER' }
};

// Middlewares
app.use(cors());
app.use(express.json());

// API: Lấy danh sách khóa học
app.get('/api/courses', (req, res) => {
  const coursesPath = path.join(__dirname, 'courses.json');
  fs.readFile(coursesPath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
    res.json(JSON.parse(data));
  });
});

// API: Đăng nhập
app.post('/api/login', (req, res) => {
  const { email } = req.body;
  const user = users[email];

  if (user) {
    res.json({ success: true, message: 'Đăng nhập thành công!', user });
  } else {
    res.status(401).json({ success: false, message: 'Email không tồn tại hoặc sai.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server đang chạy tại http://localhost:${PORT}`);
});