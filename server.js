/**
 * Entrypoint for Vercel, Node.js, and Serverless runtimes
 * ELROI CARE TRUST - Production Web Server
 * Official Website: www.elroicaretrust.in
 */

const server = require('./server.js');

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    const isBlobActive = !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.TRUST_READ_WRITE_TOKEN);
    const storeId = process.env.BLOB_STORE_ID || process.env.TRUST_STORE_ID;
    console.log(`====================================================`);
    console.log(` ELROI CARE TRUST - Production Web Server Running `);
    console.log(` Care, Compassion and Humanity `);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(` Storage: ${isBlobActive ? `Vercel Blob Storage [Active] (Store: ${storeId || 'Connected'})` : 'Local Disk Storage'}`);
    console.log(` Official Domain: www.elroicaretrust.in`);
    console.log(` Founder: P.K. Immanuel Neas Kumar (7904947631)`);
    console.log(`====================================================`);
  });
}

module.exports = server;
