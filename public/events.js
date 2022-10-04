


async function start(){
    console.log("Starting Events Page")
    // listen for send message form
    document.getElementById('eventsSubmitBtn').addEventListener('click',(e)=>{
        message= {}
            message.type = document.getElementById('eventsFldType').value
            message.payload = JSON.parse(document.getElementById('eventsFldPayload').value)

        chrome.runtime.sendMessage(message)
    })

    // add on click event for all ".exampleBtn"
    exBtnList = document.getElementsByClassName('exampleBtn')
    for(let i=0;i<exBtnList.length;i++ ) {
        exBtnList[i].addEventListener('click',(e)=>{
            console.log("Example Buttoon Clicked")
            console.log(e.target)
            setupEventExample(e.target.dataset.type)
        })
    }
}

function setupEventExample(name){
    console.log(eventsExamples[name])
    if(!eventsExamples[name]){
        console.error(`Example Event  ${name} not found`)
        return false;
    }

    document.getElementById('eventsFldType').value = eventsExamples[name].type
    document.getElementById('eventsFldPayload').value = JSON.stringify(eventsExamples[name].paylaod)


}



eventsExamples = {
    techShip: {
        type:"techShip",
        paylaod:{
            orderNum:123456
        }
    },
    logEntry:{
        type:"testLog",
        paylaod:{
            testData:123456
        }
    }
}

document.addEventListener("DOMContentLoaded", function(event) { 
    setTimeout(start,150);
});
  