import { BadRequestException, Injectable } from '@nestjs/common';
import ImageKit from 'imagekit';

@Injectable()
export class ImagekitService {
  private readonly imagekit: ImageKit;
  constructor() {
    this.imagekit = new ImageKit({
      publicKey: process.env.NEST_IMAGEKIT_PUBLIC_KEY!,
      privateKey: process.env.NEST_IMAGEKIT_PRIVATE_KEY!,
      urlEndpoint: process.env.NEST_IMAGEKIT_URL_ENDPOINT!,
    });
  }
  // create(createImagekitDto: CreateImagekitDto) {
  //   return 'This action adds a new imagekit';
  // }

  // findAll() {
  //   return `This action returns all imagekit`;
  // }

  getAuthParams() {
    const isEnvAvailable =
      !process.env.NEST_IMAGEKIT_PUBLIC_KEY ||
      !process.env.NEST_IMAGEKIT_PRIVATE_KEY ||
      !process.env.NEST_IMAGEKIT_URL_ENDPOINT;

    if (isEnvAvailable) {
      throw new BadRequestException();
    }

    const response = this.imagekit.getAuthenticationParameters();

    return {
      ...response,
    };
  }

  // update(id: number, updateImagekitDto: UpdateImagekitDto) {
  //   return `This action updates a #${id} imagekit`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} imagekit`;
  // }
}
