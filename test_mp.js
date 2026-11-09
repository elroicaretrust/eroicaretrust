const boundary = '----WebKitFormBoundary123';
const raw = '--' + boundary + '\r\nContent-Disposition: form-data; name="title"\r\n\r\nHello\r\n--' + boundary + '\r\nContent-Disposition: form-data; name="photo"; filename="test.jpg"\r\nContent-Type: image/jpeg\r\n\r\nFAKEIMAGE\r\n--' + boundary + '--\r\n';
const data = Buffer.from(raw, 'utf8');

function parseMultipart(buffer, boundary) {
  const boundaryBuffer = Buffer.from('--' + boundary);
  const fields = {};
  const files = [];

  let start = buffer.indexOf(boundaryBuffer);
  while (start !== -1) {
    start += boundaryBuffer.length;
    if (buffer.slice(start, start + 2).toString() === '--') break;
    if (buffer.slice(start, start + 2).toString() === '\r\n') start += 2;

    const next = buffer.indexOf(boundaryBuffer, start);
    if (next === -1) break;

    const part = buffer.slice(start, next - 2);
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd !== -1) {
      const headersStr = part.slice(0, headerEnd).toString('utf8');
      const body = part.slice(headerEnd + 4);

      const dispMatch = headersStr.match(/Content-Disposition: form-data; name="([^"]+)"(?:; filename="([^"]+)")?/i);
      console.log('headersStr:', headersStr, 'dispMatch:', dispMatch);
      if (dispMatch) {
        const fieldName = dispMatch[1];
        const fileName = dispMatch[2];
        if (fileName) {
          files.push({ fieldName, fileName, data: body });
        } else {
          fields[fieldName] = body.toString('utf8');
        }
      }
    }
    start = next;
  }
  return { fields, files };
}

console.log(parseMultipart(data, boundary));

