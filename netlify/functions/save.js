const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
    const headers = { "Content-Type": "application/json" };

    try {
        const { newBooks, adminPass } = JSON.parse(event.body);

        // SECURITY CHECK: Compare password to Netlify Variable
        if (adminPass !== process.env.ADMIN_PASSWORD) {
            return { statusCode: 401, headers, body: JSON.stringify({ error: "Wrong Admin Password" }) };
        }

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
            message: 'Secured Catalogue Update',
            content: Buffer.from(fileContent).toString('base64'),
            sha: fileData.sha,
        });

        return { statusCode: 200, headers, body: JSON.stringify({ status: "success" }) };
    } catch (err) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};
