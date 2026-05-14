const express = require("express");
const router = express.Router();
const { sql, config } = require("../db");

function checkAuth(req, res, next) {
    if (!req.session.user) return res.redirect("/");
    next();
}

// HIỂN THỊ
router.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});
router.get("/", checkAuth, async (req, res) => {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT * FROM SanPham");

    res.render("products", {
        products: result.recordset, // ✔ đúng
        user: req.session.user,
        message: req.session.message
    });

    req.session.message = null; // ✔ reset sau khi hiển thị
});

// THÊM
router.post("/add", checkAuth, async (req, res) => {
    if (req.session.user.Role !== "Admin")
        return res.send("Không có quyền");

    const { TenSP, DonGia, MaDM, HinhAnh } = req.body;
    const pool = await sql.connect(config);
    
    await pool.request()
        .input("TenSP", sql.NVarChar, TenSP)
        .input("DonGia", sql.Decimal(10,2), DonGia)
        .input("MaDM", sql.Int, MaDM)
        .input("HinhAnh", sql.NVarChar, HinhAnh)
        .query(`
        INSERT INTO SanPham (TenSP, DonGia, MaDM, HinhAnh)
        VALUES (@TenSP, @DonGia, @MaDM, @HinhAnh)
    `);

    res.redirect("/products");
});

// XÓA
router.get("/delete/:id", checkAuth, async (req, res) => {
    if (req.session.user.Role !== "Admin")
        return res.send("Không có quyền");

    const pool = await sql.connect(config);
    await pool.request()
        .input("id", sql.Int, req.params.id)
        .query("DELETE FROM SanPham WHERE MaSP=@id");

    res.redirect("/products");
});
// FORM SỬA
router.get("/edit/:id", checkAuth, async (req, res) => {
        if (req.session.user.Role !== "Admin")
        return res.send("Không có quyền sửa!");
    const pool = await sql.connect(config);

    const result = await pool.request()
        .input("id", sql.Int, req.params.id)
        .query("SELECT * FROM SanPham WHERE MaSP=@id");

    res.render("edit-product", {
        sp: result.recordset[0]
    });
});
// CẬP NHẬT
router.post("/update/:id", checkAuth, async (req, res) => {
    if (req.session.user.Role !== "Admin")
        return res.send("Không có quyền cập nhật!");
    const { TenSP, DonGia } = req.body;

    const pool = await sql.connect(config);

    await pool.request()
        .input("id", sql.Int, req.params.id)
        .input("TenSP", sql.NVarChar, TenSP)
        .input("DonGia", sql.Decimal(10,2), DonGia)
        .query(`
            UPDATE SanPham
            SET TenSP=@TenSP,
                DonGia=@DonGia
            WHERE MaSP=@id
        `);

    res.redirect("/products");
});
module.exports = router;