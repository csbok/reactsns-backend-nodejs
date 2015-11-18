var mysqld	= require('mysql');
var mysqlConfig = require('../config/mysql');
exports.pool = mysqld.createPool(mysqlConfig);
