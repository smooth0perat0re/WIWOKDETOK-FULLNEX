import crypto from 'crypto';

export class HmacClient {
    static generateHeaders(method: string, url: string, body: any, apiKey: string, apiSecret: string): Record<string, string> {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        
        let urlObj;
        try {
            urlObj = new URL(url);
        } catch (e) {
            urlObj = new URL(url, 'http://localhost');
        }
        let path = urlObj.pathname;
        
        if (!path.startsWith('/civitas/')) {
            path = '/civitas' + path;
        }

        const parsedBody = { ...body };
        for (const key in parsedBody) {
            if (typeof parsedBody[key] === 'object' && parsedBody[key] !== null) {
                delete parsedBody[key];
            }
        }
        
        // ksort equivalent
        const sortedKeys = Object.keys(parsedBody).sort();
        const searchParams = new URLSearchParams();
        sortedKeys.forEach(key => {
            searchParams.append(key, String(parsedBody[key]));
        });
        
        // PHP http_build_query uses RFC 1738 which encodes space as + instead of %20
        // URLSearchParams also encodes space as +
        // However, URLSearchParams leaves '*' as '*' while PHP encodes it as '%2A'
        let bodyString = searchParams.toString().replace(/\*/g, '%2A');
        
        const bodyHash = crypto.createHash('sha256').update(bodyString).digest('hex');
        
        const payload = [
            method.toUpperCase(),
            path,
            timestamp,
            bodyHash
        ].join('\n');
        
        const signature = crypto.createHmac('sha256', apiSecret).update(payload).digest('hex');
        
        return {
            "X-API-KEY": apiKey,
            "X-TIMESTAMP": timestamp,
            "X-SIGNATURE": signature,
            "Content-Type": "application/json",
            "Accept": "application/json"
        };
    }

    static async sendRequest(method: string, url: string, body: any, apiKey: string, apiSecret: string) {
        const headers = this.generateHeaders(method, url, body, apiKey, apiSecret);
        
        const options: RequestInit = {
            method: method.toUpperCase(),
            headers,
            body: JSON.stringify(body),
            cache: 'no-store'
        };

        const response = await fetch(url, options);
        let responseBody = null;
        const text = await response.text();
        try {
            responseBody = JSON.parse(text);
        } catch (e) {
            // not json
        }
        
        return {
            status: response.status,
            body: responseBody,
            raw_body: text
        };
    }
}
