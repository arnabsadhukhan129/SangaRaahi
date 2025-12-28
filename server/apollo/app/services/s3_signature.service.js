const crypto = require("crypto");
const HASH_ALGO = "sha256";
const SignatureGenerator = {
    generateSignature(url, httpMethod, region, payLoadIfAny) {
        if(!url) throw new Error("Missing URL");
        if(!httpMethod) throw new Error("Missing HTTP Method");
        const dateObj = this.getTimeData();
        const xAmzisoData = dateObj.timestamp;
        const currDate = dateObj.currDate;
        const payloadSignature = this.generatePayloadSignature(payLoadIfAny);
        const canonicalRequest = this.getCanonicalRequestString(url, httpMethod, payloadSignature, xAmzisoData);

        const ALGORITHM = "AWS4-HMAC-SHA256";
        const SIGNEDHEADERS = "host;x-amz-content-sha256;x-amz-date";
        const REGION = region;
        const SERVICE = "s3";
        const SECRET_KEY = process.env.AWS_SECRATE_KEY;
        const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY;
        const REQUEST = "aws4_request";

        const scope = currDate + "/" + REGION + "/" + SERVICE + "/" + REQUEST;

        const stringToSign = ALGORITHM + "\n" + xAmzisoData + "\n" + scope + "\n" +
        crypto.createHash(HASH_ALGO).update(canonicalRequest).digest("hex").toLowerCase();
        
        const kDate = crypto.createHmac(HASH_ALGO, "AWS4" + SECRET_KEY).update(currDate).digest();
        const kRegion = crypto.createHmac(HASH_ALGO, kDate).update(REGION).digest();
        const kService = crypto.createHmac(HASH_ALGO, kRegion).update(SERVICE).digest();
        const kSigning = crypto.createHmac(HASH_ALGO, kService).update(REQUEST).digest();

        const signature = crypto.createHmac(HASH_ALGO, kSigning).update(stringToSign).digest("hex").toLowerCase();

        const authorizationHeader = ALGORITHM + " Credential=" + ACCESS_KEY_ID + "/" + scope + ",SignedHeaders=" + SIGNEDHEADERS + ",Signature=" + signature;

        return {
            Authorization: authorizationHeader,  
            "x-amz-content-sha256": payloadSignature,
            "x-amz-date": xAmzisoData
        };
    },
    generatePayloadSignature(payLoadIfAny) {
        let signaureContent = "";
        if(payLoadIfAny) {
            if(typeof payLoadIfAny === 'object') {
                payLoadIfAny = JSON.stringify(payLoadIfAny);
            }
            signaureContent = payLoadIfAny;
        }
        return crypto.createHash(HASH_ALGO).update(signaureContent).digest("hex").toLowerCase();
    },
    getCanonicalRequestString(url, httpMethod, payloadSignature, timestamp) {
        // get the url domain and path
        const urlRef = new URL(url);
        console.log(urlRef.hostname);
        console.log(urlRef.pathname);
        const host = urlRef.hostname;
        // Encode everything except the /
        const path = urlRef.pathname.split("/").map(part => encodeURIComponent(part)).join("/");
        let query = urlRef.search;
        let str = `${httpMethod}\n${path}\n`;
        if(query) {
            // Omit the quetion mark
            query = query.replace("?", "");
            query = query.split("&").map(eachPart => eachPart.split("=").map((part) => encodeURIComponent(part)).join("=")).join("&");
            str += `${query}`;
        }
        str += `\nhost:${host}\nx-amz-content-sha256:${payloadSignature}\nx-amz-date:${timestamp}\n\nhost;x-amz-content-sha256;x-amz-date\n${payloadSignature}`;
        return str;
    },
    getTimeData() {
        const date = new Date();
        let isoData = date.toISOString();
        let xAmzisoData = isoData
        .replace(new RegExp("-", "g"), "")
        .replace(new RegExp(":", "g"), "")
        .split(".")[0] + "Z";
        const currDate = this.getDateInFormat(date);
        return {currDate, timestamp: xAmzisoData};
    },
    getDateInFormat(date){
        const year = date.getFullYear();
        let month = date.getMonth() + 1;
        month = month < 10 ? `0${month}` : month;
        let day = date.getDate();
        day = day < 10 ? `0${day}` : day;
        return `${year}${month}${day}`;
    }
}

module.exports = SignatureGenerator;