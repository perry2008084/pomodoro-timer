const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function createPNG(size, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function createChunk(type, data) {
    const typeBuffer = Buffer.from(type);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const combined = Buffer.concat([typeBuffer, data]);
    const crc = crc32(combined);
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc >>> 0);
    return Buffer.concat([length, combined, crcBuffer]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rawData = [];
  const center = size / 2;
  const radius = size * 0.4;

  for (let y = 0; y < size; y++) {
    rawData.push(0);
    for (let x = 0; x < size; x++) {
      const dx = x - center + 0.5;
      const dy = y - center + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) {
        rawData.push(r, g, b);
      } else {
        rawData.push(255, 255, 255);
      }
    }
  }

  const rawBuffer = Buffer.from(rawData);
  const compressed = zlib.deflateSync(rawBuffer);

  const ihdrChunk = createChunk("IHDR", ihdr);
  const idatChunk = createChunk("IDAT", compressed);
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return crc ^ 0xffffffff;
}

const iconsDir = path.join(__dirname, "..", "icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach((size) => {
  const png = createPNG(size, 233, 69, 96);
  const filePath = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(filePath, png);
  console.log(`Created ${filePath}`);
});
