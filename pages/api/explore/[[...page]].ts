import type { NextApiRequest, NextApiResponse } from 'next'
import * as cheerio from 'cheerio';
import { gotScraping } from 'got-scraping'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const page = req.query.page?.at(0)

        const resp = await gotScraping({
            url: 'https://komikcast.io/daftar-komik' + (page != undefined ? `/page/${page}` : "")
        })

        if (resp.statusCode == 404) {
            return res.status(404).json({ result: false, message: "Tidak ditemukan" })
        }

        const $ = cheerio.load(resp.body)
        const listComic = $(".list-update_items-wrapper .list-update_item").map((i, el) => { return parseItemComic($, el) }).toArray()

        return res.status(200).json({
            result: true,
            site: 'komikcast',
            items: listComic
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ result: false, message: "Sorry, something went wrong" })
    }
}

const sanitizeUrl = (url: string | undefined) => {
    if (url == undefined) {
        return undefined
    }

    if (!url.includes("/")) {
        return url
    }

    const splitted = url.split("/")
    if (splitted[splitted.length - 1].trim() == "") {
        return splitted[splitted.length - 2]
    }

    return splitted[splitted.length - 1]
}

const parseItemComic = ($: cheerio.CheerioAPI, element: cheerio.Element) => {
    const url = $(element).find('a').attr('href')
    const title = $(element).find(".list-update_item-info h3.title").text()
    const image = $(element).find(".list-update_item-image img").attr('src')
    const type = $(element).find(".list-update_item-image .type").text().trim()
    const rating = $(element).find(".list-update_item-info .other .numscore").text().trim() 
    const latestChapter = $(element).find(".list-update_item-info .other .chapter")[0]

    return {
        title: title,
        thumbnail: image,
        type: type,
        rating: rating,
        permalink: `komik/${sanitizeUrl(url)}`,
        latest: parseChapter($, latestChapter)
    }
}

const parseChapter = ($: cheerio.CheerioAPI, element: cheerio.Element) => {
    const label = $(element).text().trim()
    const url = $(element).attr('href')

    return {
        label: label,
        permalink: `chapter/${sanitizeUrl(url)}`
    }
}