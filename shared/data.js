const master_branch = "https://raw.githubusercontent.com/macas1/macas1.github.io/master"

export async function loadLocalText(file_name) {
    const file = await loadLocalFile(file_name)
    return file.text()
}

async function loadLocalFile(file_name) {
    return await fetch(master_branch + window.location.pathname + "/data/" + file_name)
}