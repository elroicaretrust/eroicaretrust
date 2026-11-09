/**
 * Entrypoint for Vercel, Node.js, and Serverless runtimes
 * ELROI CARE TRUST - Production Web Server
 * Official Website: www.elroicaretrust.in
 */

const server = require('./server.js');

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` ELROI CARE TRUST - Production Web Server Running `);
    console.log(` Care, Compassion and Humanity `);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(` Official Domain: www.elroicaretrust.in`);
    console.log(` Founder: P.K. Immanuel Neas Kumar (7904947631)`);
    console.log(`====================================================`);
  });
}

module.exports = server;
