// (async () => {
//     const src = chrome.runtime.getURL("demoModule.js");
//     const demo = await import(src);
//     demo.hello()
//   })();

// // Disable 3PL Centrals error reporting
// var onerror_disable_script = document.createElement('script');
// onerror_disable_script.type  ="text/javascript"
// onerror_disable_script.src  ="noErrorDisable.js"
// // onerror_disable_script.script-src ='unsafe-eval'
// // onerror_disable_script.text ="window.onerror = function (message, source, lineno, colno, error) {}"
// document.body.appendChild(onerror_disable_script)
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
        techShipEnabled: false,
        techShipTimeMin: 3000,
        techShipAutoload: false, 
        techShipAutoClose: false,
        techShipTimeout: 3000,
        

    },
    pageMods: { // container to hold page modification setup scripts, destroy settings and settings
        setup: {},
        settings: {},
        destroy: {},
        watchers:{}
    },
    events:{},
    logEntries: [], // local container to hold log entries
    log: function(entry = {}) {
        !('data' in entry) && (entry.data = {}) // create the data key if it does not exist
        
        entry.localId = makeid(16)
        // entry.createdAt= new Date()
        entry.user = window.user
        entry.sysID = $3pl.config.sysID
        entry.data.browserInfo ={
            user: window.user,
            page: window.page,
            sysID: $3pl.config.sysID,
            extVer: chrome.runtime.getManifest().version
        }
        entry.data.extConfig = $3pl.config
        
        //save this Log Entry to the local container
        $3pl.logEntries.push(entry)
    
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
                console.log("Event Log uploaded");
                // console.log(doc);
                

                //update Local copy to be marked as uploaded
                $3pl.logEntries.find((o,i)=>{
                    if(o.localId === doc.localId){
                        $3pl.logEntries[i]._id = doc._id
                        $3pl.logEntries[i].uploaded = true
                        $3pl.logEntries[i].rtnDoc = doc
                        return true; // stop search
                    }
                })


                // if(doc._id){
                //     entry._id = doc._id
                //     entry.uploaded = true
                // } else {
                //     entry.uploaded = false
                //     console.error("3PL Mods: Could not upload event log to the server")
                // }
            })
        } else {
            console.log("3PL Mods: Event log upload is Disabled in Ext Settings.")
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




    // get the current saved config and save to running config
    await chrome.storage.local.get().then((options)=>{
        $3pl.config = options
        $3pl.defaultConfig = Object.assign($3pl.defaultConfig,$3pl.config)
    })

    //check for needed upgrades
    if(!$3pl.config.version == chrome.runtime.getManifest().version){
        console.log("3PL Mods: The extention has been upgraded")
        setTimeout(()=>{ // Delayed log entry about the upgrade
            $3pl.log({  // Log Entry about the upgraded Ext
                code: 39009,
                level: 2,
                transaction: null, 
                message: "The Extention has been upgraded",
                data: {
                    prioVer: $3pl.config.version,
                    updateVer: chrome.runtime.getManifest().version
                }, 
                func: null
            })
        },2000)  // 2 sec Delay 
        //TODO: upgrade config settings..


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

    Z = document.querySelectorAll("iframe#spaWrapperIframe")

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

    // $3pl.user = window.localStorage.currentLoginUser
    // $3pl.userName = window.localStorage.currentLoginUserName

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
    //  disable the "Select all unpacked items" check box
    document.getElementById("selectUnpack").checked=false;
    document.getElementById("selectUnpack").disabled=true;

    // disable the "Qty 1 Pack checkbox"
    document.getElementById("oneQtyPack").checked=true;
    document.getElementById("oneQtyPack").disabled=true;

    // track the status of the "Pack and Ship" Modal
    $3pl.pageMods.settings.smallParcelPackAndShip.active = true;


    // get the Transaction number once all the fields populate
    querySelectorValAsync("[data-wms-selector='packAndShipTransactionTransactionIdValue']")
    .then(async (el)=>{
        var transNum = parseInt(el)
        var customerName = await querySelectorValAsync("[data-wms-selector='packAndShipTransactionCustomerValue']")

        if(!transNum){
            console.log(`Trans Number not found`)
            $3pl.log({ 
                code: 31002,
                level: 4,
                message: "Loaded the 'smallParcelPackAndShip' Page; Transaction Number not detected",
                func: "$3pl.pageMods.setup.smallParcelPackAndShip()"
            })
        } else {
            console.log(`${transNum} opened.`)

            // TODO: kickoff Rabot Start Pack
            // TODO: kickoff Penny Black Postcard

            $3pl.log({ 
                code: 31001,
                level: 2,
                transaction: transNum, 
                customerName: customerName,
                message: "Loading the 'smallParcelPackAndShip' Page",
                data: {
                    transaction: transNum
                }, 
                func: "$3pl.pageMods.setup.smallParcelPackAndShip()"
            })


            if($3pl.config.techShipEnabled){
                // ** Draw an onscreen barcode for scanning. **
                setTimeout(()=>{ // add container to hold the barcode

                    // //find the container that will hold the barcode SVG element
                    // var hAry = document.getElementsByClassName("footer-btn-holder")
                    // // hAry may return more than one element.... get the last element
                    // let divDOM = hAry[hAry.length-1]

                    // //build the svg element
                    //             // Note as to why it is this way
                    //             // https://github.com/lindell/JsBarcode/issues/221
                    //             // https://jsfiddle.net/hb9nr62q/1/
                    // let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    // svg.setAttribute('jsbarcode-format', 'code39')
                    // svg.setAttribute('jsbarcode-value', transNum)
                    // svg.className.baseVal = "transBarcode";
                    // divDOM.prepend(svg);


                    // JsBarcode(".barcode").init();

                    // // build the barcode and place into the svg element.
                    // JsBarcode("svg.transBarcode", transNum,{
                    //     // fontSize: 40,
                    //     // background: "#4b8b7f",
                    //     // lineColor: "#ffffff",
                    //     // margin: 40,
                    //     // marginLeft: 80,
                    //     format: "code39",
                    //     displayValue: true,
                    //     height: 50,
                    //     // width: 6
                    // })

                    // Pack button listener
                    let packBtn = document.getElementById("packAndShipTransactionPack")
                    packBtn.addEventListener("click",(e)=>{
                        let t = e.target
                        if(t.disabled){
                            console.log('Pack Button is disabled')
                        } else {
                            console.log('Pack Button is enabled')
                            // tell the backgorund script to display techSHip window
                            chrome.runtime.sendMessage({type:'techShip',payload:{orderNum:transNum}})
                            
                        }
                    })

                    shipBtn = document.querySelector('[data-wms-selector="packAndShipTransactionFinish"]');
                    pkAndShipBtn = document.querySelector('[data-wms-selector="packAndShipTransactionPackAndShip"]');
                    
                    shipBtn.disabled= true
                    pkAndShipBtn.disabled= true
                    shipBtn.classList.add('wms_disabled_look')
                    pkAndShipBtn.classList.add('wms_disabled_look')
                    shipBtn.hidden = true
                    pkAndShipBtn.hidden = true

                    



                },500)
            }

            // Add a Triage button
            const TriageText = document.createTextNode("Triage");
                    
            let TriageBtnText = document.createElement("div")
                TriageBtnText.classList.add('wms_toolbar_button_text')
                TriageBtnText.appendChild(TriageText)
            let TriageBtnSprite = document.createElement("div")
                TriageBtnSprite.classList.add('wms_sprite','fa','fa-stethoscope')
            let TriageBtn = document.createElement("button")
                TriageBtn.setAttribute('id', 'printTriageBtn')
                TriageBtn.setAttribute('data-wms-selector', 'printTriageBtn')
                TriageBtn.classList.add('wms_toolbar_button','primary_button_color')
                TriageBtn.appendChild(TriageBtnSprite)
                TriageBtn.appendChild(TriageBtnText)
            

            
            let TriageBtn_button_holder = document.createElement("div")
                TriageBtn_button_holder.classList.add('button_holder')
                TriageBtn_button_holder.appendChild(TriageBtn)
            let TriageBtnComponent = document.createElement("div")
                TriageBtnComponent.classList.add('wms-button-component')
                TriageBtnComponent.appendChild(TriageBtn_button_holder)
            

            let footerBtnHolder = document.querySelector('#PackAndShipTransactionModel .footer-btn-holder')
            let clsBtn = footerBtnHolder.childNodes[0]
            // document.insertBefore(TriageBtnComponent,footerBtnHolder.childNodes[0])
            clsBtn.parentElement.insertBefore(TriageBtnComponent,clsBtn)


            TriageBtnComponent.addEventListener("click",(e)=>{
                let t = e.target
                
                    console.log('Triage Button is clicked')
                    // tell the backgorund script to display techSHip window
                    chrome.runtime.sendMessage({type:'triage',payload:{orderNum:transNum}})
                
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


    
// build new scanbox input field... hid the original scanbox input
    let scanBoxOG = document.getElementById('packAndShipTransactionscanGridKey')
    let scanBox = scanBoxOG.cloneNode(true)
        scanBox.setAttribute('id', 'packAndShipScanBox')
        scanBox.setAttribute('name', 'packAndShipScanBox')
    scanBoxOG.parentElement.insertBefore(scanBox,scanBoxOG)
    // scanBoxOG.hidden=true


    const inputEvent = new Event('input', {
        bubbles: true,
        cancelable: true,
      });

      scanBoxOG.style.display = "none";


    scanBox.addEventListener("keydown", (e)=>{

        // if the Enter key is pressed, copy the value from the scanBox

        if(e.key=== 'Enter'){
            console.log('input submited: ' + e.target.value)
            console.log(e)
            // TODO check is there is an alias for the UPC
            scanBoxOG.value = e.target.value

            // trigger the enter key within the scanBoxOG field

            // let entKeyEct = new KeyboardEvent('keydown', {key:"Enter",keyCode: 13})
            // scanBoxOG.dispatchEvent(entKeyEct)

            checkAndReplaceAliaswrapper()

            // el.dispatchEvent(new KeyboardEvent('keydown', {key:"Enter",keyCode: 13}))

            let addBtn = document.querySelector("[data-wms-selector='packAndShipTransactionScanKeyAddButton']")
            addBtn.click()
        }
    })


    /*
    *   Capture & Log typed value into the ScanBox
    *   
    */
    scanBox.addEventListener("blur", (e)=>{

        if(!e.value){
            // Scan box cleared
            console.log('Scan box cleared')
            return false;
        }

        document.querySelector("[packAndShipTransactionScanKeyAddButton]")
        document.querySelector('[data-wms-selector="packAndShipTransactionScanKeyAddButton"]').onSubmit(()=>{console.log("hi")})



        // get the Transaction number once all the fields populate
        querySelectorValAsync("[data-wms-selector='packAndShipTransactionTransactionIdValue']")
        .then(async (el)=>{
            var transNum = parseInt(el)
            var customerName = await querySelectorValAsync("[data-wms-selector='packAndShipTransactionCustomerValue']")

            $3pl.log({ 
                code: 31004,
                level: 3,
                customerName: customerName,
                transaction: transNum, 
                message: "Some text was typed into the SKU Box",
                data: {
                    value: scanBox.value 
                }, 
                func: '$3pl.pageMods.setup.smallParcelPackAndShip()->scanBox.addEventListener("blur")'
            })
        })
        .catch(()=>{
            console.error("transNum not found after blur")
            $3pl.log({ 
                code: '00000',
                level: 5,
                customerName: null,
                transaction: null, 
                message: "transNum not found after blur",
                data: {}, 
                func: '$3pl.pageMods.setup.smallParcelPackAndShip()->scanBox.addEventListener("blur")'
            })
        })
    })

    /*
    *   Barcode Scan Required
    *   prevent manual input into the "Pack a Line Item" input filed
    */

    scanBox.oninput = (e)=>{ // Listener for input changes


        if($3pl.config.keyedInputDisabled){ // check in setting if keyed entry is allowed

            $3pl.pageMods.settings.smallParcelSettings.scanBoxTimeout = setTimeout(()=>{ // build a timmer to clear the input box
                //TODO: Log the data back to the server
                var v = e.target.value
                
                console.log('3PL Mods: Input Locked!')
                scanBox.disabled = true; // Lock the Text Input box

                    setTimeout(()=>{
                        scanBox.disabled = false; // re-enable
                        e.target.value = ''; //clear the input box
                        setTimeout(scanBox.focus(),50) //delay reqd to wait for the filedto be enabled again
                        // scanBox.focus()
                    },$3pl.config.keyedInputProccessTime) // Time until it is cleared and reset
            }, $3pl.config.keyedInputTimeLimit) //Time limit for input
        }


        checkAndReplaceAliaswrapper()
        

        scanBoxOG.value = scanBox.value || ""
       
        scanBoxOG.setAttribute('value', scanBoxOG.value);

        scanBoxOG.dispatchEvent(inputEvent);
    }

    /*
    *   Error Watcher
    */
    $3pl.pageMods.settings.smallParcelPackAndShip.errorWatcher = setInterval(()=>{
        //detect and setup the Pack And Ship scripts is not active
        if(document.querySelector('#Window1ScanKeyNotAvailableModel') && !document.querySelector('#Window1ScanKeyNotAvailableModel').classList.contains('tagged')){
            console.log('3PL Mods: Seems we have an error!')

            document.querySelector('#Window1ScanKeyNotAvailableModel').classList.add('tagged')
            var error = document?.querySelector('#Window1ScanKeyNotAvailableModel')?.querySelector(".model-content-wrapper")?.innerHTML || "Error Not avalible.";

            querySelectorValAsync("[data-wms-selector='packAndShipTransactionTransactionIdValue']")
                .then(async (el)=>{
                    var transNum = parseInt(el)
                    var customerName = await querySelectorValAsync("[data-wms-selector='packAndShipTransactionCustomerValue']")
                    

                    $3pl.log({ 
                        code: 31021,
                        level: 4,
                        transaction: transNum, 
                        customerName: customerName,
                        message: `Scan Error: ${error}`,
                        data: {
                            value: scanBox.value,
                            error: error
                        }, 
                        func: "$3pl.pageMods.setup.smallParcelPackAndShip()"
                    })
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
$3pl.pageMods.destroy.smallParcelSettings= ()=>{},
$3pl.pageMods.destroy.smallParcel= ()=>{
    clearInterval($3pl.pageMods.settings.smallParcel.packAndShipWatcher)
}
$3pl.pageMods.destroy.smallParcelPackAndShip= ()=>{
    clearTimeout($3pl.pageMods.settings.smallParcelSettings.scanBoxTimeout)
    clearInterval($3pl.pageMods.settings.smallParcelSettings.selfDistruct)
    $3pl.pageMods.settings.smallParcelPackAndShip.active = false;
    $3pl.pageMods.settings.smallParcelPackAndShip = {} // Clear any settings
}




// $(".wms-model-new-ui-wrapper").length




// $3pl.events.modal = new CustomEvent('open', { detail: elem.dataset.time });


/**
 * [watcherBySelector build a watcher that will watch for a selector to exist, and then call the callback]
 * 
 * Example: watcherBySelector(".wms-model-new-ui-wrapper",(el)=>{})
 *
 * @var {[type]}
 */
function watcherBySelector(selector,callback){
    // var el // the resulting element
    // var t=0; // start the clock at zero
    // tmax??=10000; // Max time to wait (ms)
    var twait=100; // time to wait between checks (ms)
    document.watcher??={}
    document.watcher.activeEls ??= []

    setInterval(()=>{
        var elmts = document.querySelectorAll(selector)
        if(elmts.length){
            elmts.forEach(el => {
                // check if this element is already active
                if(!el.dataset.found){
                    el.dataset.found = true
                    callback(el)
                }
            });
        }
    },twait)
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


function checkAndReplaceAliaswrapper() {

    let scanBoxOG = document.getElementById('packAndShipTransactionscanGridKey')

    let scanBox = document.getElementById('packAndShipScanBox')

    const inputEvent = new Event('input', {
        bubbles: true,
        cancelable: true,
      });


   let aliassku= checkAndReplaceAlias(scanBox.value)

if(aliassku){
   scanBox.value = aliassku

   scanBoxOG.value = aliassku
       
   scanBoxOG.setAttribute('value', aliassku);

   scanBoxOG.dispatchEvent(inputEvent);
}
 
}

    //Function to make the API call and check if the alias exists
     function checkAndReplaceAlias(scanValue) {
     
        let cacheVal = retrieveJsonFromCache(scanValue);

        if (cacheVal) {          
            
            console.log('Alias retrieved from cache')
           return cacheVal.sku || cacheVal[0].sku;            
           
        }

      // Check if the userEntry is not empty
      if (scanValue !== "") {
        try {
          // Make an API call to check if the alias exists
          //https://api.bful.co/products/upcAlias?barcode=987654987
            const response =  fetch(`https://api.bful.co/products/upcAlias?barcode=${scanValue}`)
            .then(response => response.json())
              .then(data => {                             

                  saveJsonToCache(data,scanValue);
                
                if (data[0]) {                
                  console.log('Alias retrieved from API')
                    return data[0].sku;                    
                } else {                  
                  return null
                }
              })
              .catch(error => {
                  console.error('Error fetching data:', error);
                  return null;
              });
       
        } catch (error) {
          console.error('Error fetching data:', error);
       
        }
      } else {
        //alert('Please enter a value before checking the alias.');
      }
      }


      const cacheKey = 'jsonCache';

      function saveJsonToCache(jsonData, barcode) {
          
          const cachedData = localStorage.getItem(cacheKey) || '[]';
          const existingData = JSON.parse(cachedData);
                  

          let isAlreadyCached = null;
          for (let i = 0; i < existingData.length; i++) {
              const innerArray = existingData[i];
              const record = innerArray.find(entry => entry.barcode === barcode);
              if (record) {
                isAlreadyCached = record;
                  break; 
              }
          }

          

          if (!isAlreadyCached) {
              // If not, add the new JSON data to the cache
              existingData.push(jsonData);
              localStorage.setItem(cacheKey, JSON.stringify(existingData));
          }
      }

      function retrieveJsonFromCache(barcode) {          
      
          const cachedData = localStorage.getItem(cacheKey) || '[]';
          const existingData = JSON.parse(cachedData);

         
          let foundRecord = null;
          for (let i = 0; i < existingData.length; i++) {
              const innerArray = existingData[i];
              const record = innerArray.find(entry => entry.barcode === barcode);
              if (record) {
                  foundRecord = record;
                  break; 
              }
          }

          return foundRecord;
          
      }

      

