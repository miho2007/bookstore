const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
    };

    try {
        // 1. Get data from the website
        const body = JSON.parse(event.body);
        const { newBooks, adminPass } = body; // This MUST be 'adminPass'

        // 2. Check the password
        // We use || "" to prevent errors if the variable is missing
        const correctPass = process.env.ADMIN_PASSWORD || "";

        if (adminPass !== correctPass) {
            return { 
                statusCode: 401, 
                headers, 
                body: JSON.stringify({ error: `Invalid Key. Received: ${adminPass ? "YES" : "EMPTY"}` }) 
            };
        }

        // 3. GitHub Logic
        const octokit = new Octokit({ auth: process.env.GH_TOKEN });
        const { data: fileData } = await octokit.repos.getContent({
            owner: 'miho2007',
            repo: 'bookstore',
            path: 'data.js',
        });

        const fileContent = `const INITIAL_BOOKS = ${JSON.stringify(newBooks, null, 2)};`;

        await octokit.repos.createOrUpdateFileContents({
            owner: 'miho2007',
            repo: 'bookstore',
            path: 'data.js',
            message: 'Secure Update',
            content: Buffer.from(fileContent).toString('base64'),
            sha: fileData.sha,
        });

        return { statusCode: 200, headers, body: JSON.stringify({ status: "success" }) };

    } catch (err) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};
