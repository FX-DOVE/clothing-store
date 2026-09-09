import nodemailer from 'nodemailer';
import { getDb } from './db.js';
import { v4 as uuidv4 } from 'uuid';

let transporterPromise = null;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;
  transporterPromise = (async () => {
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
    }
    try {
      const testAccount = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    } catch {
      return {
        sendMail: async (opts) => {
          console.log('[mail:console]', opts.to, opts.subject, opts.text || opts.html);
          return { messageId: `console-${Date.now()}`, preview: null };
        },
      };
    }
  })();
  return transporterPromise;
}

export async function sendAndStoreEmail({ to, subject, text, html, type = 'general', meta = {} }) {
  const transporter = await getTransporter();
  const from = process.env.SMTP_FROM || 'NG-BABIES <noreply@ngbabies.com>';
  let info;
  try {
    info = await transporter.sendMail({ from, to, subject, text, html });
  } catch (err) {
    console.error('[mail] send failed, logging to console', err.message);
    console.log('[mail:fallback]', to, subject, text);
    info = { messageId: `fallback-${Date.now()}` };
  }
  const record = {
    id: uuidv4(),
    to,
    subject,
    text: text || '',
    html: html || '',
    type,
    meta,
    messageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl?.(info) || null,
    createdAt: new Date().toISOString(),
  };
  getDb().get('sentEmails').push(record).write();
  return record;
}
