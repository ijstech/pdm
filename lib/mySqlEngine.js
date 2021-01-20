const Uuid = require('uuid');
const Mysql = require('mysql')
const TSQLEngine = require('./sqlEngine');

module.exports = (function(){
	TMySQLEngine = TSQLEngine.extend({
		create: function(options){
            var engine  = Mysql.createConnection({
				host: options.host,
				user: options.user,
				database: options.database,
				password: options.password
			});			
            this.inherited(options);            
			this.engine = engine;
		},
		_applyDelete: function(query, callback){
			var table = query.table;
			var fields = query.fields;
			var records = query.deleteRecords || [];
			var where = ' WHERE ';
			
			if (!records || records.length == 0){
				callback();
				return;
			}
			var keyFields = [];
			var result = []
			var self = this;
			var sql = ''
			for (var i = 0; i < fields.length; i ++){
				var field = fields[i];
				if (field.keyField)
					keyFields.push(field.fieldName);
			}
			function _applySQL(records, idx){
				var idx = idx || 0;
				if (records.length > idx)
					var item = records[idx]
				if (item){
					var keyValues = [];
					for (var k = 0; k < keyFields.length; k ++){
						keyValues.push(item['$' + keyFields[k]] || item[keyFields[k]]);
					}						
					self.engine.query(sql, keyValues, function(err){
						if (err)
							return callback(err)
						else{
							self._insertAuditTrail('delete', table, fields, where, keyValues, function(){
								_applySQL(records, idx + 1);
							})
						}						
					});
				}
				else
					callback()
			}
			if (keyFields.length > 0){
				var sql = 'DELETE FROM `' + table + '` WHERE ('
				for (var k = 0; k < keyFields.length; k ++){
					if (k == 0){
						sql = sql + '`' + keyFields[k] + '`=?'
						where += '`' + keyFields[k] + '`=?'
					}
					else{
						sql = sql + ' AND `' + keyFields[k] + '`=?'
						where += 'AND `' + keyFields[k] + '`=?'
					}							
				}
				var sql = sql + ')';
				if (query.lockField)
					sql = sql + ' AND (IFNULL(`' + query.lockField + '`,0) = 0)'
				_applySQL(records)
			}
			else
				callback()
		},
		_applyInsert: function(query, callback){
			if (!this.modifyDate)
				this.modifyDate = this.formatDateTime();
			if (this.account)
				var userID = this.account.id;			
			var table = query.table;
			var fields = {};
			for (var i = 0; i < query.fields.length; i++){
				fields[query.fields[i].fieldName] = query.fields[i]
			}
			// var fields = query.fields;
			var records = query.insertRecords || [];
			if (records.length == 0){
				callback();
				return;
			}
			var self = this;
			function _applySQL(records, idx){
				var idx = idx || 0;
				if (records.length > idx)
					var item = records[idx]
				if (item){
					var col = '';
					var value = '';
					var values = [];
					for (var n in item){
						if (n != '_uid' && fields[n]){
							var v  = item[n]
							if (fields[n].fieldType == self.FieldType.sftBoolean && typeof(v) == 'string')
								v = v == 'true'
							if (col == ''){
								col = '`' + n + '`';
								value = '?'
								values.push(v); 
							}
							else{
								col = col + ',`' + n + '`';
								value = value +',?'
								values.push(v)
							}
						} 
					}			
					var sql = 'INSERT INTO `' + table + '` (' + col + ') VALUES(' + value + ')';										
					var sqlAudit = 'INSERT INTO `$' + table + '` (`$id`,`$action`,`$date`,`$user`,' + 
						col + ') VALUES("' + Uuid.v4() + '","insert","' + self.modifyDate + '","' + userID + '",' + value + ')'					
					self.engine.query(sql, values, function(err){						
						if (err)
							return callback(err)
						self.engine.query(sqlAudit, values, function(){
							_applySQL(records, idx+1);
						})
					});
				}
				else
					callback()
			}
			_applySQL(records)
		},
		insert: function(table, data){
			var fields = '';
			var values = [];
			var params = '';
			for (var v in data){
				if (fields){
					fields += ',`' + v + '`'
					params += ',?'
				}
				else{	
					fields = '`' + v + '`'
					params = '?'
				}
				values.push(data[v])
			}
			var sql = 'insert into `' + table + '` (' + fields + ') values (' + params + ')';
			this.engine.query(sql, values, function(){});
		},
		_insertAuditTrail: function(action, table, fields, where, keyValues, callback){			
			if (!this.modifyDate)
				this.modifyDate = this.formatDateTime();
			if (this.account)
				var userID = this.account.id
			else
				var userID = '';			
			var sql = 'INSERT INTO `$' + table + '` (`$id`,`$action`,`$date`,`$user`';
			for (var i = 0; i < fields.length; i++)
				sql += ',`' + fields[i].fieldName + '`'
			sql += ') SELECT "' + Uuid.v4() + '","' + action + '","' + this.modifyDate + '","' + userID + '"';
			for (var i = 0; i < fields.length; i++)
				sql += ',`' + fields[i].fieldName + '` '
			sql += ' FROM `' + table + '` ' + where
			this.engine.query(sql, keyValues, callback || function(){}); 	 
		},
		_applyUpdate: function(query, callback){						
			var table = query.table;
			// var fields = query.fields;
			var fields = {};
			for (var i = 0; i < query.fields.length; i++){
				fields[query.fields[i].fieldName] = query.fields[i]
			}
			var records = query.updateRecords || [];
			if (records.length == 0){
				callback();
				return;
			}		
			var skipFields = ['_uid']
			for (var v in fields){
				var field = fields[v];
				if (field.fieldType == 8){ //{createBy}
					skipFields.push(field.fieldName)
				} 
				else if (field.fieldType == 9){ // {createDate}
					skipFields.push(field.fieldName)
				}
			}
			var self = this;
			var where = '';
			for (var v in fields){
				var field = fields[v];
				if (field.keyField){
					if (where == '')
						where = ' WHERE (`' + field.fieldName + '`=?'
					else
						where = where + ' AND `' + field.fieldName + '`=?'
				}
			}
			
			if (!where)
				return callback()
			where = where + ')';
			if (query.conflictResolution == 2 && query.modifyDateField) //first writer wins
				where = where + ' AND (`' + query.modifyDateField + '`=?)'
			if (query.lockField)
				where = where + ' AND (IFNULL(`' + query.lockField + '`,0) = 0)'
			
			function _applySQL(records, idx){
				var idx = idx || 0;
				if (records.length > idx)
					var item = records[idx]
				if (item){
					var updateValues = [];									
					var keyValues = [];
					for (var v in fields){
						var field = fields[v];
						if (field.keyField)													
							keyValues.push(item['$' + field.fieldName] || item[field.fieldName])
					}
					var values = Object.keys(item);
					if (query.conflictResolution == 2 && query.modifyDateField)
						keyValues.push(item[query.modifyDateField])
												
					var value = '';
					var updatedFields = [];					
					for (var k = 0; k < values.length; k ++){
						var n = values[k]
						if (fields[n] && skipFields.indexOf(n) < 0){
							updatedFields.push({fieldName: n})
							if (value == ''){
								value = ' SET `' + n + '`=?' 
							}
							else{
								value = value + ',`' + n + '`=?'
							}	
							if (query.modifyDateField == n)
								updateValues.push(query.modifyDateValue)
							else{
								var v  = item[n]								
								if (fields[n].fieldType == self.FieldType.sftBoolean && typeof(v) == 'string')
									v = v == 'true'
								updateValues.push(v)
							}
						}				 
					}								
					if (keyValues.length > 0 && updateValues.length > 0){
						updateValues = updateValues.concat(keyValues);
						var sql = 'UPDATE `' + table + '` ' + value + where;						
						self.engine.query(sql, updateValues, function(err, rows){
							if (!err && query.conflictResolution == 2 && rows.changedRows != 1){
								self.engine.query('select * from `' + table + '` ' + where, keyValues, function(err, rows){
									var err = {
										uid: query.uid,
										message: '$save_conflict',
										table: table,
										records: rows
									}
									return callback(err)
								})
							}
							else if (err){								
								return callback(err)																	
							}
							else{								
								self._insertAuditTrail('update', table, updatedFields, where, keyValues, function(){
									_applySQL(records, idx+1)
								}) 
							}
						});
					}
				}
				else
					callback()
			}
			_applySQL(records)			
		},	
		_loadData: function(tableName, fields, data, callback){
			if (tableName && fields && fields.length > 0){
				var sql = 'INSERT INTO `' + tableName + '` (\n'				
				var values = [];				
				for (var i = 0; i < fields.length; i ++){
					var field = fields[i];					
					sql += '`' + field.fieldName + '`'
					if (i < fields.length -1)
						sql += ','
				}
				sql += ') VALUES ?'
				for (var i = 0; i < data.length; i ++){
					var value = [];
					var row = data[i]
					for (var k = 0; k < fields.length; k ++){
						var field = fields[k];					
						if (row[field.fieldName] != undefined)
							value.push(row[field.fieldName])
						else
							value.push(null)
					}
					values.push(value)
				}				
				this.engine.query(sql,[values], function(err){					
					callback(err)
				})	
			}
			else		
				callback()
		},
		_createTable: function(tableName, fields, callback){			
			var keyFields = []
			// var pool = this.mySqlPool;
			if (tableName && fields && fields.length > 0){
				var sql = 'CREATE TABLE `' + tableName + '` (\n'
				if (tableName[0] == '$')
					sql += '`$id` VARCHAR(36),`$action` VARCHAR(10), `$date` DATETIME,`$user` VARCHAR(36),'
				for (var i = 0; i < fields.length; i ++){
					var field = fields[i];					
					if (field.keyField){
						keyFields.push('`' + field.fieldName + '`')
						sql += '`' + field.fieldName + '` ' + this._getFieldTypeString(field)
					}
					else
						sql += '`' + field.fieldName + '` ' + this._getFieldTypeString(field) + ' null default null'
					if (i < fields.length -1)
						sql += ','
				}				
				// var field = fields[fields.length -1];
				// if (field.keyField){
					// keyFields.push('`' + field.fieldName + '`')
					// sql = sql + '`' + field.fieldName + '` ' + this._getFieldTypeString(field)
				// }
				// else
					// sql = sql + '`' + field.fieldName + '` ' + this._getFieldTypeString(field) + ' null default null'
					
				if (tableName[0] == '$') 
					sql += ', PRIMARY KEY (' + '$id' + ')'
				else if (keyFields.length > 0)
					sql += ', PRIMARY KEY (' + keyFields.toString() + ')';			
				sql += ')'
				var self = this;
				this.engine.query(sql,[], function(err){					
					callback(err)
				})	
			}
			else		
				callback()
		},
		_checkIsStringField: function(field){
			return [this.FieldType.sftString,this.FieldType.sftGUID,this.FieldType.sftFile,this.FieldType.sftCreateBy,this.FieldType.sftModifyBy].indexOf(field.fieldType) > -1
		},
		_checkTable: function(tableName, fields, callback, skip){			
			var self = this;		
			if (this.database != 'admin' && !skip && tableName && tableName[0] != '$'){
				self._checkTable('$' + tableName, fields, function(){
					self._checkTable(tableName, fields, callback, true)
				})
			}
			else{
				var sql = 'select count(*) count ' +
					'FROM information_schema.tables  ' + 
					'WHERE table_schema = ?  ' +
					'AND table_name = ?';				
				self.engine.query(sql, [self.config.database, tableName], function(err, rows){								
					if (!rows || rows[0].count == 0)
						self._createTable(tableName, fields, callback)
					else
						self._checkTableFields(tableName, fields, callback);								
				})
			}			
		},
		_checkDatabaseExists: function(database, callback){
			var sql = 'SHOW DATABASES LIKE ?'
			this.engine.query(sql, [database], function(err, rows){								
				callback(rows && rows.length > 0)
			})
		},
		_getTables: function(database, callback){
			var sql = `select table_name 
				FROM information_schema.tables  
				WHERE table_schema = ? `
			this.engine.query(sql, [database], function(err, rows){								
				callback(err, rows)
			})
		},
		_checkTableFields: function(tableName, tableFields, callback){
			if (!tableFields)
				return callback()
			var sourceFields = {};
			var modifyFields = {};
			for (var i = 0; i < tableFields.length; i ++){
				var field = tableFields[i];
				sourceFields[field.fieldName] = field;
			}
			var self = this;
			// this.mySqlPool.
			var sql = 'select column_name name, CHARACTER_MAXIMUM_LENGTH length from information_schema.COLUMNS where table_schema = ? and table_name = ?'
			// this.engine.query('SELECT * FROM `'+ tableName + '` WHERE 2 = 1', [], function(err, rows, fields){
			this.engine.query(sql, [this.config.database, tableName], function(err, fields){
				if (fields){					
					for (var i = 0; i < fields.length; i ++){
						var field = fields[i];
						var sourceField = sourceFields[field.name]; 
						if (sourceField){
							if (sourceField.fieldType == 6)
								sourceField.size = 36;
							sourceFields[field.name] = undefined;							
							if (self._checkIsStringField(sourceField) && ((!sourceField.size && field.length < 10000000) || field.length < sourceField.size)){
								modifyFields[field.name] = sourceField;
							}
						}
					}
					var sql = ''
					for (var n in sourceFields){
						var field = sourceFields[n];
						if (field){
							if (sql == '')
								sql = sql + ' ADD COLUMN `' + field.fieldName + '` ' + self._getFieldTypeString(field)
							else
								sql = sql + ', ADD COLUMN `' + field.fieldName + '` ' + self._getFieldTypeString(field)
						}
					}
					var mod = ''
					for (var n in modifyFields){						
						var field = modifyFields[n];
						if (field){
							if (mod == '')
								mod +=' CHANGE COLUMN `' + field.fieldName + '` `' + field.fieldName + '` ' + self._getFieldTypeString(field)
							else
								mod += ', CHANGE COLUMN `' + field.fieldName + '` `' + field.fieldName + '` ' +  self._getFieldTypeString(field)
						}
					}				
					if (self._beginTransaction && (sql || mod))
						return callback('$failed_to_modify_schema_[' + tableName + ']')

					if (sql != ''){						
						sql = 'ALTER TABLE `' + tableName + '` ' + sql;
						self.engine.query(sql, [], function(err){
							if (mod){
								mod = 'ALTER TABLE `' + tableName + '` ' + mod;
								self.engine.query(mod, [], callback || function(){});
							}
							else if (callback){								
								callback(err);
							}
						})
					}
					else if (mod){						
						mod = 'ALTER TABLE `' + tableName + '` ' + mod;
						self.engine.query(mod, [], callback || function(){})
					}
					else if (callback)
						callback()
				}
				else if (callback)
					callback()
			})
		},		
		_end: function(){
			if (this.engine){
				if (this.engine.release)
					this.engine.release()
				else if (this.engine.end)
					this.engine.end();	
			}
			this.engine = null;		
		},	
		_escape: function(value, fieldType){
			if (this.isDateField(fieldType)){
				return '"' + this.formatDateTime(value) + '"'
				// return JSON.stringify(value)
			}
			else
				return this.engine.escape(value);
		},
		execSQL: function(sql, params, callback){
			var self = this;
			self.engine.query(sql, params, function(err, result, fields){
				if (err){
					return callback.apply(null, [err], { arguments: { copy: true }})
				}					
				if (!self._keepConnection && !self._beginTransaction){
					if (self.engine.release)
						self.engine.release()
					else if (self.engine.end)
						self.engine.end();
				}					
				if (Array.isArray(fields)){
					var f = [];
					for (var i = 0; i < fields.length; i ++){
						if (fields[i] && fields[i].name)
							f.push(fields[i].name)
					}
				}	
				callback.apply(null, [err, result, f], { arguments: { copy: true }})
			});
		},
		_formatQuery: function(items, skip){
			var qry;
			var skip;
			if (Array.isArray(items)){			
				var result = '';
				if (items.length > 1){
					for (var i = 0; i < items.length; i ++){
						var item = items[i];
						if (Math.abs(i + 1) % 2 == 1) {//odd
							if (skip)
								skip = false
							else{
								qry = this._formatQuery(item);
								if (qry)
									result = result + ' ' + qry
								else
									skip = true;
							}
								 
						}
						else if (i < items.length -1){
							if (skip)
								skip = false
							else
								result = result + ' ' + item
						} 
					}
					if (result)
						return '(' + result + ')';
				}
				else
					return this._formatQuery(items[0]);
			}
			else if (items)
				return '(' + items + ')'
		},
		_getFieldTypeString: function(field){
			switch (field.fieldType){
				case this.FieldType.sftBoolean:
					return 'TINYINT';
				case this.FieldType.sftDateTime:
					return 'DATETIME';
				case this.FieldType.sftModifyDate:
					return 'DATETIME';
				case this.FieldType.sftCreateDate:
					return 'DATETIME';
				case this.FieldType.sftInteger:
					return 'BIGINT(20)' 
				case this.FieldType.sftFloat:
					return 'DECIMAL(20,5)' 
				case this.FieldType.sftString:
					if (field.size)
						return 'VARCHAR(' + field.size.toString() + ')'
					else
						return 'MEDIUMTEXT';	
				case this.FieldType.sftAutoInc:
					return 'INT(10)'
				case this.FieldType.sftGUID:
					 return 'VARCHAR(36)';					 
				case this.FieldType.sftFile:{
					 // if (field.multiLang)
					 	// return 'TEXT'
					 // else
					 	return 'VARCHAR(1000)';
				}
				case this.FieldType.sftCreateBy:
					 return 'VARCHAR(36)';
				case this.FieldType.sftModifyBy:
					 return 'VARCHAR(36)';
			}
		},
		_getQueryClause: function(tableName, qry, order){
			var items = this.inherited(tableName, qry, order);
			return items;
		},
		_getQueryAnd: function(qry){
			return 'AND';
		},
		_getSQL(qry){
			if (qry._sql && qry._sql['mysql']){
				return qry._sql['mysql'];
			}
		},
		_getQueryBetween: function(qry){
			if (qry.not)
				return '`' + qry.field + '` NOT BETWEEN ' + this._escape(qry.value[0], qry.fieldType) + ' AND ' + this._escape(qry.value[1], qry.fieldType)
			else
				return '`' + qry.field + '` BETWEEN ' + this._escape(qry.value[0], qry.fieldType) + ' AND ' + this._escape(qry.value[1], qry.fieldType);
		},
		_getQueryEqual: function(qry){	
			var sql = this._getSQL(qry);
			if (qry.not)
				return 'ifnull(`' + qry.field + '`,"") <> ' + (sql?'('+sql+')':this._escape(qry.value, qry.fieldType))
			else
				return '`' + qry.field + '` = ' + (sql?'('+sql+')':this._escape(qry.value, qry.fieldType))
		},
		_getQueryGreaterOrEqual: function(qry){
			var sql = this._getSQL(qry);
			if (qry.not)
				return '`' + qry.field + '` < ' + (sql?'('+sql+')':this._escape(qry.value, qry.fieldType))
			else
				return '`' + qry.field + '` >= ' + (sql?'('+sql+')':this._escape(qry.value, qry.fieldType))
		},
		_getQueryGreaterThan: function(qry){
			var sql = this._getSQL(qry);
			if (qry.not)
				return '`' + qry.field + '` <= ' + (sql?'('+sql+')':this._escape(qry.value, qry.fieldType))
			else
				return '`' + qry.field + '` > ' + (sql?'('+sql+')':this._escape(qry.value, qry.fieldType))
		},
		_getQueryIn: function(qry){			
			if (qry.sql){
				return qry.sql
			}
			var sql = this._getSQL(qry);
			if (qry.not)
				return '`' + qry.field + '` NOT IN (' + (sql?sql+')':(this._escape(qry.value, qry.fieldType) || '""') + ')')
			else
				return '`' + qry.field + '` IN (' + (sql?sql+')':(this._escape(qry.value, qry.fieldType) || '""') + ')')
		},
		_getQueryIsMax: function(tableName, qry){
			if (qry.not)
				return '`' + qry.field + '` <> (SELECT MAX(`' + qry.field + '`) FROM `' + tableName + '`)' 
			else
				return '`' + qry.field + '` = (SELECT MAX(`' + qry.field + '`) FROM `' + tableName + '`)'
		},
		_getQueryIsMin: function(tableName, qry){
			if (qry.not)
				return '`' + qry.field + '` <> (SELECT MIN(`' + qry.field + '`) FROM `' + tableName + '`)' 
			else
				return '`' + qry.field + '` = (SELECT MIN(`' + qry.field + '`) FROM `' + tableName + '`)'
		},
		_getQueryIsNull: function(qry){
			if (qry.not)
				return '`' + qry.field + '` IS NOT NULL'
			else
				return '`' + qry.field + '` IS NULL '
		},
		_getQueryLessOrEqual: function(qry){
			var sql = this._getSQL(qry);
			if (qry.not)
				return '`' + qry.field + '` > ' + (sql?'('+sql+')':this._escape(qry.value, qry.fieldType))
			else
				return '`' + qry.field + '` <= ' + (sql?'('+sql+')':this._escape(qry.value, qry.fieldType))
		},
		_getQueryLessThan: function(qry){
			var sql = this._getSQL(qry);
			if (qry.not)
				return '`' + qry.field + '` >= ' + (sql?'('+sql+')':this._escape(qry.value, qry.fieldType))
			else
				return '`' + qry.field + '` < ' + (sql?'('+sql+')':this._escape(qry.value, qry.fieldType))
		},
		_getQueryLike: function(qry){
			var sql = this._getSQL(qry);
			if (qry.not)
				return '`' + qry.field + '` NOT LIKE ' + (sql?'('+sql+')':this._escape(qry.value, qry.fieldType))
			else
				return '`' + qry.field + '` LIKE ' + (sql?'('+sql+')':this._escape(qry.value, qry.fieldType))
		},
		_getQueryLikeLower: function(qry){
			if (qry.not)
				return 'LOWER(`' + qry.field + '`) NOT LIKE ' + this._escape(qry.value, qry.fieldType)
			else
				return 'LOWER(`' + qry.field + '`) LIKE ' + this._escape(qry.value, qry.fieldType)
		},
		_getQueryLikeUpper: function(qry){
			if (qry.not)
				return 'UPPER(`' + qry.field + '`) NOT LIKE ' + this._escape(qry.value, qry.fieldType)
			else
				return 'UPPER(`' + qry.field + '`) LIKE ' + this._escape(qry.value, qry.fieldType)
		},	
		_getQueryOr: function(qry){
			return 'OR'
		},
		_lookupQuery(query, callback){
			var result = [];
			var keys = [query.value]
			var idx = {};
			var keyIdx = {};
			if (query.hierarchical){
				var field = query.lookup_key;
				var sql = 'SELECT `' + query.lookup_key + '` FROM `' + query.lookup_table + '` WHERE `' + query.lookup_field + '`=?'
			}
			else{
				var field = query.lookup_field;
				var sql = 'IFNULL(`' + query.field + '`,"") = "" OR `' + query.field + '` IN (SELECT distinct `' + query.parent_field + '` FROM `' + query.lookup_table + '` WHERE `' + query.lookup_field + '`= ' + this._escape(query.value) + ')';
				query.sql = sql;
				return callback()
			}
			var self = this;
			function returnResult(){
				query.value = result;
				callback()
			}
			function getKeys(){
				var key = keys.pop();
				if (key){
					if (!idx[key]){
						result.push(key)
						idx[key] = true;
						self.engine.query(sql, [key], function(err, rows){
							if (rows && rows.length > 0){
								for (var i = 0; i < rows.length; i++){							
									var v = rows[i][field]
									if (v && keyIdx[v])
										keys.push(v)
								}
							}
							if (query.hierarchical)
								getKeys();			
							else
								returnResult();
						})
					}
					else
						getKeys();
				}
				else{
					returnResult()
				}
			}
			if (query.hierarchical){
				var keySql = 'SELECT DISTINCT `' + query.lookup_field + '` FROM `' + query.lookup_table + '`';
				this.engine.query(keySql, function(err, rows){
					if (rows && rows.length > 0){
						for (var i = 0; i < rows.length; i++){							
							if (rows[i][query.lookup_field])
								keyIdx[rows[i][query.lookup_field]] = true;
						}
					}
					getKeys();
				})
			}
			else
				getKeys();
		},
		query: function(query, sql, params, callback){
			var paramItems = this.parseParams(sql);
			var paramValues = [];
			for (var i = paramItems.length -1; i > -1 ; i --){
				var item = paramItems[i];
				var fromIdx = item.index;
				var toIdx = fromIdx + item.name.length;
				sql = sql.substring(0, item.index) + ' ? ' + sql.substring(toIdx, sql.length);
				paramValues.unshift(params[item.name]);
			}	
			if (query.qry && query.qry.length > 0){			
				var items = [];
				for (var i = 0; i < query.qry.length; i ++){
					var qry = query.qry[i];					
					var item = this._getQueryClause(query.table, qry)
					items.push(item);	
				}				
				var cond = this._formatQuery(items)
				sql = 'select * from (' + sql + ') tmp where ' + cond;
			}	
			if (query.countOnly)
				sql = 'select count(*) count from (' + sql + ') tmp'
			else if (query.range)
				sql = 'select * from (' + sql + ') tmp limit ' + this.engine.escape(query.range.start) + ',' + this.engine.escape(query.range.count)
			
			this.execSQL(sql, paramValues, callback)
		},
		_queryTable: function(query, callback){		
            var self = this;
            var result = {};
            result.uid = query.uid;
            var sql = 'SELECT ';
            for (var i = 0; i < query.fields.length; i ++){
                var field = query.fields[i];
                if (i > 0)
                    sql = sql + ',';
                sql = sql + '`' + field.fieldName + '`' + (field.aliasName? ' `' + field.aliasName + '`':'')
            };
            sql = sql + ' FROM ' + self.engine.escapeId(query.table);
            var items = [];			
            if (query.qry && query.qry.length > 0){			
                for (var i = 0; i < query.qry.length; i ++){
                    var qry = query.qry[i];					
                    var item = self._getQueryClause(query.table, qry)
                    items.push(item);	
                }				
                var cond = self._formatQuery(items)
            }			
            if (query.archiveField){
                var fieldName = self.engine.escapeId(query.archiveField)
                if (cond)
                    cond = '(' + cond + ') AND (' + fieldName + ' IS NULL OR ' + fieldName + ' != 1)'
                else
                    var cond = '(' + fieldName + ' IS NULL OR ' + fieldName + ' != 1)'
            }			
            if (cond)
                sql = sql + ' WHERE ' + cond;
            
            if (query.order && query.order.length > 0){
                var order = ' order by '
                for (var i = 0; i < query.order.length; i++){
                    if (i > 0)
                        order += ',';
                    order += query.order[i].field;
                    if (query.order[i].opt == 'd')
                        order += ' desc';
                }
                sql += order
            }
            if (query.countOnly)
                sql = 'select count(*) count from (' + sql + ') tmp'
            else if (query.range)
                sql += ' limit ' + self.engine.escape(query.range.start) + ',' + self.engine.escape(query.range.count)			
            try{
                self.engine.query(sql, function(err, records){									
                    if (err)
                        Log.error(sql)
                    result.records = records || []					
                    if (query.rawData)
                        callback(err, records)
                    else
                        callback(err, result);
                })	
            }
            catch(err){
                callback(err)
            }
		},
		beginTransaction: function(callback){			
			if (!this._beginTransaction){
				this._beginTransaction = true;				
				this.engine.beginTransaction(callback);
			}
			else if (callback){				
				callback()			
			}
			// var self = this;
			// this.engine.query('select get_lock("lock", 120)', function(){
			// 	self._beginTransaction = true;
			// 	self.engine.beginTransaction(callback);
			// })
		},
		commit: function(callback){			
			this._beginTransaction = false;			
			var self = this;			
			self.engine.commit(function(err){
				self._end();
				if (callback)				
					callback(err);
			})			
		},
		rollback: function(callback){						
			if (this._beginTransaction){
				this._beginTransaction = false;			
				var self = this;				
				self.engine.rollback(function(err){					
					self._end()
					if (callback)				
						callback(err);
				})
			}	
			else if (callback)		
				callback()
		},
		saveRecords: function(records, result, callback){
			var self = this;
			var _saveRecords = this.inherited;			
			if (this._beginTransaction){				
				_saveRecords.call(self, records, result, function(err){
					callback.apply(null, [err, result], { arguments: { copy: true }})	
				})
			}
			else{
				this.engine.beginTransaction(function(err){				
					if (err){
						self._end();
						if (callback)
							callback.apply(null, [err], { arguments: { copy: true }})
						return;
					}
					_saveRecords.call(self, records, result, function(err){						
						try{
							if (!err){
								self.engine.commit(function(err){
									self._end();
									if (callback)				
										callback.apply(null, [err, result], { arguments: { copy: true }})
								})
							}
							else{
								self.engine.rollback(function(){
									self._end()
									if (callback)				
										callback.apply(null, [err], { arguments: { copy: true }})
								})
							}
						}	
						catch(err){							
							self.engine.rollback(function(){
								self._end()
								if (callback)				
									callback.apply(null, [err], { arguments: { copy: true }})
							})
						}		
					})
				})
			}			
		},
		update: function(table, data, key){
			var fields = '';
			var values = [];
			var params = '';
			var where = '';
			for (var v in data){
				if (fields){
					fields += ',`' + v + '`=?'
					params += ',?'
				}
				else{	
					fields = 'set `' + v + '`=?'
					params = '?'
				}
				values.push(data[v])
			}
			for (var v in key){
				if (where){
					where += ',`' + v + '`=?';
					values.push(key[v])
				}
				else{
					where = ' where `' + v + '`=?'
					values.push(key[v])
				}					
			}
			var sql = 'update `' + table + '` ' + fields + where									
			this.engine.query(sql, values, function(){});
		}
    });	
    return TMySQLEngine;
})();