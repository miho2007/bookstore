const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  // This token will be saved in your Netlify Environment Variables
  const octokit = new Octokit({ auth: process.env.GH_TOKEN });
  const { newBooks } = JSON.parse(event.body);

  try {
    // 1. Get the current file info (we need the 'sha' to overwrite it)
    const { data: fileData } = await octokit.repos.getContent({
      owner: 'miho2007',
      repo: 'bookstore',
      path: 'data.js',
    });

    // 2. Prepare the new content
    const updatedContent = `const INITIAL_BOOKS = ${JSON.stringify(newBooks, null, 2)};`;

    // 3. Push the update to GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner: 'miho2007',
      repo: 'bookstore',
      path: 'data.js',
      message: 'Admin: Added new book to catalogue',
      content: Buffer.from(updatedContent).toString('base64'),
      sha: fileData.sha, // Security ID for the current version
    });

    return { statusCode: 200, body: JSON.stringify({ status: "success" }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
