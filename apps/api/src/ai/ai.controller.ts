import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { AiService } from './ai.service.js';

type AuthenticatedRequest = Request & {
  user: {
    sub: number;
    email: string;
    role: string;
  };
};

type AskAiBody = {
  message?: unknown;
};

const MAX_MESSAGE_LENGTH = 500;

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
  ) {}

  @Post('chat')
  async chat(
    @Body() body: AskAiBody,
    @Req() request: AuthenticatedRequest,
  ) {
    if (
      typeof body.message !== 'string'
    ) {
      throw new BadRequestException(
        'message must be a string',
      );
    }

    const message = body.message.trim();

    if (!message) {
      throw new BadRequestException(
        'message must not be empty',
      );
    }

    if (
      message.length > MAX_MESSAGE_LENGTH
    ) {
      throw new BadRequestException(
        `message must be ${MAX_MESSAGE_LENGTH} characters or fewer`,
      );
    }

    const answer = await this.aiService.ask(
      message,
      request.user.sub,
    );

    return {
      answer,
    };
  }
}