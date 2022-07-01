// require('./config.js');


var CONFIG= chrome.storage.local.get('config')

CONFIG.logServer = "https://tools.bful.co/log";
// CONFIG.logServer = "http://localhost:8080/log";
CONFIG.logEnabled = true;



// Post log entry that the extention was loaded
postLog({ 
    code: 39001,
    level: 2,
    transaction: null, 
    message: "Loading the Extention",
    data: {
    }, 
    func: null
})


// watch for changes in page or tab within the 3PL Central Application
var oldSearch = '';
setInterval(()=>{
    if(window.location.search == oldSearch) {
        return false;
    }
    oldSearch = window.location.search;
    page = (new URL(document.location)).searchParams.get('page');

    console.log(`3PL Mods: now on page: ${page}`)

    //check if we have a functions setup for this page
    if(typeof(pageMods.setup[camelize(page)]) == 'function'){
        console.log(`3PL Mods: Setup Mods for page ${page}`);
        pageMods.setup[camelize(page)]();
    } else {
        console.log(`3PL Mods: no Mods for page ${page}`);
    }

    pageMods.settings.user = window.localStorage.currentLoginUser

},250)




pageMods = {
    setup:{ 
        smallParcelSettings: ()=>{
            console.log('Now on the "small-parcel-settings" Page')
            postLog({ 
                code: 39003,
                level: 2,
                transaction: null, 
                message: "Loading the 'small-parcel-settings' Page",
                data: {
                }, 
                func: "pageMods.setup.smallParcelSettings()"
            })
            
        },
        smallParcel: ()=>{
            console.log('Now on the "small-parcel" Page')
            var packQuickInput = document.getElementById('SmallParcelGridscanGridKey')

            postLog({ 
                code: 39003,
                level: 2,
                transaction: null, 
                message: "Loading the 'small-parcel' Page",
                data: {
                }, 
                func: "pageMods.setup.smallParcel()"
            })
            
            // setup a watcher looking for if the Packa and Ship model is active
            pageMods.settings.smallParcel.packAndShipWatcher = setInterval(()=>{
                //detect and setup the Pack And Ship scripts is not active
                if(document.getElementById('PackAndShipTransactionModel') && !pageMods.settings.smallParcelPackAndShip.active){
                    console.log('Setting up smallParcelPackAndShip()')
                    pageMods.setup.smallParcelPackAndShip();
                }
                // if(!document.getElementById('PackAndShipTransactionModel')) {pageMods.settings.smallParcelPackAndShip.active=false}
            },250)
            
        },
        smallParcelPackAndShip: ()=>{
            //disable the "Select all unpacked items" check box
            document.getElementById("selectUnpack").disabled=true

            pageMods.settings.smallParcelPackAndShip.active = true;
            const transNum = parseInt(document.querySelector("[data-wms-selector='packAndShipTransactionTransactionIdValue']")?.innerHTML);

            if(!transNum){
                postLog({ 
                    code: 31002,
                    level: 4,
                    message: "Loaded the 'smallParcelPackAndShip' Page; Transaction Number not found",
                    func: "pageMods.setup.smallParcelPackAndShip()"
                })
            } else {
                postLog({ 
                    code: 31001,
                    level: 2,
                    transaction: transNum, 
                    message: "Loading the 'smallParcelPackAndShip' Page",
                    data: {
                    }, 
                    func: "pageMods.setup.smallParcelPackAndShip()"
                })
            }



            /*
            *   Barcode Scan Required
            *   prevent manual input into the "Pack a Line Item" input filed
            */
            
            var scanBox = document.getElementById('packAndShipTransactionscanGridKey')
            if(pageMods.settings.keyedInputDisabled){ // check in setting if keyed entry is allowed
                scanBox.oninput = (e)=>{ // Listener for input changes
                    pageMods.settings.smallParcelSettings.scanBoxTimeout = setTimeout(()=>{ // build a timmer to clear the input box
                        //TODO: Log the data back to the server
                        var v = e.target.value
                        
                        console.log('Input Locked!')
                        scanBox.disabled = true; // Lock the Text Input box

                        postLog({ 
                            code: 31004,
                            level: 3,
                            transaction: transNum, 
                            message: "Some test was typed into the SKU Box",
                            data: {
                                value: scanBox.value 
                            }, 
                            func: "pageMods.setup.smallParcelPackAndShip()"
                        })

                         setTimeout(()=>{
                            scanBox.disabled = false; // re-enable
                            e.target.value = ''; //clear the input box
                            setTimeout(scanBox.focus(),50) //delay reqd to wait for the filedto be enabled again
                            // scanBox.focus()
                         },pageMods.settings.keyedInputProccessTime) // Time until it is cleared and reset
                    },pageMods.settings.keyedInputTimeLimit) //Time limit for input
                }
            }

            /*
            *   Error Watcher
            */
            pageMods.settings.smallParcelPackAndShip.errorWatcher = setInterval(()=>{
                //detect and setup the Pack And Ship scripts is not active
                if(document.querySelector('#Window1ScanKeyNotAvailableModel') && !document.querySelector('#Window1ScanKeyNotAvailableModel').classList.contains('tagged')){
                    console.log('Seems we have an error!')

                    document.querySelector('#Window1ScanKeyNotAvailableModel').classList.add('tagged')
                    var error = document?.querySelector('#Window1ScanKeyNotAvailableModel')?.querySelector(".model-content-wrapper")?.innerHTML;
                    console.log(error)

                    postLog({ 
                        code: 31021,
                        level: 4,
                        transaction: transNum, 
                        message: `Scan Error: error`,
                        data: {
                            value: scanBox.value 
                        }, 
                        func: "pageMods.setup.smallParcelPackAndShip()"
                    })

                }
            },250)




            // seft distruct for when the model is closed
            pageMods.settings.smallParcelSettings.selfDistruct = setInterval(()=>{
                if(!document.getElementById('PackAndShipTransactionModel')){
                    pageMods.destroy.smallParcelPackAndShip();
                }
            },250)
        },
    },
    settings:{
        smallParcelSettings:{},
        smallParcel:{},
        smallParcelPackAndShip:{},
        keyedInputDisabled:true,
        keyedInputTimeLimit: 300,
        keyedInputProccessTime: 1000,
    },
    destroy:{
        smallParcelSettings: ()=>{},
        smallParcel: ()=>{
            clearInterval(pageMods.settings.smallParcel.packAndShipWatcher)
        },
        smallParcelPackAndShip: ()=>{
            clearTimeout(pageMods.settings.smallParcelSettings.scanBoxTimeout)
            clearInterval(pageMods.settings.smallParcelSettings.selfDistruct)
            pageMods.settings.smallParcelPackAndShip.active = false;
            pageMods.settings.smallParcelPackAndShip = {} // Clear any settings
            
        },
    }

}


// Example POST method implementation:
async function postLog(data = {}) {

    if(!CONFIG.logEnabled){
        return false;
    }
    
    !('data' in data) && (data.data = {}) // create the data key is it does not exist
   
    data.use = window.user 
    data.data.browserInfo ={
        user: window.user,
        page: window.page,
        sysID: window.sysID
    }

    // Default options are marked with *
    const response = await fetch(CONFIG.logServer, { // URL from config.js
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
  }


function camelize(str) {
    if(!str) return '';
    return str.replace(/(?:-^\w|[A-Z]|\b\w)/g, function(word, index) {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '').replace(/[^a-zA-Z ]/g, "")
}


function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * 
        charactersLength));
    }
    return result;
}


Object.defineProperty(window,'sysID',{
    get: async ()=>{
        return await chrome.storage.local.get('sysID') //attempt to get sysID
            .then(async (res)=>{
                if(!res.sysID){ // if it was not found
                    return await chrome.storage.local.set({sysID: makeid(16)}) //create and save a new sysID
                    .then(async ()=>{
                        return await chrome.storage.local.get('sysID') //read it again and return the value
                        .then((res)=>{
                            console.log(`3PL Mods sysID: ${res.sysID} `)
                            return res.sysID
                        })

                    })
                } else {   // sysID was found the first time around
                    console.log(`3PL Mods sysID: ${res.sysID} `)
                    return res.sysID
                }
            })
    }
})



Object.defineProperty(window,'page',{
    get: ()=>{
        return (new URL(document.location)).searchParams.get('page');
    }
})
Object.defineProperty(window,'user',{
    get: ()=>{
        return window?.localStorage?.currentLoginUser;
    }
})