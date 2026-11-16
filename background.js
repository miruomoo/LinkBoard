const PARENT_ID = "linkboard-root"

let menuBuild = Promise.resolve()

// Serialized so overlapping triggers can't interleave removeAll/create and cause duplicate-id errors
function rebuildMenus() {
    menuBuild = menuBuild.then(buildMenus).catch(error => {
        console.error("LinkBoard could not build context menus.", error)
    })
    return menuBuild
}

async function buildMenus() {
    const { links = [] } = await chrome.storage.sync.get("links")
    await chrome.contextMenus.removeAll()

    chrome.contextMenus.create({
        id: PARENT_ID,
        title: "LinkBoard",
        contexts: ["editable"]
    })

    if (links.length === 0) {
        chrome.contextMenus.create({
            id: "linkboard-empty",
            parentId: PARENT_ID,
            title: "No links yet - add some in the popup",
            contexts: ["editable"],
            enabled: false
        })
        return
    }

    for (const link of links) {
        chrome.contextMenus.create({
            id: link.id,
            parentId: PARENT_ID,
            // Context menus can't render custom icons/colors, so the emoji icon is prefixed to the title
            title: `${link.icon ? link.icon + "  " : ""}${link.name || link.url}`,
            contexts: ["editable"]
        })
    }
}

chrome.runtime.onInstalled.addListener(rebuildMenus)
chrome.runtime.onStartup.addListener(rebuildMenus)
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.links) rebuildMenus()
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    const { links = [] } = await chrome.storage.sync.get("links")
    const link = links.find(l => l.id === info.menuItemId)
    if (!link || !tab?.id || !isScriptablePage(tab.url)) return

    try {
        await chrome.scripting.executeScript({
            target: { tabId: tab.id, frameIds: [info.frameId ?? 0] },
            func: insertText,
            args: [link.url]
        })
    } catch (error) {
        console.warn("LinkBoard could not insert into this page.", error)
    }
})

function isScriptablePage(url) {
    try {
        return ["http:", "https:", "file:"].includes(new URL(url).protocol)
    } catch {
        return false
    }
}

// Runs inside the page
function insertText(text) {
    const el = document.activeElement
    if (!el) return

    // execCommand keeps undo history and fires input events that frameworks (React, etc.) listen to
    if (document.execCommand("insertText", false, text)) return

    if (typeof el.setRangeText === "function") {
        const start = el.selectionStart ?? el.value.length
        const end = el.selectionEnd ?? el.value.length
        el.setRangeText(text, start, end, "end")
        el.dispatchEvent(new Event("input", { bubbles: true }))
    }
}
