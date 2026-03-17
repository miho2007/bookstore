const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
    };

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, headers, body: "Method Not Allowed" };
    }

    try {
        const token = process.env.GH_TOKEN;
        if (!token) throw new Error("GH_TOKEN is missing in Netlify Environment Variables");

        const octokit = new Octokit({ auth: token });
        const { newBooks } = JSON.parse(event.body);

        // --- YOUR DATA ---
        const OWNER = 'miho2007'; 
        const REPO = 'bookstore';
        const FILE_PATH = 'data.js';

        // 1. Get current file data (to get the SHA)
        const { data: fileData } = await octokit.repos.getContent({
            owner: OWNER,
            repo: REPO,
            path: FILE_PATH,
        });

        // 2. Prepare the new content
        const fileContent = `const INITIAL_BOOKS = ${JSON.stringify(newBooks, null, 2)};`;

        // 3. Update GitHub
        await octokit.repos.createOrUpdateFileContents({
            owner: OWNER,
            repo: REPO,
            path: FILE_PATH,
            message: 'Catalogue Update from Website',
            content: Buffer.from(fileContent).toString('base64'),
            sha: fileData.sha,
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ status: "success" }),
        };
    } catch (err) {
        console.error("Function Error:", err.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message }),
        };
    }
};
