const http = require('http');

const boundary = '----WebKitFormBoundaryXYZ123';
const LF = '\r\n';
const fakePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

const part1 = `--${boundary}${LF}Content-Disposition: form-data; name="title"${LF}${LF}Test Monthly Provisions${LF}`;
const part2 = `--${boundary}${LF}Content-Disposition: form-data; name="category"${LF}${LF}groceries${LF}`;
const part3 = `--${boundary}${LF}Content-Disposition: form-data; name="passcode"${LF}${LF}elroitrust@2026${LF}`;
const part4 = `--${boundary}${LF}Content-Disposition: form-data; name="photo"; filename="sample_rice.png"${LF}Content-Type: image/png${LF}${LF}`;
const part5 = `${LF}--${boundary}--${LF}`;

const body = Buffer.concat([
  Buffer.from(part1, 'utf8'),
  Buffer.from(part2, 'utf8'),
  Buffer.from(part3, 'utf8'),
  Buffer.from(part4, 'utf8'),
  fakePng,
  Buffer.from(part5, 'utf8')
]);

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/photos',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (err) => console.error('Req error:', err));
req.write(body);
req.end();

