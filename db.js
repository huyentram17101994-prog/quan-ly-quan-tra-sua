const sql = require("mssql");

const config = {
    user: "sa",
    password: "123456",  
    server: "HuyenTram",            
    database: "QuanLyTraSua",
    options: {
        trustServerCertificate: true
    }
};

module.exports = { sql, config };