import type { NextApiRequest, NextApiResponse } from 'next'
import * as cheerio from 'cheerio';
import { gotScraping } from 'got-scraping'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const resp = await gotScraping({
            url: 'https://komikcast.site/'
        })

        const $ = cheerio.load(resp.body) 
        const listUpdateProject = $(".releases h3:eq(1)").closest('.bixbox').find('.utao').map((i, el) => { return parseBoxData($, el) }).toArray()
        const listNewRelease = $(".releases h3:eq(2)").closest('.bixbox').find('.utao').map((i, el) => { return parseBoxData($, el) }).toArray()
        
        return res.status(200).json({
            result: true,
            site: 'komikcast',
            updatedProject: listUpdateProject,
            newRelease: listNewRelease
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({result: false, message: "Sorry, something went wrong"})
    }
    
}

const parseBoxData = ($: cheerio.CheerioAPI, element: cheerio.Element) => {
    const title = $(element).find('.luf a.series h3').text()
    const img = $(element).find('.imgu a.series img').attr('src')
    const url = $(element).find('.imgu a.series').attr('href')
    const latest = $(element).find('.luf ul li').map((i, el) => { return rowItemChapter($, el) } ).toArray()

    return {
        title: title,
        img: img,
        url: url,
        latest: latest
    }
}

const rowItemChapter = ($: cheerio.CheerioAPI, element: cheerio.Element) => {
    const label = $(element).find('a').text()
    const url = $(element).find('a').attr('href')

    return {
        label: label,
        url: url
    }
}