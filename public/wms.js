
var oldSearch = '';
var page= ''
setInterval(()=>{
    if(window.location.search == oldSearch) {
        return false;
    }
    oldSearch = window.location.search;
    page = (new URL(document.location)).searchParams.get('page');

    //check if we have a functions setup for this page
    if(typeof(pageMods.setup[camelize(page)]) == 'function'){
        pageMods.setup[camelize(page)]()
    }
    

    
},500)
// window.location.search

pageMods = {
    setup:{
        smallParcelSettings: ()=>{
            console.log('Now on the "small-parcel-settings" Page')
            
        },
        smallParcel: ()=>{
            console.log('Now on the "small-parcel" Page')
            var packQuickInput = document.getElementById('SmallParcelGridscanGridKey')
            
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
            pageMods.settings.smallParcelPackAndShip.active = true;

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

                    //TODO: Log this erro back to the server
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


function camelize(str) {
    if(!str) return '';
    return str.replace(/(?:-^\w|[A-Z]|\b\w)/g, function(word, index) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '').replace(/[^a-zA-Z ]/g, "")
  }