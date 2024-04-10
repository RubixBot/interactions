// Taken from Eris

class MultipartData {
  constructor() {
    this.boundary = '----------------Rubix';
    this.bufs = [];
  }

  attach(fieldName, data, filename) {
    if(data === undefined) {
      return;
    }
    let str = `\r\n--${this.boundary}\r\nContent-Disposition: form-data; name="${fieldName}"`;
    let contentType;
    if(filename) {
      str += `; filename="${filename}"`;
      const extension = filename.match(/\.(png|apng|gif|jpg|jpeg|webp|svg|json)$/i);
      if(extension) {
        let ext = extension[1].toLowerCase();
        switch(ext) {
          case 'png':
          case 'apng':
          case 'gif':
          case 'jpg':
          case 'jpeg':
          case 'webp':
          case 'svg': {
            if(ext === 'svg') {
              ext = 'svg+xml';
            }
            contentType = 'image/';
            break;
          }
          case 'json': {
            contentType = 'application/';
            break;
          }
        }
        contentType += ext;
      }
    }

    if(contentType) {
      str += `\r\nContent-Type: ${contentType}`;
    } else if(ArrayBuffer.isView(data)) {
      str += '\r\nContent-Type: application/octet-stream';
      if(!(data instanceof Uint8Array)) {
        data = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      }
    } else if(typeof data === 'object') {
      str += '\r\nContent-Type: application/json';
      data = encode(JSON.stringify(data));
    } else {
      data = encode(`${data}`);
    }
    this.bufs.push(encode(`${str}\r\n\r\n`));
    this.bufs.push(data);
  }

  finish() {
    this.bufs.push(encode(`\r\n--${this.boundary}--`));

    let index = 0;
    const result = new Uint8Array(this.bufs.reduce((a, b) => a + b.byteLength, 0));
    for (const buf of this.bufs) {
      result.set(new Uint8Array(buf), index);
      index += buf.byteLength;
    }

    return result;
  }
}

function encode (str) {
  return new TextEncoder().encode(str);
}

module.exports = MultipartData;
