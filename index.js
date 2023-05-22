const button = document.getElementById("input-btn")
const input = document.getElementById("input-el")
const linkboard = document.getElementById("linkboard")

let links = []

button.addEventListener("click", saveInput)

function saveInput () {
    links.push(input.value)
    renderLinks()
}

function renderLinks(){ 
    const li = document.createElement("li")
    for (let i=0; i<links.length;i++){
        li.innerText=links[i]
        linkboard.appendChild(li)
    }
}
