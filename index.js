const form = document.getElementById("link-form")
const iconPicker = document.getElementById("icon-picker")
const colorPicker = document.getElementById("color-picker")
const nameEl = document.getElementById("name-el")
const urlEl = document.getElementById("url-el")
const newLinkBtn = document.getElementById("new-link-btn")
const saveBtn = document.getElementById("save-btn")
const cancelBtn = document.getElementById("cancel-btn")
const linkboard = document.getElementById("linkboard")

const ICONS = [
    "🔗", "⭐", "💼", "🏠", "📧", "📅", "📁", "📝", "💬", "🛒",
    "🎵", "🎬", "📷", "💻", "🐙", "📊", "🔒", "💡", "🚀", "❤️"
]
const COLORS = [
    "#1A73E8", "#4285F4", "#03A9F4", "#00BCD4", "#009688",
    "#34A853", "#8BC34A", "#CDDC39", "#FBBC04", "#FF9800",
    "#FF5722", "#EA4335", "#E91E63", "#9C27B0", "#673AB7",
    "#3F51B5", "#795548", "#9E9E9E", "#607D8B", "#202124"
]

const EDIT_SVG = '<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>'
const DELETE_SVG = '<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'

let links = []
let editingId = null
let draggedId = null
let dropIndex = null
let selectedIcon = ICONS[0]
let selectedColor = COLORS[0]

buildPicker(iconPicker, ICONS, (btn, icon) => {
    btn.textContent = icon
    btn.title = icon
}, icon => { selectedIcon = icon })

buildPicker(colorPicker, COLORS, (btn, color) => {
    btn.classList.add("swatch")
    btn.style.setProperty("--c", color)
    btn.title = color
}, color => { selectedColor = color })

syncPickers()

chrome.storage.sync.get("links").then(data => {
    links = data.links || []
    renderLinks()
})

form.addEventListener("submit", async e => {
    e.preventDefault()
    if (!validateURL()) {
        urlEl.reportValidity()
        return
    }

    const link = {
        id: editingId || crypto.randomUUID(),
        icon: selectedIcon,
        color: selectedColor,
        name: nameEl.value.trim(),
        url: urlEl.value.trim()
    }

    if (editingId) {
        links = links.map(l => (l.id === editingId ? link : l))
    } else {
        links.push(link)
    }

    await saveLinks()
    resetForm()
})

urlEl.addEventListener("input", validateURL)
cancelBtn.addEventListener("click", resetForm)
newLinkBtn.addEventListener("click", () => openForm())

async function saveLinks() {
    await chrome.storage.sync.set({ links })
    renderLinks()
}

function buildPicker(container, values, decorate, onSelect) {
    for (const value of values) {
        const btn = document.createElement("button")
        btn.type = "button"
        btn.className = "chip"
        btn.dataset.value = value
        btn.setAttribute("role", "radio")
        decorate(btn, value)
        btn.addEventListener("click", () => {
            onSelect(value)
            syncPickers()
        })
        container.appendChild(btn)
    }
}

function syncPickers() {
    for (const [container, selected] of [[iconPicker, selectedIcon], [colorPicker, selectedColor]]) {
        for (const btn of container.children) {
            const on = btn.dataset.value === selected
            btn.classList.toggle("selected", on)
            btn.setAttribute("aria-checked", on)
        }
    }
}

function resetForm() {
    editingId = null
    form.reset()
    selectedIcon = ICONS[0]
    selectedColor = COLORS[0]
    syncPickers()
    saveBtn.textContent = "Add link"
    form.hidden = true
    newLinkBtn.hidden = false
    cancelBtn.hidden = false
}

function openForm() {
    form.hidden = false
    newLinkBtn.hidden = true
    cancelBtn.hidden = false
    nameEl.focus()
}

function validateURL() {
    const value = urlEl.value.trim()
    let message = ""

    if (value) {
        try {
            const parsed = new URL(value)
            const supportedProtocol = ["http:", "https:", "file:"].includes(parsed.protocol)
            const hasWebHost = parsed.protocol === "file:" || Boolean(parsed.hostname)
            if (!supportedProtocol || !hasWebHost) {
                message = "Enter a valid http, https, or file URL."
            }
        } catch {
            message = "Enter a valid http, https, or file URL."
        }
    }

    urlEl.setCustomValidity(message)
    return !message
}

function startEdit(link) {
    openForm()
    editingId = link.id
    selectedIcon = link.icon || ICONS[0]
    selectedColor = link.color || COLORS[0]
    syncPickers()
    nameEl.value = link.name
    urlEl.value = link.url
    validateURL()
    saveBtn.textContent = "Save"
    nameEl.focus()
}

function renderLinks() {
    linkboard.replaceChildren()

    for (const link of links) {
        const li = document.createElement("li")
        li.draggable = true
        li.dataset.id = link.id

        li.addEventListener("dragstart", event => {
            event.dataTransfer.effectAllowed = "move"
            event.dataTransfer.setData("text/plain", link.id)
            draggedId = link.id
            dropIndex = null
            li.classList.add("dragging")
        })

        li.addEventListener("dragend", () => {
            li.classList.remove("dragging")
            endDrag()
        })

        const icon = document.createElement("span")
        icon.className = "avatar"
        icon.style.setProperty("--c", link.color)
        icon.textContent = link.icon || "🔗"

        const text = document.createElement("div")
        text.className = "text"
        const name = document.createElement("span")
        name.className = "title"
        name.textContent = link.name
        const url = document.createElement("span")
        url.className = "subtitle"
        url.textContent = link.url
        text.append(name, url)

        const edit = document.createElement("button")
        edit.className = "icon-btn"
        edit.title = "Edit"
        edit.innerHTML = EDIT_SVG
        edit.addEventListener("click", () => startEdit(link))

        const del = document.createElement("button")
        del.className = "icon-btn"
        del.title = "Delete"
        del.innerHTML = DELETE_SVG
        del.addEventListener("click", async () => {
            links = links.filter(l => l.id !== link.id)
            if (editingId === link.id) resetForm()
            await saveLinks()
        })

        li.append(icon, text, edit, del)
        linkboard.appendChild(li)
    }
}

function clearDropMarker() {
    linkboard.querySelectorAll(".drop-before, .drop-after").forEach(item => {
        item.classList.remove("drop-before", "drop-after")
    })
}

function endDrag() {
    draggedId = null
    dropIndex = null
    clearDropMarker()
}

// Listens on the document so the top and bottom edges of the list are valid targets
document.addEventListener("dragover", event => {
    if (!draggedId) return
    event.preventDefault()

    const items = [...linkboard.children]
    const next = items.findIndex(item => {
        const { top, height } = item.getBoundingClientRect()
        return event.clientY < top + height / 2
    })
    dropIndex = next === -1 ? items.length : next

    clearDropMarker()
    if (dropIndex < items.length) items[dropIndex].classList.add("drop-before")
    else items[items.length - 1].classList.add("drop-after")
})

document.addEventListener("drop", async event => {
    if (!draggedId) return
    event.preventDefault()

    const from = links.findIndex(link => link.id === draggedId)
    let to = dropIndex
    endDrag()
    if (from === -1 || to === null) return

    if (from < to) to--
    if (from === to) return

    const [moved] = links.splice(from, 1)
    links.splice(to, 0, moved)
    await saveLinks()
})
