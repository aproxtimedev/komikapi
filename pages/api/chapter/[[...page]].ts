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
            url: 'https://komikcast.io/chapter/' + page
        })

        if (resp.statusCode == 404) {
            return res.status(404).json({result: false, message: "Tidak ditemukan"})
        }

        const $ = cheerio.load(resp.body) 
        const listImages = $(".main-reading-area img").map((i, el) => { return $(el).attr('src') }).toArray()
        
        return res.status(200).json({
            result: true,
            site: 'komikcast',
            images: listImages
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({result: false, message: "Sorry, something went wrong"})
    }   
}