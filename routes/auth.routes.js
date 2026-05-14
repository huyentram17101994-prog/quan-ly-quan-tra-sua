const express = require("express");
const router = express.Router();
const { sql, config } = require("../db");

// MỞ TRANG LOGIN
router.get("/", (req, res) => {
    res.render("login");
});

// XỬ LÝ LOGIN
router.post("/login", async (req, res) => {

    const { username, password } = req.body;

    const pool = await sql.connect(config);

    const result = await pool.request()
        .input("Username", sql.NVarChar, username)
        .input("Password", sql.NVarChar, password)
        .query(`
            SELECT tk.*, nv.MaNV
            FROM TaiKhoan tk
            LEFT JOIN NhanVien nv ON tk.MaTK = nv.MaTK
            WHERE tk.Username=@Username 
            AND tk.Password=@Password
        `);

    if (result.recordset.length > 0) {

        req.session.user = {
            Username: result.recordset[0].Username,
            Role: result.recordset[0].Role,
            MaNV: result.recordset[0].MaNV
        };

        res.redirect("/products");

    } else {
        res.send("Sai tài khoản hoặc mật khẩu");
    }
});

module.exports = router;