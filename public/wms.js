// require('./config.js');


// Disable 3PL Centrals error reporting
window.onerror = function (message, source, lineno, colno, error) {}


// build $3pl object
var $3pl = {
    defaultConfig: {
        sysID: makeid(16),
        logServer: "https://tools.bful.co/log",
        logEnabled: true,
        keyedInputDisabled: true,
        keyedInputTimeLimit: 300,
        keyedInputProccessTime: 1000,
        devMachine: false,
    },
    pageMods: { // container to hold page modification setup scripts, destroy settings and settings
        setup: {},
        settings: {},
        destroy: {},
    },
    events: [], // local container to hold log entries
    log: function(entry = {}) {
        !('data' in entry) && (entry.data = {}) // create the data key if it does not exist
        
        entry.localId = makeid(16)
        entry.createdAt= new Date()
        entry.user = window.user
        entry.data.browserInfo ={
            user: window.user,
            page: window.page,
            sysID: $3pl.config.sysID
        }
        

        //save this Log Entry to the local container
        $3pl.events.push(entry)
    
        // if enabled, upload to the server
        if($3pl.config.logEnabled){
            fetch(
                $3pl.config.logServer,  // Server URL from Extention Settings
                { // Default options are marked with *                    
                    method: 'POST', // *GET, POST, PUT, DELETE, etc.
                    mode: 'cors', // no-cors, *cors, same-origin
                    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                    credentials: 'same-origin', // include, *same-origin, omit
                    headers: {'Content-Type': 'application/json'},
                    redirect: 'follow', // manual, *follow, error
                    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
                    body: JSON.stringify(entry) // body data type must match "Content-Type" header
                }
            )
            .then((response) => response.json())
            .then((doc)=>{
                console.log("Event uploaded");
                console.log(doc);
                
                $3pl.events.find((o,i)=>{
                    if(o.localId === doc.localId){
                        $3pl.events[i]._id = doc._id
                        $3pl.events[i].uploaded = true
                        return true; // stop search
                    }
                })


                if(doc._id){
                    entry._id = doc._id
                    entry.uploaded = true
                } else {
                    entry.uploaded = false
                    console.error("3PL Mods: Could not upload event log to the server")
                }


            })
            


        } else {
            console.notice("3PL Mods: Event log upload is Disabled.")
        }


    }
}


/**
 * 3PL Mods WMS Setup Funtion
 *  - This function will run when a matching page is loaded
 *
 * @return  Bool  Always true
 */
$3pl.setup = async function (){

    console.log("3PL MODS IS LOADING")


    // get the currentt save settings and save to running config
    await chrome.storage.local.get().then((options)=>{
        $3pl.config = options
    })

    //check for needed upgrades
    if(!$3pl.config.version == chrome.runtime.getManifest().version){
        //upgrade condig settings..
        console.log("3PL Mods: The extention")
        $3pl.config.version = chrome.runtime.getManifest().version
    }

    // Apply default values to missing settings that were pulled from Local storage
    $3pl.config = Object.assign($3pl.defaultConfig,$3pl.config)

    console.log("-== 3PL Mods effective Config ==-")
    console.log($3pl.config)

    // save all current setting
    await chrome.storage.local.set($3pl.config)

        // Post a log entry that the extention was loaded
        $3pl.log({ 
            code: 39001,
            level: 2,
            transaction: null, 
            message: "Loaded the Extention",
            data: {
            }, 
            func: null
        })
    

    return true
}


$3pl.setup()






// watch for changes in page or tab within the 3PL Central Application
setInterval(()=>{
    $3pl.oldSearch ??= '';
    if(window.location.search == $3pl.oldSearch) {
        return false;
    }
    $3pl.oldSearch = window.location.search;
    page = (new URL(document.location)).searchParams.get('page');

    console.log(`3PL Mods: now on page: ${page}`)

    //check if we have a functions setup for this page
    if(typeof($3pl.pageMods.setup[camelize(page)]) == 'function'){
        console.log(`3PL Mods: Setup Mods for page ${page}`);
        $3pl.pageMods.setup[camelize(page)]();
    } else {
        console.log(`3PL Mods: no Mods for page ${page}`);
    }

    $3pl.pageMods.settings.user = window.localStorage.currentLoginUser
    $3pl.pageMods.settings.userName = window.localStorage.currentLoginUserName

},250)





// setup per 3PL page
$3pl.pageMods.setup.smallParcelSettings = ()=>{
    console.log('3PL Mods: Now on the "small-parcel-settings" Page')
    $3pl.log({ 
        code: 39003,
        level: 2,
        transaction: null, 
        message: "Loading the 'small-parcel-settings' Page",
        data: {
        }, 
        func: "$3pl.pageMods.setup.smallParcelSettings()"
    })
    
}
$3pl.pageMods.setup.smallParcel = ()=>{
    console.log('3PL Mods: Now running the "$3pl.pageMods.setup.small-parcel" function')
    
    $3pl.log({ 
        code: 39003,
        level: 2,
        transaction: null, 
        message: "'small-parcel' Page Loaded",
        data: {}, 
        func: "$3pl.pageMods.setup.smallParcel()"
    })

    // setTimeout(()=>{
    //     var packQuickInput = document.getElementById('SmallParcelGridscanGridKey') // the feild at teh top of the Small Parcel Page where you scan a transacttion or Bin number
    //     packQuickInput.addEventListener("blur", (e)=>{
    //         console.log(`Typed into the quck search box`)
    //     });
    // },1000)



    // setup a watcher looking for if the Pack and Ship modal is active
    $3pl.pageMods.settings.smallParcel.packAndShipWatcher = setInterval(()=>{
        //detect and setup the Pack And Ship scripts is not active
        if(document.getElementById('PackAndShipTransactionModel') && !$3pl.pageMods.settings.smallParcelPackAndShip.active){
            console.log('3PL Mods: Setting up smallParcelPackAndShip()')
            $3pl.pageMods.setup.smallParcelPackAndShip();
        }
        // if(!document.getElementById('PackAndShipTransactionModel')) {$3pl.pageMods.settings.smallParcelPackAndShip.active=false}
    },250)
    
}
$3pl.pageMods.setup.smallParcelPackAndShip= async ()=>{
    //disable the "Select all unpacked items" check box
    document.getElementById("selectUnpack").disabled=true;


    // track the status of the "Pack and Ship" Modal
    $3pl.pageMods.settings.smallParcelPackAndShip.active = true;

    // var transNum
    // var t=0; // start the clock at zero
    // var tmax=10000; // Max time to wait (ms)
    // var twait=100; // time to wait between checks (ms)

    // while(!transNum && t<tmax){
    //     transNum = parseInt(document.querySelector("[data-wms-selector='packAndShipTransactionTransactionIdValue']")?.innerHTML);
    //     console.log("tick")
    //     await wait(twait)
    //     t+=twait
    // }
    // console.log(t)


    querySelectorValAsync("[data-wms-selector='packAndShipTransactionTransactionIdValue']")
    .then((el)=>{
        var transNum = parseInt(el)

        if(!transNum){
            $3pl.log({ 
                code: 31002,
                level: 4,
                message: "Loaded the 'smallParcelPackAndShip' Page; Transaction Number not found",
                // transaction: transNum,
                func: "$3pl.pageMods.setup.smallParcelPackAndShip()"

            })
        } else {
            $3pl.log({ 
                code: 31001,
                level: 2,
                transaction: transNum, 
                message: "Loading the 'smallParcelPackAndShip' Page",
                data: {
                    transaction: transNum
                }, 
                func: "$3pl.pageMods.setup.smallParcelPackAndShip()"
            })
        }
    })
    .catch((e)=>{
        $3pl.log({ 
            code: 31002,
            level: 4,
            message: "Loaded the 'smallParcelPackAndShip' Page; Transaction Number Element not found",
            data:{
                querySelectorAsyncError: e
            },
            func: "$3pl.pageMods.setup.smallParcelPackAndShip()"
        })
    })






    /*
    *   Barcode Scan Required
    *   prevent manual input into the "Pack a Line Item" input filed
    */
    
    var scanBox = document.getElementById('packAndShipTransactionscanGridKey')
    if($3pl.config.keyedInputDisabled){ // check in setting if keyed entry is allowed
        scanBox.oninput = (e)=>{ // Listener for input changes
            $3pl.pageMods.settings.smallParcelSettings.scanBoxTimeout = setTimeout(()=>{ // build a timmer to clear the input box
                //TODO: Log the data back to the server
                var v = e.target.value
                
                console.log('3PL Mods: Input Locked!')
                scanBox.disabled = true; // Lock the Text Input box

                $3pl.log({ 
                    code: 31004,
                    level: 3,
                    transaction: transNum, 
                    message: "Some test was typed into the SKU Box",
                    data: {
                        value: scanBox.value 
                    }, 
                    func: "$3pl.pageMods.setup.smallParcelPackAndShip()"
                })

                    setTimeout(()=>{
                    scanBox.disabled = false; // re-enable
                    e.target.value = ''; //clear the input box
                    setTimeout(scanBox.focus(),50) //delay reqd to wait for the filedto be enabled again
                    // scanBox.focus()
                    },$3pl.config.keyedInputProccessTime) // Time until it is cleared and reset
            }, $3pl.config.keyedInputTimeLimit) //Time limit for input
        }
    }

    /*
    *   Error Watcher
    */
    $3pl.pageMods.settings.smallParcelPackAndShip.errorWatcher = setInterval(()=>{
        //detect and setup the Pack And Ship scripts is not active
        if(document.querySelector('#Window1ScanKeyNotAvailableModel') && !document.querySelector('#Window1ScanKeyNotAvailableModel').classList.contains('tagged')){
            console.log('3PL Mods: Seems we have an error!')

            document.querySelector('#Window1ScanKeyNotAvailableModel').classList.add('tagged')
            var error = document?.querySelector('#Window1ScanKeyNotAvailableModel')?.querySelector(".model-content-wrapper")?.innerHTML;
            console.log(`3PL Mods: ${error}`)

            $3pl.log({ 
                code: 31021,
                level: 4,
                transaction: transNum, 
                message: `Scan Error: error`,
                data: {
                    value: scanBox.value 
                }, 
                func: "$3pl.pageMods.setup.smallParcelPackAndShip()"
            })

        }
    },250)




    // seft distruct for when the model is closed
    $3pl.pageMods.settings.smallParcelSettings.selfDistruct = setInterval(()=>{
        if(!document.getElementById('PackAndShipTransactionModel')){
            $3pl.pageMods.destroy.smallParcelPackAndShip();
        }
    },250)
}



// pageMods Settings
$3pl.pageMods.settings.smallParcelSettings= {},
$3pl.pageMods.settings.smallParcel= {},
$3pl.pageMods.settings.smallParcelPackAndShip= {},




// Teardown / detroy the pageMods
$3pl.pageMods.destroy.smallParcelSettings=  ()=>{},
$3pl.pageMods.destroy.smallParcel= ()=>{
    clearInterval($3pl.pageMods.settings.smallParcel.packAndShipWatcher)
}
$3pl.pageMods.destroy.smallParcelPackAndShip= ()=>{
    clearTimeout($3pl.pageMods.settings.smallParcelSettings.scanBoxTimeout)
    clearInterval($3pl.pageMods.settings.smallParcelSettings.selfDistruct)
    $3pl.pageMods.settings.smallParcelPackAndShip.active = false;
    $3pl.pageMods.settings.smallParcelPackAndShip = {} // Clear any settings
    
}


function querySelectorValAsync(selector,tmax){
    var el // the resulting element
    var t=0; // start the clock at zero
    tmax??=10000; // Max time to wait (ms)
    var twait=100; // time to wait between checks (ms)

    return new Promise(async function(res, rej) {
        while(!el && t<tmax){
            el = document.querySelector(selector).innerHTML;
            
            await wait(twait)
            t+=twait
        }
        if(el){
            res(el); // when successful
        } else {
            // timeout
            rej(`querySelectorValAsync: No element found for selector ${selector}; Exceded the timeout.`);
        }
    });
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


// Wait function
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))




// Object.defineProperty(window,'sysID2',{
//     get: async ()=>{
//         return await chrome.storage.local.get('sysID') //attempt to get sysID
//             .then(async (res)=>{
//                 if(!res.sysID){ // if it was not found
//                     return await chrome.storage.local.set({sysID: makeid(16)}) //create and save a new sysID
//                     .then(async ()=>{
//                         return await chrome.storage.local.get('sysID') //read it again and return the value
//                         .then((res)=>{
//                             // console.log(`3PL Mods sysID: ${res.sysID} `)
//                             return res.sysID
//                         })

//                     })
//                 } else {   // sysID was found the first time around
//                     // console.log(`3PL Mods sysID: ${res.sysID} `)
//                     return res.sysID
//                 }
//             })
//     }
// })



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