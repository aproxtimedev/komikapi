import type { NextApiRequest, NextApiResponse } from 'next'
import * as cheerio from 'cheerio';
import { gotScraping } from 'got-scraping'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        var query = req.body.query
        if (query.trim() == "") {
            return res.status(400).json({message: "Masukkan kata kunci"})
        }

        query = encodeURIComponent(query)
        const response = await gotScraping({
            url: 'https://komikcast.io/wp-admin/admin-ajax.php',
            body: `action=searchkomik_komikcast_redesign&search=${query}&orderby=relevance&per_page=50`,
            method: 'POST',
            headers: {
                referer: 'https://komikcast.io',
                'content-type': 'application/x-www-form-urlencoded'
            },
        })

        const parsed: Array<any> = JSON.parse(response.body)
        const sanitized = parsed.map((object) => { return sanitizeObject(object) })

        return res.status(200).json(sanitized)

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

const sanitizeObject = (object: any) => {
    const $ = cheerio.load(object.thumbnail)
    const thumbnail = $('img').attr('src')
    const permalink = `komik/${sanitizeUrl(object.permalink)}`
    const genres = object.genres.map((object: any) => { return object.name })

    return {
        thumbnail: thumbnail,
        permalink: permalink,
        title: object.title,
        genres: genres
    }
}