const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- DỮ LIỆU MẪU (DATABASE GIẢ LẬP) ---
// Trong thực tế, bạn nên sử dụng cơ sở dữ liệu như MongoDB hoặc PostgreSQL.
const db = {
    users: {
        'admin@coursehub.com': { id: 'admin01', username: 'Admin', role: 'ADMIN' },
        'subadmin@coursehub.com': { id: 'subadmin01', username: 'Phó Admin', role: 'SUB_ADMIN' },
        'chung@coursehub.com': { id: 'user01', username: 'ChungHo', role: 'MEMBER' },
        'user2@coursehub.com': { id: 'user02', username: 'User2', role: 'MEMBER' }
    },
    courses: require('./courses.json') // Tải khóa học từ file JSON
};

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json()); // Cho phép server đọc dữ liệu JSON từ request

// Hàm trợ giúp để lưu dữ liệu vào file courses.json
const saveCoursesToFile = () => {
    fs.writeFile(path.join(__dirname, 'courses.json'), JSON.stringify(db.courses, null, 2), (err) => {
        if (err) console.error('Lỗi khi ghi file courses.json:', err);
    });
};

// --- API ENDPOINTS ---

// [GET] Lấy danh sách tất cả người dùng (chỉ dành cho Admin)
app.get('/api/users', (req, res) => {
    // Trong thực tế, cần có xác thực token của admin
    res.json(Object.values(db.users)); // Trả về một mảng các đối tượng user
});

// [GET] Lấy danh sách tất cả khóa học
app.get('/api/courses', (req, res) => {
    res.json(db.courses);
});

// [POST] Đăng tải một khóa học mới
app.post('/api/courses', (req, res) => {
    const { title, link, category, ownerId, ownerUsername } = req.body;

    if (!title || !link || !category || !ownerId || !ownerUsername) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
    }

    const newCourse = {
        id: Date.now(), // Tạo ID duy nhất dựa trên thời gian
        ownerId,
        ownerUsername,
        title,
        author: ownerUsername, // Mặc định tác giả là người đăng
        views: 0,
        category,
        icon: "fas fa-book", // Icon mặc định
        link
    };

    db.courses.push(newCourse);
    saveCoursesToFile(); // Lưu vào file
    res.status(201).json(newCourse); // Trả về khóa học vừa tạo
});

// [DELETE] Xóa một khóa học
app.delete('/api/courses/:id', (req, res) => {
    const courseId = parseInt(req.params.id, 10);
    const { userId, userRole } = req.body; // Lấy thông tin người thực hiện hành động

    const courseIndex = db.courses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) {
        return res.status(404).json({ message: 'Không tìm thấy khóa học.' });
    }

    const courseToDelete = db.courses[courseIndex];
    const targetOwner = db.users[Object.keys(db.users).find(key => db.users[key].id === courseToDelete.ownerId)];
    const targetOwnerRole = targetOwner ? targetOwner.role : 'MEMBER';


    // Logic phân quyền xóa
    let canDelete = false;
    if (userRole === 'ADMIN') {
        canDelete = true; // Admin có thể xóa mọi thứ
    } else if (userRole === 'SUB_ADMIN' && targetOwnerRole !== 'ADMIN') {
        canDelete = true; // Phó Admin có thể xóa của thành viên và của Phó Admin khác
    } else if (courseToDelete.ownerId === userId) {
        canDelete = true; // Người dùng có thể tự xóa khóa học của mình
    }

    if (canDelete) {
        db.courses.splice(courseIndex, 1);
        saveCoursesToFile();
        res.status(200).json({ message: 'Đã xóa khóa học thành công.' });
    } else {
        res.status(403).json({ message: 'Bạn không có quyền xóa khóa học này.' });
    }
});

// [PUT] Thăng cấp một thành viên lên Phó Admin
app.put('/api/users/:id/promote', (req, res) => {
    const { adminId, adminRole } = req.body;
    const targetUserId = req.params.id;

    // Chỉ Admin mới có quyền thăng cấp
    if (adminRole !== 'ADMIN') {
        return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này.' });
    }

    const targetUserEmail = Object.keys(db.users).find(key => db.users[key].id === targetUserId);
    if (!targetUserEmail) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }
    
    // Thực hiện thăng cấp
    db.users[targetUserEmail].role = 'SUB_ADMIN';
    res.status(200).json({ message: `Đã thăng cấp ${db.users[targetUserEmail].username} thành Phó Admin.` });
});


// [POST] Đăng nhập
app.post('/api/login', (req, res) => {
    const { email } = req.body;
    const user = db.users[email];
    if (user) {
        res.json({ success: true, user });
    } else {
        res.status(401).json({ success: false, message: 'Email không tồn tại.' });
    }
});


// --- KHỞI ĐỘNG SERVER ---
app.listen(PORT, () => {
    console.log(`Backend server đang chạy tại http://localhost:${PORT}`);
});
