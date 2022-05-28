import express, { Request, Response, json } from 'express';
import sharp from "sharp";
import "dotenv/config"
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import { v5 as uuidv5, v4 as uuidv4, NIL as uuidNIL } from 'uuid';
import AWS from "aws-sdk";
import { get } from "https";
import fetch from "node-fetch";
import multer from 'multer';

const app = express();
const port = 3002;


const s3bucket = new AWS.S3({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
});

const COVERS_BUCKET = process.env.S3_BUCKET;


const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 4 * 1024 * 1024, files: 1 } });

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

app.post("/up", upload.single('file'), async (req: Request, res: Response) => {
    try {
        console.log(req.body);

        const buffer = req.file == null ? Buffer.from(req.body['file'], 'base64') : req.file.buffer;

        const fileAlias = uuidv4();
        const alias = req.body['alias'] as string;
        if (alias == null) throw Error('alias is null');
        const data = await getFilePromise(alias, fileAlias, buffer)
        res.json({
            status: 200,
            data
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

app.post("/oc", async (req: Request, res: Response) => {
    try {

        const podcastName = req.body['podcastRSS'] as string;
        const podcastUuid = uuidv5(podcastName, uuidNIL);
        const trim = req.body['trim'] == true;
        if (podcastName == null) throw Error('podcastRSS is null');
        const imageUrls = req.body['images'] as any[];
        if (imageUrls == null) throw Error('imagrURls is null');

        const missingImageUrls = [];
        const isExistPromises: Promise<any>[] = [];
        for (let a = 0; a < imageUrls.length; a++) {
            //TODO check 600 too?
            isExistPromises.push(getUrlIfDoesNotExist(300, imageUrls[a], podcastUuid, trim));
        }
        await Promise.all(isExistPromises.map(p => p.then(e => missingImageUrls.push(e), err => err)));
        console.log(missingImageUrls);

        await postImages(podcastUuid, missingImageUrls, trim);
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

app.post("/oc/multi", async (req: Request, res: Response) => {
    try {
        const podcastName = req.body['podcastRSS'] as string;
        const podcastUuid = uuidv5(podcastName, uuidNIL);
        const trim = req.body['trim'] == true;
        if (podcastName == null) throw Error('podcastRSS is null');
        const imageUrls = req.body['images'] as any[];
        if (imageUrls == null) throw Error('imagrURls is null');

        const missingImageUrls = [];
        const isExistPromises: Promise<any>[] = [];
        for (let a = 0; a < imageUrls.length; a++) {
            //TODO check 600 too?
            isExistPromises.push(getUrlIfDoesNotExist(300, imageUrls[a], podcastUuid, trim));
        }
        await Promise.all(isExistPromises.map(p => p.then(e => missingImageUrls.push(e), err => err)));
        console.log(missingImageUrls);

        await postImages(podcastUuid, missingImageUrls, trim);
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

async function oc() {

}

async function getUrlIfDoesNotExist(size: number, imageUrl: string, podcastUuid: string, trim: boolean = false): Promise<string> {
    const imageUrlUuid = uuidv5(trim ? imageUrl.split('?')[0] : imageUrl, uuidNIL);
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

async function postImages(podcasUuid: string, urls: string[], trim: boolean = false) {
    try {
        const urlPromises: Promise<any>[] = [];
        for (let a = 0; a < urls.length; a++) {
            urlPromises.push(getUrlPromise(podcasUuid, urls[a], trim));
        }
        await Promise.all(urlPromises.map(e => e.catch(c => console.error('Couldn\'t upload or download  ' + c))));
        console.log('AALLL DONE!');
    } catch (error) {
        console.log('ERR CAUTGHT');

        throw error;
    }

}

async function getUrlPromise(podcastUUID: string, url: string, trim: boolean): Promise<any> {
    return new Promise(async (resolve, reject) => {
        try {
            const imageUrlUuid = uuidv5(trim ? url.split('?')[0] : url, uuidNIL);
            const fimg = await fetch(url)
            const compressedImageCouple = await getCompressedImageCouple(Buffer.from(await fimg.arrayBuffer()));
            const promises: Promise<any>[] = [
                getSingleFileUploadPromise(getPutObjectRequest(compressedImageCouple._300, 300, imageUrlUuid, podcastUUID)),
                getSingleFileUploadPromise(getPutObjectRequest(compressedImageCouple._600, 600, imageUrlUuid, podcastUUID))
            ];
            await Promise.all(promises.map(a => a.then(r => console.log('Cover is successfully uploaded to aws! 🔥')).catch(e => console.error('Couldn\'t upload ' + e))));
            resolve('ok');
        } catch (error) {
            reject(error);
        }
    });
}

async function getFilePromise(folder: string, fileName: string, file: Buffer): Promise<string[]> {
    try {
        const fileUUID = uuidv5(fileName, uuidNIL);
        const folderUUID = uuidv5(folder, uuidNIL);
        const compressedImageCouple = await getCompressedImageCouple(file);
        const promises: Promise<string>[] = [
            getSingleFileUploadPromise(getPutObjectRequest(compressedImageCouple._300, 300, fileUUID, folderUUID)),
            getSingleFileUploadPromise(getPutObjectRequest(compressedImageCouple._600, 600, fileUUID, folderUUID))
        ];
        const uploadedUrls: string[] = [];
        await Promise.all(promises.map(a => a.then(r => {
            uploadedUrls.push(r);
            return console.log('Image is successfully uploaded to aws! 🔥 https://podcasterapp-covers.s3.eu-central-1.amazonaws.com/' + r);
        }).catch(e => { throw new Error('CAUGHT! e') })));
        return uploadedUrls;
    } catch (error) {
        throw error;
    }
}

async function getCompressedImageCouple(imageBuffer: Buffer): Promise<{ _300: Buffer, _600: Buffer }> {
    const kilobytes = (imageBuffer.byteLength / 1024);
    let quality;
    if (kilobytes > 2000)
        quality = 60
    else if (kilobytes > 700)
        quality = 70
    else if (kilobytes > 400)
        quality = 75
    else
        quality = 80

    const resized600 = await sharp(imageBuffer)
        .jpeg({ quality }).resize(600, 600)
        .toBuffer();
    const resized300 = await sharp(imageBuffer).resize(300, 300)
        .toBuffer();
    return { _300: resized300, _600: resized600 };
}

async function getSingleFileUploadPromise(params: AWS.S3.PutObjectRequest): Promise<string> {
    const promise = await s3bucket.upload(params).promise();

    return promise.Key;
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