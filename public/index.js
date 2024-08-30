window.onload = function(){
    const exampleSocket = new WebSocket("wss://localhost:443");
    let startButton = document.querySelector("#startBtn")
    let edit = document.querySelector("#inputEdit")
    let remoteText = document.querySelector("#remoteText");

    startButton.addEventListener("click",(evt)=>{
    exampleSocket.send(edit.value)
    })


    exampleSocket.onmessage=(evt)=>{
        remoteText.innerHTML = evt.data;
    }



    exampleSocket.onopen = (event) => {
    exampleSocket.send("hello from browser!!");
    };

}