const puppeteer = require('puppeteer')
const request = require('request')
const fs = require('fs')
const { pipeline } = require('stream')
const { waitForDebugger } = require('inspector')
const { resolve } = require('path')


var downloadImg = (uri, fileName, callBack) => {
    request.head(uri, (err, res, body) => {
        request(uri).pipe(fs.createWriteStream(__dirname + `/${fileName}`)).on('close', () => console.log('Finished Copy Image'))
    })
}

function wait(ms) { return new Promise(resolve => setTimeout(()=> resolve(), ms))}


;(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 100,
    })
    const page = await browser.newPage()
    await page.goto('https://ck101.com/thread-5144405-1-1.html', {
        waitUntil: 'domcontentloaded',
    })

    // Get the height of the rendered page
    const bodyHandle = await page.$('body')
    const { height } = await bodyHandle.boundingBox()
    await bodyHandle.dispose()

    // Scroll one viewport at a time, pausing to let content load
    const viewportHeight = page.viewport().height
    let viewportIncr = 0
    while (viewportIncr + viewportHeight < height) {
        await page.evaluate(_viewportHeight => {
            window.scrollBy(0, _viewportHeight)
        }, viewportHeight)
        await wait(20)
        viewportIncr = viewportIncr + viewportHeight
    }

    // Scroll back to top
    await page.evaluate(_ => {
        window.scrollTo(0, 0)
    })

    // Some extra delay to let images load
    await wait(1000)

    let imageLink = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'))
        return images.map(img => img.src).filter(img => img.includes('s1'))
        // .filter(img => img.includes('https:'))
    })

    imageLink.forEach((img, index) =>
        downloadImg(img, index + '.jpg', function() {
            console.log('done')
        })
    )

    await browser.close()
})()


