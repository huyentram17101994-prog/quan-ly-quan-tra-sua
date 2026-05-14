const express = require("express");
const router = express.Router();
const { sql, config } = require("../db");


// XEM HÓA ĐƠN
router.get("/view", (req, res) => {
    if (!req.session.MaHD) {
        return res.send("Chưa có hóa đơn!");
    }

    res.redirect("/orders/" + req.session.MaHD);
});

//Tạo hóa đơn
router.post("/create", async (req, res) => {
    console.log(req.session.user); 
    const pool = await sql.connect(config);

    const MaKH = req.body.MaKH || 1; // nếu không chọn thì khách lẻ
    const MaNV = req.session.user.MaNV; // lấy từ login

    const result = await pool.request()
        .input("MaKH", sql.Int, MaKH)
        .input("MaNV", sql.Int, MaNV)
        .execute("sp_TaoHoaDon");

    const MaHD = result.recordset[0].MaHD;

    req.session.MaHD = MaHD;

    req.session.message = "✅ Tạo hóa đơn thành công! Mã HD: " + MaHD;

    req.session.save(() => {
        res.redirect("/products");
    });
});

// THÊM SẢN PHẨM
router.get("/add/:MaSP", async (req, res) => {
    const MaHD = req.session.MaHD;
    const MaSP = req.params.MaSP;

    if (!MaHD) return res.send("Chưa có hóa đơn!");

    const pool = await sql.connect(config);

    await pool.request()
        .input("MaHD", sql.Int, MaHD)
        .input("MaSP", sql.Int, MaSP)
        .input("SoLuong", sql.Int, 1)
        .execute("sp_ThemChiTietHoaDon"); // 🔥 dùng SP

    // ✅ QUAY LẠI TRANG HÓA ĐƠN HIỆN TẠI
    res.redirect("/orders/" + MaHD);
});
// HỦY HÓA ĐƠN
router.get("/cancel/:id", async (req, res) => {

    const MaHD = req.params.id;

    const pool = await sql.connect(config);

    await pool.request()
        .input("MaHD", sql.Int, MaHD)
        .execute("sp_HuyHoaDon");

    // xóa session hóa đơn hiện tại
    req.session.MaHD = null;

    req.session.message = "❌ Hóa đơn đã được hủy!";

    req.session.save(() => {
        res.redirect("/products");
    });

});
// MÀN HÌNH THANH TOÁN
router.post("/pay", async (req, res) => {

    const MaHD = req.session.MaHD;

    if (!MaHD) {
        return res.send("Chưa có hóa đơn!");
    }

    const pool = await sql.connect(config);

    // Lấy hóa đơn
    const hd = await pool.request()
        .input("MaHD", sql.Int, MaHD)
        .query(`
                SELECT 
                    hd.*,

                    nv.TenNV AS TenNhanVien,

                    kh.TenKH AS TenKhachHang,
                    kh.SDT AS SDTKhachHang

                FROM HoaDon hd

                JOIN NhanVien nv 
                ON hd.MaNV = nv.MaNV

                JOIN KhachHang kh
                ON hd.MaKH = kh.MaKH

                WHERE hd.MaHD = @MaHD
            `);

    // Lấy chi tiết hóa đơn
    const ct = await pool.request()
        .input("MaHD", sql.Int, MaHD)
        .query(`
            SELECT ct.*, sp.TenSP
            FROM ChiTietHoaDon ct
            JOIN SanPham sp ON ct.MaSP = sp.MaSP
            WHERE ct.MaHD = @MaHD
        `);
    console.log(hd.recordset[0]);
    res.render("payment", {
        hoadon: hd.recordset[0],
        chitiet: ct.recordset
    });

});
// XÁC NHẬN THANH TOÁN
router.post("/confirm-payment", async (req, res) => {

    const MaHD = req.session.MaHD;

    const pool = await sql.connect(config);

    await pool.request()
        .input("MaHD", sql.Int, MaHD)
        .execute("sp_ThanhToanHoaDon");

    req.session.message = "✅ Hóa đơn đã thanh toán!";

    req.session.MaHD = null;

    req.session.save(() => {
        res.redirect("/products");
    });

});
// HIỂN THỊ CHI TIẾT
router.get("/:id", async (req, res) => {
    const MaHD = req.params.id;

    const pool = await sql.connect(config);

    const sp = await pool.request().query("SELECT * FROM SanPham");

    const ct = await pool.request()
        .input("MaHD", sql.Int, MaHD)
        .query(`
            SELECT ct.*, sp.TenSP
            FROM ChiTietHoaDon ct
            JOIN SanPham sp ON ct.MaSP = sp.MaSP
            WHERE MaHD=@MaHD
        `);

    res.render("order", {
        MaHD,
        sanpham: sp.recordset,
        chitiet: ct.recordset
    });
});
// ❌ XÓA SẢN PHẨM KHỎI HÓA ĐƠN
router.get("/delete/:MaHD/:MaSP", async (req, res) => {
    const { MaHD, MaSP } = req.params;

    const pool = await sql.connect(config);

    await pool.request()
        .input("MaHD", sql.Int, MaHD)
        .input("MaSP", sql.Int, MaSP)
        .query(`
            DELETE FROM ChiTietHoaDon
            WHERE MaHD=@MaHD AND MaSP=@MaSP
        `);

    res.redirect("/orders/" + MaHD);
});

module.exports = router;