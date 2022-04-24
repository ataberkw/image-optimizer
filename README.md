  # Basic image compressing tool to host aws s3

  

This is a minimal helper to compress and upload images to AWS s3. Built for Podcaster App. Feel free to play with it.
It compresses, resizes and converts an image to JPEG. It then uploads to Amazon S3 service.

## An example request

**Address:** http://localhost:3002/oc/
**Body:**  

    {
	    "podcastRSS": "https://rss.art19.com/baris-ozcan-ile-111-hz",
	    "images": 
	    [
	    "https://content.production.cdn.art19.com/images/94/cf/0b/c5/94cf0bc5-7369-4cd3-bae8-0797330c1fac/9ffa8fb0b6d65f3f5fe1b4817790b68b4e87fe96680e6be913ad9ea763838ca0f995354076537a972e275f21e0d635f1be5e1fcfe3bf154e045af981d9b27963.jpeg", 
	    "https://content.productio7963.jpeg", //invalid image.
	    "https://content.production.cdn.art19.com/images/02/78/33/a9/027833a9-1ea7-4b62-b178-28dafad4dd06/de790c26ce3706bafbc461dfe80dbab43874fb24dad31eb476d2d2bc2fbc4e57293d6d3cb1c2cc68bd1497d96fa021e7d7bb7b1d6487f378ea0f6725928f1853.jpeg",
	    "https://content.production.cdn.art19.com/images/02/78/33/a9/027833a9-1ea7-4b62-b178-28dafad4dd06/de790c26ce3706bafbc461dfe80dbab43874fb24dad31eb476d2d2bc2fbc4e57293d6d3cb1c2cc68bd1497d96fa021e7d7bb7b1d6487f378ea0f6725928f1853.jpeg",
	    "https://content.production.cdn.art19.com/images/eb/12/17/cb/eb1217cb-1884-42c3-868e-114ae090a791/2269786c05087530082b95ac7b847b993b0f3c3155207a2221c1158621d1edf26213412e73f4817cc3594b8861d31c375258bff37ff4f8b68ae6302f3a19ada6.jpeg",
	    "https://content.production.cdn.art19.com/images/30/8a/18/16/308a1816-5312-4fe8-92e7-7a96a3b4272b/2b3baf5fdba3ea775647138ba350526027da45bcba9d9dfe220e4798145f52a51a10cde5f776d871117a01671805802de1370e3074cb33239f731b01194ae225.jpeg"
	    ]
    }

## Links to Podcaster App
> Podcaster App is a social podcast browsing application.
[podcasterapp.net](https://podcasterapp.net/)
[Podcaster App on Google Play Store](https://play.google.com/store/apps/details?id=net.podcasterapp/)
[Podcaster App on App Store](https://apps.apple.com/tr/app/podcasterapp/id1609760899/)