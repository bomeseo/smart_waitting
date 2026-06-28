import {wingAPI} from ".././wingAPI/src/script/wingAPI.js"

(async () => {
    
    window.wing = new wingAPI()
    await wing.connect("ws://localhost:4000")


    const currentFileName = window.location.pathname.split('/').pop();
    if (currentFileName === 'ticket.html') {
        const issueTicket_btn = document.getElementById('issueTicket')
        issueTicket_btn.addEventListener('click',(e) => {
            const ticketContent = document.getElementById('ticketContent')
            const ticketCount = document.getElementById('ticketCount')
            wing.send('reserve',{content:ticketContent.value,count:Number(ticketCount.value)})
        })

    }
    window.wing.send('renewData', {});

    
    wing.recv((recv)=>{
        const code = recv.code
        const data = recv.data
        
        if (code == 'renew'){
            console.log(data.all)
            window.SmartWaitingData = { startedAt: Date.now(), contents: data.all };
        }

    })

})();