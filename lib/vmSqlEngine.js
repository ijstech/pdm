function formatDateTime(value) {
    try {
        if (typeof (value) == 'string')
            value = new Date(value);
        else if (!value)
            value = new Date();
        var yy = value.getFullYear().toString();
        var mm = (value.getMonth() + 1).toString();
        var dd = value.getDate().toString();
        var h = value.getHours().toString() || '0';
        var m = value.getMinutes().toString() || '0';
        var s = value.getSeconds().toString() || '0';
        if (h > 0 || m > 0 || s > 0)
            return yy + '-' + (mm[1] ? mm : "0" + mm[0]) + '-' + (dd[1] ? dd : "0" + dd[0]) + ' ' + (h[1] ? h : "0" + h[0]) + ':' + (m[1] ? m : "0" + m[0]) + ':' + (s[1] ? s : "0" + s[0]);
        else
            return yy + '-' + (mm[1] ? mm : "0" + mm[0]) + '-' + (dd[1] ? dd : "0" + dd[0]);
    }
    catch(e) {}
}
function parseDateTime(input) {
    if (typeof (input) == 'string') {
        if (input.indexOf('T') > 0)
            return new Date(input);
        else
            return new Date(input.replace(/-/g, "/"));
    }
    else
        return new Date(input);
}
var TFieldType;
(function (TFieldType) {
    TFieldType[TFieldType["ftAny"] = 0] = "ftAny";
    TFieldType[TFieldType["ftBoolean"] = 1] = "ftBoolean";
    TFieldType[TFieldType["ftDateTime"] = 2] = "ftDateTime";
    TFieldType[TFieldType["ftInteger"] = 3] = "ftInteger";
    TFieldType[TFieldType["ftFloat"] = 4] = "ftFloat";
    TFieldType[TFieldType["ftString"] = 5] = "ftString";
    TFieldType[TFieldType["ftGUID"] = 6] = "ftGUID";
    TFieldType[TFieldType["ftAutoInc"] = 7] = "ftAutoInc";
    TFieldType[TFieldType["ftCreateBy"] = 8] = "ftCreateBy";
    TFieldType[TFieldType["ftCreateDate"] = 9] = "ftCreateDate";
    TFieldType[TFieldType["ftModifyBy"] = 10] = "ftModifyBy";
    TFieldType[TFieldType["ftModifyDate"] = 11] = "ftModifyDate";
    TFieldType[TFieldType["ftArchive"] = 12] = "ftArchive";
    TFieldType[TFieldType["ftLock"] = 13] = "ftLock";
    TFieldType[TFieldType["ftFile"] = 14] = "ftFile";
})(TFieldType || (TFieldType = {}));
var ECondition;
(function (ECondition) {
    ECondition[ECondition["equal"] = 0] = "equal";
    ECondition[ECondition["notEqual"] = 1] = "notEqual";
    ECondition[ECondition["contain"] = 2] = "contain";
    ECondition[ECondition["notContain"] = 3] = "notContain";
    ECondition[ECondition["between"] = 4] = "between";
    ECondition[ECondition["notBetween"] = 5] = "notBetween";
    ECondition[ECondition["greater"] = 6] = "greater";
    ECondition[ECondition["greaterOrEqual"] = 7] = "greaterOrEqual";
    ECondition[ECondition["less"] = 8] = "less";
    ECondition[ECondition["lessOrEqual"] = 9] = "lessOrEqual";
    ECondition[ECondition["in"] = 10] = "in";
    ECondition[ECondition["notIn"] = 11] = "notIn";
    ECondition[ECondition["beginWith"] = 12] = "beginWith";
    ECondition[ECondition["notBeginWith"] = 13] = "notBeginWith";
    ECondition[ECondition["endWith"] = 14] = "endWith";
    ECondition[ECondition["notEndWith"] = 15] = "notEndWith";
    ECondition[ECondition["empty"] = 16] = "empty";
    ECondition[ECondition["notEmpty"] = 17] = "notEmpty";
})(ECondition || (ECondition = {}));
var SQLEngine;
(function (SQLEngine) {
    class TPDFile {
        constructor(record, field) {
            this.record = record;
            this.field = field;
            this.file = {};
            var sql = this.record._recordSet._SQL;
            var context = sql._context;
            if (sql._multiLangFields.indexOf(this.field) > -1) {
                var multiLan = true;
            }
            var value = record._record[field];
            if (typeof (value) == 'string') {
                try {
                    value = JSON.parse(value);
                }
                catch (err) {
                    value = {};
                }
            }
            if (value && typeof (value) == 'object') {
                if (multiLan && !value.hasOwnProperty('_multiLang') && !value.hasOwnProperty('en') && !value.hasOwnProperty('zh-HK') && !value.hasOwnProperty('zh-CN')) {
                    var lang = context.options._locale;
                    this.file = {
                        _multiLang: true,
                        publicAccess: value.publicAccess
                    };
                    this.file[context.options._defaultLocale || lang] = value;
                }
                else if (!multiLan && value.hasOwnProperty('_multiLang')) {
                    this.file = {
                        publicAccess: value.publicAccess
                    };
                    if (value.hasOwnProperty(context.options._defaultLocale)) {
                        var file = value[context.options._defaultLocale];
                        for (var v in file) {
                            if (v != 'publicAccess')
                                this.file[v] = file[v];
                        }
                    }
                    else {
                        for (var id in value) {
                            if (id != 'publicAccess')
                                break;
                        }
                        var file = value[id];
                        for (var v in file) {
                            if (v != 'publicAccess')
                                this.file[v] = file[v];
                        }
                    }
                }
                else
                    this.file = value;
            }
        }
        assign(source) {
            var file = JSON.stringify(source.file);
            this.file = JSON.parse(file);
            this.record.setFieldValue(this.field, file, '{file}');
        }
        delete() {
            if (this.file) {
                this.file.deleted = true;
                this.record.setFieldValue(this.field, JSON.stringify(this.file));
            }
        }
        get deleted() {
            var file = this._getFile();
            if (file && this.file)
                return file.deleted || this.file.deleted;
        }
        set deleted(value) {
            this.delete();
        }
        get fileName() {
            var file = this._getFile();
            if (file && !file.deleted && this.file && !this.file.deleted)
                return file.fileName || '';
            else
                return '';
        }
        set fileName(value) {
            var file = this._getFile();
            if (file && !file.deleted && this.file)
                file.fileName = value;
            this._setFile(file);
        }
        _getLang() {
            var sql = this.record._recordSet._SQL;
            if (sql._multiLangFields.indexOf(this.field) > -1)
                return sql._context.options._locale || sql._context.options._defaultLocale;
        }
        _getFile() {
            if (this.file && !this.file.deleted) {
                var lang = this._getLang();
                var sql = this.record._recordSet._SQL;
                if (sql._multiLangFields.indexOf(this.field) > -1) {
                    var context = sql._context;
                    var lang = context.options._locale || context.options._defaultLocale;
                    var defaultLang = context.options._defaultLocale;
                    if (context.options.returnDefaultLanguageValue)
                        var file = this.file[lang] || this.file[defaultLang] || this.file['en'] || this.file['zh-HK'] || this.file['zh-CN'];
                    else
                        var file = this.file[lang];
                    if (typeof (file) == 'string')
                        return JSON.parse(file);
                    else
                        return file || {};
                }
                else
                    return this.file || {};
            }
            else
                return {};
        }
        _setFile(file) {
            if (this.file && !this.file.deleted) {
                var lang = this._getLang();
                var sql = this.record._recordSet._SQL;
                if (sql._multiLangFields.indexOf(this.field) > -1) {
                    var context = sql._context;
                    var lang = context.options._locale || context.options._defaultLocale;
                    this.file[lang] = file;
                }
                else
                    this.file = file;
                this.record.setFieldValue(this.field, JSON.stringify(this.file), '{file}');
            }
        }
        get guid() {
            var file = this._getFile();
            return file.guid || '';
        }
        set guid(value) {
            var file = this._getFile();
            file.guid = value;
            this._setFile(file);
        }
        loadFromJSON(value) {            
            if (typeof(value) == 'string')
                value = JSON.parse(value);
            this.file = value;
            this.record.setFieldValue(this.field, JSON.stringify(value), '{file}');
        }
        loadFromBlob(fileName, blob, publicAccess){            
            let self = this;                     
            return new Promise(async function(resolve, reject){
                try{                    
                    var file = self._getFile();      
                    file.guid = self.record._recordSet._context._genGUID();
                    file.fileName = fileName;
                    file.publicAccess = publicAccess
                    delete file.deleted;
                    let result = await _$$pdm.writeFile(file, blob);                     
                    self._setFile(file);   
                    resolve()
                }
                catch(err){                                            
                    reject(err);
                }                
            })            
        }
        get modifyDate() {
            var file = this._getFile();
            if (file && !file.deleted && this.file && !this.file.deleted)
                return file.modifyDate;
        }
        get publicAccess() {
            if (this.file && !this.file.deleted)
                return this.file.publicAccess;
        }
        saveToJSON() {
            return JSON.stringify(this.file);
        }
        get size() {
            var file = this._getFile();
            if (file && !file.deleted && this.file && !this.file.deleted)
                return file.size || 0;
            this.record.setFieldValue(this.field, JSON.stringify(file), '{file}');
        }
        set size(value) {
            var file = this._getFile();
            file.size = value;
            this._setFile(file);
        }
        get url() {
            var file = this._getFile();
            if (file && !file.deleted && this.file && !this.file.deleted) {
                if (this.uploaded || this.file.publicAccess)
                    return '/assets/' + file.guid + '/' + file.fileName;
                else if (file.fileName) {
                    var keyFields = this.record._recordSet._SQL._keyFields;
                    var contextUrl = this.record._recordSet._context.contextURL;
                    if (contextUrl && contextUrl[0] != '/')
                        contextUrl = '/' + contextUrl;
                    var tableName = this.record._recordSet._SQL._tableClass || this.record._recordSet._tableName;
                    return '/assets' + contextUrl + '/' +
                        tableName + '/' +
                        this.field + '/' + this.record._record[keyFields[0].fieldName] + '/' + file.fileName;
                }
            }
        }
        setFileInfo(fileInfo, publicAccess) {
            var file = {
                fileName: fileInfo.fileName,
                guid: fileInfo.guid,
                size: fileInfo.size,
                key: fileInfo.key
            };
            if (!this.file)
                this.file = {};
            delete this.file.deleted;
            var lang = this._getLang();
            if (lang) {
                this.file.publicAccess = publicAccess;
                this.file[lang] = file;
                this.file['_multiLang'] = true;
                this.record.setFieldValue(this.field, this.file, '{file}');
            }
            else {
                this.file = file;
                this.file.publicAccess = publicAccess;
                if (this.file)
                    this.record.setFieldValue(this.field, JSON.stringify(this.file), '{file}');
                else
                    this.record.setFieldValue(this.field, '', '{file}');
            }
        }
    }
    SQLEngine.TPDFile = TPDFile;
    class TPDContextOptions {
        constructor(owner) {
            this.asyncRead = false;
            this.asyncSave = false;
            this._locale = '';
            this._defaultLocale = '';
            this._multiLanguage = true;
            this._readOnly = false;
            this.returnDefaultLanguageValue = true;
            this.lazyLoad = false;
            this.localDB = false;
            this.context = owner;
        }
        get defaultLocale() {
            return this._defaultLocale;
        }
        set defaultLocale(value) {
            this._defaultLocale = value;
        }
        get locale() {
            return this._locale;
        }
        set locale(value) {
            this._locale = value;
        }
        get multiLanguage() {
            return this._multiLanguage;
        }
        set multiLanguage(value) {
            this._multiLanguage = value;
        }
        get readOnly() {
            return this._readOnly;
        }
        set readOnly(value) {
            if (value != this._readOnly) {
                this._readOnly = value;
            }
        }
    }
    SQLEngine.TPDContextOptions = TPDContextOptions;
    class _TPDContext {
        constructor(parent, options) {
            this._modifiedRecordset = {};
            this._snapshot = [];
            this._acl = {};
            this._encryptFields = {};
            this._fetchRecordsets = {};
            this._fetchRecordsetsCallback = {};
            this._loadAcl = true;
            this._fetchCallback = [];
            this._queryResult = [];
            this.options = new TPDContextOptions(this);
            this._guid = this._genGUID();
            this._parent = parent;
            if (options) {
                if (parent && options.onStateChange)
                    this._onStateChange = $.proxy(parent.__this[options.onStateChange], parent.__this);
                if (parent && options.onRecordAppend)
                    this._onRecordAppend = $.proxy(parent.__this[options.onRecordAppend], parent.__this);
                if (parent && options.onRecordChange)
                    this._onRecordChange = $.proxy(parent.__this[options.onRecordChange], parent.__this);
                if (parent && options.onRecordDelete)
                    this._onRecordDelete = $.proxy(parent.__this[options.onRecordDelete], parent.__this);
                if (parent && options.onCurrentChange)
                    this._onCurrentChange = $.proxy(parent.__this[options.onCurrentChange], parent.__this);
                if (parent && options.onSaveConflict)
                    this._onSaveConflict = $.proxy(parent.__this[options.onSaveConflict], parent.__this);
                if (parent && options.beforeFileUpload)
                    this._beforeFileUpload = $.proxy(parent.__this[options.beforeFileUpload], parent.__this);
                this._contextURL = options.contextURL || this._path || '';
                this.database = options.database;
                this.options.lazyLoad = options.lazyLoad;
            }
            else
                this._contextURL = this._path || '';
            if (options && options.endpoint)
                this._optionEndPoint = options.endpoint;
            else
                this._endPoint = (this._endPoint || '/pdm');
            this._uid = 0;
        }
        async _updateAcl(callback) {
            if (!this._loadAcl) {
                if (callback)
                    callback();
                return;
            }
            var qry = {};
            qry.url = this.contextURL;
            qry.acl = this._loadAcl;
            var self = this;
            return new Promise(async function (resolve, reject) {
                try {
                    _$$pdm.fetch(self._endPoint, qry, function (err, result) {                        
                        if (err)
                            return reject(err);
                        self._loadAcl = false;                        
                        if (result.encryption && result.keys) {
                            var keys = {};
                            for (var i = 0; i < result.keys.length; i++)
                                keys[result.keys[i].guid] = result.keys[i].public_key;
                            var encrypt = {};
                            for (var i = 0; i < result.encryption.length; i++) {
                                var item = result.encryption[i];
                                if (keys[item.key]) {
                                    encrypt[item.table] = encrypt[item.table] || {};
                                    encrypt[item.table][item.field] = {
                                        id: item.key,
                                        field: item.field,
                                        publicKey: keys[item.key]
                                    };
                                }
                            }
                            self._encryptFields = encrypt || {};
                            for (var v in self) {
                                var rs = self[v];
                                if (rs && encrypt[rs._tableName]) {
                                    rs._encryptFields = encrypt[rs._tableName];
                                }
                            }
                        }
                        if (result.acl) {
                            self._acl = result.acl || {};
                            for (var w in result.acl) {
                                if (self[w] && self[w]._tableName)
                                    self[w].acl = result.acl[w];
                            }
                        }
                        if (callback)
                            callback();
                        resolve();
                    });
                }
                catch (err) {
                    reject(err);
                    if (callback)
                        callback(err);
                }
            });
        }
        get contextURL() {
            return this._contextURL || this._url || '';
        }
        get _endPoint() {
            return this._optionEndPoint || this.options.endpoint;
        }
        set _endPoint(value) {
            this.options.endpoint = value;
        }
        free() {
            this._onStateChange = null;
            this._onRecordAppend = null;
            this._onRecordChange = null;
            this._onRecordDelete = null;
            this._onCurrentChange = null;
            this._onSaveConflict = null;
            this._beforeFileUpload = null;
        }
        assign(source) {
            var items = [
                '_onStateChange',
                '_onRecordAppend',
                '_onRecordChange',
                '_onRecordDelete',
                '_onCurrentChange',
                '_onSaveConflict',
                '_beforeFileUpload'
            ];
            for (var v in source) {
                if (items.indexOf(v) < -1)
                    this[v] = source[v];
            }
        }
        _addFetchRecordset(recordSet, callback) {
            this._fetchRecordsets[recordSet._uid] = recordSet;
            this._fetchRecordsetsCallback[recordSet._uid] = callback;
        }
        _notifyDataBinding(prop, value) {
            if (this._page) {
                if (!this._name) {
                    for (var v in this._page) {
                        if (this._page[v] == this) {
                            this._name = v;
                            break;
                        }
                    }
                }
                this._page._updateProp('', this._name + '.' + prop, value);
            }
        }
        _addModifiedRecordset(recordset, record) {
            this._modifiedRecordset[recordset._uid] = recordset;
            if (!this._changed) {
                this._notifyDataBinding('modified', true);
                if (this._onStateChange)
                    this._onStateChange(this);
            }
            if (record && record._deleted && this._onRecordDelete)
                this._onRecordDelete(this, recordset, record);
            else if (record && record._newRecord && this._onRecordAppend)
                this._onRecordAppend(this, recordset, record);
            this._changed = true;
        }
        applyChanges(recordSetType, qry) {
            if (!qry) {
                return new Promise(function (resolve) {
                    resolve();
                });
            }
            qry.database = this.database;
            var result = false;
            var rs = new recordSetType(this, null, null);
            var tableName = rs._SQL._tableName;
            var fields = rs._SQL._fields;
            var keyFields = rs._SQL._keyFields;
            function checkField(field) {
                for (var i = 0; i < fields.length; i++) {
                    var f = fields[i];
                    if (f.fieldName.toLowerCase() == field.fieldName.toLowerCase() && f.keyField == field.keyField)
                        return true;
                }
                return false;
            }
            function checkRecordSet() {
                for (var i = 0; i < qry.records.length; i++) {
                    var r = qry.records[i];
                    if (r.table != tableName)
                        return false;
                    for (var k = 0; k < r.fields.length; k++) {
                        if (!checkField(r.fields[k]))
                            return false;
                    }
                    return true;
                }
            }
            var self = this;
            return new Promise(async function (resolve, reject) {
                try {
                    _$$pdm.fetch(self._endPoint, qry, function (err, result) {                        
                        if (err)
                            reject(err);
                        else
                            resolve(result.success == true);
                    });
                }
                catch (err) {
                    reject(err);
                }
            });
        }
        clearChanges(result, callback) {
            function getChanges(uid) {
                if (result && result.data) {
                    return result.data[uid];
                }
            }
            for (var i = 0; i < this._queryResult.length; i++) {
                var data = this._queryResult[i];
                data.orig = JSON.parse(JSON.stringify(data.data));
            }
            for (var n in this._modifiedRecordset) {
                var rs = this._modifiedRecordset[n];
                for (var k in rs._appended) {
                    var record = rs._appended[k];
                    record._newRecord = false;
                    record._oldValues = {};
                    rs._addRecordByPrimaryIndex(record._record, record);
                }
                for (var k in rs._modified) {
                    var record = rs._modified[k];
                    record._oldValues = {};
                }
                rs._deleted = {};
                rs._appended = {};
                rs._modified = {};
                rs._modifiedFields = {};
                var changes = getChanges(rs._uid);
                var withChanges = changes && changes.records && changes.records.length > 0;
                if (withChanges) {
                    for (var i = 0; i < changes.records.length; i++) {
                        var rec = changes.records[i];
                        var record = rs._getRecordByPrimaryIndex(rec);
                        if (record) {
                            for (var v in rec) {
                                if (rs._SQL._withDateField && rs._SQL._dateFields.indexOf(v) > -1)
                                    record._record[v] = formatDateTime(parseDateTime(rec[v]));
                                else
                                    record._record[v] = rec[v];
                            }
                        }
                    }
                }
            }
            this._modifiedRecordset = {};
            if (this._changed != false) {
                this._changed = false;
                this._notifyDataBinding('modified', false);
                if (this._onStateChange)
                    this._onStateChange(this);
                if (callback)
                    callback();
            }
        }
        _clone(obj) {
            if (null == obj || "object" != typeof obj)
                return obj;
            var copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr))
                    copy[attr] = obj[attr];
            }
            return copy;
        }
        _getRecordSet(table) {
            function getRecordSet(context, table) {
                for (var v in context) {
                    if (typeof (v) == 'string' && v[0] != '_' && context[v] instanceof _TPDRecordSet) {
                        var rs = context[v];
                        if (rs._tableName == table)
                            return rs;
                        else if (rs._records.length > 0) {
                            rs = getRecordSet(rs._records[0], table);
                            if (rs)
                                return rs;
                        }
                    }
                }
            }
            return getRecordSet(this, table);
        }
        _load(records, changes) {
            var records = JSON.parse(JSON.stringify(records));
            function loadData(parent) {
                for (var i = 0; i < records.length; i++) {
                    var rec = records[i];
                    var rs = parent[rec.tableClass];
                    if (rs instanceof _TPDRecordSet && !rs._processed) {
                        var link = rs._masterLink;
                        if (link && link.masterFields && link.refFields) {
                            var masterField = link.masterFields[0];
                            var childField = link.refFields[0];
                        }
                        if (parent instanceof _TPDContext || (rec.records.length > 0 && rec.records[0][childField] == parent[masterField])) {
                            rs._processed = true;
                            rs.mergeRecords(rec.records);
                            if (changes) {
                                var keyField = rs._SQL._keyFields[0].fieldName;
                                for (var k = 0; k < changes.length; k++) {
                                    var change = changes[k];
                                    if (change.tableClass == rs._SQL._tableClass) {
                                        if (Array.isArray(change.deleteRecords)) {
                                            for (var m = 0; m < change.deleteRecords.length; m++) {
                                                var item = change.deleteRecords[m];
                                                var old = rs._getRecordByPrimaryIndex(item[keyField]);
                                                if (old)
                                                    rs.delete(old);
                                            }
                                        }
                                        if (Array.isArray(change.updateRecords)) {
                                            for (var m = 0; m < change.updateRecords.length; m++) {
                                                var item = change.updateRecords[m];
                                                var old = rs._getRecordByPrimaryIndex(item[keyField]);
                                                if (old) {
                                                    for (var v in item)
                                                        old.setFieldValue(v, item[v]);
                                                }
                                            }
                                        }
                                        if (Array.isArray(change.insertRecords) && change.insertRecords.length > 0) {
                                            if (parent instanceof _TPDContext || (change.insertRecords[0][childField] == parent[masterField])) {
                                                for (var m = 0; m < change.insertRecords.length; m++) {
                                                    var item = change.insertRecords[m];
                                                    var rec = rs.append();
                                                    for (var v in item)
                                                        rec._record[v] = item[v];
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else if (changes) {
                            var keyField = rs._SQL._keyFields[0].fieldName;
                            for (var k = 0; k < changes.length; k++) {
                                var change = changes[k];
                                if (change.tableClass == rs._SQL._tableClass) {
                                    if (Array.isArray(change.insertRecords) && change.insertRecords.length > 0) {
                                        if (parent instanceof _TPDContext || (change.insertRecords[0][childField] == parent[masterField])) {
                                            rs._processed = true;
                                            for (var m = 0; m < change.insertRecords.length; m++) {
                                                var item = change.insertRecords[m];
                                                var rec = rs.append();
                                                for (var v in item)
                                                    rec._record[v] = item[v];
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        var rd = rs.first;
                        while (rd) {
                            loadData(rd);
                            rd = rs.next;
                        }
                        if (rs._records.length > 0)
                            rs._current = rs._records[0];
                    }
                }
            }
            loadData(this);
        }
        beginTransaction(callback) {
            this._beginTransaction = true;
        }
        rollback(callback) {
            this._beginTransaction = false;
        }
        execSQL(sql, params) {
            var qry = {};
            qry.url = this.contextURL;
            qry.sql = sql;
            qry.database = this.database;
            qry.params = params;
            var result;
            var self = this;
            return new Promise(async function (resolve, reject) {
                try {
                    _$$pdm.fetch(self._endPoint, qry, function (err, result, fields) {                        
                        if (err)
                            reject(err);
                        else
                            resolve(result);
                    });
                }
                catch (err) {                    
                    reject(err);
                }
            });
        }
        fetchRecords(callback, fetchNow, all) {
            var self = this;
            var queries = [];
            var resultSet = [];
            return new Promise(async function (resolve, reject) {
                for (var id in self._fetchRecordsets) {
                    var rs = self._fetchRecordsets[id];
                    var query = rs._query();
                    if (query) {
                        queries.push(query);
                    }
                }
                if (queries.length > 0) {
                    var qry = {};
                    qry.url = self.contextURL;
                    qry.acl = self._loadAcl;
                    qry.queries = queries;
                    qry.database = self.database;
                    _$$pdm.fetch(self._endPoint, qry, function (err, result) {                        
                        if (result && result.success === true) {
                            self._loadAcl = true;
                            for (var i = 0; i < result.data.length; i++) {
                                var data = result.data[i];
                                var rs = self._fetchRecordsets[data.uid];
                                delete self._fetchRecordsets[data.uid];
                                if (rs) {
                                    resultSet.push({
                                        uid: rs._uid,
                                        data: rs.mergeRecords(data.records)
                                    });
                                    if (rs._masterRecord && rs._masterRecord._snapshot && rs._masterRecord._snapshot.length > 0)
                                        rs.snapshot();
                                    if (self._fetchRecordsetsCallback[data.uid])
                                        self._fetchRecordsetsCallback[data.uid](rs);
                                    delete self._fetchRecordsetsCallback[data.uid];
                                }
                            }
                            return resolve(resultSet);
                        }
                        else {
                            var err = result.responseText || result.error || '$exception';
                            if (err && err.code)
                                err = "Oops! We've encountered a problem trying to process your request. Please try again.";
                            return reject(err);
                        }
                    });
                }
            });
        }
        query(query) {
            var qry = {};
            qry.url = this.contextURL;
            qry.query = query;
            qry.schema = this._schema;
            qry.database = this.database;
            qry.withSchema = true;
            var result;
            var self = this;
            return new Promise(async function (resolve, reject) {
                try {
                    _$$pdm.fetch(self._endPoint, qry, function (err, data) {                        
                        var err = data.responseText || data.error;
                        if (data.data && data.schema) {
                            result = data.data;
                            self._queryResult.push({
                                orig: JSON.parse(JSON.stringify(data.data)),
                                data: result,
                                schema: data.schema
                            });
                        }
                        resolve();
                    });
                }
                catch (err) {
                    reject(err);
                }
            });
        }
        getChanges(recordSetType) {
            var records = [];
            for (var n in this._modifiedRecordset) {
                var rs = this._modifiedRecordset[n];
                if (rs instanceof recordSetType) {
                    var modified = false;
                    var reqRecord = {};
                    var deleteRecords = [];
                    var insertRecords = [];
                    var updateRecords = [];
                    var fields = rs._SQL._fields;
                    var keyFields = rs._SQL._keyFields;
                    for (var k in rs._deleted) {
                        var record = rs._deleted[k];
                        var rec = {};
                        for (var i = 0; i < keyFields.length; i++) {
                            rec['$' + keyFields[i].fieldName] = record._oldValues[keyFields[i].fieldName] || record._record[keyFields[i].fieldName];
                            rec[keyFields[i].fieldName] = record._record[keyFields[i].fieldName];
                        }
                        deleteRecords.push(rec);
                        modified = true;
                    }
                    for (var k in rs._appended) {
                        var record = rs._appended[k];
                        record._record._uid = record._uid;
                        for (var i = 0; i < rs._SQL._dateFields.length; i++) {
                            var field = rs._SQL._dateFields[i];
                            var value = record._record[field];
                            if (value) {
                                record._record[field] = formatDateTime(parseDateTime(value));
                            }
                        }
                        var rec = {};
                        for (var v in record._record) {
                            if (record._record[v] && typeof (record._record[v]) == 'object')
                                rec[v] = JSON.stringify(record._record[v]);
                            else
                                rec[v] = record._record[v];
                        }
                        insertRecords.push(rec);
                        modified = true;
                    }
                    for (var k in rs._modified) {
                        var record = rs._modified[k];
                        for (var i = 0; i < rs._SQL._dateFields.length; i++) {
                            var field = rs._SQL._dateFields[i];
                            var value = record._record[field];
                            if (value) {
                                record._record[field] = formatDateTime(parseDateTime(value));
                            }
                        }
                        var rec = {};
                        for (var v in record._record) {
                            if (record._record[v] && typeof (record._record[v]) == 'object')
                                rec[v] = JSON.stringify(record._record[v]);
                            else
                                rec[v] = record._record[v];
                        }
                        for (var i = 0; i < keyFields.length; i++) {
                            rec['$' + keyFields[i].fieldName] = record._oldValues[keyFields[i].fieldName] || record._record[keyFields[i].fieldName];
                        }
                        updateRecords.push(rec);
                        modified = true;
                    }
                    if (modified) {
                        reqRecord.uid = rs._uid;
                        reqRecord.table = rs._tableName;
                        reqRecord.insertRecords = insertRecords;
                        reqRecord.updateRecords = updateRecords;
                        reqRecord.deleteRecords = deleteRecords;
                        records.push(reqRecord);
                    }
                }
            }
            if (records.length > 0) {
                var qry = {};
                qry.url = this.contextURL;
                qry.records = records;
                qry.database = this.database;
                return qry;
            }
        }
        get endPoint() {
            return this._endPoint;
        }
        set endPoint(value) {
            if (!value || typeof (value) == 'string')
                this._optionEndPoint = value;
        }
        _genGUID() {
            var d = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
            uuid = uuid.replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
            });
            return uuid;
        }
        _getUID() {
            this._uid++;
            return this._uid;
        }
        isModified() {
            for (var n in this._modifiedRecordset)
                return true;
            return false;
        }
        loadChanges(recordSetType, recordType, data) {
            var rs;
            for (var v in this) {
                if (this[v] instanceof recordSetType) {
                    rs = this[v];
                    break;
                }
            }
            if (!rs)
                rs = new recordSetType(this, recordType, null);
            if (data && data.records) {
                for (var i = 0; i < data.records.length; i++) {
                    var changes = {
                        insertRecords: data.records[i].insertRecords,
                        updateRecords: data.records[i].updateRecords,
                        deleteRecords: data.records[i].deleteRecords
                    };
                    rs._tableName = data.records[i].table;
                    rs.changes = changes;
                }
            }
            return rs;
        }
        get modified() {
            for (var n in this._modifiedRecordset)
                return true;
            return false;
        }
        get onCurrentChange() {
            return this._onCurrentChange;
        }
        set onCurrentChange(fn) {
            if (this._parent)
                this._onCurrentChange = $.proxy(fn, this._parent.__this);
            else
                this._onCurrentChange = fn;
        }
        get onRecordAppend() {
            return this._onRecordAppend;
        }
        set onRecordAppend(fn) {
            if (this._parent)
                this._onRecordAppend = $.proxy(fn, this._parent.__this);
            else
                this._onRecordAppend = fn;
        }
        get onRecordChange() {
            return this._onRecordChange;
        }
        set onRecordChange(fn) {
            if (this._parent)
                this._onRecordChange = $.proxy(fn, this._parent.__this);
            else
                this._onRecordChange = fn;
        }
        get onRecordDelete() {
            return this._onRecordDelete;
        }
        set onRecordDelete(fn) {
            if (this._parent)
                this._onRecordDelete = $.proxy(fn, this._parent.__this);
            else
                this._onRecordDelete = fn;
        }
        get beforeFileUpload() {
            return this._beforeFileUpload;
        }
        set beforeFileUpload(fn) {
            if (this._parent)
                this._beforeFileUpload = $.proxy(fn, this._parent.__this);
            else
                this._beforeFileUpload = fn;
        }
        get onSaveConflict() {
            return this._onSaveConflict;
        }
        set onSaveConflict(fn) {
            if (this._parent)
                this._onSaveConflict = $.proxy(fn, this._parent.__this);
            else
                this._onSaveConflict = fn;
        }
        get onStateChange() {
            return this._onStateChange;
        }
        set onStateChange(fn) {
            if (this._parent)
                this._onStateChange = $.proxy(fn, this._parent.__this);
            else
                this._onStateChange = fn;
        }
        _saveQuery(schema, data1, data2) {
            var self = this;
            function getKeyField(fields) {
                for (var v in fields) {
                    var field = fields[v].field || fields[v];
                    if (field.keyField)
                        return field;
                }
            }
            function compareObjects(obj1, obj2) {
                for (var v in obj1)
                    if (obj1[v] != obj2[v])
                        return false;
                for (var v in obj2)
                    if (obj1[v] == undefined)
                        return false;
                return true;
            }
            function compareRecord(fields, rec1, rec2) {
                var result = {};
                var changed = false;
                for (var v in fields) {
                    var field = fields[v];
                    if (field.field) {
                        var fieldName = field.field.fieldName;
                        if (field.link) {
                            if (field.link.type == 1) {
                                if (rec2[v])
                                    result[field.link.childField] = rec2[v][field.link.parentField];
                                else
                                    result[field.link.childField] = '';
                            }
                        }
                        else if (rec1[v] && rec2[v] && typeof (rec1[v]) == 'object' &&
                            typeof (rec2[v]) == 'object') {
                            if (!compareObjects(rec1[v], rec2[v])) {
                                changed = true;
                                if (rec2[v] && typeof (rec2[v]) == 'object')
                                    result[fieldName] = JSON.stringify(rec2[v]);
                                result[fieldName] = rec2[v];
                            }
                        }
                        else if (rec1[v] != rec2[v]) {
                            changed = true;
                            if (rec2[v] && typeof (rec2[v]) == 'object')
                                result[fieldName] = JSON.stringify(rec2[v]);
                            else
                                result[fieldName] = rec2[v];
                        }
                    }
                }
                if (changed)
                    return result;
            }
            function compareDetails(schema, data1, data2, parentValue) {
                var data1 = data1 || {};
                var data2 = data2 || {};
                var records = [];
                for (var v in schema.fields) {
                    var field = schema.fields[v];
                    if (field.link) {
                        if (field.link.type == 0) {
                            var s = {
                                tableName: field.link.childTable,
                                fields: field.fields
                            };
                            records = records.concat(compare(s, data1[v], data2[v], field.link.childField, parentValue));
                        }
                        else {
                            var s = {
                                tableName: field.link.childTable,
                                fields: field.fields
                            };
                            records = records.concat(compareDetails(s, data1[v], data2[v]));
                        }
                    }
                }
                return records;
            }
            function compare(schema, data1, data2, parentField, parentValue) {
                var data1 = data1 || [];
                var data2 = data2 || [];
                if (schema.tableName && schema.fields) {
                    var changed = false;
                    var records = [];
                    var result = {
                        table: schema.tableName,
                        deleteRecords: [],
                        insertRecords: [],
                        updateRecords: []
                    };
                    var keyField = getKeyField(schema.fields);
                    var idx1 = {};
                    var idx2 = {};
                    for (var i = 0; i < data1.length; i++) {
                        var keyValue = data1[i][keyField.fieldName];
                        idx1[keyValue] = data1[i];
                    }
                    for (var i = 0; i < data2.length; i++) {
                        var keyValue = data2[i][keyField.fieldName];
                        if (!keyValue) {
                            keyValue = self._genGUID();
                            data2[i][keyField.fieldName] = keyValue;
                        }
                        idx2[keyValue] = data2[i];
                    }
                    for (var v in idx1) {
                        if (!idx2[v]) {
                            changed = true;
                            result.deleteRecords.push({
                                [keyField.fieldName]: v
                            });
                        }
                        else {
                            var changes = compareRecord(schema.fields, idx1[v], idx2[v]);
                            if (changes) {
                                changed = true;
                                changes[keyField.fieldName] = idx1[v][keyField.fieldName];
                                result.updateRecords.push(changes);
                            }
                            records = records.concat(compareDetails(schema, idx1[v], idx2[v], v));
                        }
                    }
                    for (var v in idx2) {
                        if (!idx1[v]) {
                            changed = true;
                            var changes = compareRecord(schema.fields, {}, idx2[v]);
                            if (parentField && parentValue)
                                changes[parentField] = parentValue;
                            result.insertRecords.push(changes);
                            records = records.concat(compareDetails(schema, {}, idx2[v], v));
                        }
                    }
                    if (changed)
                        records.push(result);
                    return records;
                }
                else {
                    for (var v in schema) {
                        return compare(schema[v], data1[v], data2[v]);
                    }
                }
            }
            return compare(schema, data1, data2);
        }
        clearSnapshot() {
            for (var v in this) {
                if (this[v] instanceof _TPDRecordSet)
                    this[v].clearSnapshot();
            }
            this._snapshot = [];
        }
        commit(callback) {
            if (this._snapshot.pop()) {
                for (var v in this) {
                    if (this[v] instanceof _TPDRecordSet)
                        this[v].commit();
                }
            }
            if (this._beginTransaction) {
                this._beginTransaction = false;
            }
        }
        restore() {
            var s = this._snapshot.pop();
            if (s) {
                this._changed = s._changed;
                this._modifiedRecordset = {};
                for (var n in s._modifiedRecordset)
                    this._modifiedRecordset[n] = s._modifiedRecordset[n];
                for (var v in this) {
                    if (this[v] instanceof _TPDRecordSet)
                        this[v].restore();
                }
                if (this._onStateChange)
                    this._onStateChange(this);
            }
        }
        snapshot() {
            var s = {
                _modifiedRecordset: {}
            };
            for (var n in this._modifiedRecordset)
                s._modifiedRecordset[n] = this._modifiedRecordset[n];
            this._snapshot.push(s);
            for (var v in this) {
                if (this[v] instanceof _TPDRecordSet)
                    this[v].snapshot();
            }
        }
        _getChanges() {
            var records = [];
            for (var n in this._modifiedRecordset) {
                var modified = false;
                var reqRecord = {};
                var deleteRecords = [];
                var insertRecords = [];
                var updateRecords = [];
                var rs = this._modifiedRecordset[n];
                var fields = rs._SQL._fields;
                if (rs._SQL._signFields.length > 0)
                    fields.push({
                        fieldName: '$$sig',
                        fieldType: TFieldType.ftString,
                        size: 1000
                    });
                var keyFields = rs._SQL._keyFields;
                for (var k in rs._deleted) {
                    var record = rs._deleted[k];
                    var rec = {};
                    for (var i = 0; i < keyFields.length; i++) {
                        if (record._oldValues[keyFields[i].fieldName] && record._oldValues[keyFields[i].fieldName] != record._record[keyFields[i].fieldName])
                            rec['$' + keyFields[i].fieldName] = record._oldValues[keyFields[i].fieldName] || record._record[keyFields[i].fieldName];
                        rec[keyFields[i].fieldName] = record._record[keyFields[i].fieldName];
                    }
                    deleteRecords.push(rec);
                    modified = true;
                }
                for (var k in rs._appended) {
                    var record = rs._appended[k];
                    record._sign();
                    record._record._uid = record._uid;
                    if (rs._SQL._multiLangFields.length > 0) {
                        var r = this._clone(record._record);
                        for (var i = 0; i < rs._SQL._multiLangFields.length; i++) {
                            var field = rs._SQL._multiLangFields[i];
                            if (record._record[field] && typeof (record._record[field]) == 'object')
                                r[field] = JSON.stringify(record._record[field]);
                            else
                                r[field] = record._record[field];
                        }
                        insertRecords.push(r);
                    }
                    else
                        insertRecords.push(record._record);
                    modified = true;
                }
                for (var k in rs._modified) {
                    var record = rs._modified[k];
                    record._sign();
                    var r = {};
                    for (var i = 0; i < rs._SQL._fields.length; i++) {
                        var field = rs._SQL._fields[i].fieldName;
                        if (rs._modifiedFields[field])
                            r[field] = record._record[field];
                    }
                    for (var i = 0; i < rs._SQL._keyFields.length; i++) {
                        var field = rs._SQL._keyFields[i].fieldName;
                        if (record._oldValues[field] && record._oldValues[field] != record._record[field])
                            r['$' + field] = record._oldValues[field] || record._record[field];
                        r[field] = record._record[field];
                    }
                    if (record._record['$$sig'])
                        r['$$sig'] = record._record['$$sig'];
                    if (rs._SQL._multiLangFields.length > 0) {
                        for (var i = 0; i < rs._SQL._multiLangFields.length; i++) {
                            var field = rs._SQL._multiLangFields[i];
                            if (r.hasOwnProperty(field)) {
                                if (r[field] && typeof (r[field]) == 'object')
                                    r[field] = JSON.stringify(r[field]);
                                else
                                    r[field] = r[field];
                            }
                        }
                    }
                    else {
                        for (var i = 0; i < rs._SQL._dateFields.length; i++) {
                            var field = rs._SQL._dateFields[i];
                            if (r.hasOwnProperty(field)) {
                                var value = r[field];
                                if (value) {
                                    r[field] = formatDateTime(parseDateTime(value));
                                }
                            }
                        }
                    }
                    updateRecords.push(r);
                    modified = true;
                }
                if (modified) {
                    reqRecord.uid = rs._uid;
                    reqRecord.table = rs._tableName;
                    reqRecord.tableClass = rs._SQL._tableClass;
                    reqRecord.fields = fields;
                    reqRecord.insertRecords = insertRecords;
                    reqRecord.updateRecords = updateRecords;
                    reqRecord.deleteRecords = deleteRecords;
                    records.push(reqRecord);
                }
            }
            return records;
        }
        save() {            
            var records = [];
            for (var i = 0; i < this._queryResult.length; i++) {
                var data = this._queryResult[i];
                records = records.concat(this._saveQuery(data.schema, data.orig, data.data));
            }
            var self = this;
            records = records.concat(this._getChanges());                  
            return new Promise(async function (resolve, reject) {                
                try {                 
                    if (records.length > 0) {                     
                        var qry = {};
                        qry.helper = self.options.helper;
                        qry.url = self.contextURL;
                        qry.records = records;
                        qry.database = self.database;
                        _$$pdm.fetch(self._endPoint, qry, function (err, result) {
                            if (result && result.success == true) {
                                var idx = {};
                                for (var v in self._modifiedRecordset)
                                    idx[v] = self._modifiedRecordset[v];
                                self.clearChanges(result);
                                if (result.data) {
                                    for (var i = 0; i < result.data.length; i++) {
                                        var data = result.data[i];
                                        var rs = idx[data.uid];
                                        if (rs) {
                                            rs.mergeRecords(data.records);
                                        }
                                    }
                                }
                                if (self._snapshot.length > 0) {
                                    self.commit();
                                    self.snapshot();
                                }
                            }
                            else {
                                if (result) {
                                    var err = result.error || result.responseText;
                                    if (err && err.message)
                                        err = err.message;
                                    else if (err && err.code)
                                        err = "$Oops!_We've_encountered_a_problem_trying_to_process_your_request._Please_try_again.";
                                    else if (typeof (err) != 'string')
                                        err = "$Oops!_We've_encountered_a_problem_trying_to_process_your_request._Please_try_again.";
                                }
                                else
                                    err = "$Oops!_We've_encountered_a_problem_trying_to_process_your_request._Please_try_again.";
                                if (result && result.error && result.error.uid && self._onSaveConflict) {
                                    var rs = self._modifiedRecordset[result.error.uid];
                                    if (result.error.records && result.error.records.length > 0) {
                                        var rd = rs.template();
                                        rd._record = result.error.records[0];
                                    }
                                    self._onSaveConflict(self, rs, rd);
                                }
                            }
                            resolve();
                        });
                    }
                    else
                        resolve();
                }
                catch (err) {
                    reject(err);
                }
            });
        }
        _updateModifiedRecordset(recordSet) {
            if (!recordSet.isModified()) {
                delete this._modifiedRecordset[recordSet._uid];
                if (this._changed && !this.isModified()) {
                    this._changed = false;
                    this._notifyDataBinding('modified', true);
                    if (this._onStateChange)
                        this._onStateChange(this);
                }
            }
        }
    }
    SQLEngine._TPDContext = _TPDContext;
    class TPDContext extends _TPDContext {
    }
    SQLEngine.TPDContext = TPDContext;
    class TPDField {
        constructor(fieldName, fieldType, keyField, size, archiveField, lockField, searchField, multiLang) {
            this.fieldName = fieldName;
            this.fieldType = fieldType;
            if (keyField)
                this.keyField = keyField;
            if (archiveField)
                this.archiveField = archiveField;
            if (lockField)
                this.lockField = lockField;
            if (searchField)
                this.searchField = searchField;
            if (multiLang)
                this.multiLang = multiLang;
            if (size != undefined)
                this.size = size;
            else
                this.size = 0;
        }
    }
    SQLEngine.TPDField = TPDField;
    class TOIField {
        constructor(sql, joint, fieldName) {
            this._joint = joint;
            this._SQL = sql;
            this._fieldName = fieldName;
            this._newItem('');
        }
        get asc() {
            this._newItem('');
            return this._joint;
        }
        get desc() {
            this._newItem('d');
            return this._joint;
        }
        _newItem(opt, value) {
            var item = {};
            item.opt = opt;
            item.field = this._fieldName;
            this._SQL.addOrderItem(item);
        }
    }
    SQLEngine.TOIField = TOIField;
    class _TQIField {
        constructor(sql, joint, fieldName, fieldType, keyField, size, archiveField, lockField, searchField, multiLang) {
            if (!(sql instanceof _TPDSQLClause)) {
                var o = sql;
                var sql = o.sql;
                var joint = o.joint;
                var fieldName = o.fieldName;
                var fieldType = o.fieldType;
                var keyField = o.keyField;
                var size = o.size;
                var archiveField = o.archiveField;
                var lockField = o.lockField;
                var searchField = o.searchField;
                var multiLang = o.multiLang;
                var encrypt = o.encrypt;
                var sign = o.sign;
                var readOnly = o.readOnly;
            }
            var field = new TPDField(fieldName, fieldType, keyField, size, archiveField, lockField, searchField, multiLang);
            this._joint = joint;
            this._SQL = sql;
            this._fieldName = fieldName;
            this._fieldType = fieldType;
            this._keyField = keyField;
            this._searchField = searchField;
            this._multiLang = multiLang;
            if (size != undefined) {
                field.size = size;
            }
            else
                this._size = 0;
            this._SQL._fields.push(field);
            if (keyField)
                this._SQL._keyFields.push(field);
            if (archiveField)
                this._SQL._archiveField = this;
            if (lockField)
                this._SQL._lockField = this;
            if (readOnly)
                this._SQL._readOnlyFields.push(field.fieldName);
            if (multiLang)
                this._SQL._multiLangFields.push(field.fieldName);
            if (encrypt)
                this._SQL._encryptFields.push(field.fieldName);
            if (sign)
                this._SQL._signFields.push(field.fieldName);
            if (field.fieldType == TFieldType.ftDateTime || field.fieldType == TFieldType.ftCreateDate || field.fieldType == TFieldType.ftModifyDate) {
                this._SQL._dateFields.push(field.fieldName);
                this._SQL._withDateField = true;
            }
        }
        _between(valueFrom, valueTo) {
            this._newItem('between', [valueFrom, valueTo]);
            return this._joint;
        }
        _equal(value) {
            this._newItem('=', value);
            return this._joint;
        }
        _greaterOrEqual(value) {
            this._newItem('>=', value);
            return this._joint;
        }
        _greaterThan(value) {
            this._newItem('>', value);
            return this._joint;
        }
        _in(value) {
            this._newItem('in', value);
            return this._joint;
        }
        _isMax() {
            this._newItem('ismax');
            return this._joint;
        }
        _isMin() {
            this._newItem('ismin');
            return this._joint;
        }
        _isNull() {
            this._newItem('isnull');
            return this._joint;
        }
        _lessOrEqual(value) {
            this._newItem('<=', value);
            return this._joint;
        }
        _lessThan(value) {
            this._newItem('<', value);
            return this._joint;
        }
        _like(value) {
            this._newItem('like', value);
            return this._joint;
        }
        _likeLower(value) {
            this._newItem('likelower', value);
            return this._joint;
        }
        _likeUpper(value) {
            this._newItem('likeupper', value);
            return this._joint;
        }
        _newItem(opt, value) {
            var item = {};
            item.opt = opt;
            item.field = this._fieldName;
            item.fieldType = this._fieldType;
            item.value = value;
            this._SQL.addItem(item);
        }
        _not() {
            this._SQL._not = true;
        }
    }
    SQLEngine._TQIField = _TQIField;
    class TQIDateField extends _TQIField {
        constructor(sql, joint, fieldName, fieldType, keyField, size, archiveField, lockField, searchField) {
            super(sql, joint, fieldName, TFieldType.ftDateTime, keyField, size, archiveField, lockField, searchField);
        }
        between(valueFrom, valueTo) {
            return super._between(valueFrom, valueTo);
        }
        equal(value) {
            return super._equal(value);
        }
        greaterOrEqual(value) {
            return super._greaterOrEqual(value);
        }
        greaterThan(value) {
            return super._greaterThan(value);
        }
        in(value) {
            return super._in(value);
        }
        get isMax() {
            return super._isMax();
        }
        get isMin() {
            return super._isMin();
        }
        get isNull() {
            return super._isNull();
        }
        lessOrEqual(value) {
            return super._lessOrEqual(value);
        }
        lessThan(value) {
            return super._lessThan(value);
        }
        get not() {
            super._not();
            return this;
        }
    }
    SQLEngine.TQIDateField = TQIDateField;
    class TQICreateDateField extends _TQIField {
        constructor(sql, joint, fieldName, fieldType, keyField, size, archiveField, lockField, searchField) {
            super(sql, joint, fieldName, TFieldType.ftCreateDate, keyField, size, archiveField, lockField, searchField);
        }
        between(valueFrom, valueTo) {
            return super._between(valueFrom, valueTo);
        }
        equal(value) {
            return super._equal(value);
        }
        greaterOrEqual(value) {
            return super._greaterOrEqual(value);
        }
        greaterThan(value) {
            return super._greaterThan(value);
        }
        in(value) {
            return super._in(value);
        }
        get isMax() {
            return super._isMax();
        }
        get isMin() {
            return super._isMin();
        }
        get isNull() {
            return super._isNull();
        }
        lessOrEqual(value) {
            return super._lessOrEqual(value);
        }
        lessThan(value) {
            return super._lessThan(value);
        }
        get not() {
            super._not();
            return this;
        }
    }
    SQLEngine.TQICreateDateField = TQICreateDateField;
    class TQIModifyDateField extends _TQIField {
        constructor(sql, joint, fieldName, fieldType, keyField, size, archiveField, lockField, searchField) {
            super(sql, joint, fieldName, TFieldType.ftModifyDate, keyField, size, archiveField, lockField, searchField);
        }
        between(valueFrom, valueTo) {
            return super._between(valueFrom, valueTo);
        }
        equal(value) {
            return super._equal(value);
        }
        greaterOrEqual(value) {
            return super._greaterOrEqual(value);
        }
        greaterThan(value) {
            return super._greaterThan(value);
        }
        in(value) {
            return super._in(value);
        }
        get isMax() {
            return super._isMax();
        }
        get isMin() {
            return super._isMin();
        }
        get isNull() {
            return super._isNull();
        }
        lessOrEqual(value) {
            return super._lessOrEqual(value);
        }
        lessThan(value) {
            return super._lessThan(value);
        }
        get not() {
            super._not();
            return this;
        }
    }
    SQLEngine.TQIModifyDateField = TQIModifyDateField;
    class TQINumericField extends _TQIField {
        constructor(sql, joint, fieldName, fieldType, keyField, size, archiveField, lockField, searchField) {
            super(sql, joint, fieldName, fieldType, keyField, size, archiveField, lockField, searchField);
        }
        between(valueFrom, valueTo) {
            return super._between(valueFrom, valueTo);
        }
        equal(value) {
            return super._equal(value);
        }
        greaterOrEqual(value) {
            return super._greaterOrEqual(value);
        }
        greaterThan(value) {
            return super._greaterThan(value);
        }
        in(value) {
            return super._in(value);
        }
        get isMax() {
            return super._isMax();
        }
        get isMin() {
            return super._isMin();
        }
        get isNull() {
            return super._isNull();
        }
        lessOrEqual(value) {
            return super._lessOrEqual(value);
        }
        lessThan(value) {
            return super._lessThan(value);
        }
        get not() {
            super._not();
            return this;
        }
    }
    SQLEngine.TQINumericField = TQINumericField;
    class TQIStringField extends _TQIField {
        constructor(sql, joint, fieldName, fieldType, keyField, size, archiveField, lockField, searchField, multiLang) {
            super(sql, joint, fieldName, fieldType, keyField, size, archiveField, lockField, searchField, multiLang);
        }
        between(valueFrom, valueTo) {
            return super._between(valueFrom, valueTo);
        }
        equal(value) {
            return super._equal(value);
        }
        greaterOrEqual(value) {
            return super._greaterOrEqual(value);
        }
        greaterThan(value) {
            return super._greaterThan(value);
        }
        in(value) {
            return super._in(value);
        }
        get isMax() {
            return super._isMax();
        }
        get isMin() {
            return super._isMin();
        }
        get isNull() {
            return super._isNull();
        }
        lessOrEqual(value) {
            return super._lessOrEqual(value);
        }
        lessThan(value) {
            return super._lessThan(value);
        }
        like(value) {
            return super._like(value);
        }
        likeLower(value) {
            return super._likeLower(value);
        }
        likeUpper(value) {
            return super._likeUpper(value);
        }
        get not() {
            super._not();
            return this;
        }
    }
    SQLEngine.TQIStringField = TQIStringField;
    class TQIBooleanField extends _TQIField {
        constructor(sql, joint, fieldName, fieldType, keyField, size, archiveField, lockField, searchField) {
            super(sql, joint, fieldName, TFieldType.ftBoolean, keyField, size, archiveField, lockField, searchField);
        }
        equal(value) {
            return super._equal(value);
        }
        get isNull() {
            return super._isNull();
        }
        get not() {
            super._not();
            return this;
        }
    }
    SQLEngine.TQIBooleanField = TQIBooleanField;
    class TQIFileField extends _TQIField {
        constructor(sql, joint, fieldName, fieldType, keyField, size, archiveField, lockField, searchField, multiLang) {
            super(sql, joint, fieldName, TFieldType.ftFile, keyField, size, archiveField, lockField, searchField, multiLang);
        }
        get isNull() {
            return super._isNull();
        }
        get not() {
            super._not();
            return this;
        }
    }
    SQLEngine.TQIFileField = TQIFileField;
    class _TPDSQLClause {
        constructor(context) {
            this._queries = [];
            this._orderBy = [];
            this._fields = [];
            this._textFields = {};
            this._fieldIndex = {};
            this._keyFields = [];
            this._dateFields = [];
            this._multiLangFields = [];
            this._readOnlyFields = [];
            this._encryptFields = [];
            this._signFields = [];
            this._context = context;
        }
        _getQueryFields() {
            var result = [];
            for (var i = 0; i < this._fields.length; i++) {
                var field = this._fields[i];
                if (this._context.options.lazyLoad && field.fieldType == TFieldType.ftString && field.size == 0)
                    this._textFields[field.fieldName] = field;
                else
                    result.push(field);
            }
            return result;
        }
        _getField(fieldName) {
            if (this._fieldIndex[fieldName])
                return this._fieldIndex[fieldName];
            for (var i = 0; i < this._fields.length; i++) {
                if (this._fields[i].fieldName == fieldName) {
                    this._fieldIndex[fieldName] = this._fields[i];
                    return this._fields[i];
                }
            }
        }
        addItem(item) {
            if (this._not)
                item.not = true;
            this._not = false;
            if (!this._query)
                this._query = [];
            this._query.push(item);
        }
        addOrderItem(item) {
            for (var i = 0; i < this._orderBy.length; i++) {
                if (this._orderBy[i].field == item.field) {
                    this._orderBy[i].opt = item.opt;
                    return;
                }
            }
            this._orderBy.push(item);
        }
        addQuery(joint) {
            if (this._query) {
                this._queries.push(this._query);
                if (joint)
                    this._queries.push(joint);
                this._query = undefined;
            }
        }
        assign(qry) {
            this._query = undefined;
            this._queries = [qry];
        }
        reset() {
            this._query = undefined;
            this._queries = [];
        }
        query() {
            if (this._query)
                this._queries.push(this._query);
            this._query = undefined;
            if (this._queries.length > 0) {
                var queries = this._queries;
                return queries;
            }
        }
    }
    SQLEngine._TPDSQLClause = _TPDSQLClause;
    class _TPDDetailRecordSet {
        constructor(context, masterRecordSet, detailRecordSet, isSQL, recordSetClass, recordClass, tableName) {
            this._context = context;
            this._isSQL = isSQL;
            this._masterRecordSetName = masterRecordSet;
            this._detailRecordSetName = detailRecordSet;
            this._recordSetClass = recordSetClass;
            this._recordClass = recordClass;
            this._tableName = tableName;
        }
        get _encryptFields() {
            if (this._context[this._masterRecordSetName].current) {
                var rs = this._context[this._masterRecordSetName].current[this._detailRecordSetName];
                return this._context._encryptFields[rs._tableName] || rs._encryptFields;
            }
        }
        get _SQL() {
            if (this.__recordSet) {
                return this.__recordSet._SQL;
            }
            else if (this._context[this._masterRecordSetName].current) {
                var rs = this._context[this._masterRecordSetName].current[this._detailRecordSetName];
                return rs._SQL;
            }
        }
        get acl() {
            if (this.__recordSet) {
                return this.__recordSet.acl;
            }
            else if (this._context[this._masterRecordSetName].current) {
                var rs = this._context[this._masterRecordSetName].current[this._detailRecordSetName];
                return this._context._acl[rs._tableName] || rs.acl;
            }
        }
        get _dataLoaded() {
            if (this.__recordSet) {
                return this.__recordSet._dataLoaded;
            }
            else if (this._context[this._masterRecordSetName].current) {
                if (!this._context[this._masterRecordSetName].current[this._detailRecordSetName]._dataLoaded)
                    this._context[this._masterRecordSetName].current[this._detailRecordSetName].first;
                return this._context[this._masterRecordSetName].current[this._detailRecordSetName]._dataLoaded;
            }
        }
        append() {
            if (this._context.options._readOnly) {
                return;
            }
            if (this.__recordSet) {
                return this.__recordSet.append();
            }
            else if (this._context[this._masterRecordSetName].current) {
                var rec = this._context[this._masterRecordSetName].current[this._detailRecordSetName].append();
                return rec;
            }
        }
        get count() {
            if (this.__recordSet) {
                return this.__recordSet.count;
            }
            else if (this._context[this._masterRecordSetName].current) {
                return this._context[this._masterRecordSetName].current[this._detailRecordSetName].count;
            }
            else
                return 0;
        }
        get current() {
            if (this.__recordSet) {
                return this.__recordSet.current;
            }
            else if (this._context[this._masterRecordSetName].current) {
                var rs = this._context[this._masterRecordSetName].current[this._detailRecordSetName];
                rs._isSQL = this._isSQL;
                if (this._isSQL)
                    rs._tableName = this._detailRecordSetName;
                rs._lockUponSave = this._lockUponSave;
                var rec = rs.current;
                if (this._current != rec) {
                    this._current = rec;
                }
                return rec;
            }
        }
        set current(record) {
            if (this.__recordSet) {
                this.__recordSet.current = record;
            }
            else if (this._context[this._masterRecordSetName].current) {
                this._context[this._masterRecordSetName].current[this._detailRecordSetName].current = record;
            }
            if (this._current != record) {
                this._current = record;
            }
        }
        delete(record) {
            if (this._context.options._readOnly) {
                return;
            }
            if (this.__recordSet) {
                var rec = this.__recordSet.delete(record);
                if (this._current != rec) {
                    this._current = rec;
                }
                return rec;
            }
            else if (this._context[this._masterRecordSetName].current) {
                var rec = this._context[this._masterRecordSetName].current[this._detailRecordSetName].delete(record);
                if (this._current != rec) {
                    this._current = rec;
                }
                return rec;
            }
        }
        _applyQueries(queries) {
            if (this.__recordSet)
                return this.__recordSet._applyQueries(queries);
        }
        search(value, localOnly, limit) {
            if (this.__recordSet)
                return this.__recordSet.search(value, localOnly, limit);
        }
        fetchRecords(callback, fetchNow, all) {
            if (this.__recordSet || ((this.isMaster || fetchNow) && !this._context[this._masterRecordSetName].current && this._recordSetClass && this._recordClass)) {
                if (!this.__recordSet)
                    this.__recordSet = new this._recordSetClass(this._context, this._recordClass, this._tableName, null, this._isSQL);
                return this.__recordSet.fetchRecords(callback, fetchNow, all);
            }
        }
        fetchRangeRecords(start, count) {
            if (this.__recordSet || (!this._context[this._masterRecordSetName].current && this._recordSetClass && this._recordClass)) {
                this.isMaster = true;
                if (!this.__recordSet)
                    this.__recordSet = new this._recordSetClass(this._context, this._recordClass, this._tableName, null, this._isSQL);
                this.__recordSet._rangeStart = start;
                this.__recordSet._rangeCount = count;
                return this.__recordSet.fetchRecords(true);
            }
        }
        get first() {
            if (this.__recordSet) {
                return this.__recordSet.first;
            }
            else if (this._context[this._masterRecordSetName].current) {
                var rec = this._context[this._masterRecordSetName].current[this._detailRecordSetName].first;
                if (this._current != rec) {
                    this._current = rec;
                }
                return rec;
            }
        }
        get masterRecordSet() {
            if (!this._masterRecordSet)
                this._masterRecordSet = this._context[this._masterRecordSetName];
            return this._masterRecordSet;
        }
        get query() {
            if (!this._context[this._masterRecordSetName].current && this._recordSetClass && this._recordClass) {
                if (!this.__recordSet)
                    this.__recordSet = new this._recordSetClass(this._context, this._recordClass, this._tableName, null, this._isSQL);
                return this.__recordSet.query;
            }
            else if (this._context[this._masterRecordSetName].current) {
                return this._context[this._masterRecordSetName].current[this._detailRecordSetName].query;
            }
        }
        get readOnly() {
            if (this._context[this._masterRecordSetName].current) {
                var rs = this._context[this._masterRecordSetName].current[this._detailRecordSetName];
                var acl = this._context._acl;
                if (acl && acl[this._detailRecordSetName])
                    rs.acl = acl[this._detailRecordSetName];
                return rs.readOnly;
            }
        }
        records(index) {
            if (this.__recordSet)
                return this.__recordSet._records[index];
        }
        get _records() {
            if (this.__recordSet) {
                return this.__recordSet._records;
            }
            else if (this._context[this._masterRecordSetName].current) {
                return this._context[this._masterRecordSetName].current[this._detailRecordSetName]._records;
            }
        }
        get _recordSet() {
            return this._context[this._detailRecordSetName];
        }
        get _uid() {
            if (this.__recordSet && this.__recordSet.current) {
                return this.__recordSet.current._uid;
            }
            else if (this._context[this._masterRecordSetName].current)
                return this._context[this._masterRecordSetName].current[this._detailRecordSetName]._uid;
        }
    }
    SQLEngine._TPDDetailRecordSet = _TPDDetailRecordSet;
    class _TPDRecordSet {
        constructor(context, recordType, tableName, detailRecordSet, isSQL) {
            this.recordType = recordType;
            this._dataLoaded = false;
            this._primaryIndex = {};
            this._missingKeyIndex = {};
            this._records = [];
            this._appended = {};
            this._modified = {};
            this._modifiedFields = {};
            this._deleted = {};
            this._snapshot = [];
            this._masterLink = {};
            this._fetchingQuery = undefined;
            this._context = context;
            this._uid = this._context._getUID();
            this._isSQL = isSQL;
            if (detailRecordSet) {
                this._masterRecordSet = tableName;
                this._detailRecordSet = detailRecordSet;
            }
            else {
                this._tableName = tableName;
                this._SQL = new _TPDSQLClause(context);
                this._SQL._recordSet = this;
            }
        }
        _addRecordByPrimaryIndex(record, rec) {
            var idx = undefined;
            if (this._SQL._keyFields.length > 0) {
                for (var i = 0; i < this._SQL._keyFields.length; i++) {
                    var field = this._SQL._keyFields[i];
                    if (i == this._SQL._keyFields.length - 1) {
                        if (!idx)
                            idx = this._primaryIndex;
                        var r = idx[record[field.fieldName]];
                        if (!r) {
                            if (!rec) {
                                var rec = new this.recordType(this, record);
                            }
                            idx[record[field.fieldName]] = rec;
                            this._records.push(rec);
                            return rec;
                        }
                        else if (!this._modified[r._uid] && !r._deleted) {
                            for (var v in record)
                                r._record[v] = record[v];
                            return r;
                        }
                        else
                            return r;
                    }
                    else {
                        if (!idx)
                            idx = this._primaryIndex;
                        if (!idx[record[field.fieldName]]) {
                            var newIdx = {};
                            idx[record[field.fieldName]] = newIdx;
                            idx = newIdx;
                        }
                        else
                            idx = idx[record[field.fieldName]];
                    }
                }
            }
            else {
                if (!rec)
                    var rec = new this.recordType(this, record);
                this._records.push(rec);
                return rec;
            }
        }
        commit() {
            if (this._snapshot.pop()) {
                for (var i = 0; i < this._records.length; i++)
                    this._records[i].commit();
            }
        }
        checkIsNewRecord(record) {
            if (record)
                return record._newRecord;
        }
        checkIsDeleted(record) {
            return record._deleted;
        }
        clearSnapshot() {
            for (var i = 0; i < this._records.length; i++)
                this._records[i].clearSnapshot();
            this._snapshot = [];
        }
        _getData() {
            var records = [];
            for (var i = 0; i < this._records.length; i++)
                records.push(this._records[i]._record);
            return {
                tableName: this._tableName,
                tableClass: this._SQL._tableClass,
                records: records
            };
        }
        restore() {
            if (this._current && this._current._detailRecordSet) {
                for (var v in this._current._detailRecordSet)
                    this._current._detailRecordSet[v].restore();
            }
            var s = this._snapshot.pop();
            if (s) {
                this._fetchAll = s._fetchAll;
                this._current = s.current;
                this._records = s.records;
                this._appended = s.appended;
                this._modified = s.modified;
                this._modifiedFields = s.modifiedFields;
                this._deleted = s.deleted;
                this._primaryIndex = s.primaryIndex;
                s = undefined;
                for (var i = 0; i < this._records.length; i++)
                    this._records[i].restore();
            }
        }
        snapshot() {
            var s = {
                _fetchAll: this._fetchAll,
                current: this._current,
                records: [],
                appended: {},
                modified: {},
                modifiedFields: {},
                deleted: {},
                primaryIndex: {}
            };
            for (var n in this._primaryIndex)
                s.primaryIndex[n] = this._primaryIndex[n];
            for (var i = 0; i < this._records.length; i++) {
                s.records.push(this._records[i]);
                this._records[i].snapshot();
            }
            for (var n in this._appended)
                s.appended[n] = this._appended[n];
            for (var n in this._modified)
                s.modified[n] = this._modified[n];
            for (var n in this._modifiedFields)
                s.modifiedFields[n] = this._modifiedFields[n];
            for (var n in this._deleted)
                s.deleted[n] = this._deleted[n];
            this._snapshot.push(s);
            if (this._current && this._current._detailRecordSet) {
                for (var v in this._current._detailRecordSet)
                    this._current._detailRecordSet[v].snapshot();
            }
        }
        append() {
            if (this._context.options._readOnly || this.readOnly || this._isSQL) {
                return;
            }
            this._dataLoaded = true;
            var rec = new this.recordType(this, {});
            rec._newRecord = true;
            this._appended[rec._uid] = rec;
            for (var i = 0; i < this._SQL._keyFields.length; i++) {
                var field = this._SQL._keyFields[i];
                if (field.keyField && field.fieldType == TFieldType.ftGUID) {
                    rec._record[field.fieldName] = this._context._genGUID();
                }
            }
            if (this._masterRecord) {
                for (var i = 0; i < this._masterLink.refFields.length; i++) {
                    rec._record[this._masterLink.refFields[i]] = this._masterRecord._record[this._masterLink.masterFields[i]];
                }
            }
            this._addRecordByPrimaryIndex(rec._record, rec);
            this._current = rec;
            this._context._addModifiedRecordset(this, rec);
            this._notifyCurrentChange();
            return rec;
        }
        _addQueries(fields, queries) {
        }
        _applyQueries(queries) {
            this._fetchingQuery = undefined;
            this._queries = queries || [];
            this._SQL.query();
            var _queries = this._SQL._queries;
            var query = this['query'].where;
            var fields = {};
            for (var v in query) {
                if (query[v] instanceof _TQIField) {
                    fields[query[v]._fieldName] = query[v];
                    fields[v] = query[v];
                }
            }
            function getNot(query) {
                if (query.opt)
                    return query.not;
                return query.condition == ECondition.notEqual ||
                    query.condition == ECondition.notContain ||
                    query.condition == ECondition.notBetween ||
                    query.condition == ECondition.notIn ||
                    query.condition == ECondition.notBeginWith ||
                    query.condition == ECondition.notEndWith ||
                    query.condition == ECondition.notEmpty;
            }
            function getOpt(query) {
                if (query.opt)
                    return query.opt;
                switch (query.condition) {
                    case ECondition.equal:
                        return '=';
                    case ECondition.notEqual:
                        return '=';
                    case ECondition.contain:
                        return 'like';
                    case ECondition.notContain:
                        return 'like';
                    case ECondition.between:
                        return 'between';
                    case ECondition.notBetween:
                        return 'between';
                    case ECondition.greater:
                        return '>';
                    case ECondition.greaterOrEqual:
                        return '>=';
                    case ECondition.less:
                        return '<';
                    case ECondition.lessOrEqual:
                        return '<=';
                    case ECondition.in:
                        return 'in';
                    case ECondition.notIn:
                        return 'in';
                    case ECondition.beginWith:
                        return 'like';
                    case ECondition.notBeginWith:
                        return 'like';
                    case ECondition.endWith:
                        return 'like';
                    case ECondition.notEndWith:
                        return 'like';
                    case ECondition.empty:
                        return 'isnull';
                    case ECondition.notEmpty:
                        return 'isnull';
                }
            }
            function getValue(query) {
                if (query.opt)
                    return query.value;
                if (typeof (query.value) == 'undefined')
                    return;
                switch (query.condition) {
                    case ECondition.contain:
                        return '%' + query.value + '%';
                    case ECondition.notContain:
                        return '%' + query.value + '%';
                    case ECondition.in:
                        if (query.value)
                            return query.value.split(',').map(function (s) {
                                if (s)
                                    return s.trim();
                            });
                        else
                            return [];
                    case ECondition.notIn:
                        if (query.value)
                            return query.value.split(',').map(function (s) {
                                if (s)
                                    return s.trim();
                            });
                        else
                            return [];
                    case ECondition.beginWith:
                        return query.value + '%';
                    case ECondition.notBeginWith:
                        return query.value + '%';
                    case ECondition.endWith:
                        return '%' + query.value;
                    case ECondition.notEndWith:
                        return '%' + query.value;
                    default:
                        return query.value;
                }
            }
            function getQuery(query) {
                var field = fields[query.field];
                if (field) {
                    var result = {
                        field: field._fieldName,
                        fieldType: field._fieldType,
                        opt: getOpt(query),
                        not: getNot(query),
                        value: getValue(query)
                    };
                    if (typeof (result.value) == 'undefined')
                        return;
                    if (query.queries && query.queries.length > 0) {
                        if (query.queries[0].andOr)
                            var cond = { opt: 'or' };
                        else
                            var cond = { opt: 'and' };
                        var arrayResult = getQueries(query.queries);
                        arrayResult.unshift(cond);
                        arrayResult.unshift(result);
                        return arrayResult;
                    }
                    else
                        return result;
                }
                else if (query.opt)
                    return query;
            }
            function getQueries(queries) {
                var result = [];
                for (var i = 0; i < queries.length; i++) {
                    var query = queries[i];
                    if (i == 0 && !query.opt) {
                        if (query.andOr)
                            var cond = { opt: 'or' };
                        else
                            var cond = { opt: 'and' };
                    }
                    var q = getQuery(query);
                    if (q) {
                        q.item_guid = query.item_guid;
                        q.menu_guid = query.menu_guid;
                        if (cond && result.length > 0 && (Array.isArray(q) || q.field))
                            result.push(cond);
                        result.push(q);
                    }
                }
                return result;
            }
            if (_queries.length > 0)
                this._SQL._queries = [getQueries(queries), { opt: 'and' }, _queries];
            else
                this._SQL._queries = getQueries(queries);
        }
        get changes() {
            var result = {
                table: this._tableName,
                tableClass: this._SQL._tableClass,
                insertRecords: [],
                updateRecords: [],
                deleteRecords: []
            };
            var keyFields = this._SQL._keyFields;
            for (var k in this._deleted) {
                var record = this._deleted[k];
                var rec = {};
                for (var i = 0; i < keyFields.length; i++) {
                    rec[keyFields[i].fieldName] = record._record[keyFields[i].fieldName];
                }
                result.deleteRecords.push(rec);
            }
            for (var k in this._appended) {
                var record = this._appended[k];
                record._record._uid = record._uid;
                result.insertRecords.push(record._record);
            }
            for (var k in this._modified) {
                var record = this._modified[k];
                result.updateRecords.push(record._record);
            }
            return result;
        }
        set changes(data) {
            if (data.deleteRecords) {
                for (var i = 0; i < data.deleteRecords.length; i++) {
                    var item = data.deleteRecords[i];
                    var rec = this.template();
                    for (var v in item) {
                        if (v && v[0] == '$')
                            rec._oldValues[v.substring(1)] = item[v];
                        else
                            rec._record[v] = item[v];
                    }
                    this.delete(rec);
                }
            }
            if (data.insertRecords) {
                for (var i = 0; i < data.insertRecords.length; i++) {
                    var item = data.insertRecords[i];
                    var rec = this.append();
                    for (var v in item)
                        rec._record[v] = item[v];
                }
            }
            if (data.updateRecords) {
                for (var i = 0; i < data.updateRecords.length; i++) {
                    var item = data.updateRecords[i];
                    var rec = this.template();
                    for (var v in item) {
                        if (v && v[0] == '$')
                            rec._oldValues[v.substring(1)] = item[v];
                        else {
                            this._modifiedFields[v] = true;
                            rec._record[v] = item[v];
                        }
                    }
                    this._records.push(rec);
                    this.modify(rec);
                }
            }
        }
        cloneRecord(record) {
            var rec = new this.recordType(this, {});
            rec._uid = this._context._genGUID();
            for (var v in record._record)
                rec._record[v] = record._record[v];
            for (var v in record._oldValues)
                rec._oldValues[v] = record._oldValues[v];
            return rec;
        }
        get count() {
            var self = this;
            if (this._fetchingRecords) {
                return new Promise(async function (resolve, reject) {
                    try {
                        if (self._fetchingRecords) {
                            self._fetchingRecords = false;
                            await self._context.fetchRecords();
                        }
                        resolve(self._records.length);
                    }
                    catch (err) {
                        reject(err);
                    }
                });
            }
            else
                return self._records.length;
        }
        get current() {
            return this._current;
        }
        set current(record) {
            if (this._current != record) {
                this._current = record;
                this._notifyCurrentChange();
            }
        }
        delete(record) {
            if (this._context.options._readOnly || this.readOnly || this._isSQL) {
                return;
            }
            var rec = record;
            if (rec._isLocked)
                return record;
            rec._deleted = true;
            if (record._isTemplate) {
                var rec = this.cloneRecord(rec);
                this._deleted[rec._uid] = rec;
                this._context._addModifiedRecordset(this);
            }
            else if (!rec._newRecord) {
                if (this._SQL._archiveField) {
                    rec.setFieldValue(this._SQL._archiveField._fieldName, true);
                    this._modified[rec._uid] = record;
                }
                else {
                    this._deleted[rec._uid] = record;
                    delete this._modified[rec._uid];
                }
                this._context._addModifiedRecordset(this, record);
            }
            else {
                delete this._appended[rec._uid];
                this._context._updateModifiedRecordset(this);
            }
            var idx = this._records.indexOf(record);
            if (idx >= 0)
                this._records.splice(idx, 1);
            if (!this._deleteAll) {
                this.current = this.first;
            }
            else {
            }
            this._notifyCurrentChange();
        }
        deleteAll() {
            if (this.readOnly || this._isSQL)
                return;
            this._deleteAll = true;
            if (this._masterRecord)
                var rd = this.first;
            for (var i = this._records.length - 1; i > -1; i--) {
                var record = this._records[i];
                this.delete(record);
            }
            this._deleteAll = false;
        }
        fetchRangeRecords(start, count) {
            this._rangeStart = start;
            this._rangeCount = count;
            return this.fetchRecords(true);
        }
        async fetchRecordCount() {            
            this._countOnly = true;
            this._context._addFetchRecordset(this, null);
            var data = await this._context.fetchRecords(undefined, true);
            for (var i = 0; i < data.length; i++) {
                if (data[i].uid == this._uid) {
                    var result = data[i].data;
                    break;
                }
            }
            this._countOnly = false;
            if (result && result.length > 0)
                return result[0].count;
            else
                return 0;
        }
        async fetchRecords(fetchNow, all, callback) {
            if (this._masterRecord && !fetchNow && all)
                this._fetchAll = true;
            this._fetchingRecords = true;
            this._context._addFetchRecordset(this, callback);
            if (fetchNow) {
                var data = await this._context.fetchRecords(undefined, true, all);
                for (var i = 0; i < data.length; i++) {
                    if (data[i].uid == this._uid) {
                        var result = data[i].data;
                        break;
                    }
                }
                var rs = new _TPDRecordSet(this._context, this.recordType, this._tableName);
                rs._dataLoaded = true;
                rs._SQL = this._SQL;
                if (result) {
                    for (var i = 0; i < result.length; i++) {
                        rs._addRecordByPrimaryIndex(result[i]._record, result[i]);
                    }
                }
                return rs;
            }
        }
        _fetchRecordsByKeyValue(values, async, refresh) {
            if (this._SQL._keyFields.length == 1) {
                var dataLoaded = this._dataLoaded;
                var qryValues = [];
                var index = this._primaryIndex;
                for (var i = 0; i < values.length; i++) {
                    if (refresh || (!index[values[i]] && !this._missingKeyIndex[values[i]]))
                        qryValues.push(values[i]);
                }
                if (qryValues.length > 0) {
                    if (this._fetchingQuery && this._fetchingQuery.qry && this._fetchingQuery.qry[0].opt == 'in') {
                        for (var i = 0; i < qryValues.length; i++)
                            this._fetchingQuery.qry[0].value.push(qryValues[i]);
                    }
                    else {
                        this._fetchingQuery = {};
                        var qry = [];
                        this._fetchingQuery.uid = this._uid;
                        if (!this._isSQL)
                            this._fetchingQuery.table = this._tableName;
                        this._fetchingQuery.fields = this._SQL._fields;
                        var field = this._SQL._keyFields[0];
                        var q = {};
                        q.field = field.fieldName;
                        q.opt = 'in';
                        q.value = qryValues;
                        qry.push(q);
                        this._fetchingQuery.qry = qry;
                        this._dataLoaded = false;
                        this._context._addFetchRecordset(this);
                    }
                }
                this._context.fetchRecords(undefined, true);
                this._dataLoaded = dataLoaded;
                var result = [];
                for (var i = 0; i < values.length; i++) {
                    if (index[values[i]])
                        result.push(index[values[i]]);
                    else
                        this._missingKeyIndex[values[i]] = true;
                }
                return result;
            }
            return [];
        }
        _fetchRecordByPrimaryKey(keyValue) {
            var keyField = this._SQL._keyFields[0].fieldName;
            var values = {};
            values[keyField] = keyValue;
            return this._fetchRecordByPrimaryIndex(values);
        }
        _fetchRecordByPrimaryIndex(values) {
            var dataLoaded = this._dataLoaded;
            this._fetchingQuery = {};
            var qry = [];
            this._fetchingQuery.uid = this._uid;
            this._fetchingQuery.table = this._tableName;
            this._fetchingQuery.fields = this._SQL._fields;
            for (var i = 0; i < this._SQL._keyFields.length; i++) {
                var field = this._SQL._keyFields[i];
                var q = {};
                q.field = field.fieldName;
                q.opt = '=';
                q.value = values[field.fieldName];
                qry.push(q);
                if (i > this._SQL._keyFields.length - 1) {
                    var q = {};
                    q.opt = 'and';
                    qry.push(q);
                }
            }
            this._fetchingQuery.qry = qry;
            this._dataLoaded = false;
            this._context._addFetchRecordset(this);
            this._context.fetchRecords(undefined, true);
            this._dataLoaded = dataLoaded;
            return this._getRecordByPrimaryIndex(values);
        }
        get fields() {
            return this._SQL._fields;
        }
        _filterCheckRecord(records, record, condition) {
            var result = false;
            if (condition.fieldType == TFieldType.ftDateTime || condition.fieldType == TFieldType.ftCreateDate || condition.fieldType == TFieldType.ftModifyDate) {
                var rec = parseDateTime(record._record[condition.field]);
            }
            else
                var rec = record._record[condition.field];
            var value = condition.value;
            switch (condition.opt) {
                case 'between':
                    result = rec >= value[0] && rec <= value[1];
                    break;
                case '=':
                    if (condition.fieldType == 5)
                        result = (rec == value) || (rec == undefined && value == '');
                    else
                        result = (rec == value);
                    break;
                case '>=':
                    result = rec >= value;
                    break;
                case '>':
                    result = rec > value;
                    break;
                case 'in':
                    result = value.indexOf(rec) > -1;
                    break;
                case 'ismax':
                    result = rec == value;
                    break;
                case 'ismin':
                    result = rec == value;
                    break;
                case 'isnull':
                    if (condition.fieldType == 5)
                        result = rec == undefined || rec == '';
                    else
                        result = rec == undefined;
                    break;
                case '<=':
                    result = rec <= value;
                    break;
                case '<':
                    result = rec < value;
                    break;
                case 'like':
                    if (rec && value) {
                        var b = value[0];
                        var e = value[value.length - 1];
                        var v;
                        if (b == '%' && e == '%')
                            v = value.replace(/%/g, '.*');
                        else if (b == '%')
                            v = value.replace(/%/g, '.*') + '^';
                        else if (e == '%')
                            v = '^' + value.replace(/%/g, '.*');
                        else
                            v = '^' + value.replace(/%/g, '.*');
                        var reg = new RegExp(v);
                        result = rec.match(reg) != null;
                    }
                    else
                        result = rec == value;
                    break;
                case 'likelower':
                    if (rec && value) {
                        var rec = rec.toLowerCase();
                        var value = value.toLowerCase();
                        var b = value[0];
                        var e = value[value.length - 1];
                        var v;
                        if (b == '%' && e == '%')
                            v = value.replace(/%/g, '.*');
                        else if (b == '%')
                            v = value.replace(/%/g, '.*') + '^';
                        else if (e == '%')
                            v = '^' + value.replace(/%/g, '.*');
                        else
                            v = '^' + value.replace(/%/g, '.*');
                        var reg = new RegExp(v);
                        result = rec.match(reg) != null;
                    }
                    else
                        result = rec == value;
                    break;
                case 'likeupper':
                    if (rec && value) {
                        var rec = rec.toUpperCase();
                        var value = value.toUpperCase();
                        var b = value[0];
                        var e = value[value.length - 1];
                        var v;
                        if (b == '%' && e == '%')
                            v = value.replace(/%/g, '.*');
                        else if (b == '%')
                            v = value.replace(/%/g, '.*') + '^';
                        else if (e == '%')
                            v = '^' + value.replace(/%/g, '.*');
                        else
                            v = '^' + value.replace(/%/g, '.*');
                        var reg = new RegExp(v);
                        result = rec.match(reg) != null;
                    }
                    else
                        result = rec == value;
                    break;
            }
            if (condition.not)
                return !result;
            else
                return result;
        }
        _filterIncludeRecords(fromRecords, toRecords, condition) {
            for (var i = fromRecords.length - 1; i > -1; i--) {
                var rec = fromRecords[i];
                if (this._filterCheckRecord(fromRecords, rec, condition)) {
                    toRecords.push(rec);
                    fromRecords.splice(i, 1);
                }
            }
        }
        _filterExcludeRecords(fromRecords, toRecords, condition) {
            for (var i = toRecords.length - 1; i > -1; i--) {
                var rec = toRecords[i];
                if (!this._filterCheckRecord(fromRecords, rec, condition)) {
                    fromRecords.push(rec);
                    toRecords.splice(i, 1);
                }
            }
        }
        filterRecords() {
            if (this._fetchingRecords) {
                this._fetchingRecords = false;
                this._context.fetchRecords();
            }
            var result = [];
            var records = this._records.slice(0);
            var exclusive;
            var self = this;
            function getMaxValue(cond) {
                for (var i = 0; i < self._records.length; i++) {
                    if (!cond.value || cond.value < self._records[i]._record[cond.field])
                        cond.value = self._records[i]._record[cond.field];
                }
            }
            function getMinValue(cond) {
                for (var i = 0; i < self._records.length; i++) {
                    if (!cond.value || cond.value > self._records[i]._record[cond.field])
                        cond.value = self._records[i]._record[cond.field];
                }
            }
            var query = this._SQL.query();
            if (query) {
                if (query.length > 0 && !Array.isArray(query[0]))
                    query = query.shift();
                for (var i = 0; i < query.length; i++) {
                    var qry = query[i];
                    if (!Array.isArray(qry)) {
                        exclusive = qry.opt == 'and';
                    }
                    else {
                        for (var k = 0; k < qry.length; k++) {
                            if (!qry[k].field) {
                                exclusive = qry[k].opt == 'and';
                            }
                            else {
                                if (qry[k].opt == 'ismax')
                                    getMaxValue(qry[k]);
                                if (qry[k].opt == 'ismin')
                                    getMinValue(qry[k]);
                                if (exclusive)
                                    this._filterExcludeRecords(records, result, qry[k]);
                                else
                                    this._filterIncludeRecords(records, result, qry[k]);
                            }
                        }
                    }
                }
            }
            else
                var result = records;
            var rs = new _TPDRecordSet(this._context, undefined, undefined);
            rs._records = result;
            return rs;
        }
        get first() {
            var self = this;
            return new Promise(async function (resolve, reject) {
                try {
                    if (self._fetchingRecords) {
                        self._fetchingRecords = false;
                        await self._context.fetchRecords();
                    }
                    if (self._records.length > 0) {
                        self.current = self._records[0];
                    }
                    else {
                        self.current = undefined;
                    }
                    resolve(self._current);
                }
                catch (err) {
                    reject(err);
                }
            });
        }
        getChangeLog(record, callback) {
            if (this._SQL._keyFields.length == 1) {
                var field = this._SQL._keyFields[0];
                var qry = {};
                qry.url = this._context.contextURL;
                qry.table = this._tableName;
                qry.fields = this._SQL._fields;
                qry.log = true;
                qry.database = this._context.database;
                qry.key = field;
                qry.keyValue = record._record[field.fieldName];
                var self = this;
                return new Promise(async function (resolve, reject) {
                    try {
                        _$$pdm.fetch(self._context._endPoint, qry, function (err, data) {
                            if (typeof(data) == 'string')
                                data = JSON.parse(data);
                            var err = data.responseText || data.error;
                            if (callback)
                                callback(err, data.data);
                            resolve(data.data);
                        });
                    }
                    catch (err) {
                        reject(err);
                    }
                });
            }
            else {
                if (callback)
                    callback();
                return new Promise(function (resolve) {
                    resolve();
                });
            }
        }
        _getDetailRecordSet(recordSet, record, table, refFields, masterFields) {
            if (this._current)
                return this._current._getDetailRecordSet(recordSet, record, table, refFields, masterFields);
            else
                return undefined;
        }
        getFieldValue(fieldName, fieldType) {
            if (!this._name) {
                for (var v in this._context) {
                    if (this._context[v] == this) {
                        this._name = v;
                        break;
                    }
                }
            }
            if (!this.current)
                this.first;
            if (this._current)
                return this._current.getFieldValue(fieldName, fieldType);
            else
                return '';
        }
        _getKeyField() {
            return this._SQL._keyFields[0];
        }
        _getReferenceRecord(className, refFields, masterFields) {
            if (this._current)
                return this._current._getReferenceRecord(className, refFields, masterFields);
            else
                return undefined;
        }
        _setReferenceRecord(className, record, refFields, masterFields) {
            if (this._current)
                return this._current._setReferenceRecord(className, record, refFields, masterFields);
        }
        _getRecordByPrimaryIndex(values) {
            if (this._fetchingQuery)
                this._context.fetchRecords(undefined, true);
            var result = undefined;
            for (var i = 0; i < this._SQL._keyFields.length; i++) {
                var field = this._SQL._keyFields[i];
                var keyValue;
                if (typeof (values) == 'string')
                    keyValue = values;
                else
                    keyValue = values[field.fieldName];
                if (i == this._SQL._keyFields.length - 1) {
                    if (!idx)
                        var idx = this._primaryIndex;
                    var rec = idx[keyValue];
                    if (rec) {
                        return rec;
                    }
                }
                else if (!idx)
                    var idx = this._primaryIndex;
                else if (idx[keyValue])
                    idx = idx[keyValue];
                else
                    return undefined;
            }
        }
        getRecordByPrimaryKey(key, refresh, checkOnly) {
            var index = this._primaryIndex;
            if (!refresh && index && index[key])
                return this._primaryIndex[key];
            else if (!this._fetchingQuery && this._missingKeyIndex[key])
                return;
            else if (checkOnly)
                return;
            var rs = this._fetchRecordsByKeyValue([key], false, refresh);
            if (rs.length == 1)
                return rs[0];
            else
                this._missingKeyIndex[key] = true;
        }
        isModified() {
            for (var n in this._appended)
                return true;
            for (var n in this._modified)
                return true;
            for (var n in this._deleted)
                return true;
            return false;
        }
        get modified() {
            return this._context._modifiedRecordset[this._uid] != undefined;
        }
        get keyFields() {
            return this._SQL._keyFields;
        }
        get last() {
            if (this._fetchingRecords) {
                this._fetchingRecords = false;
                this._context.fetchRecords();
            }
            if (this._records.length > 0) {
                this._current = this._records[this._records.length - 1];
            }
            else {
                this._current = undefined;
            }
            return this._current;
        }
        mergeConflict(record) {
            var rec = this._getRecordByPrimaryIndex(record._record);
            if (rec) {
                for (var v in record._record) {
                    if (typeof (rec._oldValues[v]) == 'undefined') {
                        if (this._SQL._withDateField && this._SQL._dateFields.indexOf(v) > -1)
                            rec._record[v] = formatDateTime(parseDateTime(record._record[v]));
                        else
                            rec._record[v] = record._record[v];
                    }
                }
            }
        }
        mergeRecords(data) {
            if (!this._countOnly) {
                try {
                    var result = [];
                    this._dataLoaded = true;
                    this._fetchingRecords = false;
                    if (this._SQL._signFields.length > 0) {
                        var modifyByField;
                        for (var i = 0; i < this._SQL._fields.length; i++) {
                            var field = this._SQL._fields[i];
                            if (field.fieldType == TFieldType.ftModifyBy) {
                                modifyByField = field.fieldName;
                                break;
                            }
                        }
                        if (modifyByField) {
                            var modifyByList = [];
                            for (var i = 0; i < data.length; i++) {
                                var item = data[i];
                                if (item && item['$$sig']) {
                                    var modifyByValue = item[modifyByField];
                                    if (modifyByList.indexOf(modifyByValue) < 0)
                                        modifyByList.push(modifyByValue);
                                }
                            }
                        }
                    }
                    for (var i = 0; i < data.length; i++) {
                        if (data[i]) {
                            var rec = this._addRecordByPrimaryIndex(data[i], null);
                            if (rec)
                                result.push(rec);
                        }
                    }
                    if (!this._current) {
                        this._current = this.first;
                        this._notifyCurrentChange();
                    }
                }
                catch (err) {
                    console.log(err);
                }
                return result;
            }
            else
                return data;
        }
        modify(rec) {
            if (this.readOnly || this._isSQL)
                return;
            if (rec._isTemplate) {
                var r = this.cloneRecord(rec);
                this._modified[r._uid] = r;
                this._context._addModifiedRecordset(this);
            }
        }
        get next() {
            if (this._current) {
                var idx = this._records.indexOf(this._current);
                if (idx < this._records.length - 1) {
                    this._current = this._records[idx + 1];
                }
                else {
                    this._current = undefined;
                }
                this._notifyCurrentChange();
                return this._current;
            }
        }
        _notifyCurrentChange() {
            if (this._context._onCurrentChange || this._context._page) {
                if (this._onCurrentChangeTimer)
                    clearTimeout(this._onCurrentChangeTimer);
                var self = this;
                this._onCurrentChangeTimer = setTimeout(function () {
                    self._onCurrentChangeTimer = undefined;
                    if (self._context._onCurrentChange)
                        self._context._onCurrentChange(self._context, self, self._current);
                    if (self._context._page)
                        self._context._notifyDataBinding(self._name, '');
                }, 1);
            }
        }
        get previous() {
            if (this._current) {
                var idx = this._records.indexOf(this._current);
                if (idx > 0) {
                    this._current = this._records[idx - 1];
                }
                else {
                    this._current = undefined;
                }
                this._notifyCurrentChange();
                return this._current;
            }
        }
        _query() {
            var query = {};
            if (this._countOnly)
                query.countOnly = true;
            if (this._rangeStart != undefined && this._rangeCount != undefined) {
                query.range = {
                    start: this._rangeStart,
                    count: this._rangeCount
                };
                this._rangeStart = undefined;
                this._rangeCount = undefined;
            }
            if (this._isSQL) {
                query.uid = this._uid;
                query.tableClass = this._tableName;
                query.params = this._params;
                if (this._params && this._params.length > 0)
                    return query;
            }
            if (this._fetchAll) {
            }
            if (this._fetchingQuery) {
                var query = this._fetchingQuery;
                if (this._isSQL) {
                    query.tableClass = this._tableName;
                    query.params = this._params;
                }
                this._fetchingQuery = undefined;
                return query;
            }
            else if (this._masterRecord) {
                var qry = [];
                query.uid = this._uid;
                if (!this._isSQL)
                    query.table = this._tableName;
                query.fields = this._SQL._getQueryFields();
                for (var i = 0; i < this._masterLink.refFields.length; i++) {
                    var q = {};
                    q.field = this._masterLink.refFields[i];
                    q.opt = '=';
                    q.value = this._masterRecord._record[this._masterLink.masterFields[i]];
                    qry.push(q);
                    if (i > this._masterLink.refFields.length - 1) {
                        var q = {};
                        q.opt = 'and';
                        qry.push(q);
                    }
                }
                query.qry = qry;
            }
            else {
                var qry = this._SQL.query();
                if (qry) {
                    query.uid = this._uid;
                    if (!query.tableClass)
                        query.table = this._tableName;
                    query.fields = this._SQL._getQueryFields();
                    query.qry = qry;
                }
                else {
                    query.uid = this._uid;
                    if (!query.tableClass)
                        query.table = this._tableName;
                    query.fields = this._SQL._getQueryFields();
                }
            }
            if (!query.tableClass)
                query.tableClass = this._SQL._tableClass;
            query.order = this._SQL._orderBy;
            return query;
        }
        get _currentReadOnly() {
            if (this._current)
                return this._current._isReadOnly;
        }
        get readOnly() {
            return false;
        }
        records(index) {
            return this._records[index];
        }
        refresh() {
            var keyField = this._SQL._keyFields[0];
            var keyValues = [];
            for (var i = 0; i < this._records.length; i++) {
                var record = this._records[i]._record;
                this._records[i]._detailRecordSet = {};
                keyValues.push(record[keyField.fieldName]);
            }
            if (keyValues.length == 0)
                return;
            this._SQL.reset();
            var qry = {
                opt: 'in',
                field: keyField.fieldName,
                fieldType: keyField.fieldName,
                value: keyValues
            };
            this._SQL.addItem(qry);
            this.fetchRecords(true);
        }
        reset() {
            this._dataLoaded = false;
            this._primaryIndex = {};
            for (var i = 0; i < this._records.length; i++)
                this._records[i]._uid = undefined;
            this._records = [];
            this._appended = {};
            this._modified = {};
            this._deleted = {};
            this._current = undefined;
            this._SQL.reset();
        }
        search(value, localOnly, limit) {
            this._SQL.reset();
            if (value) {
                var first = true;
                for (var i = 0; i < this._SQL._fields.length; i++) {
                    var field = this._SQL._fields[i];
                    if (field.searchField) {
                        var qry = {
                            opt: 'like',
                            field: field.fieldName,
                            fieldType: field.fieldType,
                            value: value + '%'
                        };
                        if (!first)
                            this._SQL.addItem({ opt: 'or' });
                        this._SQL.addItem(qry);
                        first = false;
                    }
                }
            }
            if (localOnly)
                return this.filterRecords();
            else if (limit)
                return this.fetchRangeRecords(0, limit);
            else
                return this.fetchRecords(true, !value);
        }
        setFieldValue(fieldName, value, fieldType, propName) {
            if (this._current)
                this._current.setFieldValue(fieldName, value, fieldType, propName);
        }
        sort(sortFunction) {
            if (this._fetchingRecords) {
                this._fetchingRecords = false;
                this._context.fetchRecords();
            }
            this._records.sort(sortFunction);
        }
        template() {
            var _template = new this.recordType(this, {});
            _template._isTemplate = true;
            _template._record = {};
            return _template;
        }
        toJSON() {
            var result = [];
            var count = this.count;
            if (count > 0) {
                for (var i = 0; i < this._records.length; i++)
                    result.push(this._records[i]._record);
            }
            return result;
        }
    }
    SQLEngine._TPDRecordSet = _TPDRecordSet;
    class _TPDParams {
        constructor(recordSet) {
            this._SQL = recordSet._SQL;
            this._recordSet = recordSet;
        }
        _getParamValue(param) {
            if (this._recordSet._params)
                return this._recordSet._params['@' + param];
        }
        _setParamValue(param, value) {
            if (!this._recordSet._params)
                this._recordSet._params = {};
            this._recordSet._params['@' + param] = value;
        }
    }
    SQLEngine._TPDParams = _TPDParams;
    class _TPDRecord {
        constructor(recordSet, record) {
            this._snapshot = [];
            this._detailRecordSet = {};
            this._reference = {};
            this._files = {};
            this._plainValue = {};
            this._recordSet = recordSet;
            this._record = record;
            this._oldValues = {};
            var SQL = this._recordSet._SQL;
            for (var i = 0; i < SQL._dateFields.length; i++) {
                var field = SQL._dateFields[i];
                var value = record[field];
                if (value) {
                    record[field] = formatDateTime(parseDateTime(value));
                }
            }
            this._uid = this._recordSet._context._getUID();
        }
        commit() {
            this._snapshot.pop();
        }
        _decryptValue(value) {
            return value;
        }
        _getDetailRecordSet(recordSet, record, table, refFields, masterFields) {
            var rs = this._detailRecordSet[table];
            if (!rs) {
                rs = new recordSet(this._recordSet._context, record, table);
                rs._masterRecord = this;
                rs._masterLink = {};
                rs._masterLink.refFields = refFields;
                rs._masterLink.masterFields = masterFields;
                this._detailRecordSet[table] = rs;
                rs.fetchRecords();
            }
            return rs;
        }
        checkFieldValueEncrypted(fieldName, fieldType) {
            var value = this._record[fieldName];
            if (typeof (value) == 'string') {
                var field = this._recordSet._SQL._getField(fieldName);
                if (field && field.fieldType == TFieldType.ftFile) {
                    if (this._files[fieldName] && this._files[fieldName].file)
                        var key = this._files[fieldName].file.key;
                    else if (value) {
                        try {
                            var v = JSON.parse(value);
                            var key = v.key;
                        }
                        catch (err) { }
                    }
                    return key && key.length > 0;
                }
                else {
                    return value[0] == String.fromCharCode(7);
                }
            }
            return false;
        }
        fetchAllDetails() {
            for (var v in this) {
                var o = this[v];
                if (o instanceof _TPDRecordSet && o._masterRecord === this) {
                    o.fetchRecords(false, false, function (rs) {
                        for (var i = 0; i < rs.count; i++) {
                            var rd = rs.records(i);
                            rd.fetchAllDetails();
                        }
                    });
                }
            }
        }
        getFieldValue(fieldName, fieldType) {
            var sql = this._recordSet._SQL;
            if (sql._context.options.lazyLoad && sql._textFields[fieldName] && this._record[fieldName] == undefined) {
                var keyField = sql._keyFields[0];
                var keyValue = this._record[keyField.fieldName];
                var rd = this._recordSet.getRecordByPrimaryKey(keyValue, true);
            }
            var encryptFields = this._recordSet._encryptFields || this._recordSet._context._encryptFields[this._recordSet._tableName];
            if (fieldType == '{file}') {
                if (!this._files[fieldName])
                    this._files[fieldName] = new TPDFile(this, fieldName);
                return this._files[fieldName];
            }
            else if (encryptFields && encryptFields[fieldName]) {
                if (typeof (this._plainValue[fieldName]) != 'undefined') {
                    return this._plainValue[fieldName];
                }
                else {
                    var value = this._record[fieldName];
                    if (!value)
                        return value;
                    try {
                        var field = this._recordSet._SQL._getField(fieldName);
                        switch (field.fieldType) {
                            case TFieldType.ftInteger, TFieldType.ftFloat:
                                value = this._decryptValue(value);
                                if (value != '<encrypted>')
                                    value = parseFloat(value);
                                break;
                            default:
                                value = this._decryptValue(value);
                        }
                        if (typeof (value) == 'undefined') {
                            this._plainValue[fieldName] = '<encrypted>';
                        }
                        else
                            this._plainValue[fieldName] = value;
                    }
                    catch (err) {
                        return this._plainValue[fieldName] = '<encrypted>';
                    }
                    return this._plainValue[fieldName];
                }
            }
            else if (this._recordSet._SQL._withDateField && this._recordSet._SQL._dateFields.indexOf(fieldName) > -1) {
                var value = this._record[fieldName];
                if (value) {
                    return parseDateTime(value);
                }
            }
            else if (this._recordSet._SQL._multiLangFields.indexOf(fieldName) > -1) {
                var context = this._recordSet._SQL._context;
                var rec = this._record[fieldName];
                if (context.options._multiLanguage) {
                    try {
                        var lang = context.options._locale || context.options._defaultLocale;
                    }
                    catch (err) { }
                    if (typeof (rec) == 'string') {
                        try {
                            var v = JSON.parse(rec);
                            if (!v.hasOwnProperty('_multiLang') && !v.hasOwnProperty('en') && !v.hasOwnProperty('zh-HK') && !v.hasOwnProperty('zh-CN')) {
                                var v = {
                                    _multiLang: true
                                };
                                v[lang] = rec;
                            }
                            else
                                v._multiLang = true;
                        }
                        catch (err) {
                            var v = {
                                _multiLang: true
                            };
                            v[lang] = rec;
                        }
                        rec = v;
                        this._record[fieldName] = rec;
                    }
                    if (!context.options.multiLanguage)
                        return rec || '';
                    var defaultLang = context.options.defaultLocale;
                    for (var d in rec) {
                        if (d != '_multiLang' && d != 'publicAccess' && d != 'deleted')
                            break;
                    }
                    if (rec) {
                        if (context.options.returnDefaultLanguageValue)
                            return rec[lang] || rec[defaultLang] || rec[d] || '';
                        else
                            return rec[lang];
                    }
                    else
                        return '';
                }
                else {
                    if (rec && typeof (rec) == 'object')
                        return JSON.stringify(rec);
                    else
                        return rec;
                }
            }
            else
                return this._record[fieldName];
        }
        _getPrimaryKey() {
            return this._record[this._recordSet._SQL._keyFields[0].fieldName];
        }
        _getReferenceRecord(className, refFields, masterFields) {
            if (this._reference[className])
                return this._reference[className];
            else if (this._reference[className] === 0)
                return undefined;
            else {
                var rs = this._recordSet._context[className];
                if (rs) {
                    var values = {};
                    for (var i = 0; i < refFields.length; i++)
                        values[masterFields[i]] = this._record[refFields[i]];
                    var r = rs._getRecordByPrimaryIndex(values);
                    if (!r)
                        r = rs._fetchRecordByPrimaryIndex(values);
                    if (r)
                        this._reference[className] = r;
                    else
                        this._reference[className] = 0;
                    return r;
                }
                else
                    this._reference[className] = 0;
            }
        }
        _encryptValue(value, id, publicKey) {
            return value;
        }
        _reset() {
            for (var v in this._oldValues)
                this._record[v] = this._oldValues[v];
            delete this._recordSet._modified[this._uid];
        }
        clearSnapshot() {
            this._snapshot = [];
        }
        restore() {
            var s = this._snapshot.pop();
            if (s) {
                this._deleted = s.deleted;
                for (var v in s.record)
                    this._record[v] = s.record[v];
            }
        }
        snapshot() {
            var s = {
                deleted: this._deleted,
                record: {}
            };
            this._snapshot.push(s);
        }
        get _isLocked() {
            return false;
        }
        get _isReadOnly() {
            return this._recordSet.readOnly || this._isLocked;
        }
        setFieldValue(fieldName, value, fieldType, propName) {
            if (this._recordSet._context.options._readOnly || this._recordSet.readOnly || this._recordSet._currentReadOnly) {
                return;
            }
            if (!fieldType) {
                var field = this._recordSet._SQL._getField(fieldName);
                if (typeof (value) == 'string' && (field.fieldType == TFieldType.ftInteger || field.fieldType == TFieldType.ftFloat)) {
                    value = parseFloat(value);
                    if (isNaN(value))
                        value = 0;
                }
            }
            if (this._snapshot.length > 0) {
                var s = this._snapshot[this._snapshot.length - 1];
                if (!s.record.hasOwnProperty(fieldName)) {
                    if (this._record[fieldName] && typeof (this._record[fieldName]) == 'object')
                        s.record[fieldName] = JSON.stringify(this._record[fieldName]);
                    else
                        s.record[fieldName] = this._record[fieldName];
                }
                if (this._recordSet._SQL._lockField) {
                    s.record[this._recordSet._SQL._lockField._fieldName] = false;
                }
            }
            var encryptFields = this._recordSet._encryptFields || this._recordSet._context._encryptFields[this._recordSet._tableName];
            if (fieldType != '{file}' && encryptFields && encryptFields[fieldName]) {
                var field = encryptFields[fieldName];
                if (typeof (value) != 'undefined')
                    this._plainValue[fieldName] = value;
                else
                    this._plainValue[fieldName] = '';
                if (typeof (value) == 'string')
                    var value = this._encryptValue(value, field.id, field.publicKey);
                else
                    var value = this._encryptValue(JSON.stringify(value), field.id, field.publicKey);
            }
            if (this._recordSet._context._page)
                this._recordSet._context._notifyDataBinding(this._recordSet._name + '.' + propName, value);
            if (!this._newRecord)
                this._recordSet._modifiedFields[fieldName] = true;
            if (value instanceof TPDFile) {
                if (value.file)
                    var value = JSON.stringify(value.file);
                else
                    var value = '';
            }
            if (!this._oldValues.hasOwnProperty(fieldName))
                this._oldValues[fieldName] = this._record[fieldName];
            if (fieldType != '{file}' && this._recordSet._SQL._multiLangFields.indexOf(fieldName) > -1) {
                var context = this._recordSet._SQL._context;
                if (context.options._multiLanguage) {
                    var lang = context.options._locale;
                    if (!this._record[fieldName]) {
                        this._record[fieldName] = { _multiLang: true };
                        this._record[fieldName][lang] = value;
                    }
                    else {
                        var rec = this._record[fieldName];
                        if (typeof (rec) == 'string') {
                            try {
                                rec = JSON.parse(rec);
                                if (!rec.hasOwnProperty('_multiLang') && !rec.hasOwnProperty('en') && !rec.hasOwnProperty('zh-HK') && !rec.hasOwnProperty('zh-CN')) {
                                    rec = { _multiLang: true };
                                    rec[context.options._defaultLocale || lang] = this._record[fieldName];
                                }
                                rec._multiLang = true;
                            }
                            catch (err) {
                                rec = { _multiLang: true };
                                rec[context.options._defaultLocale || lang] = this._record[fieldName];
                            }
                            this._record[fieldName] = rec;
                        }
                        rec[lang] = value;
                    }
                }
                else {
                    this._record[fieldName] = value;
                }
            }
            else if (this._recordSet._SQL._withDateField && this._recordSet._SQL._dateFields.indexOf(fieldName) > -1) {
                this._record[fieldName] = formatDateTime(value);
            }
            else
                this._record[fieldName] = value;
            if (!this._isTemplate) {
                if (!this._newRecord && !this._recordSet._modified[this._uid]) {
                    this._recordSet._modified[this._uid] = this;
                    if (!this._deleted)
                        this._recordSet._context._addModifiedRecordset(this._recordSet, this);
                }
                if (!this._recordSet._context._onRecordChangeCalling && this._recordSet._context._onRecordChange) {
                    this._recordSet._context._onRecordChangeCalling = true;
                    try {
                        this._recordSet._context._onRecordChange(this._recordSet._context, this._recordSet, this);
                    }
                    catch (e) { }
                    this._recordSet._context._onRecordChangeCalling = false;
                }
            }
            if (this._recordSet._lockUponSave && this._recordSet._SQL._lockField && fieldName != this._recordSet._SQL._lockField._fieldName) {
                this.setFieldValue(this._recordSet._SQL._lockField._fieldName, true);
            }
        }
        _setReferenceRecord(className, record, refFields, masterFields) {
            if (this._recordSet.readOnly)
                return;
            this._reference[className] = record;
            for (var i = 0; i < refFields.length; i++) {
                var fieldName = refFields[i];
                if (record) {
                    this.setFieldValue(fieldName, record[masterFields[i]]);
                }
                else
                    this.setFieldValue(fieldName, undefined);
            }
        }
        _sign() {
        }
        toJSON() {
            return this._record;
        }
    }
    SQLEngine._TPDRecord = _TPDRecord;
    class _TQIJoint {
        constructor(sql) {
            this._SQL = sql;
        }
        get and() {
            var item = {};
            item.opt = 'and';
            this._SQL.addItem(item);
            return this._QueryObject;
        }
        get or() {
            var item = {};
            item.opt = 'or';
            this._SQL.addItem(item);
            return this._QueryObject;
        }
    }
    SQLEngine._TQIJoint = _TQIJoint;
    class _TOIJoint {
        constructor(sql) {
            this._SQL = sql;
        }
        get and() {
            var item = {};
            item.opt = 'and';
            this._SQL.addItem(item);
            return this._QueryObject;
        }
    }
    SQLEngine._TOIJoint = _TOIJoint;
    class _TPDSQLEnforceField {
    }
    SQLEngine._TPDSQLEnforceField = _TPDSQLEnforceField;
    class _TPDUpdateRecordField {
    }
    SQLEngine._TPDUpdateRecordField = _TPDUpdateRecordField;
    class TPDUpdateRecords {
    }
    SQLEngine.TPDUpdateRecords = TPDUpdateRecords;
    class _TQIQuery {
        constructor(sql, baseType, tableName, tableClass) {
            this.baseType = baseType;
            this.enforce = {};
            this._SQL = sql;
            this._SQL._tableName = tableName;
            if (tableClass)
                this._SQL._tableClass = tableClass;
            this._joint = new _TQIJoint(this._SQL);
            this._QueryObject = new this.baseType(this._SQL, this._joint);
            this._joint._QueryObject = this._QueryObject;
        }
        get and() {
            var item = {};
            item.opt = 'and';
            this._SQL.addQuery(item);
            return this._QueryObject;
        }
        get or() {
            var item = {};
            item.opt = 'or';
            this._SQL.addQuery(item);
            return this._QueryObject;
        }
        reset() {
            this._SQL.reset();
        }
        assign(query) {
            this._SQL.assign(query);
            this._SQL._recordSet._fetchingRecords = true;
            this._SQL._context._addFetchRecordset(this._SQL._recordSet);
        }
        get where() {
            this._SQL.reset();
            this._SQL._recordSet._fetchingRecords = true;
            this._SQL._context._addFetchRecordset(this._SQL._recordSet);
            return this._QueryObject;
        }
    }
    SQLEngine._TQIQuery = _TQIQuery;
    class _TOIObject {
        constructor(sql) {
            this._SQL = sql;
            this._SQL._orderBy = [];
            this._joint = new _TOIJoint(this._SQL);
            this._joint._QueryObject = this;
        }
    }
    SQLEngine._TOIObject = _TOIObject;
    class _TQIObject {
        constructor(sql, joint) {
            this._SQL = sql;
            this._joint = joint;
        }
    }
    SQLEngine._TQIObject = _TQIObject;
})(SQLEngine || (SQLEngine = {}));
