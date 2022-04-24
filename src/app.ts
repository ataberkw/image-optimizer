import express, { Request, Response, json } from 'express';
import sharp from "sharp";
import "dotenv/config"
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import { v5 as uuidv5, NIL as uuidNIL } from 'uuid';
import AWS from "aws-sdk";
import { get } from "https";
import fetch from "node-fetch";

const app = express();
const port = 3002;


const s3bucket = new AWS.S3({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
});

const COVERS_BUCKET = process.env.S3_BUCKET;


app.use(express.static("./uploads"));
app.use(express.urlencoded({ extended: false }))
app.use(express.json());
// returns the compression middleware
app.use(compression());
// helps you secure your Express apps by setting various HTTP headers
app.use(helmet());
// providing a Connect/Express middleware that can be used to enable CORS with various options
app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});

app.post("/oc", async (req: Request, res: Response) => {
    try {
        const podcastName = req.body['podcastRSS'] as string;
        const podcastUuid = uuidv5(podcastName, uuidNIL);
        if (podcastName == null) throw Error('podcastRSS is null');
        const imageUrls = req.body['images'] as any[];
        if (imageUrls == null) throw Error('imagrURls is null');

        const missingImageUrls = [];
        const isExistPromises: Promise<any>[] = [];
        for (let a = 0; a < imageUrls.length; a++) {
            //TODO check 600 too?
            isExistPromises.push(getUrlIfDoesNotExist(300, imageUrls[a], podcastUuid));
        }
        await Promise.all(isExistPromises.map(p => p.then(e => missingImageUrls.push(e), err => err)));
        console.log(missingImageUrls);

        await postImages(podcastUuid, missingImageUrls);
        res.json({
            status: 200,
        });
    } catch (error) {
        console.error(error);
        res.statusCode = 400;
        res.json({
            status: 400,
            message: error.message
        });
    }
});

async function getUrlIfDoesNotExist(size: number, imageUrl: string, podcastUuid: string): Promise<string> {
    const imageUrlUuid = uuidv5(imageUrl, uuidNIL);
    const request = getHeadObjectRequest(size, imageUrlUuid, podcastUuid);
    return new Promise(async (resolve, reject) => {
        try {
            await s3bucket.headObject(request).promise();
            console.log('Image is already on AWS 🎉');
            reject();
        } catch (error) {
            resolve(imageUrl);
        }
    });
}

async function postImages(podcasUuid: string, urls: string[]) {
    try {

        const urlPromises: Promise<any>[] = [];
        for (let a = 0; a < urls.length; a++) {
            urlPromises.push(getUrlPromise(podcasUuid, urls[a]));
        }
        await Promise.all(urlPromises.map(e => e.catch(c => console.error('Couldn\'t upload or download ' + c))));
        console.log('AALLL DONE!');
    } catch (error) {
        console.log('ERR CAUTGHT');

        throw error;
    }

}


async function getUrlPromise(podcastUUID: string, url: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
        try {
            const imageUrlUuid = uuidv5(url, uuidNIL);
            const fimg = await fetch(url)
            const downloadedImage = Buffer.from(await fimg.arrayBuffer())

            const resized600 = await sharp(downloadedImage)
                .jpeg({ quality: 65 }).resize(600, 600)
                .toBuffer();
            const resized300 = await sharp(downloadedImage).jpeg({ quality: 65 }).resize(300, 300)
                .toBuffer();
            const promises: Promise<any>[] = [
                getSingleFileUploadPromise(getPutObjectRequest(resized300, 300, imageUrlUuid, podcastUUID)),
                getSingleFileUploadPromise(getPutObjectRequest(resized600, 600, imageUrlUuid, podcastUUID))
            ];
            await Promise.all(promises.map(a => a.then(r => console.log('Cover is successfully uploaded to aws! 🔥')).catch(e => console.error('Couldn\'t upload ' + e))));
            resolve('ok');
        } catch (error) {
            reject(error);
        }
    });
}
function getSingleFileUploadPromise(params: AWS.S3.PutObjectRequest): Promise<AWS.S3.ManagedUpload.SendData> {
    return s3bucket.upload(params).promise();
};

function getPutObjectRequest(buffer: AWS.S3.Body, size: number, imageUrlUuid: string, podcastUuid: string): AWS.S3.PutObjectRequest {
    return {
        Bucket: COVERS_BUCKET,
        Key: getCoverKey(size, imageUrlUuid, podcastUuid),
        Body: buffer
    };
}

function getHeadObjectRequest(size: number, imageUrlUuid: string, podcastUuid: string): AWS.S3.HeadObjectRequest {
    return {
        Bucket: COVERS_BUCKET,
        Key: getCoverKey(size, imageUrlUuid, podcastUuid),
    };
}

function getCoverKey(size: number, imageUrlUuid: string, podcastUuid: string) {
    return `covers/${podcastUuid}/${imageUrlUuid}/${imageUrlUuid}-${size}.webp`;
}