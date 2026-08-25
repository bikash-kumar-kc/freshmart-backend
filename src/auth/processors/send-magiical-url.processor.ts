import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';

@Processor('send-magical-url')
export class OtpEmailProcessor extends WorkerHost {
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
    <h2 className='text-gray-500'>
    Hey, user click below link to reset your password. This link expires within 10 minutes of send.
    </h2>
    <p><a>${job.data.magicalUrl}</a></p>
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
