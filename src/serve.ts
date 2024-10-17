import fs from 'fs';
import http, { ServerResponse } from 'http';
import ts from 'typescript';

const mimeToContentType = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript',
    ico: 'image/vnd.microsoft.icon'
};

function getContentType(mimeType: string | undefined) {
    if (!mimeType) {
        return 'text/plain'    
    }
    return mimeToContentType[mimeType]; 
}

function compileTypescript(source: string): string {
    // TODO: get project tsconfig
    return ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS }}).outputText;
}

function handleError(err: NodeJS.ErrnoException, res) {
    console.error(err);
    switch(err.code) {
        case 'ENOENT':
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/html');
            res.end('404: Page Not Found');
            break;
        default:
            res.writeHead(500, {'Content-Type': 'text/html'});
            res.end('500: Internal Server Error');
    }
}

function serveFile(path: string | undefined, res: ServerResponse) {
    const fileExt = path?.split('.').pop();

    if (fileExt === 'js') {
        fs.readFile(`./src/client/${path?.replace('.js', '.ts')}`, 'utf8', (err, data) => {
            if (err) {
                handleError(err, res);
                return
            }
            res.writeHead(200, {'Content-Type': 'application/javascript'});
            res.end(compileTypescript(data));

        });
        return
    }
    
    fs.readFile(`./src/client/${path}`, (err, data) => {
        if (err) {
            handleError(err, res);
        } else {
            res.writeHead(200, {'Content-Type': getContentType(fileExt)});
            res.end(data);
        }
    });
}

const server = http.createServer((req, res) => {
    console.log(`handling request: ${req.method} ${req.url}`)
    
    if (req.url === '/') {
        serveFile('index.html', res);
    } else {
        serveFile(req.url, res);
    }

    res.on('finish', () => {
        console.log(`[${res.statusCode}] ${req.method} ${req.url}`);
    });
});

server.listen(8000, () => {
    console.log('Server listening on localhost:8000');
});
