const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
    };

    try {
        console.log("Function triggered...");

        // 1. Check Token
        if (!process.env.GH_TOKEN) {
            console.error("LOG: GH_TOKEN is missing!");
            return { statusCode: 500, headers, body: JSON.stringify({ error: "GH_TOKEN missing" }) };
        }

        const octokit = new Octokit({ auth: process.env.GH_TOKEN });
        const { newBooks } = JSON.parse(event.body);

        // 2. Exact Repo Info
        const OWNER = 'miho2007'; 
        const REPO = 'bookstore';

        console.log(`LOG: Attempting to reach ${OWNER}/${REPO}...`);

        // 3. Get File (The part that usually fails)
        const { data: fileData } = await octokit.repos.getContent({
            owner: OWNER,
            repo: REPO,
            path: 'data.js',
        });

        console.log("LOG: data.js found. Updating content...");

        const fileContent = `const INITIAL_BOOKS = ${JSON.stringify(newBooks, null, 2)};`;

        // 4. Push Update
        await octokit.repos.createOrUpdateFileContents({
            owner: OWNER,
            repo: REPO,
            path: 'data.js',
            message: 'Catalogue Update',
            content: Buffer.from(fileContent).toString('base64'),
            sha: fileData.sha,
        });

        console.log("LOG: Successfully saved to GitHub!");

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ status: "success" }),
        };

    } catch (err) {
        console.error("LOG ERROR:", err.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message }),
        };
    }
};
