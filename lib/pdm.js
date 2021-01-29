const TMySQLEngine = require('./mySqlEngine');

async function handleRequest(dbConfig, data, callback){
    if (!dbConfig || dbConfig.type == 'mysql'){
        var engine = new TMySQLEngine(dbConfig);
        if (data.queries){
            try{
                engine.fetchRecords(data.queries, callback);
            }
            catch(err){
                return callback(err, {
                    success: false
                })
            }
        }
        else if (data.records){
            engine.saveRecords(data.records, [], callback);
        }
        else if (data.sql){
            engine.execSQL(data.sql, data.params, callback);
        }
    }
    else
        callback.apply(null, ['$database_type_not_supported'], { arguments: { copy: true }})
};

module.exports = {
    handleRequest: handleRequest
}