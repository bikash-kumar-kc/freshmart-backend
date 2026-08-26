import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';

@Processor('send-magical-url')
export class PasswordResetProcessor extends WorkerHost {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.AUTHOR_MAIL, pass: process.env.APP_PASSWORD },
  });

  async process(
    job: Job<{
      email: string;
      magicalUrl: string;
    }>,
  ) {
    const htmlStructure = `
  <div>
    <h2 style="color: #6b7280;">
      Hey, click the link below to reset your password.
      This link expires within 10 minutes of sending.
    </h2>

    <p>
      <a 
        href="${job.data.magicalUrl}" 
        target="_blank"
        style="color: #2563eb; text-decoration: underline;"
      >
        Reset your password
      </a>
    </p>
  </div>
`;
    await this.transporter.sendMail({
      from: 'FreshMart <no-reply@freshmart.com>',
      to: job.data.email,
      subject: 'Password Reset',
      html: htmlStructure,
    });
  }
}
