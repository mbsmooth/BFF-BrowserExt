'use strict';

// With background scripts you can communicate extension files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.type === 'GREETINGS') {
//     const message = `Hi Ove, my name is Bac. I am from Background. It's great to hear from you.`;

//     // Log message coming from the `request` parameter
//     console.log(request.payload.message);
//     // Send a response message
//     sendResponse({
//       message,
//     });
//   }
// });

var $bf = {}

// on load
// get the current saved config and save to running config
async ()=>{
  await chrome.storage.local.get().then((options)=>{
    $bf.config = options
  })
}




chrome.runtime.onMessage.addListener(async (message,sender,sendResponse) => {
  if(!message.type === "getSettings") return false
})
chrome.runtime.onMessage.addListener(async (message,sender,sendResponse) => {
  if(!message.type === "saveSettings") return false
})




// Console log all messages
chrome.runtime.onMessage.addListener(async (message,sender,cb) => {
  await chrome.storage.local.get().then((options)=>{
    $bf.config = options
  })

  Object.keys(msgHandlers)

  if(msgHandlers.hasOwnProperty(message.type)){
    msgHandlers[message.type](message.payload,sender,cb)
  } else {
    console.log(`New Message`);  
      console.log(`Handler not found for type ${message.type}`);  
      console.log(`Full Message: `);  
      console.log(message);  
  }


  // switch(message.type){
  //   case 'techShip':
  //     msgHandlers.techShip(message.payload,sender,cb)
  //   case 'getSettings':
  //     msgHandlers.getSettings(message.payload,sender,cb)
  //   default:
  //     console.log(`New Message`);  
  //     console.log(`Handler not found for type ${message.type}`);  
  //     console.log(`Full Message: `);  
  //     console.log(message);  
  // }

  return Promise.resolve("Dummy response to keep the console quiet");


})



var msgHandlers = {}
    msgHandlers.template =  async (payload,sender,cb)=>{}

    msgHandlers.triage = async (payload,sender,cb)=>{
      console.log(`triage: ${payload.orderNum}`);  
      chrome.tabs.create({ 'url': `chrome-extension://${chrome.runtime.id}/techShip.html?order=${payload.orderNum}&triage=true` });  
    }


    msgHandlers.techShip = async (payload,sender,cb)=>{
      // only if techShip is enabled
      if($bf.config.techShipEnabled){
        console.log(`techShip: ${payload.orderNum}`);  
        chrome.tabs.create({ 'url': `chrome-extension://${chrome.runtime.id}/techShip.html?order=${payload.orderNum}` });  
      }
      
      // trigger the autoloader
      if($bf.config.techShipAutoload){
        console.log(`techShip: ${payload.orderNum}`);  
        chrome.tabs.create({ 'url': `techship://${payload.orderNum}` });  
      }


    }
    msgHandlers.getSettings =  async (payload,sender,cb)=>{
      console.log("getSettings")

      await getSettings()
      console.log($bf.config)
      cb($bf.config)
    }





console.log(`Starting 3PL Mods`);

async function getSettings(){
  await chrome.storage.local.get().then((config)=>{
    $bf.config = config
  })

  return $bf.config
}

async function saveSettings(){
  await chrome.storage.local.get().then((config)=>{
    $bf.config = config
  })

  return $bf.config
}


