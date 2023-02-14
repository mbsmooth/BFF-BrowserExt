

// Main entry point
async function start(){
    loadSettings()

    document.getElementById("settingsSaveBtn").addEventListener('click',(e)=>{
        e.preventDefault()
        console.log('Save Button Clicked')
        saveSettings()
        loadSettings()
    })
}


// Kick things off here
document.addEventListener("DOMContentLoaded", function(event) { 
    setTimeout(start,150);
});


async function loadSettings(){
    // await chrome.runtime.sendMessage(
    //     {type:'getSettings',payload:{}},
    //     (settings)=>{
    //         console.log(settings)
    //     }
    // )

    // pull settings directly   (skip tbackground js (for now))
    await chrome.storage.local.get().then((config)=>{
        
        // isDev
        if(config.isDev){document.getElementsByName("devMachine")[0].checked = true
        } else {document.getElementsByName("devMachine")[0].checked = false}

        // logEnabled
        if(config.logEnabled){
            document.getElementsByName("logEnabled")[0].checked = true
        } else {
            document.getElementsByName("logEnabled")[0].checked = false
        }

        // logServer
        if(config.logServer){
            document.getElementsByName("logServer")[0].value = config.logServer
        } else {
            document.getElementsByName("logServer")[0].value = "https://tools.bful.co/log"
        }

        // sysID
        if(config.sysID){
            document.getElementsByName("sysID")[0].value = config.sysID
        } else {
            document.getElementsByName("sysID")[0].value = ""
        }

// 3PL Central Small Pack Options  

        // keyedInputDisabled
        if(config.keyedInputDisabled){
            document.getElementsByName("keyedInputDisabled")[0].checked = true
        } else {
            document.getElementsByName("keyedInputDisabled")[0].checked = false
        }

        // keyedInputProccessTime
        if(config.keyedInputProccessTime){
            document.getElementsByName("keyedInputProccessTime")[0].value = config.keyedInputProccessTime
        } else {
            document.getElementsByName("keyedInputProccessTime")[0].value = 1000
        }

        // keyedInputTimeLimit
        if(config.keyedInputTimeLimit){
            document.getElementsByName("keyedInputTimeLimit")[0].value = config.keyedInputTimeLimit
        } else {
            document.getElementsByName("keyedInputTimeLimit")[0].value = 300
        }

// techShip Options
        // techShipEnabled
        if(config.techShipEnabled){
            document.getElementsByName("techShipEnabled")[0].checked = true
        } else {
            document.getElementsByName("techShipEnabled")[0].checked = false
        }
        
        // techShipTimeMin
        if(config.techShipTimeMin){
            document.getElementsByName("techShipTimeMin")[0].value = config.techShipTimeMin
        } else {
            document.getElementsByName("techShipTimeMin")[0].value = 3000
        }


        // techShipAutoload
        if(config.techShipAutoload){
            document.getElementsByName("techShipAutoload")[0].checked = true
        } else {
            document.getElementsByName("techShipAutoload")[0].checked = false
        }
        
        // techShipAutoClose
        if(config.techShipAutoClose){
            document.getElementsByName("techShipAutoClose")[0].checked = true
        } else {
            document.getElementsByName("techShipAutoClose")[0].checked = false
        }


        // techShipTimeout
        if(config.techShipTimeout){
            document.getElementsByName("techShipTimeout")[0].value = config.techShipTimeout
        } else {
            document.getElementsByName("techShipTimeout")[0].value = 300
        }

      })

      return true
}

async function saveSettings(){
    var config = {
        devMachine:             document.getElementsByName("devMachine")[0].checked,
        logEnabled:             document.getElementsByName("logEnabled")[0].checked,
        logServer:              document.getElementsByName("logServer")[0].value,
        sysID:                  document.getElementsByName("sysID")[0].value,
    // 3PLC Small Pack
        keyedInputDisabled:     document.getElementsByName("keyedInputDisabled")[1].checked,
        keyedInputProccessTime: document.getElementsByName("keyedInputProccessTime")[0].value,
        keyedInputTimeLimit:    document.getElementsByName("keyedInputTimeLimit")[0].value,
    // TechShip
        techShipEnabled:        document.getElementsByName("techShipEnabled")[1].checked,
        techShipTimeMin:        document.getElementsByName("techShipTimeMin")[0].value,
        techShipAutoload:       document.getElementsByName("techShipAutoload")[0].checked,
        techShipAutoClose:      document.getElementsByName("techShipAutoClose")[0].checked,
        techShipTimeout:        document.getElementsByName("techShipTimeout")[0].value,
    }
    
    await chrome.storage.local.set(config)
    document.getElementById("messageBox").innerHTML = "Saved"
    setTimeout(()=>{
        document.getElementById("messageBox").innerHTML = ""
    },4000)


}