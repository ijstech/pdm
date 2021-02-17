const Fs = require('fs');
const Path = require('path');
const Script = Fs.readFileSync(Path.resolve(__dirname, 'vmSqlEngine.js'), 'UTF-8');
const Pdm = require('./pdm');
const Db = require('@ijstech/db');

module.exports = function(vm, ctx, site, options){            
    vm.injectGlobalObject('_$$plugin_pdm', {
        $$fetch: true,
        fetch: function(endpoint, query){            
            return new Promise(function(resolve, reject){
                let dbName = site.database || ctx.package.db[0] || site.db[0];
                if (query.database && site.db && site.db.indexOf(query.database) > -1)          
                    dbName = query.database            
                let dbConfig = Db.getDatabase(dbName);
                if (dbConfig)
                    Pdm.handleRequest(dbConfig, query, function(err, result){                                                                   
                        if (err)
                            reject(JSON.stringify(err))
                        else
                            resolve(JSON.stringify(result))
                    })
                else
                    reject('$invalid_database')
            })   
        },
        $$readFile: true,
        readFile: function(file){            
            return new Promise(async function(resolve, reject){                
                try{                    
                    let storage = require('@ijstech/storage');
                    let org = site.org;                    
                    let result = await storage.readFile(org.guid + '/' + file.guid);                                
                    resolve(result);        
                }
                catch(err){                    
                    reject(JSON.stringify(err));
                }
            })            
        },
        $$writeFile: true,
        writeFile: function(file, blob){            
            return new Promise(async function(resolve, reject){                
                try{                    
                    let storage = require('@ijstech/storage');
                    let org = site.org;                    
                    let result = await storage.writeFile(org.guid + '/' + file.guid, blob);                                
                    resolve(result);        
                }
                catch(err){                    
                    reject(JSON.stringify(err));
                }
            })            
        }
    }, ''+ function init(){
    	global._$$pdm = {
    		fetch: async function(endpoint, query, callback){
                try{
                    var result = await _$$plugin_pdm.fetch(endpoint, query)
                    callback(null, JSON.parse(result));
                }
                catch(err){
                    callback(JSON.parse(err))
                }
            },
            writeFile: async function(file, blob){
                await _$$plugin_pdm.writeFile(file, blob)
            }
    	}
    } + ';init()');
    vm.injectScript(Script);
}