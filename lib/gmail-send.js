/**
 * Gmail Send Helper (Plain JS for webhook-server.js)
 *
 * Lightweight email sender using Google Service Account with domain-wide delegation.
 * Mirrors src/lib/gmail.ts sendEmail() but in CommonJS for the Express webhook server.
 */

const { google } = require('googleapis');

const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const SERVICE_ACCOUNT_PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
const DEFAULT_IMPERSONATE_EMAIL = 'tony@dropfly.io';

function getGmailClient(impersonateEmail) {
    if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_PRIVATE_KEY) {
        throw new Error('Gmail not configured: GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY are required');
    }

    const auth = new google.auth.JWT({
        email: SERVICE_ACCOUNT_EMAIL,
        key: SERVICE_ACCOUNT_PRIVATE_KEY,
        scopes: [
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify',
        ],
        subject: impersonateEmail || DEFAULT_IMPERSONATE_EMAIL,
    });

    return google.gmail({ version: 'v1', auth });
}

function base64urlEncode(str) {
    return Buffer.from(str, 'utf-8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function buildMimeMessage(params) {
    const to = Array.isArray(params.to) ? params.to.join(', ') : params.to;
    const from = params.from || DEFAULT_IMPERSONATE_EMAIL;
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const headers = [
        `From: ${from}`,
        `To: ${to}`,
        `Subject: ${params.subject}`,
        `MIME-Version: 1.0`,
    ];

    if (params.replyTo) {
        headers.push(`Reply-To: ${params.replyTo}`);
    }

    const textBody = params.textBody || params.body.replace(/<[^>]*>/g, '');

    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);

    const messageParts = [
        headers.join('\r\n'),
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        'Content-Transfer-Encoding: 7bit',
        '',
        textBody,
        `--${boundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        'Content-Transfer-Encoding: 7bit',
        '',
        params.body,
        `--${boundary}--`,
    ];

    return messageParts.join('\r\n');
}

/**
 * Send an email via Gmail API using service account delegation.
 *
 * @param {Object} params
 * @param {string|string[]} params.to
 * @param {string} params.subject
 * @param {string} params.body - HTML body
 * @param {string} [params.textBody] - Plain text body
 * @param {string} [params.from] - From address (must be a domain alias)
 * @param {string} [params.replyTo]
 * @returns {Promise<{ messageId: string, threadId: string }>}
 */
async function sendEmail(params) {
    try {
        const gmail = getGmailClient();
        const raw = base64urlEncode(buildMimeMessage(params));

        const result = await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw },
        });

        if (!result.data.id) {
            throw new Error('Gmail API returned no message ID');
        }

        return {
            messageId: result.data.id,
            threadId: result.data.threadId || result.data.id,
        };
    } catch (error) {
        console.error('Gmail sendEmail error:', error);
        throw new Error(`Failed to send email: ${error.message || error}`);
    }
}

module.exports = { sendEmail };
