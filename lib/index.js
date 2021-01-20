const fs = require('fs');
const path = require('path');
const script = fs.readFileSync(path.resolve(__dirname, 'vmSqlEngine.js'), 'UTF-8');
const pdm = require('./pdm');

module.exports = function(vm, ctx, site){            
    vm.injectGlobalObject('_pdm', {
        $$fetch: true,
        fetch: function(endpoint, query){
            let db = query.database || site.database;
            if (!db){
                for (let d in site.dbConfig){
                    db = d;
                    break;
                }
            }                        
            let dbConfig = site.dbConfig[db];
            return new Promise(function(resolve, reject){
                pdm.handleRequest(dbConfig, query, function(err, result){                           
                    if (err)
                        reject(err)
                    else
                        resolve(JSON.stringify(result))
                })
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
    	global.$$pdm = {
    		fetch: async function(endpoint, query, callback){                                                
                try{
                    var result = await _pdm.fetch(endpoint, query)                    
                    callback(null, JSON.parse(result));
                }
                catch(err){
                    callback(JSON.parse(err))
                }
            },
            writeFile: async function(file, blob){
                await _pdm.writeFile(file, blob)
            }
    	}
    } + ';init()');
    vm.injectScript(script);
}