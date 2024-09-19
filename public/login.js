window.onload=function(){
    let loginButton= document.querySelector(".login_btn");
    let failTitle = document.querySelector(".fail_title");
    let successTitle = document.querySelector(".success_title");
    let nameInput = document.querySelector("#name");
    let passwordInput = document.querySelector("#password");
    let credPrompt = document.querySelector(".cred_prompt")
    let urlLink = document.querySelector(".link_url");

    loginButton.addEventListener("click",async (evt)=>{
              failTitle.classList.add('d-none')
              if (nameInput.value < 1 || passwordInput.value < 1) {
                failTitle.classList.remove('d-none')
                failTitle.innerHTML = "password and name must be entered!" 
                return
              }
              const dataToFetch = {
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({name:nameInput.value, password:passwordInput.value})
              }

                try {
                    const currentUrl = new URL(document.location.href)
                    let response = await fetch(`${currentUrl.protocol}//${currentUrl.hostname}/login`, dataToFetch).then(res=>res.json())
                    if (response.status){
                         successTitle.classList.remove("d-none")
                         failTitle.classList.add("d-none")
                         //assign token
                         sessionStorage.setItem('auth',response.auth);
                         //hide credantials prompt and show link, disable button and input:
                         credPrompt.classList.add('d-none');
                         urlLink.classList.remove('d-none');
                          let form = document.querySelector(".my_form")
                          form.classList.add('d-none')
                    } else{
                        successTitle.classList.add("d-none")
                        failTitle.classList.remove("d-none")
                        failTitle.innerText="incorrect password or login!"
                    }
                    //set session store
                    
                    //sessionStorage.getItem(key)
                    //sessionStorage.removeItem(key)
                    //set title
                   
                } catch (e) {
                    failTitle.classList.remove('d-none')
                    failTitle.innerText =`error: ${e.message}`
                }
             
          

    })

}