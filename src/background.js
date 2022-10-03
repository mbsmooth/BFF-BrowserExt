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
    $3pl.config = options
  })
}


chrome.runtime.onMessage.addListener(async (message,sender,sendResponse) => {
  if(!message.type === "getSettings") return false
})
chrome.runtime.onMessage.addListener(async (message,sender,sendResponse) => {
  if(!message.type === "saveSettings") return false
})




// Console log all messages
chrome.runtime.onMessage.addListener(async (message,sender,sendResponse) => {
  console.log(`New Message`);  
  console.log(`Message from ${sender}`);  
  console.log(`Message: `);  
  console.log(message);  


  sendResponse({data:"done1"})
  return {data:"done2"}
})

chrome.runtime.onMessage.addListener(async (message,sender,sendResponse) => {
  if(!message.type === "techShip") return false
  console.log(`techShip: ${message.transNum}`);  
  chrome.tabs.create({ 'url': `chrome-extension://${chrome.runtime.id}/techShip.html?order=${message.transNum}` });

})



console.log(`Starting 3PL Mods`);

function getSettings(){

}


