import express, { Request, Response, json } from 'express';
import sharp from "sharp";
import "dotenv/config"
import path from 'path';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import { v5 as uuidv5, v4 as uuidv4, NIL as uuidNIL } from 'uuid';
import AWS from "aws-sdk";
import { get } from "https";
import fetch from "node-fetch";
import multer from 'multer';
import fs from 'fs';

const app = express();
const port = process.env.PORT || 3000;


const s3bucket = new AWS.S3({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY
});

const COVERS_BUCKET = process.env.S3_BUCKET;


const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 4 * 1024 * 1024, files: 1 } });

// mkdir ~/podino-media/podcast-covers if not exists
// process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE
const coverSizes = [600, 300, 120];
const mediaFolder = `${process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE}/podino-media/podcast-covers`;
fs.mkdirSync(mediaFolder, { recursive: true });
for (let a = 0; a < coverSizes.length; a++) {
    fs.mkdirSync(`${mediaFolder}/${coverSizes[a]}`, { recursive: true });
}


app.use(express.static("./uploads"));
app.use(express.urlencoded({ extended: false }))
app.use(express.json());
// returns the compression middleware
app.use(compression());
// helps you secure your Express apps by setting various HTTP headers
app.use(helmet());
// providing a Connect/Express middleware that can be used to enable CORS with various options
app.use(cors());

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

app.get("/", async (req: Request, res: Response) => {
    try {
        const size = req.query['size'] || '300';
        const url = req.query['imageUrl'];
        if (url == null) {
            res.redirect(301, 'https://podino.app/');
            return;
        } 
        
        const imageUrlUuid = uuidv5(url.toString(), uuidNIL);
        // if exists directly return the image
        const requestedImageAlreadyExists = fs.existsSync(`${mediaFolder}/${size}/${imageUrlUuid}.webp`);
        if (requestedImageAlreadyExists){
            res.sendFile(`${mediaFolder}/${size}/${imageUrlUuid}.webp`);
            return;
        }

        /**
         * DON'T USE AWS
         * check if image is already in ~/podino-media/podcast-covers/
         * show if exists. Else compress and put it there
         * then show it to user
         */
        let start = new Date().getTime();
        const downloadedImage = await fetch(url);

        console.log('Time taken to download: ', new Date().getTime() - start, 'ms');
        start = new Date().getTime();
        
        await saveCompressedImages(imageUrlUuid, Buffer.from(await downloadedImage.arrayBuffer()));
        console.log('Time taken: ', new Date().getTime() - start, 'ms');
        res.sendFile(`${mediaFolder}/${size}/${imageUrlUuid}.webp`);
    } catch (error) {
        console.error(error);
        res.statusCode = 400;
        res.json({
            status: 400,
            message: error.message
        });
    }
});

app.get("/media/*", async (req: Request, res: Response) => {
    // Dosya yolunu req.params[0] ile alıyoruz
    const filePath = req.params[0];

    // Güvenlik için path.normalize kullanarak dosya yolunu normalize ediyoruz
    const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');

    // Dosya tam yolu, sunucunuzdaki yerel dizin yapısına göre ayarlanmalı
    const fullPath = path.join(`${process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE}/podino-media`, safePath);
console.log("fullpath: ", fullPath);

    // Dosyayı gönderiyoruz
    res.sendFile(fullPath, (err) => {
        if (err) {
            // Dosya bulunamadı veya başka bir hata oluştu
            console.log(err);
            res.status(404).send("Dosya bulunamadı!");
        }
    });
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



async function saveCompressedImages(name: String, imageBuffer: Buffer): Promise<void> {
    /**
     * DON'T USE AWS
     * 
     * 
     */
    const compressSizes = [600, 300, 120];
    let lastCompression = imageBuffer;
    //save them to ~/podino-media/podcast-covers/ as {uuidv5}-{size}.webp
    for (let a = 0; a < compressSizes.length; a++) {
        const folderExists = fs.existsSync(`${mediaFolder}/${compressSizes[a]}`);
        if (!folderExists) {
            throw new Error('Folder doesn\'t exist');
        }
        const filePath = `${mediaFolder}/${compressSizes[a]}/${name}.webp`;
        const resized = await sharp(lastCompression).webp({quality:70}).resize(compressSizes[a], compressSizes[a]).toBuffer();
        lastCompression = resized;
        fs.writeFileSync(filePath, resized);
    }
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