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
            url: 'https://komikcast.io/komik/' + page
        })

        if (resp.statusCode == 404) {
            return res.status(404).json({result: false, message: "Tidak ditemukan"})
        }

        const $ = cheerio.load(resp.body) 
        
        $(".komik_info-content-info-release b").remove();

        const title = $(".komik_info-content-body-title").text()
        const img = $(".komik_info-content-thumbnail-image.wp-post-image").attr('src')
        const genre = $(".komik_info-content-genre a").map((i, el) => { return $(el).text() }).toArray()
        const rating = $(".data-rating").attr('data-ratingkomik')
        const released = $(".komik_info-content-info-release").text().trim();
        const type = $(".komik_info-content-info-type a").text()
        const lastUpdate = $(".komik_info-content-update time").text()
        const synopsis = $(".komik_info-description-sinopsis").text().trim()
        const chapters = $(".komik_info-chapters-wrapper li").map((i, el) => { return parseChapterRow($, el) }).toArray()
        
        return res.status(200).json({
            result: true,
            site: 'komikcast',
            title: sanitizeText(title),
            thumbnail: img,
            genres: genre,
            rating: rating,
            released: released,
            type: type,
            updated: lastUpdate,
            synopsis: synopsis,
            chapters: chapters
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({result: false, message: "Sorry, something went wrong"})
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

const sanitizeText = (text: String | undefined) => {
    if (text == undefined) {
        return undefined
    }

    return text.replace(/\s\s+/g, ' ')
} 

const parseChapterRow = ($: cheerio.CheerioAPI, element: cheerio.Element) => {
    const label = $(element).find('a').text() 
    const url = $(element).find('a').attr('href')
    const time = $(element).find('.chapter-link-time').text().trim() 

    return {
        label: sanitizeText(label),
        permalink: `chapter/${sanitizeUrl(url)}`,
        updated: sanitizeText(time)
    }
}