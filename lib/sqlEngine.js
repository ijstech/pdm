const Uuid = require('uuid')

var fieldType = {
	sftAny:0, 
	sftBoolean:1, 
	sftDateTime:2,
	sftInteger:3, 
	sftFloat:4, 
	sftString:5,
	sftGUID:6,
	sftAutoInc:7,
	sftCreateBy:8, 
	sftCreateDate:9,
	sftModifyBy:10, 
	sftModifyDate:11,
	sftArchive: 12,
	sftLock:13,
	sftFile:14	
};

module.exports = (function(){	
    var initializing = false, fnTest = /xyz/.test(function() { xyz;
	}) ? /\binherited\b/ : /.*/;
	// The base Class implementation (does nothing)
	this.TClass = function() {
	};
	// Create a new Class that inherits from this class
	TClass.extend = function(prop) {		
		var inherited = this.prototype;

		// Instantiate a base class (but only create the instance,
		// don't run the create constructor)
		initializing = true;
		var prototype = new this();
		initializing = false;

		// Copy the properties over onto the new prototype
		for(var name in prop) {
			// Check if we're overwriting an existing function
			prototype[name] = typeof prop[name] == "function" && typeof inherited[name] == "function" && fnTest.test(prop[name]) ? (function(name, fn) {
				return function() {
					var tmp = this.inherited;

					// Add a new .inherited() method that is the same method
					// but on the super-class
					this.inherited = inherited[name];

					// The method only need to be bound temporarily, so we
					// remove it when we're done executing
					var ret = fn.apply(this, arguments);
					this.inherited = tmp;

					return ret;
				};
			})(name, prop[name]) : prop[name];
		}

		// The dummy class constructor
		function Class() {			
			// All construction is actually done in the create method
			if(!initializing && this.create)
				this.create.apply(this, arguments);
		}

		// Populate our constructed prototype object
		Class.prototype = prototype;

		// Enforce the constructor to be what we expect
		Class.prototype.constructor = Class;
		
		Class.prototype.isA = function(o){
			return this instanceof o;			
		}		
		
		// And make this class extendable
		Class.extend = arguments.callee;

		return Class;
    };
    
	this.TSQLEngine = TClass.extend({
		create: function(config){
			this.database = config.database;
			this.config = config;
			this.fields = [];
			this.FieldType = fieldType; 
		},	
		logError: function(err){
			console.trace(err)
		},
		addField: function(fieldName, fieldType, fieldSize, keyField){
			var field = {
				fieldName: fieldName,
				fieldType: fieldType,
				keyField: keyField,
				size: fieldSize
			}
			this.fields.push(field);
		},
		// _end: function(){			
		// },
		insertRecord: function(tableName, records, callback){			
			var rs = [
				{
					uid: 1,
					table: tableName,
					fields: this.fields,
					insertRecords: records
				}
			];
			this.saveRecords(rs, [], function(err){
				if (callback)
					callback(err)
			})
		},
		_applySave: function(records, callback){
			var self = this;
			self._applyDelete(records, function(err){
				if (err)
					callback(err)
				else{
					self._applyInsert(records, function(err){
						if (err)
							callback(err)
						else
							self._applyUpdate(records, function(err){
								callback(err)
							})
					})		
				}					
			})
		},
		_checkTables: function(queries, callback){			
			var self = this;
			var count = 0;			
			if (queries.length > 0){
				for (var i = 0; i < queries.length; i ++){
					var query = queries[i];	
					if (query.table && query.fields){
						if (this.context && this.context._encryption){
							for (var k = 0; k < this.context._encryption.length; k++){
								if (this.context._encryption[k].table == query.table){
									for (var m = 0; m < query.fields.length; m++){
										if (query.fields[m].fieldName == this.context._encryption[k].field){											
											if (query.fields[m].fieldType != 5){
												query.fields[m].fieldType = 5
												query.fields[m].size = 500
											}
											else if (query.fields[m].size < 3000){
												query.fields[m].size += 500;
											}
											break;
										}
									}
								}
							}
						}
						self._checkTable(query.table, query.fields, function(err){
							if (err){							
								callback(err);
								return;
							}
							count = count + 1;
							if (count == queries.length)
								callback()											
						})
					}
					else{
						count = count + 1;
						if (count == queries.length)
							callback()				
					}
				};
			}
			else
				callback();
		},
		createDatabase: function(database, callback){
			var self = this;
			this._createDatabase(database, function(err, result){
				self._end()
				if (callback)
					callback(err, result)				
			})
		},
		execSQL: function(sql, params, callback){
			//dummy callback
			callback.apply(null, [], { arguments: { copy: true }})
		},
		insert: function(table, data){

		},
		_lookupQuery(callback){
			callback()
		},
		_lookupQueries(queries, callback, idx){
			var idx = idx || 0;
			var self = this;
			function lookup(){
				if (idx < queries.length){
					self._lookupQueries(queries[idx], function(){
						idx++
						lookup();
					}, idx)
				}
				else{
					callback()
				}
			}
			if (Array.isArray(queries) && queries.length > 0)
				lookup()
			else if (queries && queries.lookup_table && queries.lookup_field){
				this._lookupQuery(queries, callback)
			}
			else{				
				callback();
			}
		},
		_fetchRecords: function(queries, callback, result, error){
			var self = this;
			var query = queries.shift();
			if (query){
				if (query.table && query.fields){
					query.rawData = queries.rawData;					
					self._lookupQueries(query.qry, function(){
						self._queryTable(query, function(err, data){							
							if (err){
								error = err;
								Log.error(err)
							}
							result.push(data);
							if (queries.rawData){
								self._end();								
								callback(err, data)
							}
							else
								self._fetchRecords(queries, callback, result, error)
						})
					})
				}
				else if (query._sql && query._sql[this.config.type]){// && query.params){//!query.table){
					var sql = query._sql[this.config.type];
					var params = query.params || [];
					if (params.length == 0 && query.qry && query.qry.length > 0){			
						var items = [];			
						for (var i = 0; i < query.qry.length; i ++){
							var qry = query.qry[i];					
							var item = this._getQueryClause(query.table, qry)
							items.push(item);	
						}				
						var cond = this._formatQuery(items)
						sql = sql.replace(/;/g,'');
						sql = 'select * from (' + sql + ') tmp where ' + cond;						
					}	
					self._keepConnection = true;
					self.query(query, sql, params, function(err, data){							
						self._keepConnection = false;
						if (err){
							Log.error(err)
						}	
						result.push({
							error: err,
							uid: query.uid,
							records: data
						});
						self._fetchRecords(queries, callback, result)
					})
				}
				else{
					self._fetchRecords(queries, callback, result)
				}
			}
			else{
				this._end();
				callback(error, result);											
			}
		},
		fetchRecords: function(queries, callback){
			var self = this;
			self._checkTables(queries, function(err){				
				if (err){
					self._end();
					if (callback)
					callback.apply(null, [err], { arguments: { copy: true }})
				}
				else{
					var result = [];
					self._fetchRecords(queries, function(err, result){
						callback.apply(null, [err, {success: !err, data: result}], { arguments: { copy: true }})
					}, []);					
				}
			})
		},
		formatDateTime: function(date){
			try{
				if (typeof(date) == 'string')
					var date = new Date(date);
				else if (!date || isNaN(date))
					var date = new Date()
				var yy = date.getFullYear().toString();
				var mm = (date.getMonth()+1).toString(); 
				var dd = date.getDate().toString();
				var h = date.getHours();
				var m = date.getMinutes();
				var s = date.getSeconds();   	
				if (h > 0 || m > 0 || s > 0){
					h = h.toString();
					m = m.toString();
					s = s.toString();
					var result = yy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]) + ' ' + (h[1]?h:"0"+h[0]) + ':' + (m[1]?m:"0"+m[0]) + ':' + (s[1]?s:"0"+s[0])
				}
				else
					var result = yy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]);
				return result 
			}
			catch(err){}		   	
		},
		genGUID: function(){			
		    return Uuid.v4();
		},
		getFieldDataType: function(dataType){
			var type = dataType.toLowerCase().trim();						
			if (type == '{guid}') 
				return fieldType.sftGUID
			else if (type == '{autoinc}') 
				return fieldType.sftAutoInc
			else if (type == 'boolean') 
				return fieldType.sftBoolean
			else if (type == '{createby}') 
				return fieldType.sftCreateBy
			else if (type == '{modifyby}')
				return fieldType.sftModifyBy
			else if (type == '{file}')
				return fieldType.sftFile
			else if (type == 'integer')
				return fieldType.sftInteger
			else if (type == 'float')
				return fieldType.sftFloat
			else if (type == '{createdate}')
				return fieldType.sftCreateDate
			else if (type == '{modifydate}')
				return fieldType.sftModifyDate
			else if (type == 'datetime')
				return fieldType.sftDateTime
			else 
				return fieldType.sftString
		},
		getFieldSize: function(dataType, multiLang){
			var type = dataType.toLowerCase().trim();
			if (type == '{guid}') 
				return '36'
			else if (type == '{createby}' || type == '{modifyby}') 
				return '36'
			else if (type == '{file}'){
				if (multiLang)
					return '900'
				else
					return '300'
			}
			else if (type.substring(0, 7) == 'varchar'){
				var value = type.substring(type.lastIndexOf("(")+1,type.lastIndexOf(")"));
				return value 
			}
			else if (type == 'boolean')
				return 1
			else 
				return undefined;
		},
		_getQueryClause: function(tableName, qry){
			var items = [];		
			var self = this;			
			function getQueryClause(item){
				switch(item.opt){
					case 'between':
						if (self.isDateField(item.fieldType) && Array.isArray(item.value) && item.value.length == 2){
							try{
								if (typeof (item.value[0]) == 'string' && item.value[0].indexOf(' ') < 0){
									var value1 = new Date(item.value[0]);	
									value1.setHours(0,0,0,0);
								}
								else
									var value1 = new Date(item.value[0]);	
								if (typeof (item.value[1]) == 'string' && item.value[1].indexOf(' ') < 0){
									var value2 = new Date(item.value[1]);	
									value2.setHours(23,59,59,999);
								}
								else
									var value2 = new Date(item.value[1]);
								item.value = [value1, value2]
							}							
							catch(err){
								Log.error(err);
							}							
						}
						items.push(self._getQueryBetween(item));
						break;
					case '=':
						items.push(self._getQueryEqual(item));
						break;
					case '>=':
						items.push(self._getQueryGreaterOrEqual(item));
						break;
					case '>':
						items.push(self._getQueryGreaterThan(item));
						break;
					case 'in':
						items.push(self._getQueryIn(item));
						break;
					case 'ismax':
						items.push(self._getQueryIsMax(tableName, item));
						break;
					case 'ismin':
						items.push(self._getQueryIsMin(tableName, item));
						break;
					case 'isnull':
						items.push(self._getQueryIsNull(item));
						break;
					case '<=':
						items.push(self._getQueryLessOrEqual(item));
						break;
					case '<':
						items.push(self._getQueryLessThan(item));
						break;
					case 'like':
						items.push(self._getQueryLike(item));
						break;
					case 'likelower':
						items.push(self._getQueryLikeLower(item));
						break;
					case 'likeupper':
						items.push(self._getQueryLikeUpper(item));
						break;
				}
			}
			if (Array.isArray(qry)){			
				for (var i = 0; i < qry.length; i ++){
					var item = qry[i];
					if (Array.isArray(item))
						items.push(this._getQueryClause(tableName, item))
					else{
						switch(item.opt){
							case 'and':
								if (i < qry.length -1)
									items.push(this._getQueryAnd(item));
								break;							
							case 'or':
								if (i < qry.length -1)
									items.push(this._getQueryOr(item));
								break;
							default:
								getQueryClause(item)
						}
					}
				}
			}
			else if (qry.opt == 'and')
				items.push(this._getQueryAnd(qry))
			else if (qry.opt == 'or')
				items.push(this._getQueryOr(qry))
			else
				getQueryClause(qry)
			// else if (qry.opt == '=')
				// items.push(this._getQueryEqual(qry));
			return items;
		},
		isBooleanField: function(fieldType){
			return fieldType == this.FieldType.sftBoolean ||
				fieldType == this.FieldType.sftArchive ||
				fieldType == this.FieldType.sftLock
		},
		isDateField: function(fieldType){
			return fieldType == this.FieldType.sftDateTime ||
				fieldType == this.FieldType.sftCreateDate ||
				fieldType == this.FieldType.sftModifyDate
		},
		parseParams: function(sql){
			try{
				var regex = /\@([\w.$]+|"[^"]+"|'[^']+')/g
				var result = [];
				var match
				while (match = regex.exec(sql)) {
					result.push({
						name: match[0],
						index: match.index
					})
				}
				return result;
			}
			catch(err){
				return []
			}				
		},
		resolve: function(items, filters, callback, result){
			var self = this;
			var result = result || {};
			var item = items.shift();
			var links = [];
			var idx = 0;
			var paging;
			var ordering = [];
			function getKeys(link, rows){		
				var keys = {
					field: '',
					values: []
				};
				if (link.Cardinality == 0) { //master detail
					for (var i = 0; i < link.toTable.Fields.length; i++){
						var field = link.toTable.Fields[i]
						if (field.KeyField)
							break;
					}
					for (var i = 0; i < rows.length; i++){
						keys.values.push(rows[i][field.PropertyName])
					}
					keys.field = field.PropertyName;
					return keys;
				}
				else{ //reference	
					for (var i = 0; i < rows.length; i++){
						keys.values.push(rows[i][link.toTable.ChildObjectName])
					}
					keys.field = link.toTable.ChildObjectName					
					return keys;
				}
			}
			function resolveLinks(callback){
				var link = links.shift();
				if (link){
					var field = item.name.value;
					var rows = result[field];
					var keys = getKeys(link, rows);					
					idx = 0;					
					if (link.Cardinality == 0){
						var refField = link.ChildFields[0];
						link.item.qry = [{
							opt: 'in',
							field: refField,
							value: keys.values
						}]		
					}
					else{
						var refField = link.ParentFields[0];						
						link.item.qry = [{
							opt: 'in',
							field: refField,
							value: keys.values
						}]
						for (var i = 0; i < link.toTable.Fields.length; i++){
							if (link.toTable.Fields[i].KeyField){
								var refKeyField = link.toTable.Fields[i].PropertyName;
								var refObjName = link.toTable.ChildObjectName;
							}
						}
					}
						
					if (link.Cardinality == 0){ //master detail
						for (i = 0; i < link.item.items.length;i ++){
							if (link.item.items[i].name.value == refField){
								var withRefField = true;
								break;
							}
						}
						if (!withRefField)
							link.item.items.push({
								name:{value:refField}
							})
					}						
					self.resolve([link.item], filters, function(err, data){
						var field = link.item.name.value;
						if (data && data[field]){
							var dataItem = data[field].pop();
							while (dataItem){									
								for (var i = 0; i < rows.length; i ++){									
									if (link.Cardinality == 0){
										if (rows[i][keys.field] == dataItem[refField]){
											if (!rows[i][field])
												rows[i][field] = []
											if (!withRefField)
												delete dataItem[refField]
											rows[i][field].push(dataItem)
											break;
										}	
									}
									else{										
										if (rows[i][refObjName] == dataItem[refKeyField])
											rows[i][refObjName] = dataItem;
									}	
								}
								dataItem = data[field].pop();
							}							
						}							
						resolveLinks(callback)
					})
				}
				else
					callback.apply(null, [], { arguments: { copy: true }})
			}
			function getFilter(tableName){
				var tableName = tableName.toLowerCase();
				if (filters){
					for (var i = 0; i < filters.length; i++){
						var filter = filters[i]
						if (filter.table && filter.table.toLowerCase() == tableName){
							filter.fields = filter.fields || []
							return filter;
						}
					}					
				}
				else
					return {fields: []};
			}
			function getValue(value){
				if (value.value != undefined)
					return value.value
				else if (value.values != undefined){
					var result = []
					for (var i = 0; i < value.values.length; i++)
						result.push(value.values[i].value)
					return result;
				}
				return '';
			}
			function getQuery(fields, data){
				if (data.fields && data.fields.length == 1)
					var field = getField(fields, data.fields[0].name.value)				
				if (field){
					var data = data.fields[0];
					var result = [];
					var op = '=';
					var value;
					if (data.value.value != undefined){
						value = data.value.value;
					}
					else if (data.value.fields){						
						var qry;
						var joint;						
						for (var k = 0; k < data.value.fields.length; k++){
							if (data.value.fields[k].name.value == 'op')
								op = data.value.fields[k].value.value
							else if (data.value.fields[k].name.value == 'value')
								value = data.value.fields[k].value.value;
							else if (data.value.fields[k].name.value == 'or'){
								var join = 'or'
								qry = getQuery(fields, data.value.fields[k].value)
							}
							else if (data.value.fields[k].name.value == 'and'){
								var join = 'and'
								qry = getQuery(fields, data.value.fields[k].value)
							}
						}						
					}
					result.push({
						opt: op,
						field: field.FieldName,
						fieldType: self.getFieldDataType(field.FieldType),
						value: value
					})
					if (joint && qry){
						result.push({opt:joint});
						result.push(qry)
					}
					return result;
				}
			}
			function getField(fields, propName){
				for (var k = 0; k < fields.length; k++){
					var field = fields[k]
					if (field.PropertyName == propName)
						return field
				}
			}
			if (item && item.items && item.table){
				var paging = undefined;
				var fields = {};
				var linkFields = [];			
				var qry = {
					rawData: true,
					table: item.table.TableName,
					fields: [],
					qry: item.qry || []
				}
				var filter = getFilter(qry.table)
				if (!filter)
					return self.resolve(items, filters, callback, result);
				if (item.arguments){
					for (var i = 0; i < item.arguments.length; i++){
						var arg = item.arguments[i];						
						if (arg.name.value == '_paging'){
							try{
								if (arg.value.fields){
									paging = {};
									for (var k = 0; k < arg.value.fields.length; k++){
										var field = arg.value.fields[k];
										if (field.name.value == 'page')
											paging.page = parseInt(field.value.value)
										else if (field.name.value == 'size')
											paging.count = parseInt(field.value.value)
									}
									if (paging.page > 0 && paging.count != undefined){	
										qry.range = {
											start: (paging.page -1) * paging.count,
											count: paging.count
										}
									}
								}
							}
							catch(err){

							}								
						}
						else if (arg.name.value == '_ordering'){
							if (!qry.order)
								qry.order = [];
							if (arg.value.value){
								var field = getField(item.table.Fields, arg.value.value)
								if (field)
									qry.order.push({field: field.FieldName});
							}
							else if (arg.value.fields){
								var field = undefined;
								var desc = false;
								for (var k = 0; k < arg.value.fields.length; k++){
									if (arg.value.fields[k].name.value == 'by' && arg.value.fields[k].value)
										var field = getField(item.table.Fields, arg.value.fields[k].value.value)
									else if (arg.value.fields[k].name.value == 'desc' && arg.value.fields[k].value)
										var desc = arg.value.fields[k].value.value;
								}
								if (field){
									qry.order.push({field: field.FieldName,opt: desc?'d':''});
								}
							}
							else if (arg.value.values){
								for (var k = 0; k < arg.value.values.length; k++){
									var value = arg.value.values[k];
									if (value.value){
										var field = getField(item.table.Fields, value.value)
										if (field)
											qry.order.push({field: field.FieldName});
									}
									else if (value.fields){
										for (var m = 0; m < value.fields.length; m++){
											if (value.fields[m].name.value == 'by' && value.fields[m].value){
												var field = getField(item.table.Fields, value.fields[m].value.value)
											}
											else if (value.fields[m].name.value == 'desc' && value.fields[m].value)
												var desc = value.fields[m].value.value;
										}
										if (field)
											qry.order.push({field: field.FieldName,opt: desc?'d':''});
									}
								}
							}
						}
						else if (arg.name.value == '_searching'){
							var value = '%' + arg.value.value + '%';
							if (qry.qry.length > 0)
								qry.qry.push({opt:'and'})
							var q = [];
							for (var k = 0; k < item.table.Fields.length; k++){
								var field = item.table.Fields[k];
								if (field.SearchBy){
									if (q.length > 0)
										q.push({opt:'or'});
									q.push({
										opt: 'like',
										field: field.FieldName,
										fieldType: self.getFieldDataType(field.FieldType),
										value: value
									})
								}
							}
							qry.qry.push(q);
						}
						else{
							var field = getField(item.table.Fields, arg.name.value)
							if (field){								
								var op = '=';
								var joint = '';
								if (qry.qry.length > 0)
									qry.qry.push({opt:'and'})
								if (arg.value.value != undefined){
									var value = arg.value.value;
								}
								else if (arg.value.fields){
									for (var k = 0; k < arg.value.fields.length; k++){
										if (arg.value.fields[k].name.value == 'op'){
											var op = arg.value.fields[k].value.value;
										}
										else if (arg.value.fields[k].name.value == 'value'){
											var value = getValue(arg.value.fields[k].value)
										}	
										else if (arg.value.fields[k].name.value == 'or'){
											joint = 'or'
											var q = getQuery(item.table.Fields, arg.value.fields[k].value)											
										}
										else if (arg.value.fields[k].name.value == 'and'){
											joint = 'and'
											var q = getQuery(item.table.Fields, arg.value.fields[k].value)
										}
									}
								}	
								for (var k = 0; k < filter.fields.length; k++){
									if (filter.fields[k].field == field.FieldName){
										var op = '=';
										var value = filter.fields[k].value;
										break;
									}
								}								
								if (joint && q){
									q.push({opt:joint})
									q.push({
										opt: op,
										field: field.FieldName,
										fieldType: self.getFieldDataType(field.FieldType),
										value: value
									})								
									qry.qry.push(q)
								}
								else{
									qry.qry.push({
										opt: op,
										field: field.FieldName,
										fieldType: self.getFieldDataType(field.FieldType),
										value: value
									})								
								}							
							}
						}						
					}
				}
				for (var k = 0; k < filter.fields.length; k++){
					var field = filter.fields[k]					
					if (qry.qry.length > 0)
						qry.qry.push({opt:'and'})
					qry.qry.push({
						opt:'=',
						field: field.field,
						value: field.value
					})
				}
				for (var i = 0; i < item.items.length; i++){
					fields[item.items[i].name.value] = 1;
					var link = item.items[i].link;
					if (link){
						link.item = item.items[i];						
						links.push(link)
						if (link.Cardinality == 1){ //reference
							qry.fields.push({
								fieldName: link.ChildFields[0],
								aliasName: link.toTable.ChildObjectName
							})
						}
					}
				}
				
				var fileFields = [];
				for (var i = 0; i < item.table.Fields.length; i++){
					var field = item.table.Fields[i]
					if (field.FieldType == '{file}')
						fileFields.push(field.PropertyName)
					if (fields[field.FieldName])
						qry.fields.push({
							keyField: field.KeyField,
							fieldName: field.FieldName,
							fieldType: this.getFieldDataType(field.FieldType),
							size: this.getFieldSize(field.FieldType)
						})
					else if (fields[field.PropertyName] || field.KeyField)
						qry.fields.push({
							keyField: field.KeyField,
							fieldName: field.FieldName,
							aliasName: field.PropertyName,
							fieldType: this.getFieldDataType(field.FieldType),
							size: this.getFieldSize(field.FieldType)
						})
				}
				this._checkTable(item.table.TableName, qry.fields, function(err){					
					if (!err){						
						self._queryTable(qry, function(err, rows){
							if (err)
								return callback(err)
							if (rows && fileFields.length > 0){								
								for (var i = 0; i < fileFields.length; i++){
									for (var k = 0; k < rows.length; k++){
										if (rows[k][fileFields[i]]){
											try{
												rows[k][fileFields[i]] = JSON.parse(rows[k][fileFields[i]])
											}
											catch(err){}
										}
									}
								}
							}
							result[item.name.value] = rows;							
							if (rows){
								var count = rows.length;
								if (paging){
									qry.countOnly = true;
									self._queryTable(qry, function(err, rows){
										if (rows && rows.length == 1){
											if (!result.paging)
												result.paging = {}
											result.paging[item.name.value] = {
												total_page: Math.ceil(rows[0].count / paging.count),
												total_count: rows[0].count,
												current_page: paging.page
											}
										}
										resolveLinks(function(){
											self.resolve(items, filters, callback, result)	
										})
									})
										
								}
								else{
									resolveLinks(function(){
										self.resolve(items, filters, callback, result)	
									})
								}
							}
							else
								self.resolve(items, filters, callback, result)	
						})
					}
					else{
						return callback(err)					
					}
				})
			}
			else	
				callback(undefined, result)
		},
		saveRecords: function(records, result, callback){
			var self = this;
			if (Array.isArray(records)){
				this._checkTables(records, function(err){
					if (err){
						self._end();
						callback.apply(null, [err], { arguments: { copy: true }})
					}
					else{
						var count = 0;
						for (var i = 0; i < records.length; i++){
							var record = records[i];
							self._applySave(record, function(err, data){
								if (err){
									self._end();
									callback.apply(null, [err], { arguments: { copy: true }})
									return;
								}
								else{
									count++;
									if (count == records.length){	
										// self._end();
										callback.apply(null, [], { arguments: { copy: true }})									
									}
								}
							})
						}			
					}
				})
			}
			else
				callback()
		},
		update: function(table, data, key){
			
		}
    });
    return this.TSQLEngine;
})();