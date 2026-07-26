import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';

@Processor('otp-email')
export class OtpEmailProcessor extends WorkerHost {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.AUTHOR_MAIL, pass: process.env.APP_PASSWORD },
  });

  async process(
    job: Job<{
      email: string;
      otp?: string;
      vendorId?: string;
      type: 'otp' | 'vendor-verification-message';
    }>,
  ) {
    let htmlStructure: string = '';
    let subject = 'Verify Your Email';

    if (job.data.type === 'otp') {
      htmlStructure = `<p>Your verification code is <strong>${job.data.otp}</strong>. It expires in 2 minutes.</p>`;
    } else if (job.data.type === 'vendor-verification-message') {
      htmlStructure = `<p>Your Vendor Registration Application (VRA) has approved.Your vendor Id is : <bold>${job.data.vendorId}</bold></p>. Please, keep you id safe, it will require while creating vendor account.`;
      subject = 'Vendor Registration Application is approved';
    }

    await this.transporter.sendMail({
      from: 'FreshMart <no-reply@freshmart.com>',
      to: job.data.email,
      subject: subject,
      html: htmlStructure,
    });
  }
}
