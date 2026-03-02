/**
 * DigiAI Standalone Web App — local development server.
 */
import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`DigiAI web app running at http://localhost:${PORT}`);
});
