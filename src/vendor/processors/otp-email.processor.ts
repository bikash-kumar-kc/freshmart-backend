import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';

@Processor('otp-email')
export class OtpEmailProcessor extends WorkerHost {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.AUTHOR_MAIL, pass: process.env.APP_PASSWORD },
  });

  async process(job: Job<{ email: string; otp: string }>) {
    await this.transporter.sendMail({
      from: 'FreshMart <no-reply@freshmart.com>',
      to: job.data.email,
      subject: 'Verify your FreshMart vendor application',
      html: `<p>Your verification code is <strong>${job.data.otp}</strong>. It expires in 2 minutes.</p>`,
    });
  }
}
