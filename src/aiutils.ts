import { Ollama } from 'ollama'
import OpenAI from 'openai'
import fs from 'fs'
import { deleteCard, getItems } from './miroutils.ts'
import { sortCards, addCard, moveCard, renameCard } from './mirohighlevel.mjs'
import { findClusters } from './clustering.mjs'
import { log, warn } from 'console'
import { MiroApi } from '@mirohq/miro-api'

const { host, EDENAITOKEN, IMPLEMENTATION } = process.env

const imp = {
    constructCard: async (_: string): Promise<string | null> => { throw new Error("Not implemented") },
    findCategories: async (_: string): Promise<string | null> => { throw new Error("Not implemented") }
}

function readFile() {
    return fs.readFileSync("System.txt", "ascii")
}

switch (IMPLEMENTATION) {
    case "ollama":
        const ollama = new Ollama({ host })
        const model = "interpreter"
        await ollama.create({ model, path: "ModelFile" })
        imp.constructCard = async content => ollama.chat({
            model,
            messages: [{ role: "user", content }]
        }).then(res => res.message.content)
        break
    case "openai":
        const openai = new OpenAI()
        const system = readFile()
        imp.findCategories = async content => openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: "Based on the INPUT groups of JSON arrays, reply with a JSON array, replacing each INPUT group with a single category" }, { role: "user", content }]
        }).then(data => data.choices[0]?.message?.content)
        imp.constructCard = async content => openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: system }, { role: "user", content }]
        }).then(data => data.choices[0]?.message?.content)
        break
}

export async function chat(miroapi: MiroApi, board: string, content: string) {
    const sortedCards = await sortCards(miroapi, board)
    // const categories = getCategoryNames(sortedCards)
    const clusters = <string[][]>findClusters(await getItems(miroapi, board))
    const categories = await imp.findCategories(JSON.stringify(clusters || "[]"))
    if (categories)
        chatToJSON(content, categories)
            .then(data => data.length ? data.forEach(obj => decide(miroapi, board, obj, clusters, sortedCards))
                : decide(miroapi, board, data, clusters, sortedCards))
}

async function chatToJSON(content: string, categories: string) {
    while (true) {
        try {
            content = "CATEGORIES: " + categories + "\n" + content
            const result = await imp.constructCard(content)
            // fs.writeFileSync("result.txt", result)
            return { ...JSON.parse(result || "{}")[0], categories: JSON.parse(categories) }
        } catch (err) {
            warn(err)
            return
        }
    }
}

export function decide(miroapi: MiroApi, board: string, data: { command: any; title: any; newTitle: any; owner: any; categories: any }, clusters: { [x: string]: any }, sortedCards: {} | undefined) {
    const { command, title, newTitle, owner, categories } = data
    const arr = clusters[categories.indexOf(owner)]
    log(clusters, categories, owner)
    const newOwner = arr[Math.floor(Math.random() * arr.length)]

    switch (command) {
        case "addCard":
            addCard(miroapi, board, { ...data, owner: newOwner }, sortedCards)
            break
        case "removeCard":
            deleteCard(miroapi, board, title)
            break
        case "moveCard":
            moveCard(miroapi, board, data, sortedCards)
            break
        case "renameCard":
            renameCard(miroapi, board, data, sortedCards)
            break
        default:
            log("default")
    }
}

export async function generateImage(text) {
    const provider = "replicate/classic"
    const res = await fetch("https://api.edenai.run/v2/image/generation", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${EDENAITOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            providers: provider,
            text,
            resolution: "256x256",
        })
    }).then(res => res.json()).catch(warn)
    log(res)
    log(res.items[0].image_resource_url)
    return res
}