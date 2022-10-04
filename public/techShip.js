const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

var $bf= {}

async function start(){
    JsBarcode("#barcode", urlParams.get('order'));

    // read settings
    await chrome.storage.local.get().then((options)=>{
        $bf.config = options
    })

    
    // Enable the close button after  techShipTimeMin in ms
    setTimeout(()=>{
        document.getElementById('closeTab').disabled = false
    },$bf.config.techShipTimeMin)

    // close tab when clicked
    document.getElementById('closeTab').addEventListener('click',(e)=>{
        window.close();
    })
    
}


document.addEventListener("DOMContentLoaded", function(event) { 
    setTimeout(start,150);
});
  

